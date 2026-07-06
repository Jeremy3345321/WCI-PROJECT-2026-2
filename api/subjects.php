<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$conn = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch all subjects or single subject
if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    $curriculum = $_GET['curriculum'] ?? 'new';
    
    // If ID is provided, fetch single subject
    if ($id) {
        $stmt = $conn->prepare("SELECT * FROM subjects WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $subject = $result->fetch_assoc();
        
        if ($subject) {
            respond(['success' => true, 'subject' => $subject]);
        } else {
            respondError('Subject not found');
        }
        exit;
    }
    
    // Check if term column exists
    $checkColumn = $conn->query("SHOW COLUMNS FROM `subjects` LIKE 'term'");
    $termColumnExists = $checkColumn && $checkColumn->num_rows > 0;
    
    // Check if units column exists, if not add it
    $checkUnits = $conn->query("SHOW COLUMNS FROM `subjects` LIKE 'units'");
    if (!$checkUnits || $checkUnits->num_rows === 0) {
        $conn->query("ALTER TABLE `subjects` ADD COLUMN `units` INT NOT NULL DEFAULT 1");
    }
    
    // Fetch all JHS subjects (we'll filter by term on the frontend)
    $jhsResult = $conn->query("SELECT * FROM subjects WHERE type = 'jhs' AND curriculum = '$curriculum' ORDER BY category, name");
    
    $g11Sem1Result = $conn->query("SELECT * FROM subjects WHERE type = 'shs' AND (grade = '11' OR grade = 'both') AND (semester = '1' OR semester = 'both') AND curriculum = '$curriculum' ORDER BY category, name");
    $g11Sem2Result = $conn->query("SELECT * FROM subjects WHERE type = 'shs' AND (grade = '11' OR grade = 'both') AND (semester = '2' OR semester = 'both') AND curriculum = '$curriculum' ORDER BY category, name");
    $g12Sem1Result = $conn->query("SELECT * FROM subjects WHERE type = 'shs' AND (grade = '12' OR grade = 'both') AND (semester = '1' OR semester = 'both') AND curriculum = '$curriculum' ORDER BY category, name");
    $g12Sem2Result = $conn->query("SELECT * FROM subjects WHERE type = 'shs' AND (grade = '12' OR grade = 'both') AND (semester = '2' OR semester = 'both') AND curriculum = '$curriculum' ORDER BY category, name");
    
    if ($jhsResult && $g11Sem1Result && $g11Sem2Result && $g12Sem1Result && $g12Sem2Result) {
        $jhs = [];
        while ($row = $jhsResult->fetch_assoc()) {
            $jhs[] = $row;
        }
        
        $g11Sem1 = [];
        while ($row = $g11Sem1Result->fetch_assoc()) {
            $g11Sem1[] = $row;
        }
        
        $g11Sem2 = [];
        while ($row = $g11Sem2Result->fetch_assoc()) {
            $g11Sem2[] = $row;
        }
        
        $g12Sem1 = [];
        while ($row = $g12Sem1Result->fetch_assoc()) {
            $g12Sem1[] = $row;
        }
        
        $g12Sem2 = [];
        while ($row = $g12Sem2Result->fetch_assoc()) {
            $g12Sem2[] = $row;
        }
        
        respond(['success' => true, 'jhs' => $jhs, 'g11Sem1' => $g11Sem1, 'g11Sem2' => $g11Sem2, 'g12Sem1' => $g12Sem1, 'g12Sem2' => $g12Sem2]);
    } else {
        respondError('Failed to fetch subjects: ' . $conn->error);
    }
}

