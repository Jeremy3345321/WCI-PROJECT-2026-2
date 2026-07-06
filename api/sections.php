<?php
// ============================================================
// API: /api/sections.php
// GET    → fetch all sections
// POST   → add a new section
// DELETE → remove a section (by id in query string)
// ============================================================
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// ---- GET ----
if ($method === 'GET') {
    $db = getDB();
    // Add availability and room columns if they don't exist
    $db->query("ALTER TABLE `sections` ADD COLUMN IF NOT EXISTS `availability` TEXT NOT NULL DEFAULT ''");
    $db->query("ALTER TABLE `sections` ADD COLUMN IF NOT EXISTS `room` VARCHAR(50) DEFAULT ''");
    $db->query("ALTER TABLE `sections` ADD COLUMN IF NOT EXISTS `section_elective_subtypes` TEXT DEFAULT NULL");
    
    $result = $db->query("SELECT id, name, grade, strand, availability, room, section_elective_subtypes FROM sections ORDER BY grade, strand, name");
    $sections = [];
    while ($row = $result->fetch_assoc()) {
        $availObj = $row['availability'] ? json_decode($row['availability'], true) : [];
        $sections[] = [
            'id'           => $row['id'],
            'name'         => $row['name'],
            'grade'        => (int)$row['grade'],
            'strand'       => $row['strand'] ?? '',
            'availability' => $availObj ?: (object)[],
            'room'         => $row['room'] ?? '',
            'section_elective_subtypes' => $row['section_elective_subtypes'] ?? null,
        ];
    }
    $db->close();
    respond(['success' => true, 'data' => $sections]);
}

// ---- POST: add section ----
if ($method === 'POST') {
    $body   = json_decode(file_get_contents('php://input'), true);
    $name   = strtoupper(trim($body['name']   ?? ''));
    $grade  = (int)($body['grade']  ?? 0);
    $strand = strtoupper(trim($body['strand'] ?? ''));

    if (!$name || !$grade) respondError('Name and grade are required');
    if ($grade < 7 || $grade > 12) respondError('Grade must be 7–12');

    // Build ID: G{grade}-{strand}-{name} or G{grade}-{name}
    $safeName = preg_replace('/[^A-Z0-9]/', '-', $name);
    $safeName = preg_replace('/-+/', '-', trim($safeName, '-'));
    $id = $strand
        ? "G{$grade}-{$strand}-{$safeName}"
        : "G{$grade}-{$safeName}";
    $id = substr($id, 0, 30);

    // Full display name (without strand - strand is shown in label)
    $displayName = "GRADE {$grade} - {$name}";

    $db = getDB();

    // Check duplicate
    $check = $db->prepare("SELECT id FROM sections WHERE id=?");
    $check->bind_param('s', $id);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        $db->close();
        respondError('A section with that name already exists');
    }

    $stmt = $db->prepare("INSERT INTO sections (id, name, grade, strand) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('ssis', $id, $displayName, $grade, $strand);
    if ($stmt->execute()) {
        $db->close();
        respond(['success' => true, 'id' => $id, 'name' => $displayName, 'grade' => $grade, 'strand' => $strand]);
    } else {
        $db->close();
        respondError('Could not add section: ' . $stmt->error, 500);
    }
}

// ---- DELETE: remove section or bulk clear availability ----
if ($method === 'DELETE') {
    $action = $_GET['action'] ?? '';

    // Bulk clear all section availability
    if ($action === 'clearavailability') {
        $db = getDB();
        $emptyJson = json_encode((object)[]);
        if ($db->query("UPDATE sections SET availability = '$emptyJson'")) {
            $db->close();
            respond(['success' => true, 'message' => 'All section availability cleared']);
        } else {
            $db->close();
            respondError('Failed to clear availability: ' . $db->error, 500);
        }
    }

    $id = $_GET['id'] ?? '';
    if (!$id) respondError('Section ID required');

    $db = getDB();

    // Also delete all schedules for this section
    $clean = $db->prepare("DELETE FROM schedules WHERE section_id=?");
    $clean->bind_param('s', $id);
    $clean->execute();

    $stmt = $db->prepare("DELETE FROM sections WHERE id=?");
    $stmt->bind_param('s', $id);
    if ($stmt->execute()) {
        $db->close();
        respond(['success' => true, 'message' => 'Section removed']);
    } else {
        $db->close();
        respondError('Delete failed: ' . $stmt->error, 500);
    }
}

