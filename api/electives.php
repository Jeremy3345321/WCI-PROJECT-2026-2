<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$conn = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Check if grade column exists
$gradeColumnExists = false;
$checkColumn = $conn->query("SHOW COLUMNS FROM elective_subtypes LIKE 'grade'");
if ($checkColumn && $checkColumn->num_rows > 0) {
    $gradeColumnExists = true;
}

// GET - Fetch all elective subtypes
if ($method === 'GET') {
    $type = $_GET['type'] ?? 'all';
    $grade = $_GET['grade'] ?? 'all';
    $id = intval($_GET['id'] ?? 0);
    $check = $_GET['check'] ?? false;
    
    // Check count for a specific subtype (used before delete)
    if ($id > 0 && $check) {
        $stmt = $conn->prepare("SELECT name FROM elective_subtypes WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $subtype = $result->fetch_assoc();
        
        if (!$subtype) {
            respondError('Elective subtype not found');
        }
        
        $checkStmt = $conn->prepare("SELECT COUNT(*) as count FROM subjects WHERE elective_subtype = ?");
        $checkStmt->bind_param('s', $subtype['name']);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result()->fetch_assoc();
        
        respond(['success' => true, 'count' => $checkResult['count']]);
        exit;
    }
    
    if (!$gradeColumnExists) {
        // Fallback to old query without grade column
        if ($type === 'all') {
            $result = $conn->query("SELECT * FROM elective_subtypes ORDER BY type, name");
        } else {
            $stmt = $conn->prepare("SELECT * FROM elective_subtypes WHERE type = ? ORDER BY name");
            $stmt->bind_param('s', $type);
            $stmt->execute();
            $result = $stmt->get_result();
        }
    } else {
        // Use new query with grade column
        if ($type === 'all' && $grade === 'all') {
            $result = $conn->query("SELECT * FROM elective_subtypes ORDER BY grade, type, name");
        } elseif ($grade !== 'all') {
            // Strict filtering - only show subtypes for the specific grade (no 'both')
            $stmt = $conn->prepare("SELECT * FROM elective_subtypes WHERE grade = ? ORDER BY type, name");
            $stmt->bind_param('s', $grade);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $stmt = $conn->prepare("SELECT * FROM elective_subtypes WHERE type = ? ORDER BY grade, name");
            $stmt->bind_param('s', $type);
            $stmt->execute();
            $result = $stmt->get_result();
        }
    }
    
    if ($result) {
        $academic = [];
        $techpro = [];
        
        while ($row = $result->fetch_assoc()) {
            if ($row['type'] === 'academic') {
                $academic[] = $row;
            } else {
                $techpro[] = $row;
            }
        }
        
        respond(['success' => true, 'academic' => $academic, 'techpro' => $techpro]);
    } else {
        respondError('Failed to fetch elective subtypes: ' . $conn->error);
    }
}

// POST - Add new elective subtype
elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $type = trim($input['type'] ?? '');
    $name = trim($input['name'] ?? '');
    
    if (empty($type) || empty($name)) {
        respondError('Type and name required');
    }
    
    if (!in_array($type, ['academic', 'techpro'])) {
        respondError('Invalid type. Must be "academic" or "techpro"');
    }
    
    if ($gradeColumnExists) {
        $grade = trim($input['grade'] ?? '11');
        if (!in_array($grade, ['11', '12'])) {
            respondError('Invalid grade. Must be "11" or "12"');
        }
        $stmt = $conn->prepare("INSERT INTO elective_subtypes (grade, type, name) VALUES (?, ?, ?)");
        $stmt->bind_param('sss', $grade, $type, $name);
    } else {
        $stmt = $conn->prepare("INSERT INTO elective_subtypes (type, name) VALUES (?, ?)");
        $stmt->bind_param('ss', $type, $name);
    }
    
    if ($stmt->execute()) {
        respond(['success' => true, 'id' => $conn->insert_id]);
    } else {
        if ($conn->errno === 1062) {
            respondError('This elective subtype already exists' . ($gradeColumnExists ? ' for this grade' : ''));
        } else {
            respondError('Failed to add elective subtype: ' . $stmt->error);
        }
    }
}

// PUT - Update elective subtype
elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = intval($input['id'] ?? 0);
    $name = trim($input['name'] ?? '');
    
    if (empty($id) || empty($name)) {
        respondError('ID and name required');
    }
    
    $stmt = $conn->prepare("UPDATE elective_subtypes SET name = ? WHERE id = ?");
    $stmt->bind_param('si', $name, $id);
    
    if ($stmt->execute()) {
        respond(['success' => true]);
    } else {
        respondError('Failed to update elective subtype: ' . $stmt->error);
    }
}

// DELETE - Remove elective subtype
elseif ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    $force = $_GET['force'] ?? false;
    
    if (empty($id)) {
        respondError('ID required');
    }
    
    // Get subtype name
    $stmt = $conn->prepare("SELECT name FROM elective_subtypes WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $subtype = $result->fetch_assoc();
    
    if (!$subtype) {
        respondError('Elective subtype not found');
    }
    
    // Check if any subjects are using this subtype
    $checkStmt = $conn->prepare("SELECT COUNT(*) as count FROM subjects WHERE elective_subtype = ?");
    $checkStmt->bind_param('s', $subtype['name']);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result()->fetch_assoc();
    
    // If force delete is enabled, clear the elective_subtype from subjects first
    if ($force && $checkResult['count'] > 0) {
        $updateStmt = $conn->prepare("UPDATE subjects SET elective_subtype = NULL WHERE elective_subtype = ?");
        $updateStmt->bind_param('s', $subtype['name']);
        $updateStmt->execute();
    }
    
    // Delete the elective subtype
    $deleteStmt = $conn->prepare("DELETE FROM elective_subtypes WHERE id = ?");
    $deleteStmt->bind_param('i', $id);
    
    if ($deleteStmt->execute()) {
        respond(['success' => true, 'cleared_subjects' => $checkResult['count']]);
    } else {
        respondError('Failed to remove elective subtype: ' . $deleteStmt->error);
    }
}

else {
    respondError('Method not allowed', 405);
}