// POST - Add new subject
elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $name = trim($input['name'] ?? '');
    $type = trim($input['type'] ?? '');
    $grade = trim($input['grade'] ?? 'both');
    $semester = trim($input['semester'] ?? 'both');
    $term = trim($input['term'] ?? 'all');
    $category = trim($input['category'] ?? 'core');
    $curriculum = trim($input['curriculum'] ?? 'new');
    $strand = trim($input['strand'] ?? 'all');
    $elective_type = isset($input['elective_type']) ? trim($input['elective_type']) : null;
    $elective_subtype = isset($input['elective_subtype']) ? trim($input['elective_subtype']) : null;
    $units = isset($input['units']) ? intval($input['units']) : 1;
    
    if (empty($name) || empty($type)) {
        respondError('Name and type required');
    }
    
    // Check if term column exists
    $checkColumn = $conn->query("SHOW COLUMNS FROM `subjects` LIKE 'term'");
    $termColumnExists = $checkColumn && $checkColumn->num_rows > 0;
    
    if ($termColumnExists) {
        $stmt = $conn->prepare("INSERT INTO subjects (name, type, grade, semester, term, category, curriculum, strand, elective_type, elective_subtype, units) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('ssssssssssi', $name, $type, $grade, $semester, $term, $category, $curriculum, $strand, $elective_type, $elective_subtype, $units);
    } else {
        $stmt = $conn->prepare("INSERT INTO subjects (name, type, grade, semester, category, curriculum, strand, elective_type, elective_subtype, units) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('sssssssssi', $name, $type, $grade, $semester, $category, $curriculum, $strand, $elective_type, $elective_subtype, $units);
    }
    
    if ($stmt->execute()) {
        respond(['success' => true, 'id' => $conn->insert_id]);
    } else {
        respondError('Failed to add subject: ' . $stmt->error);
    }
}

// PUT - Update subject
elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = trim($input['id'] ?? '');
    $name = trim($input['name'] ?? '');
    $category = trim($input['category'] ?? '');
    $curriculum = trim($input['curriculum'] ?? '');
    $strand = trim($input['strand'] ?? '');
    $term = trim($input['term'] ?? '');
    $elective_type = isset($input['elective_type']) ? trim($input['elective_type']) : null;
    $elective_subtype = isset($input['elective_subtype']) ? trim($input['elective_subtype']) : null;
    $units = isset($input['units']) ? intval($input['units']) : null;
    
    if (empty($id) || empty($name)) {
        respondError('ID and name required');
    }
    
    $updates = ['name = ?'];
    $types = 's';
    $params = [$name];
    
    if (!empty($category)) {
        $updates[] = 'category = ?';
        $types .= 's';
        $params[] = $category;
    }
    
    if (!empty($curriculum)) {
        $updates[] = 'curriculum = ?';
        $types .= 's';
        $params[] = $curriculum;
    }
    
    if (!empty($strand)) {
        $updates[] = 'strand = ?';
        $types .= 's';
        $params[] = $strand;
    }
    
    // Check if term column exists before trying to update it
    if (!empty($term)) {
        $checkColumn = $conn->query("SHOW COLUMNS FROM `subjects` LIKE 'term'");
        if ($checkColumn && $checkColumn->num_rows > 0) {
            $updates[] = 'term = ?';
            $types .= 's';
            $params[] = $term;
        }
    }
    
    // Handle elective_type (can be null)
    if (isset($input['elective_type'])) {
        $updates[] = 'elective_type = ?';
        $types .= 's';
        $params[] = $elective_type;
    }
    
    // Handle elective_subtype (can be null)
    if (isset($input['elective_subtype'])) {
        $updates[] = 'elective_subtype = ?';
        $types .= 's';
        $params[] = $elective_subtype;
    }
    
    // Handle units
    if (isset($input['units'])) {
        $updates[] = 'units = ?';
        $types .= 'i';
        $params[] = $units;
    }
    
    $params[] = $id;
    $types .= 'i';
    
    $sql = "UPDATE subjects SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        respond(['success' => true]);
    } else {
        respondError('Failed to update subject: ' . $stmt->error);
    }
}

// DELETE - Remove subject
elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    
    if (empty($id)) {
        respondError('ID required');
    }
    
    $stmt = $conn->prepare("DELETE FROM subjects WHERE id = ?");
    $stmt->bind_param('i', $id);
    
    if ($stmt->execute()) {
        respond(['success' => true]);
    } else {
        respondError('Failed to remove subject: ' . $stmt->error);
    }
}

else {
    respondError('Method not allowed', 405);
}
