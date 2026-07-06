<?php
// ============================================================
// API: /api/conflicts.php
// GET → returns all conflicts including double-bookings, unit violations, and same-day duplicates
// ============================================================
require_once 'config.php';

$db = getDB();

$allConflicts = [];

// ============================================================
// CONFLICT TYPE 1: Double-booked slots (same section assigned to 2+ teachers at same time)
// ============================================================
$result = $db->query("
    SELECT 
        s.day, s.slot_id, s.section_id,
        COUNT(s.teacher_id) AS teacher_count,
        GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ' / ') AS teachers
    FROM schedules s
    JOIN teachers t ON t.id = s.teacher_id
    WHERE s.section_id != ''
    GROUP BY s.day, s.slot_id, s.section_id
    HAVING teacher_count > 1
    ORDER BY FIELD(s.day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), s.slot_id
");

while ($row = $result->fetch_assoc()) {
    $allConflicts[] = [
        'type' => 'DOUBLE_BOOKING',
        'day' => $row['day'],
        'slot_id' => $row['slot_id'],
        'section_id' => $row['section_id'],
        'teacher_count' => (int)$row['teacher_count'],
        'teachers' => $row['teachers'],
        'message' => "Section {$row['section_id']} has {$row['teacher_count']} teachers at {$row['day']} {$row['slot_id']}: {$row['teachers']}"
    ];
}

// ============================================================
// CONFLICT TYPE 2: Unit compliance violations (subjects not appearing exactly N times per week)
// ============================================================

// Get current term and semester (use defaults if not provided)
$currentTerm = isset($_GET['currentTerm']) ? $_GET['currentTerm'] : '1';
$currentSemester = isset($_GET['currentSemester']) ? $_GET['currentSemester'] : '1';

// Check if term column exists
$checkTermColumn = $db->query("SHOW COLUMNS FROM subjects LIKE 'term'");
$termColumnExists = $checkTermColumn && $checkTermColumn->num_rows > 0;

// Get all sections
$sectionsResult = $db->query("SELECT id, name, grade, strand FROM sections");
$sections = [];
while ($row = $sectionsResult->fetch_assoc()) {
    $sections[] = $row;
}

// Get all subjects
if ($termColumnExists) {
    $subjectsResult = $db->query("SELECT name, type, grade, semester, term, category, strand, units FROM subjects WHERE curriculum = 'new'");
} else {
    $subjectsResult = $db->query("SELECT name, type, grade, semester, category, strand, units FROM subjects WHERE curriculum = 'new'");
}

$subjects = [];
while ($row = $subjectsResult->fetch_assoc()) {
    $subjects[] = [
        'name' => $row['name'],
        'type' => $row['type'],
        'grade' => $row['grade'],
        'semester' => $row['semester'],
        'term' => $termColumnExists ? $row['term'] : 'all',
        'category' => $row['category'],
        'strand' => $row['strand'],
        'units' => isset($row['units']) ? (int)$row['units'] : 1
    ];
}

