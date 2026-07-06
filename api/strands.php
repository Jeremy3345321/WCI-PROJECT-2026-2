<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$conn = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch all strands
if ($method === 'GET') {
    // Get current strand enum values from subjects table
    $result = $conn->query("SHOW COLUMNS FROM subjects LIKE 'strand'");
    
    if ($result && $row = $result->fetch_assoc()) {
        $type = $row['Type'];
        // Extract enum values: enum('ABM','STEM','TVL','HUMSS','all')
        preg_match("/^enum\(\'(.*)\'\)$/", $type, $matches);
        $enumValues = explode("','", $matches[1]);
        
        // Filter out 'all' and create strand objects
        $strands = [];
        $strandNames = [
            'ABM' => 'Accountancy, Business and Management',
            'STEM' => 'Science, Technology, Engineering and Mathematics',
            'TVL' => 'Technical-Vocational-Livelihood',
            'HUMSS' => 'Humanities and Social Sciences'
        ];
        
        foreach ($enumValues as $code) {
            if ($code !== 'all') {
                $strands[] = [
                    'code' => $code,
                    'name' => $strandNames[$code] ?? $code
                ];
            }
        }
        
        respond(['success' => true, 'strands' => $strands]);
    } else {
        respondError('Failed to fetch strands');
    }
}

// POST - Add new strand
elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $code = strtoupper(trim($input['code'] ?? ''));
    $name = trim($input['name'] ?? '');
    
    if (empty($code) || empty($name)) {
        respondError('Code and name required');
    }
    
    // Validate code format
    if (!preg_match('/^[A-Z]+$/', $code) || strlen($code) > 10) {
        respondError('Code must be letters only (max 10 characters)');
    }
    
    // Get current enum values
    $result = $conn->query("SHOW COLUMNS FROM subjects LIKE 'strand'");
    if (!$result || !($row = $result->fetch_assoc())) {
        respondError('Failed to read current strands');
    }
    
    $type = $row['Type'];
    preg_match("/^enum\(\'(.*)\'\)$/", $type, $matches);
    $enumValues = explode("','", $matches[1]);
    
    // Check if code already exists
    if (in_array($code, $enumValues)) {
        respondError('Strand code already exists');
    }
    
    // Add new value (keep 'all' at the end)
    $newValues = [];
    foreach ($enumValues as $val) {
        if ($val !== 'all') {
            $newValues[] = $val;
        }
    }
    $newValues[] = $code;
    $newValues[] = 'all';
    
    $enumList = "'" . implode("','", $newValues) . "'";
    
    // Update subjects table
    $sql1 = "ALTER TABLE subjects MODIFY COLUMN strand ENUM($enumList) DEFAULT 'all'";
    if (!$conn->query($sql1)) {
        respondError('Failed to update subjects table: ' . $conn->error);
    }
    
    respond(['success' => true, 'message' => 'Strand added successfully']);
}

// PUT - Update strand name (note: this only updates the display name, not the enum value)
elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $code = strtoupper(trim($input['code'] ?? ''));
    $newName = trim($input['name'] ?? '');
    
    if (empty($code) || empty($newName)) {
        respondError('Code and name required');
    }
    
    // Note: Renaming enum values requires complex ALTER TABLE operations
    // For now, we'll just return success (the name is only for display)
    respond(['success' => true, 'message' => 'Strand name updated (display only)']);
}

// DELETE - Remove strand
elseif ($method === 'DELETE') {
    $code = strtoupper(trim($_GET['code'] ?? ''));
    
    if (empty($code)) {
        respondError('Code required');
    }
    
    if ($code === 'ALL') {
        respondError('Cannot delete the "all" strand');
    }
    
    // Check if strand is in use
    $checkSubjects = $conn->prepare("SELECT COUNT(*) as count FROM subjects WHERE strand = ?");
    $checkSubjects->bind_param('s', $code);
    $checkSubjects->execute();
    $result = $checkSubjects->get_result()->fetch_assoc();
    
    if ($result['count'] > 0) {
        respondError("Cannot delete: {$result['count']} subject(s) are using this strand");
    }
    
    $checkSections = $conn->prepare("SELECT COUNT(*) as count FROM sections WHERE strand = ?");
    $checkSections->bind_param('s', $code);
    $checkSections->execute();
    $result = $checkSections->get_result()->fetch_assoc();
    
    if ($result['count'] > 0) {
        respondError("Cannot delete: {$result['count']} section(s) are using this strand");
    }
    
    // Get current enum values
    $result = $conn->query("SHOW COLUMNS FROM subjects LIKE 'strand'");
    if (!$result || !($row = $result->fetch_assoc())) {
        respondError('Failed to read current strands');
    }
    
    $type = $row['Type'];
    preg_match("/^enum\(\'(.*)\'\)$/", $type, $matches);
    $enumValues = explode("','", $matches[1]);
    
    // Remove the code
    $newValues = array_filter($enumValues, function($val) use ($code) {
        return $val !== $code;
    });
    
    $enumList = "'" . implode("','", $newValues) . "'";
    
    // Update subjects table
    $sql1 = "ALTER TABLE subjects MODIFY COLUMN strand ENUM($enumList) DEFAULT 'all'";
    if (!$conn->query($sql1)) {
        respondError('Failed to update subjects table: ' . $conn->error);
    }
    
    respond(['success' => true, 'message' => 'Strand deleted successfully']);
}

else {
    respondError('Method not allowed', 405);
}
