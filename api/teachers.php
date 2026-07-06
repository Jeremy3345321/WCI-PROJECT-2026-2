<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// ---- GET ----
if ($method === 'GET') {
    try {
        $db = getDB();
        
        // Check if load column exists, if not add it
        $checkLoad = $db->query("SHOW COLUMNS FROM teachers LIKE 'load'");
        if (!$checkLoad || $checkLoad->num_rows === 0) {
            $db->query("ALTER TABLE `teachers` ADD COLUMN `load` VARCHAR(10) NOT NULL DEFAULT ''");
        }
        
        // Add other columns if they don't exist (safer approach)
        $columns = [
            'subject' => "VARCHAR(60) NOT NULL DEFAULT ''",
            'subjects' => "TEXT NOT NULL DEFAULT ''",
            'availability' => "TEXT NOT NULL DEFAULT ''",
            'departments' => "TEXT NOT NULL DEFAULT ''",
            'employment_type' => "VARCHAR(20) NOT NULL DEFAULT 'full-time'",
            'advisory_section' => "VARCHAR(30) NOT NULL DEFAULT ''",
            'room_number' => "VARCHAR(30) NOT NULL DEFAULT ''",
            'jhs_grades' => "TEXT NOT NULL DEFAULT ''"
        ];
        
        foreach ($columns as $colName => $colDef) {
            $checkCol = $db->query("SHOW COLUMNS FROM teachers LIKE '$colName'");
            if (!$checkCol || $checkCol->num_rows === 0) {
                $db->query("ALTER TABLE `teachers` ADD COLUMN `$colName` $colDef");
            }
        }

        // Try the full query
        $result = $db->query("
            SELECT t.id, t.name, 
                   COALESCE(t.subject, '') as subject, 
                   COALESCE(t.subjects, '') as subjects, 
                   COALESCE(t.availability, '') as availability, 
                   COALESCE(t.departments, '') as departments, 
                   COALESCE(t.employment_type, 'full-time') as employment_type, 
                   COALESCE(t.advisory_section, '') as advisory_section, 
                   COALESCE(t.room_number, '') as room_number, 
                   COALESCE(t.`load`, '') as `load`,
                   COALESCE(t.jhs_grades, '') as jhs_grades,
                   COUNT(s.id) AS total_periods,
                   SUM(CASE WHEN s.day='Monday' THEN 1 ELSE 0 END) AS mon, 
                   SUM(CASE WHEN s.day='Tuesday' THEN 1 ELSE 0 END) AS tue,
                   SUM(CASE WHEN s.day='Wednesday' THEN 1 ELSE 0 END) AS wed, 
                   SUM(CASE WHEN s.day='Thursday' THEN 1 ELSE 0 END) AS thu,
                   SUM(CASE WHEN s.day='Friday' THEN 1 ELSE 0 END) AS fri, 
                   SUM(CASE WHEN s.day='Saturday' THEN 1 ELSE 0 END) AS sat
            FROM teachers t
            LEFT JOIN schedules s ON s.teacher_id = t.id AND s.section_id != ''
            GROUP BY t.id ORDER BY t.name
        ");
        
        if (!$result) {
            $db->close();
            respondError('Query failed: ' . $db->error, 500);
        }
        
        $teachers = [];
        while ($row = $result->fetch_assoc()) {
            $subjectsArr = [];
            if ($row['subjects']) {
                $subjectsArr = json_decode($row['subjects'], true);
                if (json_last_error() !== JSON_ERROR_NONE || !is_array($subjectsArr)) {
                    $subjectsArr = array_values(array_filter(explode('|', $row['subjects'])));
                }
            }
            if (empty($subjectsArr) && $row['subject']) {
                $subjectsArr = [$row['subject']];
            }
            $availObj = $row['availability'] ? json_decode($row['availability'], true) : [];
            if (json_last_error() !== JSON_ERROR_NONE) { $availObj = []; }
            $deptObj = $row['departments'] ? json_decode($row['departments'], true) : [];
            if (json_last_error() !== JSON_ERROR_NONE) { $deptObj = []; }
            $jhsGradesObj = $row['jhs_grades'] ? json_decode($row['jhs_grades'], true) : [];
            if (json_last_error() !== JSON_ERROR_NONE) { $jhsGradesObj = []; }
            $teachers[] = [
                'id'               => $row['id'],
                'name'             => $row['name'],
                'subject'          => $row['subject'] ?? '',
                'subjects'         => $subjectsArr,
                'availability'     => $availObj ?: (object)[],
                'departments'      => $deptObj ?: (object)[],
                'employment_type'  => $row['employment_type'] ?: 'full-time',
                'advisory_section' => $row['advisory_section'] ?? '',
                'room_number'      => $row['room_number'] ?? '',
                'load'             => $row['load'] ?? '',
                'jhs_grades'       => $jhsGradesObj ?: (object)[],
                'total_periods'    => (int)$row['total_periods'],
                'mon'=>(int)$row['mon'],'tue'=>(int)$row['tue'],
                'wed'=>(int)$row['wed'],'thu'=>(int)$row['thu'],'fri'=>(int)$row['fri'],'sat'=>(int)$row['sat'],
            ];
        }
        $db->close();
        respond(['success' => true, 'data' => $teachers]);
        
    } catch (Exception $e) {
        if (isset($db)) $db->close();
        respondError('Exception: ' . $e->getMessage(), 500);
    }
}

// ---- POST: add teacher ----
if ($method === 'POST') {
    try {
        $body            = json_decode(file_get_contents('php://input'), true);
        $name            = trim($body['name']            ?? '');
        $subject         = trim($body['subject']         ?? '');
        $subjects        = $body['subjects']             ?? [];
        $availability    = $body['availability']         ?? [];
        $departments     = $body['departments']          ?? [];
        $employment_type = trim($body['employment_type'] ?? 'full-time');
        $load            = trim($body['load']            ?? '');
        $jhs_grades      = $body['jhs_grades']           ?? [];
        if (!$name) respondError('Name is required');

        if (is_string($subjects) && strlen(trim($subjects)) > 0) {
            $decoded = json_decode($subjects, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $subjects = $decoded;
            } else {
                $subjects = explode('|', $subjects);
            }
        }

        $subjects = array_values(array_unique(array_filter(array_map('trim', (array)$subjects))));
        if (empty($subjects) && $subject) {
            $subjects[] = $subject;
        }
        $firstSubj    = $subjects[0] ?? $subject;
        $subjJson     = json_encode($subjects);
        $availJson    = json_encode($availability ?: (object)[]);
        $deptJson     = json_encode($departments ?: (object)[]);
        $jhsGradesJson = json_encode($jhs_grades ?: (object)[]);

        $id = strtoupper(preg_replace('/[^A-Z0-9]/i', '_', preg_replace('/^(MR\.|MRS\.|MS\.|DR\.)\s*/i', '', $name)));
        $id = substr(preg_replace('/_+/', '_', trim($id, '_')), 0, 25);

        $db = getDB();
        
        // Ensure load column exists
        $checkLoad = $db->query("SHOW COLUMNS FROM teachers LIKE 'load'");
        if (!$checkLoad || $checkLoad->num_rows === 0) {
            $db->query("ALTER TABLE `teachers` ADD COLUMN `load` VARCHAR(10) NOT NULL DEFAULT ''");
        }

        $check = $db->prepare("SELECT id FROM teachers WHERE id=? OR name=?");
        $check->bind_param('ss', $id, $name);
        $check->execute();
        if ($check->get_result()->num_rows > 0) $id = $id . '_' . rand(10, 99);

        $stmt = $db->prepare("INSERT INTO teachers (id, name, subject, subjects, availability, departments, employment_type, `load`, jhs_grades) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('sssssssss', $id, $name, $firstSubj, $subjJson, $availJson, $deptJson, $employment_type, $load, $jhsGradesJson);
        if ($stmt->execute()) {
            $db->close();
            respond(['success' => true, 'id' => $id, 'name' => $name]);
        } else {
            $db->close();
            respondError('Could not add teacher: ' . $stmt->error, 500);
        }
    } catch (Exception $e) {
        if (isset($db)) $db->close();
        respondError('Exception: ' . $e->getMessage(), 500);
    }
}

// ---- PUT: edit teacher ----
if ($method === 'PUT') {
    try {
        $body = json_decode(file_get_contents('php://input'), true);
        $id   = trim($body['id'] ?? '');
        if (!$id) respondError('ID is required');

        $db = getDB();
        
        // Ensure load column exists
        $checkLoad = $db->query("SHOW COLUMNS FROM teachers LIKE 'load'");
        if (!$checkLoad || $checkLoad->num_rows === 0) {
            $db->query("ALTER TABLE `teachers` ADD COLUMN `load` VARCHAR(10) NOT NULL DEFAULT ''");
        }

        // Advisory only update
        if (isset($body['_only']) && $body['_only'] === 'advisory') {
            $sec = trim($body['advisory_section'] ?? '');
            $stmt = $db->prepare("UPDATE teachers SET advisory_section=? WHERE id=?");
            $stmt->bind_param('ss', $sec, $id);
            if ($stmt->execute()) {
                $db->close(); 
                respond(['success' => true]);
            } else { 
                $db->close(); 
                respondError('Update failed', 500); 
            }
            return;
        }
        
        // Room only update
        if (isset($body['_only']) && $body['_only'] === 'room') {
            $room = trim($body['room_number'] ?? '');
            $stmt = $db->prepare("UPDATE teachers SET room_number=? WHERE id=?");
            $stmt->bind_param('ss', $room, $id);
            if ($stmt->execute()) { 
                $db->close(); 
                respond(['success' => true]); 
            } else { 
                $db->close(); 
                respondError('Update failed', 500); 
            }
            return;
        }

        $name            = trim($body['name']            ?? '');
        $subject         = trim($body['subject']         ?? '');
        $subjects        = $body['subjects']             ?? [];
        $availability    = $body['availability']         ?? [];
        $departments     = $body['departments']          ?? [];
        $employment_type = trim($body['employment_type'] ?? 'full-time');
        $load            = trim($body['load']            ?? '');
        $jhs_grades      = $body['jhs_grades']           ?? [];
        if (!$name) respondError('Name is required');

        if (is_string($subjects) && strlen(trim($subjects)) > 0) {
            $decoded = json_decode($subjects, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $subjects = $decoded;
            } else {
                $subjects = explode('|', $subjects);
            }
        }

        $subjects = array_values(array_unique(array_filter(array_map('trim', (array)$subjects))));
        if (empty($subjects) && $subject) {
            $subjects[] = $subject;
        }
        $firstSubj    = $subjects[0] ?? $subject;
        $subjJson     = json_encode($subjects);
        $availJson    = json_encode($availability ?: (object)[]);
        $deptJson     = json_encode($departments ?: (object)[]);
        $jhsGradesJson = json_encode($jhs_grades ?: (object)[]);

        $stmt = $db->prepare("UPDATE teachers SET name=?, subject=?, subjects=?, availability=?, employment_type=?, departments=?, `load`=?, jhs_grades=? WHERE id=?");
        $stmt->bind_param('sssssssss', $name, $firstSubj, $subjJson, $availJson, $employment_type, $deptJson, $load, $jhsGradesJson, $id);
        if ($stmt->execute()) {
            $db->close();
            respond(['success' => true, 'message' => 'Teacher updated']);
        } else {
            $db->close();
            respondError('Update failed: ' . $stmt->error, 500);
        }
    } catch (Exception $e) {
        if (isset($db)) $db->close();
        respondError('Exception: ' . $e->getMessage(), 500);
    }
}

// ---- DELETE ----
if ($method === 'DELETE') {
    try {
        $action = $_GET['action'] ?? '';
        if ($action === 'clearadvisory') {
            $db = getDB();
            $db->query("UPDATE teachers SET advisory_section=''");
            $db->close();
            respond(['success' => true, 'message' => 'All advisory sections cleared']);
        }
        if ($action === 'clearrooms') {
            $db = getDB();
            $db->query("UPDATE teachers SET room_number=''");
            $db->close();
            respond(['success' => true, 'message' => 'All rooms cleared']);
        }
        if ($action === 'clearsubjects') {
            $db = getDB();
            $db->query("UPDATE teachers SET subject='', subjects=''");
            $db->close();
            respond(['success' => true, 'message' => 'All subjects cleared']);
        }
        $id = $_GET['id'] ?? '';
        if (!$id) respondError('Teacher ID required');
        $db = getDB();
        $stmt = $db->prepare("DELETE FROM teachers WHERE id=?");
        $stmt->bind_param('s', $id);
        if ($stmt->execute()) { 
            $db->close(); 
            respond(['success' => true]); 
        } else { 
            $db->close(); 
            respondError('Delete failed', 500); 
        }
    } catch (Exception $e) {
        if (isset($db)) $db->close();
        respondError('Exception: ' . $e->getMessage(), 500);
    }
}

respondError('Method not allowed', 405);