// For each section, check unit compliance
foreach ($sections as $section) {
    $sectionId = $section['id'];
    $grade = (int)$section['grade'];
    $strand = $section['strand'];
    
    // Get subjects that should be taught to this section
    $sectionSubjects = [];
    foreach ($subjects as $subj) {
        if ($grade <= 10) {
            // JHS subjects
            if ($subj['type'] === 'jhs') {
                $termValue = isset($subj['term']) ? $subj['term'] : 'all';
                if ($termValue === 'all' || $termValue === $currentTerm || empty($termValue)) {
                    $sectionSubjects[] = [
                        'name' => $subj['name'],
                        'units' => $subj['units']
                    ];
                }
            }
        } else {
            // SHS subjects
            if ($subj['type'] === 'shs') {
                $gradeMatch = ($subj['grade'] === 'both' || $subj['grade'] === (string)$grade);
                $semesterMatch = ($subj['semester'] === 'both' || $subj['semester'] === $currentSemester);
                $strandMatch = true;
                if ($subj['category'] === 'applied') {
                    $strandMatch = ($subj['strand'] === 'all' || $subj['strand'] === $strand);
                }
                if ($gradeMatch && $semesterMatch && $strandMatch) {
                    $sectionSubjects[] = [
                        'name' => $subj['name'],
                        'units' => $subj['units']
                    ];
                }
            }
        }
    }
    
    // Remove duplicates
    $uniqueSubjects = [];
    $seenNames = [];
    foreach ($sectionSubjects as $subj) {
        if (!in_array($subj['name'], $seenNames)) {
            $uniqueSubjects[] = $subj;
            $seenNames[] = $subj['name'];
        }
    }
    
    // Count actual occurrences in schedule
    foreach ($uniqueSubjects as $subj) {
        $subjectName = $subj['name'];
        $requiredUnits = $subj['units'];
        
        // Use prepared statement to avoid SQL injection
        $stmt = $db->prepare("
            SELECT COUNT(*) as count 
            FROM schedules 
            WHERE section_id = ? AND subject = ?
        ");
        $stmt->bind_param('ss', $sectionId, $subjectName);
        $stmt->execute();
        $countResult = $stmt->get_result();
        $countRow = $countResult->fetch_assoc();
        $actualUnits = (int)$countRow['count'];
        $stmt->close();
        
        // Flag ANY deviation from required units (including 0 actual when units > 0)
        if ($actualUnits != $requiredUnits) {
            if ($actualUnits < $requiredUnits) {
                $allConflicts[] = [
                    'type' => 'UNIT_DEFICIT',
                    'section' => $section['name'],
                    'section_id' => $sectionId,
                    'subject' => $subjectName,
                    'required_units' => $requiredUnits,
                    'actual_units' => $actualUnits,
                    'deficit' => $requiredUnits - $actualUnits,
                    'message' => "Subject '$subjectName' in section {$section['name']} has only $actualUnits of $requiredUnits required units (deficit: " . ($requiredUnits - $actualUnits) . ")"
                ];
            } else {
                $allConflicts[] = [
                    'type' => 'UNIT_EXCESS',
                    'section' => $section['name'],
                    'section_id' => $sectionId,
                    'subject' => $subjectName,
                    'required_units' => $requiredUnits,
                    'actual_units' => $actualUnits,
                    'excess' => $actualUnits - $requiredUnits,
                    'message' => "Subject '$subjectName' in section {$section['name']} has $actualUnits units but only $requiredUnits required (excess: " . ($actualUnits - $requiredUnits) . ")"
                ];
            }
        }
    }
}

// ============================================================
// CONFLICT TYPE 3: Same-day duplicates (same subject appearing multiple times on same day)
// NOTE: Only applies to JHS (grades 7-10). SHS subjects can appear multiple times per day.
// ============================================================
$duplicatesResult = $db->query("
    SELECT 
        s.section_id, 
        s.day, 
        s.subject, 
        COUNT(*) as occurrences,
        sec.grade
    FROM schedules s
    JOIN sections sec ON sec.id = s.section_id
    WHERE s.section_id != ''
    GROUP BY s.section_id, s.day, s.subject
    HAVING occurrences > 1 AND sec.grade <= 10
    ORDER BY s.section_id, FIELD(s.day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')
");

while ($row = $duplicatesResult->fetch_assoc()) {
    // Get section name
    $sectionName = $row['section_id'];
    foreach ($sections as $sec) {
        if ($sec['id'] === $row['section_id']) {
            $sectionName = $sec['name'];
            break;
        }
    }
    
    $allConflicts[] = [
        'type' => 'SAME_DAY_DUPLICATE',
        'section' => $sectionName,
        'section_id' => $row['section_id'],
        'subject' => $row['subject'],
        'day' => $row['day'],
        'occurrences' => (int)$row['occurrences'],
        'message' => "Subject '{$row['subject']}' appears {$row['occurrences']} times on {$row['day']} in section $sectionName (should appear only once per day for JHS)"
    ];
}

// ============================================================
// CONFLICT TYPE 4: Schedule gaps (empty slots between scheduled subjects)
// ============================================================
$days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
$jhsSlots = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'];
$shsSlots = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];

foreach ($sections as $section) {
    $sectionId = $section['id'];
    $grade = (int)$section['grade'];
    $availableSlots = $grade <= 10 ? $jhsSlots : $shsSlots;
    $availableDays = $grade <= 10 ? array_slice($days, 0, 5) : $days;
    
    foreach ($availableDays as $day) {
        // Get all scheduled slots for this section on this day
        $scheduledSlotsResult = $db->query("
            SELECT slot_id 
            FROM schedules 
            WHERE section_id = '$sectionId' AND day = '$day'
            ORDER BY slot_id
        ");
        
        $scheduledSlots = [];
        while ($slotRow = $scheduledSlotsResult->fetch_assoc()) {
            $scheduledSlots[] = $slotRow['slot_id'];
        }
        
        if (empty($scheduledSlots)) continue;
        
        // Get slot numbers
        $scheduledSlotNumbers = array_map(function($s) { return (int)str_replace('p', '', $s); }, $scheduledSlots);
        $minSlot = min($scheduledSlotNumbers);
        $maxSlot = max($scheduledSlotNumbers);
        
        // Check for gaps between min and max
        for ($slotNum = $minSlot + 1; $slotNum < $maxSlot; $slotNum++) {
            if (!in_array($slotNum, $scheduledSlotNumbers)) {
                $allConflicts[] = [
                    'type' => 'SCHEDULE_GAP',
                    'section' => $section['name'],
                    'section_id' => $sectionId,
                    'day' => $day,
                    'gap_slot' => 'p' . $slotNum,
                    'message' => "Gap detected on $day in section {$section['name']} at slot p$slotNum (subjects should be consecutive)"
                ];
            }
        }
    }
}

$db->close();

// Group conflicts by type for easier frontend handling
$conflictsByType = [
    'DOUBLE_BOOKING' => [],
    'UNIT_DEFICIT' => [],
    'UNIT_EXCESS' => [],
    'SAME_DAY_DUPLICATE' => [],
    'SCHEDULE_GAP' => []
];

foreach ($allConflicts as $conflict) {
    $conflictsByType[$conflict['type']][] = $conflict;
}

respond([
    'success' => true, 
    'conflicts' => $allConflicts, 
    'conflicts_by_type' => $conflictsByType,
    'total' => count($allConflicts),
    'summary' => [
        'double_bookings' => count($conflictsByType['DOUBLE_BOOKING']),
        'unit_deficits' => count($conflictsByType['UNIT_DEFICIT']),
        'unit_excesses' => count($conflictsByType['UNIT_EXCESS']),
        'same_day_duplicates' => count($conflictsByType['SAME_DAY_DUPLICATE']),
        'schedule_gaps' => count($conflictsByType['SCHEDULE_GAP'])
    ]
]);