// ---- PUT: update section name, strand, availability, room, or elective subtypes ----
if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true);
    $id = trim($body['id'] ?? '');
    
    if (!$id) respondError('Section ID required');
    
    $db = getDB();
    
    // Add columns if they don't exist
    $db->query("ALTER TABLE `sections` ADD COLUMN IF NOT EXISTS `availability` TEXT NOT NULL DEFAULT ''");
    $db->query("ALTER TABLE `sections` ADD COLUMN IF NOT EXISTS `room` VARCHAR(50) DEFAULT ''");
    $db->query("ALTER TABLE `sections` ADD COLUMN IF NOT EXISTS `section_elective_subtypes` TEXT DEFAULT NULL");
    
    // Check if updating name and strand
    if (isset($body['name']) && isset($body['strand'])) {
        $name = strtoupper(trim($body['name'] ?? ''));
        $strand = strtoupper(trim($body['strand'] ?? ''));
        
        if (!$name) {
            $db->close();
            respondError('Section name is required');
        }
        
        // Get current section data to get grade
        $current = $db->prepare("SELECT grade, strand FROM sections WHERE id=?");
        $current->bind_param('s', $id);
        $current->execute();
        $result = $current->get_result();
        
        if ($result->num_rows === 0) {
            $db->close();
            respondError('Section not found');
        }
        
        $row = $result->fetch_assoc();
        $grade = (int)$row['grade'];
        
        // Build new ID
        $safeName = preg_replace('/[^A-Z0-9]/', '-', $name);
        $safeName = preg_replace('/-+/', '-', trim($safeName, '-'));
        $newId = $strand
            ? "G{$grade}-{$strand}-{$safeName}"
            : "G{$grade}-{$safeName}";
        $newId = substr($newId, 0, 30);
        
        // Full display name (without strand - strand is shown in label)
        $displayName = "GRADE {$grade} - {$name}";
        
        // Check if new ID already exists (and it's not the same section)
        if ($newId !== $id) {
            $check = $db->prepare("SELECT id FROM sections WHERE id=?");
            $check->bind_param('s', $newId);
            $check->execute();
            if ($check->get_result()->num_rows > 0) {
                $db->close();
                respondError('A section with that name already exists');
            }
            
            // Update section ID in schedules table
            $updateSchedules = $db->prepare("UPDATE schedules SET section_id=? WHERE section_id=?");
            $updateSchedules->bind_param('ss', $newId, $id);
            $updateSchedules->execute();
        }
        
        // Update section
        $stmt = $db->prepare("UPDATE sections SET id=?, name=?, strand=? WHERE id=?");
        $stmt->bind_param('ssss', $newId, $displayName, $strand, $id);
        
        if ($stmt->execute()) {
            $db->close();
            respond(['success' => true, 'message' => 'Section updated', 'newId' => $newId]);
        } else {
            $db->close();
            respondError('Update failed: ' . $stmt->error, 500);
        }
    }
    // Check if updating availability
    elseif (isset($body['availability'])) {
        $availability = $body['availability'] ?? [];
        $availJson = json_encode($availability ?: (object)[]);
        
        $stmt = $db->prepare("UPDATE sections SET availability=? WHERE id=?");
        $stmt->bind_param('ss', $availJson, $id);
        
        if ($stmt->execute()) {
            $db->close();
            respond(['success' => true, 'message' => 'Section updated']);
        } else {
            $db->close();
            respondError('Update failed: ' . $stmt->error, 500);
        }
    } 
    // Check if updating room
    elseif (isset($body['room'])) {
        $room = trim($body['room'] ?? '');
        
        $stmt = $db->prepare("UPDATE sections SET room=? WHERE id=?");
        $stmt->bind_param('ss', $room, $id);
        
        if ($stmt->execute()) {
            $db->close();
            respond(['success' => true, 'message' => 'Section updated']);
        } else {
            $db->close();
            respondError('Update failed: ' . $stmt->error, 500);
        }
    } 
    // Check if updating elective subtypes
    elseif (isset($body['section_elective_subtypes'])) {
        $subtypes = $body['section_elective_subtypes'];
        $subtypesJson = is_string($subtypes) ? $subtypes : json_encode($subtypes ?? []);
        
        $stmt = $db->prepare("UPDATE sections SET section_elective_subtypes=? WHERE id=?");
        $stmt->bind_param('ss', $subtypesJson, $id);
        
        if ($stmt->execute()) {
            $db->close();
            respond(['success' => true, 'message' => 'Section updated']);
        } else {
            $db->close();
            respondError('Update failed: ' . $stmt->error, 500);
        }
    } else {
        $db->close();
        respondError('No update data provided');
    }
}

respondError('Method not allowed', 405);
