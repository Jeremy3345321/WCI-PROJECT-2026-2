<?php
// ============================================================
// API: /api/auto_schedule.php
// POST → automatically generate schedules without conflicts
// ============================================================

// Enable error reporting for debugging but don't display errors in API response
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in API response
ini_set('log_errors', 1); // Log errors instead

// Start output buffering to catch any unexpected output
ob_start();

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondError('Method not allowed', 405);
}


$db = getDB();
    
    if (!$db) {
        respondError('Database connection failed');
    }
    
    // Get current term and semester from request or use defaults
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        respondError('Invalid JSON input: ' . json_last_error_msg());
    }
    
    $currentTerm = isset($input['currentTerm']) ? $input['currentTerm'] : '1'; // For JHS
    $currentSemester = isset($input['currentSemester']) ? $input['currentSemester'] : '1'; // For SHS
    $g12Curriculum = isset($input['g12Curriculum']) ? $input['g12Curriculum'] : 'old'; // For Grade 12 curriculum mode

    // Get all teachers with their subjects, availability, and custom load
    $teachersResult = $db->query("SELECT id, name, subjects, availability, `load`, departments, jhs_grades FROM teachers");
    if (!$teachersResult) {
        respondError('Failed to fetch teachers: ' . $db->error);
    }
    
    $teachers = [];
    while ($row = $teachersResult->fetch_assoc()) {
        // Handle subjects: can be pipe-delimited string or JSON array
        $subjectsData = $row['subjects'] ?: '';
        if ($subjectsData && $subjectsData[0] !== '[') {
            // Pipe-delimited format
            $subjects = array_values(array_filter(explode('|', $subjectsData)));
        } else {
            // JSON format
            $subjects = json_decode($subjectsData ?: '[]', true) ?? [];
        }
        
        $teachers[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'subjects' => $subjects,
            'availability' => json_decode($row['availability'] ?: '{}', true) ?? [],
            'load' => isset($row['load']) && $row['load'] !== '' ? (int)$row['load'] : null,
            'departments' => json_decode($row['departments'] ?: '{}', true) ?? [],
            'jhs_grades' => json_decode($row['jhs_grades'] ?: '{}', true) ?? []
        ];
    }

    // Get all sections
    $sectionsResult = $db->query("SELECT id, name, grade, strand, availability, section_elective_subtypes FROM sections");
    if (!$sectionsResult) {
        respondError('Failed to fetch sections: ' . $db->error);
    }
    
    $sections = [];
    while ($row = $sectionsResult->fetch_assoc()) {
        $electiveSubtypes = [];
        if (!empty($row['section_elective_subtypes'])) {
            $decoded = json_decode($row['section_elective_subtypes'], true);
            if (is_array($decoded)) $electiveSubtypes = $decoded;
        }
        $sections[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'grade' => (int)$row['grade'],
            'strand' => $row['strand'],
            'availability' => json_decode($row['availability'] ?: '{}', true),
            'section_elective_subtypes' => $electiveSubtypes
        ];
    }

    // Check if term column exists
    $checkTermColumn = $db->query("SHOW COLUMNS FROM subjects LIKE 'term'");
    $termColumnExists = $checkTermColumn && $checkTermColumn->num_rows > 0;
    
    // Check if units column exists, if not add it
    $checkUnits = $db->query("SHOW COLUMNS FROM subjects LIKE 'units'");
    if (!$checkUnits || $checkUnits->num_rows === 0) {
        $db->query("ALTER TABLE subjects ADD COLUMN units INT NOT NULL DEFAULT 1");
    }
    
    // Get all subjects with proper fields including units
    // For Grade 12, use the specified curriculum; for others, use 'new' curriculum
    // We'll fetch both and filter later based on section grade
    if ($termColumnExists) {
        $subjectsResult = $db->query("SELECT name, type, grade, semester, term, category, strand, curriculum, elective_type, elective_subtype, units FROM subjects");
    } else {
        $subjectsResult = $db->query("SELECT name, type, grade, semester, category, strand, curriculum, elective_type, elective_subtype, units FROM subjects");
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
            'curriculum' => $row['curriculum'],
            'elective_type' => $row['elective_type'],
            'elective_subtype' => $row['elective_subtype'],
            'units' => isset($row['units']) ? (int)$row['units'] : 1
        ];
    }

// Define time slots
$days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
$jhsSlots = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']; // JHS: 8 periods (100% load)
$shsSlots = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']; // SHS: 9 periods (100% load)

// Maximum periods per week for 100% load
$jhsMaxPeriodsPerWeek = 8 * 5; // 8 periods/day * 5 days = 40 periods/week
$shsMaxPeriodsPerWeek = 9 * 6; // 9 periods/day * 6 days = 54 periods/week

// Initialize schedule tracking
$schedule = []; // [teacher_id][day][slot] = ['section' => section_id, 'subject' => subject]
$sectionSchedule = []; // [section_id][day][slot] = ['teacher' => teacher_id, 'subject' => subject]
$subjectUsagePerDay = []; // [section_id][day][subject] = count
$subjectUsagePerWeek = []; // [section_id][subject] = count
$teacherPeriodCount = []; // [teacher_id] = total periods assigned
$conflicts = []; // Track scheduling conflicts

// Helper function to check if teacher is available
function isTeacherAvailable($teacher, $day, $slot) {
    $avail = $teacher['availability'];
    if (empty($avail)) return true; // No restrictions = available
    if (!isset($avail[$day])) return false;
    $dayAvail = $avail[$day];
    
    // Support both formats:
    // 1) Object format: { "p2": true, "p3": true } (saved by frontend)
    // 2) Legacy array format: ["p2", "p3"]
    // 3) Time-range format: { available:true, timeIn:"07:00", timeOut:"17:30" }
    if (is_array($dayAvail)) {
        // Check if this is time-range format
        if (isset($dayAvail['available']) && $dayAvail['available'] === true && isset($dayAvail['timeIn']) && isset($dayAvail['timeOut'])) {
            // Convert time range to period slots and check if requested slot is within range
            $timeIn = $dayAvail['timeIn'];
            $timeOut = $dayAvail['timeOut'];
            
            // Convert 12-hour format to 24-hour if needed
            $timeIn = convertTo24Hour($timeIn);
            $timeOut = convertTo24Hour($timeOut);
            
            // Define period time ranges for both JHS and SHS
            // We'll use SHS times as the default since they're more common for time-based availability
            $periodTimes = [
                'p1' => ['start' => '07:00', 'end' => '07:30'],  // JHS only
                'p2' => ['start' => '07:30', 'end' => '08:30'],  // Both (JHS) / 7:30-8:30 (SHS)
                'p3' => ['start' => '08:30', 'end' => '09:30'],  // Both
                'p4' => ['start' => '09:30', 'end' => '10:30'],  // SHS: 9:30-10:30 (no break) / JHS: 9:45-10:45
                'p5' => ['start' => '10:45', 'end' => '11:45'],  // SHS: 10:45-11:45 / JHS: 10:45-11:45
                'p6' => ['start' => '11:45', 'end' => '12:45'],  // SHS: 11:45-12:45 / JHS: 12:15-13:15
                'p7' => ['start' => '13:15', 'end' => '14:15'],  // Both (after lunch)
                'p8' => ['start' => '14:15', 'end' => '15:15'],  // SHS: 14:15-15:15 / JHS: 14:30-15:30
                'p9' => ['start' => '15:30', 'end' => '16:30'],  // Both (after break)
                'p10' => ['start' => '16:30', 'end' => '17:30']  // SHS only: 4:30 PM - 5:30 PM
            ];
            
            // Check if the requested slot exists in period times
            if (!isset($periodTimes[$slot])) {
                return false;
            }
            
            $slotStart = $periodTimes[$slot]['start'];
            $slotEnd = $periodTimes[$slot]['end'];
            
            // Teacher is available if their time range covers the entire period slot
            // Period is available if: teacher timeIn <= slot start AND teacher timeOut >= slot end
            $isAvailable = ($timeIn <= $slotStart && $timeOut >= $slotEnd);
            
            return $isAvailable;
        }
        
        // Legacy check for 'available' without time range (treat as all day)
        if (isset($dayAvail['available']) && $dayAvail['available'] === true && !isset($dayAvail['timeIn'])) {
            return true;
        }
        
        if (count($dayAvail) > 0 && !isset($dayAvail[0])) {
            // Associative array (object format) — check if slot key is true
            return isset($dayAvail[$slot]) && $dayAvail[$slot] === true;
        }
        return in_array($slot, $dayAvail);
    }
    return false;
}

// Helper function to convert 12-hour time format to 24-hour format
function convertTo24Hour($time) {
    // If already in 24-hour format (HH:MM), return as is
    if (preg_match('/^\d{2}:\d{2}$/', $time)) {
        return $time;
    }
    
    // Handle 12-hour format with am/pm
    if (preg_match('/^(\d{1,2}):(\d{2})\s*(am|pm)$/i', $time, $matches)) {
        $hour = (int)$matches[1];
        $minute = $matches[2];
        $meridiem = strtolower($matches[3]);
        
        if ($meridiem === 'pm' && $hour !== 12) {
            $hour += 12;
        } elseif ($meridiem === 'am' && $hour === 12) {
            $hour = 0;
        }
        
        return sprintf('%02d:%02d', $hour, $minute);
    }
    
    // Return as is if format not recognized
    return $time;
}

// Helper function to check if section is available
function isSectionAvailable($section, $day, $slot) {
    $avail = $section['availability'];
    if (empty($avail)) return true; // No restrictions = available
    if (!isset($avail[$day])) return false;
    return in_array($slot, $avail[$day]);
}

// Helper function to check if slot is free for teacher
function isTeacherSlotFree($schedule, $teacherId, $day, $slot) {
    return !isset($schedule[$teacherId][$day][$slot]);
}

// Helper function to check if slot is free for section
function isSectionSlotFree($sectionSchedule, $sectionId, $day, $slot) {
    return !isset($sectionSchedule[$sectionId][$day][$slot]);
}

// Helper function to check if teacher has reached maximum reasonable load
function hasTeacherReachedMaxLoad($teacherPeriodCount, $teacherId, $grade, $teachers) {
    global $jhsMaxPeriodsPerWeek, $shsMaxPeriodsPerWeek;
    
    // Find the teacher to get their custom load and departments
    $teacher = null;
    foreach ($teachers as $t) {
        if ($t['id'] === $teacherId) {
            $teacher = $t;
            break;
        }
    }
    
    if (!$teacher) {
        return true; // If teacher not found, consider them at max load
    }
    
    $maxLoad = null;
    
    // Check if teacher has a custom load set (from availability calculation)
    if ($teacher['load'] && $teacher['load'] > 0) {
        // Use teacher's custom load (this is in periods per week)
        $maxLoad = $teacher['load'];
    } else {
        // Determine max load based on teacher's departments
        // Check what departments the teacher is assigned to
        $teachesJHS = false;
        $teachesSHS = false;
        
        // Check teacher's subjects to determine their departments
        if (isset($teacher['subjects']) && is_array($teacher['subjects'])) {
            foreach ($teacher['subjects'] as $teacherSubject) {
                // This is a simplified check - in reality we'd need to look up each subject
                // For now, assume if they're being considered for this grade, they can teach it
                if ($grade <= 10) {
                    $teachesJHS = true;
                } else {
                    $teachesSHS = true;
                }
            }
        }
        
        // If teacher teaches both JHS and SHS, use the higher limit
        // If teacher teaches only one, use that limit
        // Default to the current section's grade level if we can't determine
        if ($teachesJHS && $teachesSHS) {
            $maxLoad = max($jhsMaxPeriodsPerWeek, $shsMaxPeriodsPerWeek);
        } else if ($teachesJHS) {
            $maxLoad = $jhsMaxPeriodsPerWeek;
        } else if ($teachesSHS) {
            $maxLoad = $shsMaxPeriodsPerWeek;
        } else {
            // Default based on current section grade
            $maxLoad = $grade <= 10 ? $jhsMaxPeriodsPerWeek : $shsMaxPeriodsPerWeek;
        }
    }
    
    $currentLoad = isset($teacherPeriodCount[$teacherId]) ? $teacherPeriodCount[$teacherId] : 0;
    return $currentLoad >= $maxLoad;
}

// Helper function to check if subject was already used today for this section
function wasSubjectUsedToday($subjectUsagePerDay, $sectionId, $day, $subject) {
    return isset($subjectUsagePerDay[$sectionId][$day][$subject]) && $subjectUsagePerDay[$sectionId][$day][$subject] > 0;
}

// Helper function to check if placing a subject would create back-to-back periods
function wouldCreateBackToBackPeriods($sectionSchedule, $sectionId, $day, $slot, $subject, $availableSlots, $isLateWeekSlot = false) {
    // For late week slots (Friday afternoon), be more flexible with back-to-back prevention
    // This ensures Friday afternoon slots get filled even if it means some back-to-back periods
    if ($isLateWeekSlot) {
        // Only prevent back-to-back if it would create 3+ consecutive periods of the same subject
        $consecutiveCount = 1; // Current slot counts as 1
        
        // Get the index of current slot
        $currentSlotIndex = array_search($slot, $availableSlots);
        if ($currentSlotIndex === false) return false;
        
        // Count consecutive periods before this slot
        $checkIndex = $currentSlotIndex - 1;
        while ($checkIndex >= 0) {
            $checkSlot = $availableSlots[$checkIndex];
            if (isset($sectionSchedule[$sectionId][$day][$checkSlot])) {
                $checkEntry = $sectionSchedule[$sectionId][$day][$checkSlot];
                if (is_array($checkEntry) && isset($checkEntry['subject']) && $checkEntry['subject'] === $subject) {
                    $consecutiveCount++;
                    $checkIndex--;
                } else {
                    break; // Different subject, stop counting
                }
            } else {
                break; // Empty slot, stop counting
            }
        }
        
        // Count consecutive periods after this slot
        $checkIndex = $currentSlotIndex + 1;
        while ($checkIndex < count($availableSlots)) {
            $checkSlot = $availableSlots[$checkIndex];
            if (isset($sectionSchedule[$sectionId][$day][$checkSlot])) {
                $checkEntry = $sectionSchedule[$sectionId][$day][$checkSlot];
                if (is_array($checkEntry) && isset($checkEntry['subject']) && $checkEntry['subject'] === $subject) {
                    $consecutiveCount++;
                    $checkIndex++;
                } else {
                    break; // Different subject, stop counting
                }
            } else {
                break; // Empty slot, stop counting
            }
        }
        
        // Allow up to 2 consecutive periods for late week slots, prevent 3+
        return $consecutiveCount >= 3;
    }
    
    // Regular back-to-back prevention for early week slots
    // Get the index of current slot
    $currentSlotIndex = array_search($slot, $availableSlots);
    if ($currentSlotIndex === false) return false;
    
    // Check previous slot (if exists)
    if ($currentSlotIndex > 0) {
        $prevSlot = $availableSlots[$currentSlotIndex - 1];
        if (isset($sectionSchedule[$sectionId][$day][$prevSlot])) {
            $prevEntry = $sectionSchedule[$sectionId][$day][$prevSlot];
            if (is_array($prevEntry) && isset($prevEntry['subject']) && $prevEntry['subject'] === $subject) {
                return true; // Would create back-to-back with previous period
            }
        }
    }
    
    // Check next slot (if exists)
    if ($currentSlotIndex < count($availableSlots) - 1) {
        $nextSlot = $availableSlots[$currentSlotIndex + 1];
        if (isset($sectionSchedule[$sectionId][$day][$nextSlot])) {
            $nextEntry = $sectionSchedule[$sectionId][$day][$nextSlot];
            if (is_array($nextEntry) && isset($nextEntry['subject']) && $nextEntry['subject'] === $subject) {
                return true; // Would create back-to-back with next period
            }
        }
    }
    
    return false;
}

// Helper function to get appropriate slots for grade
function getSlotsForGrade($grade) {
    global $jhsSlots, $shsSlots;
    return $grade <= 10 ? $jhsSlots : $shsSlots;
}

// Helper function to get days for grade (JHS: Mon-Fri, SHS: Mon-Sat)
function getDaysForGrade($grade) {
    global $days;
    return $grade <= 10 ? array_slice($days, 0, 5) : $days;
}

// Helper: find eligible teachers for a subject at a given day/slot
function findEligibleTeachers($subject, $day, $slot, $grade, $teachers, $subjects, $schedule, $teacherPeriodCount, $sectionTeacherAssignment = null, $sectionId = null) {
    $eligible = [];
    foreach ($teachers as $teacher) {
        // Skip teachers with no subjects assigned
        if (!is_array($teacher['subjects']) || empty($teacher['subjects'])) continue;
        
        // STRICT: Only teachers who have this specific subject assigned can teach it
        if (!in_array($subject, $teacher['subjects'])) continue;
        
        // Verify subject matches grade level
        $subjectMatchesGrade = false;
        foreach ($subjects as $s) {
            if ($s['name'] === $subject) {
                if ($grade <= 10 && $s['type'] === 'jhs') { $subjectMatchesGrade = true; break; }
                if ($grade > 10 && $s['type'] === 'shs') { $subjectMatchesGrade = true; break; }
            }
        }
        if (!$subjectMatchesGrade) continue;
        // Department/grade checks
        if ($grade <= 10) {
            $td = $teacher['departments'] ?? [];
            $tjg = $teacher['jhs_grades'] ?? [];
            if (!isset($td['jhs']) || !$td['jhs']) continue;
            $checkedJhsGrades = [];
            foreach ([7, 8, 9, 10] as $g) {
                if (!empty($tjg["grade{$g}"])) {
                    $checkedJhsGrades[] = $g;
                }
            }
            if (count($checkedJhsGrades) > 0 && !in_array($grade, $checkedJhsGrades, true)) {
                continue;
            }
        } else {
            $td = $teacher['departments'] ?? [];
            if (!isset($td['shs']) || !$td['shs']) continue;
            $checkedShsGrades = [];
            foreach ([11, 12] as $g) {
                if (!empty($td["grade{$g}"])) {
                    $checkedShsGrades[] = $g;
                }
            }
            if (count($checkedShsGrades) > 0 && !in_array($grade, $checkedShsGrades, true)) {
                continue;
            }
        }
        if ($grade <= 10 && $day === 'Saturday') continue;
        if (!isTeacherAvailable($teacher, $day, $slot)) continue;
        if (!isTeacherSlotFree($schedule, $teacher['id'], $day, $slot)) continue;
        if (hasTeacherReachedMaxLoad($teacherPeriodCount, $teacher['id'], $grade, $teachers)) continue;
        $eligible[] = $teacher;
    }
    // Sort by load ascending
    usort($eligible, function($a, $b) use ($teacherPeriodCount) {
        return (isset($teacherPeriodCount[$a['id']]) ? $teacherPeriodCount[$a['id']] : 0)
             - (isset($teacherPeriodCount[$b['id']]) ? $teacherPeriodCount[$b['id']] : 0);
    });

    // If the section already has a teacher assigned for this subject, enforce that same teacher.
    if ($sectionTeacherAssignment !== null && $sectionId !== null && isset($sectionTeacherAssignment[$sectionId][$subject])) {
        $preferredTeacherId = $sectionTeacherAssignment[$sectionId][$subject];
        foreach ($eligible as $teacher) {
            if ($teacher['id'] === $preferredTeacherId) {
                return [$teacher];
            }
        }
        return [];
    }

    return $eligible;
}

// Main scheduling algorithm
$assignments = [];
$failedAssignments = [];

// For each section, try to assign subjects
foreach ($sections as $section) {
    $sectionId = $section['id'];
    $grade = $section['grade'];
    $strand = $section['strand'];
    $availableDays = getDaysForGrade($grade);
    $availableSlots = getSlotsForGrade($grade);
    
    // Get subjects that should be taught to this section
    $sectionSubjects = [];
    foreach ($subjects as $subj) {
        // Match subjects to section based on grade, type, term/semester, strand, and curriculum
        if ($grade <= 10) {
            // JHS subjects - match by type and term
            if ($subj['type'] === 'jhs') {
                // Check if subject is for current term or all terms
                // If term is not set or empty, include it (backward compatibility)
                $termValue = isset($subj['term']) ? $subj['term'] : 'all';
                $termMatch = ($termValue === 'all' || $termValue === $currentTerm || empty($termValue));
                
                // FILTER: Only use 'new' curriculum for JHS
                $curriculumMatch = (isset($subj['curriculum']) && $subj['curriculum'] === 'new');
                
                if ($curriculumMatch && $termMatch) {
                    $sectionSubjects[] = [
                        'name' => $subj['name'],
                        'units' => $subj['units']
                    ];
                }
            }
        } else {
            // SHS subjects - match by grade, semester, strand, curriculum, and elective subtype
            if ($subj['type'] === 'shs') {
                // For Grade 12, check curriculum preference
                $curriculumMatch = true;
                if ($grade === 12) {
                    $curriculumMatch = ($subj['curriculum'] === $g12Curriculum);
                } else {
                    // For Grade 11, always use 'new' curriculum
                    $curriculumMatch = ($subj['curriculum'] === 'new');
                }
                
                // Check grade match
                $gradeMatch = ($subj['grade'] === 'both' || $subj['grade'] === (string)$grade);
                
                // Check semester match
                $semesterMatch = ($subj['semester'] === 'both' || $subj['semester'] === $currentSemester);
                
                // Check strand/elective match for applied subjects
                $strandMatch = true;
                if ($subj['category'] === 'applied') {
                    $sectionElectiveSubtypes = $section['section_elective_subtypes'] ?? [];
                    
                    // For old curriculum (strand-based), use strand matching
                    if ($g12Curriculum === 'old' && $grade === 12) {
                        $strandMatch = ($subj['strand'] === 'all' || $subj['strand'] === $strand || empty($subj['strand']));
                    } else if (!empty($sectionElectiveSubtypes)) {
                        // New curriculum: filter by elective_subtype
                        if (!empty($subj['elective_subtype'])) {
                            // Subject has a specific elective subtype — must match section's assigned subtypes
                            $strandMatch = in_array($subj['elective_subtype'], $sectionElectiveSubtypes);
                        } else {
                            // Subject has no elective_subtype — fall back to strand matching
                            $strandMatch = ($subj['strand'] === 'all' || $subj['strand'] === $strand || empty($subj['strand']));
                        }
                    } else {
                        // No elective subtypes assigned to section — fall back to strand matching
                        $strandMatch = ($subj['strand'] === 'all' || $subj['strand'] === $strand || empty($subj['strand']));
                    }
                }
                
                if ($curriculumMatch && $gradeMatch && $semesterMatch && $strandMatch) {
                    $sectionSubjects[] = [
                        'name' => $subj['name'],
                        'units' => $subj['units']
                    ];
                }
            }
        }
    }
    
    // Remove duplicates by name (prefer new curriculum and higher units)
    $uniqueSubjects = [];
    $subjectsByName = [];
    
    foreach ($sectionSubjects as $subj) {
        $subjectName = $subj['name'];
        
        if (!isset($subjectsByName[$subjectName])) {
            // First occurrence of this subject
            $subjectsByName[$subjectName] = $subj;
        } else {
            // Duplicate found - keep the one with more units
            if ($subj['units'] > $subjectsByName[$subjectName]['units']) {
                $subjectsByName[$subjectName] = $subj;
            }
        }
    }
    
    // Convert back to indexed array
    $sectionSubjects = array_values($subjectsByName);
    
    // Debug: Track sections with no subjects
    if (empty($sectionSubjects)) {
        $failedAssignments[] = [
            'section' => $sectionId,
            'subject' => 'N/A',
            'reason' => 'No subjects found for this section (grade: ' . $grade . ', strand: ' . $strand . ')'
        ];
        continue;
    }
    
    // For JHS sections, add PRELIMINARIES at p1 slot (7:00-7:30 AM) for advisory teacher
    if ($grade <= 10) {
        // Get advisory teacher for this section
        $advisoryTeacherId = null;
        $advisoryTeacherResult = $db->query("SELECT id FROM teachers WHERE advisory_section = '$sectionId' LIMIT 1");
        if ($advisoryTeacherResult && $row = $advisoryTeacherResult->fetch_assoc()) {
            $advisoryTeacherId = $row['id'];
        }
        
        // Schedule PRELIMINARIES for Monday-Friday at p1
        if ($advisoryTeacherId) {
            // For PRELIMINARIES, advisory teacher just needs to have JHS department
            // They don't need to have the specific grade selected since they're the advisory teacher
            $advisoryTeacherCanTeachGrade = false;
            foreach ($teachers as $t) {
                if ($t['id'] === $advisoryTeacherId) {
                    $teacherDepts = $t['departments'] ?? [];
                    
                    // Teacher must have JHS department checked
                    if (isset($teacherDepts['jhs']) && $teacherDepts['jhs']) {
                        $advisoryTeacherCanTeachGrade = true;
                    }
                    break;
                }
            }
            
            if ($advisoryTeacherCanTeachGrade) {
                foreach (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as $day) {
                    $slot = 'p1';
                    
                    // Check if teacher and section are available
                    $teacherAvailable = true;
                    foreach ($teachers as $t) {
                        if ($t['id'] === $advisoryTeacherId) {
                            $teacherAvailable = isTeacherAvailable($t, $day, $slot);
                            break;
                        }
                    }
                    
                    if ($teacherAvailable && isSectionAvailable($section, $day, $slot)) {
                        $schedule[$advisoryTeacherId][$day][$slot] = [
                            'section' => $sectionId,
                            'subject' => 'PRELIMINARIES'
                        ];
                        $sectionSchedule[$sectionId][$day][$slot] = [
                            'teacher' => $advisoryTeacherId,
                            'subject' => 'PRELIMINARIES'
                        ];
                        
                        if (!isset($teacherPeriodCount[$advisoryTeacherId])) {
                            $teacherPeriodCount[$advisoryTeacherId] = 0;
                        }
                        $teacherPeriodCount[$advisoryTeacherId]++;
                        
                        $assignments[] = [
                            'teacher_id' => $advisoryTeacherId,
                            'day' => $day,
                            'slot_id' => $slot,
                            'section_id' => $sectionId,
                            'subject' => 'PRELIMINARIES'
                        ];
                    }
                }
            }
        }
    }
    
    // ABSOLUTE STRICT UNIT COMPLIANCE: Calculate total required periods for this section
    $totalRequiredPeriods = 0;
    foreach ($sectionSubjects as $subj) {
        $totalRequiredPeriods += $subj['units'];
    }
    
    // Calculate how many total slots this section needs to fill
    $totalSlotsNeeded = count($availableDays) * count($availableSlots);

    // Count only subject slots already filled (exclude PRELIMINARIES at p1)
    $slotsFilledForSection = 0;
    if (isset($sectionSchedule[$sectionId])) {
        foreach ($sectionSchedule[$sectionId] as $day => $slots) {
            foreach ($slots as $slot => $entry) {
                if ($slot !== 'p1') {
                    $slotsFilledForSection++;
                }
            }
        }
    }
    
    // STRICT COMPLIANCE: Don't try to fill more slots than required periods
    $maxSlotsToFill = min($totalSlotsNeeded, $totalRequiredPeriods);
    
    // Initialize subject usage tracking for this section
    if (!isset($subjectUsagePerWeek[$sectionId])) {
        $subjectUsagePerWeek[$sectionId] = [];
    }

    // Track teacher assignment for each subject within this section
    $sectionTeacherAssignment = [];
    
    // ================================================================
    // SCHEDULING ALGORITHM - Clean rewrite
    // Rules:
    // 1. Each subject appears exactly its unit count times per week
    // 2. Same subject NEVER appears twice on the same day UNLESS it is an SHS
    //    subject with 4+ units — in that case exactly ONE day gets a double period
    //    (2 consecutive slots) and the remaining units spread 1-per-day
    // 3. Subjects fill slots sequentially with NO gaps (free time only at end)
    // 4. Teacher availability is strictly respected
    // ================================================================

    // OPTIMIZATION: Pre-calculate teacher availability for all subjects
    // This avoids repeated availability checks in the loop
    $subjectTeacherAvailability = []; // [subjectName] => [day] => hasAvailableTeacher
    
    foreach ($sectionSubjects as $subj) {
        $subjectName = $subj['name'];
        $subjectTeacherAvailability[$subjectName] = [];
        
        // Find teachers who can teach this subject
        $teachersForSubject = [];
        foreach ($teachers as $t) {
            if (is_array($t['subjects']) && in_array($subjectName, $t['subjects'])) {
                // Check if teacher can teach this grade
                if ($grade <= 10) {
                    $td = $t['departments'] ?? [];
                    if (isset($td['jhs']) && $td['jhs']) {
                        $teachersForSubject[] = $t;
                    }
                } else {
                    $td = $t['departments'] ?? [];
                    if (isset($td['shs']) && $td['shs']) {
                        $teachersForSubject[] = $t;
                    }
                }
            }
        }
        
        // For each day, check if at least one teacher is available
        foreach ($availableDays as $day) {
            $subjectTeacherAvailability[$subjectName][$day] = false;
            foreach ($teachersForSubject as $t) {
                // Quick check: if teacher has any availability on this day, mark as available
                // We don't need to check every slot here, just if they're available at all
                $avail = $t['availability'];
                if (!empty($avail) && isset($avail[$day])) {
                    $dayAvail = $avail[$day];
                    if (is_array($dayAvail)) {
                        if (isset($dayAvail['available']) && $dayAvail['available'] === true) {
                            $subjectTeacherAvailability[$subjectName][$day] = true;
                            break; // At least one teacher available
                        }
                    }
                }
            }
        }
    }

    // Step 1: Distribute subject units across days
    // Build a plan: for each subject with N units, pick N different days.
    // EXCEPTION: SHS subjects with units >= 4 get one "double-period" day
    //   (that day receives 2 entries for the subject) and the rest spread 1-per-day.
    $dayPlan = []; // [day] => [subjectName, ...]
    foreach ($availableDays as $d) $dayPlan[$d] = [];

    // Track which subjects get a double-period day (SHS, units >= 4)
    $doublePeriodSubjects = []; // [subjectName] => true

    // Sort subjects by units descending so high-unit subjects spread first
    $sortedSubjects = $sectionSubjects;
    usort($sortedSubjects, function($a, $b) { return $b['units'] - $a['units']; });

    foreach ($sortedSubjects as $subj) {
        $subjectName = $subj['name'];
        $units = $subj['units'];
        $isDoubleDay = ($grade > 10 && $units >= 4);

        // Use pre-calculated availability
        $daysWithAvailableTeachers = [];
        if (isset($subjectTeacherAvailability[$subjectName])) {
            foreach ($subjectTeacherAvailability[$subjectName] as $day => $hasTeacher) {
                if ($hasTeacher) {
                    $daysWithAvailableTeachers[] = $day;
                }
            }
        }
        
        // If no teachers available, use all days as fallback (will be handled in recovery)
        if (empty($daysWithAvailableTeachers)) {
            $daysWithAvailableTeachers = $availableDays;
        }

        if ($isDoubleDay) {
            // One day gets 2 slots, remaining (units - 2) days get 1 slot each
            $doublePeriodSubjects[$subjectName] = true;
            $singleDayUnits = $units - 2; // remaining units spread 1-per-day

            // Ensure we have enough days for single-day units
            if ($singleDayUnits > count($daysWithAvailableTeachers) - 1) {
                $singleDayUnits = count($daysWithAvailableTeachers) - 1;
            }

            // Pick the lightest-loaded day for the double period (from available days only)
            $dayLoads = [];
            foreach ($daysWithAvailableTeachers as $d) {
                $dayLoads[$d] = isset($dayPlan[$d]) ? count($dayPlan[$d]) : 0;
            }
            asort($dayLoads);
            $allDaysSorted = array_keys($dayLoads);
            $doubleDay = $allDaysSorted[0];

            // Add subject twice on the double-period day
            $dayPlan[$doubleDay][] = $subjectName;
            $dayPlan[$doubleDay][] = $subjectName;

            // Pick remaining days for single-period placements (exclude the double day)
            $remainingDays = array_filter($allDaysSorted, function($d) use ($doubleDay) { return $d !== $doubleDay; });
            $remainingDays = array_values($remainingDays);
            $daysToUse = array_slice($remainingDays, 0, $singleDayUnits);

            foreach ($daysToUse as $d) $dayPlan[$d][] = $subjectName;
        } else {
            // Standard: 1 per day, spread evenly
            // ONLY use days where teachers are available
            $unitsToPlace = $units;
            if ($units > count($daysWithAvailableTeachers)) {
                // Not enough available days for 1-per-day distribution
                // Place 1 on each available day, remaining will be handled by recovery pass
                $unitsToPlace = count($daysWithAvailableTeachers);
            }

            // Pick the $unitsToPlace days with fewest subjects so far (from available days only)
            $dayLoads = [];
            foreach ($daysWithAvailableTeachers as $d) {
                $dayLoads[$d] = isset($dayPlan[$d]) ? count($dayPlan[$d]) : 0;
            }
            asort($dayLoads);
            $daysToUse = array_slice(array_keys($dayLoads), 0, $unitsToPlace);

            // Ensure unique days (prevent same-day duplicates)
            $daysToUse = array_unique($daysToUse);

            foreach ($daysToUse as $d) $dayPlan[$d][] = $subjectName;
        }
    }

    // Step 2: For each day, fill slots sequentially with planned subjects
    // Subjects pack from p2 forward - no gaps allowed
    // CONFLICT PREVENTION: Validate each placement to ensure no conflicts
    // Process days in order (Monday to Saturday)
    
    foreach ($availableDays as $day) {
        // Build a queue of subjects planned for this day
        $subjectsQueue = $dayPlan[$day];
        
        // Try to place each subject in the queue
        foreach ($subjectsQueue as $queueIndex => $subject) {
            $placed = false;
            
            // Try each slot on this day until we find one that works
            foreach ($availableSlots as $slot) {
                if ($placed) break;
                
                // Check if section is available at this slot
                if (!isSectionAvailable($section, $day, $slot)) {
                    continue;
                }
                
                // Check if slot is already filled (e.g., by PRELIMINARIES or another subject)
                if (!isSectionSlotFree($sectionSchedule, $sectionId, $day, $slot)) {
                    continue;
                }
                
                // CONFLICT PREVENTION 1: Check if subject already placed today (prevent same-day duplicates)
                // EXCEPTION: double-period SHS subjects (4+ units) are allowed exactly 2 per day
                $todayCount = isset($subjectUsagePerDay[$sectionId][$day][$subject]) ? $subjectUsagePerDay[$sectionId][$day][$subject] : 0;
                $maxPerDay = (isset($doublePeriodSubjects[$subject]) && $doublePeriodSubjects[$subject]) ? 2 : 1;
                if ($todayCount >= $maxPerDay) {
                    continue; // Skip this subject, already at max for today
                }
                
                // CONFLICT PREVENTION 2: Check if placing this subject would exceed its weekly units
                $currentWeeklyUsage = isset($subjectUsagePerWeek[$sectionId][$subject]) ? $subjectUsagePerWeek[$sectionId][$subject] : 0;
                $requiredUnits = 0;
                foreach ($sectionSubjects as $subj) {
                    if ($subj['name'] === $subject) {
                        $requiredUnits = $subj['units'];
                        break;
                    }
                }
                if ($currentWeeklyUsage >= $requiredUnits) {
                    continue; // Skip - would create unit excess
                }
                
                $eligible = findEligibleTeachers($subject, $day, $slot, $grade, $teachers, $subjects, $schedule, $teacherPeriodCount, $sectionTeacherAssignment, $sectionId);
                
                if (!empty($eligible)) {
                    // Found a teacher - place the subject
                    $teacher = $eligible[0];
                    if (!isset($sectionTeacherAssignment[$sectionId][$subject])) {
                        $sectionTeacherAssignment[$sectionId][$subject] = $teacher['id'];
                    }
                    
                    // CONFLICT PREVENTION 3: Double-check teacher slot is free (prevent double-booking)
                    if (!isTeacherSlotFree($schedule, $teacher['id'], $day, $slot)) {
                        continue; // Teacher already assigned elsewhere at this time
                    }
                    
                    // Place the subject
                    $schedule[$teacher['id']][$day][$slot] = ['section' => $sectionId, 'subject' => $subject];
                    $sectionSchedule[$sectionId][$day][$slot] = ['teacher' => $teacher['id'], 'subject' => $subject];
                    if (!isset($teacherPeriodCount[$teacher['id']])) $teacherPeriodCount[$teacher['id']] = 0;
                    $teacherPeriodCount[$teacher['id']]++;
                    if (!isset($subjectUsagePerDay[$sectionId][$day])) $subjectUsagePerDay[$sectionId][$day] = [];
                    if (!isset($subjectUsagePerDay[$sectionId][$day][$subject])) $subjectUsagePerDay[$sectionId][$day][$subject] = 0;
                    $subjectUsagePerDay[$sectionId][$day][$subject]++;
                    if (!isset($subjectUsagePerWeek[$sectionId][$subject])) $subjectUsagePerWeek[$sectionId][$subject] = 0;
                    $subjectUsagePerWeek[$sectionId][$subject]++;
                    $assignments[] = ['teacher_id'=>$teacher['id'],'day'=>$day,'slot_id'=>$slot,'section_id'=>$sectionId,'subject'=>$subject];
                    $slotsFilledForSection++;
                    
                    $placed = true;
                    break; // Subject placed, move to next subject in queue
                }
            }
            
            // If subject couldn't be placed on this day, it will be handled in recovery passes
        }
    }

    // Step 3: AGGRESSIVE RECOVERY - place any subjects that didn't get all their units
    // ENHANCED: Multiple passes with different strategies to maximize unit fulfillment
    // SPECIAL HANDLING: For JHS subjects, allow same-day duplicates in recovery if needed
    // IMPROVED: Try all day-slot combinations instead of just sequential slots
    $maxRecoveryPasses = 10; // Increased from 8 to 10 for more aggressive recovery
    
    for ($pass = 0; $pass < $maxRecoveryPasses; $pass++) {
        $unitsPlacedThisPass = 0;
        
        // Shuffle subject order in later passes for different placement strategies
        if ($pass > 2) {
            shuffle($sectionSubjects);
        }
        
        foreach ($sectionSubjects as $subj) {
            $subjectName = $subj['name'];
            $requiredUnits = $subj['units'];
            $currentUnits = isset($subjectUsagePerWeek[$sectionId][$subjectName]) ? $subjectUsagePerWeek[$sectionId][$subjectName] : 0;
            $deficit = $requiredUnits - $currentUnits;
            if ($deficit <= 0) continue;

            // IMPROVED STRATEGY: Build a list of all possible day-slot combinations where this subject could be placed
            // Then try them in order of preference (prioritize days with limited teacher availability)
            $possiblePlacements = [];
            
            foreach ($availableDays as $day) {
                foreach ($availableSlots as $slot) {
                    // Check basic availability
                    if (!isSectionAvailable($section, $day, $slot)) continue;
                    if (!isSectionSlotFree($sectionSchedule, $sectionId, $day, $slot)) continue;
                    
                    // Check if we can place this subject here based on current pass strategy
                    $todayCount = isset($subjectUsagePerDay[$sectionId][$day][$subjectName]) ? $subjectUsagePerDay[$sectionId][$day][$subjectName] : 0;
                    
                    // Determine max allowed per day based on pass number
                    $maxPerDay = 1; // Default: 1 per day
                    if ($pass < 3) {
                        // Early passes: strict 1 per day (or 2 for double-period SHS)
                        $maxPerDay = (isset($doublePeriodSubjects[$subjectName]) && $doublePeriodSubjects[$subjectName]) ? 2 : 1;
                    } else if ($pass < 6) {
                        // Mid passes: allow 2 per day for JHS if deficit is critical
                        $maxPerDay = ($grade <= 10 && $deficit >= 3) ? 2 : 1;
                    } else {
                        // Late passes: allow multiple per day (no limit)
                        $maxPerDay = 999;
                    }
                    
                    if ($todayCount >= $maxPerDay) continue;
                    
                    // Check if teacher is available
                    $eligible = findEligibleTeachers($subjectName, $day, $slot, $grade, $teachers, $subjects, $schedule, $teacherPeriodCount, $sectionTeacherAssignment, $sectionId);
                    if (empty($eligible)) continue;
                    
                    $teacher = $eligible[0];
                    
                    // Double-check teacher slot is free
                    if (!isTeacherSlotFree($schedule, $teacher['id'], $day, $slot)) continue;
                    
                    // Calculate priority score for this placement
                    // Lower score = higher priority
                    $priority = 0;
                    
                    // Factor 1: Prefer days where teacher has limited availability
                    $teacherAvailableSlots = 0;
                    foreach ($availableSlots as $s) {
                        if (isTeacherAvailable($teacher, $day, $s)) {
                            $teacherAvailableSlots++;
                        }
                    }
                    $priority += $teacherAvailableSlots; // Fewer available slots = lower score = higher priority
                    
                    // Factor 2: Prefer days where subject hasn't been placed yet
                    $priority += ($todayCount * 100); // Penalize days that already have this subject
                    
                    // Factor 3: Prefer earlier slots (sequential packing)
                    $slotNum = (int)str_replace('p', '', $slot);
                    $priority += $slotNum; // Earlier slots get lower scores
                    
                    $possiblePlacements[] = [
                        'day' => $day,
                        'slot' => $slot,
                        'teacher' => $teacher,
                        'priority' => $priority
                    ];
                }
            }
            
            // Sort placements by priority (ascending - lower values first)
            usort($possiblePlacements, function($a, $b) {
                return $a['priority'] - $b['priority'];
            });
            
            // Try to place the subject in the best available slots
            foreach ($possiblePlacements as $placement) {
                if ($deficit <= 0) break;
                
                $day = $placement['day'];
                $slot = $placement['slot'];
                $teacher = $placement['teacher'];
                
                // Re-verify slot is still free (may have been filled by previous placement)
                if (!isSectionSlotFree($sectionSchedule, $sectionId, $day, $slot)) continue;
                if (!isTeacherSlotFree($schedule, $teacher['id'], $day, $slot)) continue;
                
                // Re-check weekly units (may have been updated)
                $currentWeeklyUsage = isset($subjectUsagePerWeek[$sectionId][$subjectName]) ? $subjectUsagePerWeek[$sectionId][$subjectName] : 0;
                if ($currentWeeklyUsage >= $requiredUnits) break;
                
                // Assign teacher if not already assigned
                if (!isset($sectionTeacherAssignment[$sectionId][$subjectName])) {
                    $sectionTeacherAssignment[$sectionId][$subjectName] = $teacher['id'];
                }
                
                // Verify this is the assigned teacher for this subject
                if ($sectionTeacherAssignment[$sectionId][$subjectName] !== $teacher['id']) {
                    continue; // Different teacher, skip
                }
                
                // Place the subject
                $schedule[$teacher['id']][$day][$slot] = ['section'=>$sectionId,'subject'=>$subjectName];
                $sectionSchedule[$sectionId][$day][$slot] = ['teacher'=>$teacher['id'],'subject'=>$subjectName];
                if (!isset($teacherPeriodCount[$teacher['id']])) $teacherPeriodCount[$teacher['id']] = 0;
                $teacherPeriodCount[$teacher['id']]++;
                if (!isset($subjectUsagePerDay[$sectionId][$day])) $subjectUsagePerDay[$sectionId][$day] = [];
                if (!isset($subjectUsagePerDay[$sectionId][$day][$subjectName])) $subjectUsagePerDay[$sectionId][$day][$subjectName] = 0;
                $subjectUsagePerDay[$sectionId][$day][$subjectName]++;
                if (!isset($subjectUsagePerWeek[$sectionId][$subjectName])) $subjectUsagePerWeek[$sectionId][$subjectName] = 0;
                $subjectUsagePerWeek[$sectionId][$subjectName]++;
                $assignments[] = ['teacher_id'=>$teacher['id'],'day'=>$day,'slot_id'=>$slot,'section_id'=>$sectionId,'subject'=>$subjectName];
                $slotsFilledForSection++;
                $deficit--;
                $unitsPlacedThisPass++;
            }
        }
        
        // If no units were placed this pass, no point trying again
        if ($unitsPlacedThisPass === 0) {
            break;
        }
    }
    
    // Step 4: AGGRESSIVE COMPACTION - Remove ALL gaps by moving subjects to earlier slots
    // ENHANCED: Multiple compaction passes with different strategies to eliminate ALL gaps
    $maxCompactionPasses = 8; // Increased from 5 to 8 for more aggressive gap removal
    
    for ($compactPass = 0; $compactPass < $maxCompactionPasses; $compactPass++) {
        $gapsRemovedThisPass = 0;
        
        foreach ($availableDays as $day) {
            if (!isset($sectionSchedule[$sectionId][$day])) continue;
            
            $daySchedule = $sectionSchedule[$sectionId][$day];
            $filledSlots = [];
            
            // Collect all filled slots for this day
            foreach ($availableSlots as $slot) {
                if (isset($daySchedule[$slot])) {
                    $filledSlots[] = [
                        'slot' => $slot,
                        'teacher' => $daySchedule[$slot]['teacher'],
                        'subject' => $daySchedule[$slot]['subject']
                    ];
                }
            }
            
            // If no filled slots or only one, skip compaction
            if (count($filledSlots) <= 1) continue;
            
            // Check if there are actually gaps to compact
            $slotNumbers = array_map(function($s) { return (int)str_replace('p', '', $s); }, array_column($filledSlots, 'slot'));
            $minSlot = min($slotNumbers);
            $maxSlot = max($slotNumbers);
            $hasGaps = ($maxSlot - $minSlot + 1) > count($filledSlots);
            
            if (!$hasGaps) continue; // No gaps to compact
            
            // Clear the day schedule
            foreach ($availableSlots as $slot) {
                if (isset($sectionSchedule[$sectionId][$day][$slot])) {
                    $entry = $sectionSchedule[$sectionId][$day][$slot];
                    unset($sectionSchedule[$sectionId][$day][$slot]);
                    unset($schedule[$entry['teacher']][$day][$slot]);
                }
            }
            
            // Strategy 1: Pack from the beginning (first pass)
            if ($compactPass < 4) {
                $targetSlotIndex = 0;
                $successfullyPlaced = 0;
                
                foreach ($filledSlots as $entry) {
                    $placed = false;
                    
                    // Try to find next available slot where both section AND teacher are available
                    while ($targetSlotIndex < count($availableSlots) && !$placed) {
                        $targetSlot = $availableSlots[$targetSlotIndex];
                        
                        // Check section availability
                        if (!isSectionAvailable($section, $day, $targetSlot)) {
                            $targetSlotIndex++;
                            continue;
                        }
                        
                        // Check teacher availability at new slot
                        $teacherAvailable = false;
                        foreach ($teachers as $t) {
                            if ($t['id'] === $entry['teacher']) {
                                $teacherAvailable = isTeacherAvailable($t, $day, $targetSlot);
                                break;
                            }
                        }
                        
                        if (!$teacherAvailable) {
                            // Teacher not available at this slot - try next slot
                            $targetSlotIndex++;
                            continue;
                        }
                        
                        // Check teacher doesn't have another assignment at this slot
                        if (!isTeacherSlotFree($schedule, $entry['teacher'], $day, $targetSlot)) {
                            $targetSlotIndex++;
                            continue;
                        }
                        
                        // Place subject at this slot
                        $sectionSchedule[$sectionId][$day][$targetSlot] = [
                            'teacher' => $entry['teacher'],
                            'subject' => $entry['subject']
                        ];
                        $schedule[$entry['teacher']][$day][$targetSlot] = [
                            'section' => $sectionId,
                            'subject' => $entry['subject']
                        ];
                        
                        // Update assignments array
                        foreach ($assignments as &$assignment) {
                            if ($assignment['section_id'] === $sectionId && 
                                $assignment['day'] === $day && 
                                $assignment['slot_id'] === $entry['slot'] &&
                                $assignment['subject'] === $entry['subject'] &&
                                $assignment['teacher_id'] === $entry['teacher']) {
                                $assignment['slot_id'] = $targetSlot;
                                break;
                            }
                        }
                        
                        $targetSlotIndex++;
                        $successfullyPlaced++;
                        $placed = true;
                        
                        if ($entry['slot'] !== $targetSlot) {
                            $gapsRemovedThisPass++;
                        }
                    }
                    
                    // If we couldn't place this entry at the target slot, try other slots on the same day
                    if (!$placed) {
                        // Try other slots on the same day to avoid gaps
                        foreach ($availableSlots as $altSlot) {
                            if ($altSlot === $targetSlot) continue; // Already tried
                            if (!isSectionAvailable($section, $day, $altSlot)) continue;
                            if (!isSectionSlotFree($sectionSchedule, $sectionId, $day, $altSlot)) continue;
                            
                            // Check teacher availability at alternative slot
                            $teacherAvailable = false;
                            foreach ($teachers as $t) {
                                if ($t['id'] === $entry['teacher']) {
                                    $teacherAvailable = isTeacherAvailable($t, $day, $altSlot);
                                    break;
                                }
                            }
                            
                            if (!$teacherAvailable) continue;
                            if (!isTeacherSlotFree($schedule, $entry['teacher'], $day, $altSlot)) continue;
                            
                            // Place at alternative slot
                            $sectionSchedule[$sectionId][$day][$altSlot] = [
                                'teacher' => $entry['teacher'],
                                'subject' => $entry['subject']
                            ];
                            $schedule[$entry['teacher']][$day][$altSlot] = [
                                'section' => $sectionId,
                                'subject' => $entry['subject']
                            ];
                            
                            // Update assignments array
                            foreach ($assignments as &$assignment) {
                                if ($assignment['section_id'] === $sectionId && 
                                    $assignment['day'] === $day && 
                                    $assignment['slot_id'] === $entry['slot'] &&
                                    $assignment['subject'] === $entry['subject'] &&
                                    $assignment['teacher_id'] === $entry['teacher']) {
                                    $assignment['slot_id'] = $altSlot;
                                    break;
                                }
                            }
                            
                            $targetSlotIndex++;
                            $successfullyPlaced++;
                            $placed = true;
                            
                            if ($entry['slot'] !== $altSlot) {
                                $gapsRemovedThisPass++;
                            }
                            break;
                        }
                    }
                    
                    // If still couldn't place, try other days to avoid gaps
                    if (!$placed) {
                        foreach ($availableDays as $altDay) {
                            if ($altDay === $day) continue;
                            
                            // Try slots on alternative day
                            foreach ($availableSlots as $altSlot) {
                                if (!isSectionAvailable($section, $altDay, $altSlot)) continue;
                                if (!isSectionSlotFree($sectionSchedule, $sectionId, $altDay, $altSlot)) continue;
                                
                                // Check teacher availability at alternative day/slot
                                $teacherAvailable = false;
                                foreach ($teachers as $t) {
                                    if ($t['id'] === $entry['teacher']) {
                                        $teacherAvailable = isTeacherAvailable($t, $altDay, $altSlot);
                                        break;
                                    }
                                }
                                
                                if (!$teacherAvailable) continue;
                                if (!isTeacherSlotFree($schedule, $entry['teacher'], $altDay, $altSlot)) continue;
                                
                                // Check if subject already used on alternative day (strict no same-day duplicates)
                                if (isset($subjectUsagePerDay[$sectionId][$altDay][$entry['subject']]) && 
                                    $subjectUsagePerDay[$sectionId][$altDay][$entry['subject']] > 0) {
                                    continue;
                                }
                                
                                // Place on alternative day
                                $sectionSchedule[$sectionId][$altDay][$altSlot] = [
                                    'teacher' => $entry['teacher'],
                                    'subject' => $entry['subject']
                                ];
                                $schedule[$entry['teacher']][$altDay][$altSlot] = [
                                    'section' => $sectionId,
                                    'subject' => $entry['subject']
                                ];
                                
                                // Update subject usage for new day
                                if (!isset($subjectUsagePerDay[$sectionId][$altDay])) $subjectUsagePerDay[$sectionId][$altDay] = [];
                                if (!isset($subjectUsagePerDay[$sectionId][$altDay][$entry['subject']])) $subjectUsagePerDay[$sectionId][$altDay][$entry['subject']] = 0;
                                $subjectUsagePerDay[$sectionId][$altDay][$entry['subject']]++;
                                
                                // Update assignments array
                                foreach ($assignments as &$assignment) {
                                    if ($assignment['section_id'] === $sectionId && 
                                        $assignment['day'] === $day && 
                                        $assignment['slot_id'] === $entry['slot'] &&
                                        $assignment['subject'] === $entry['subject'] &&
                                        $assignment['teacher_id'] === $entry['teacher']) {
                                        $assignment['day'] = $altDay;
                                        $assignment['slot_id'] = $altSlot;
                                        break;
                                    }
                                }
                                
                                $targetSlotIndex++;
                                $successfullyPlaced++;
                                $placed = true;
                                $gapsRemovedThisPass++;
                                break 2; // Break out of both loops
                            }
                        }
                    }
                    
                    // Only put back in original slot as last resort
                    if (!$placed) {
                        $sectionSchedule[$sectionId][$day][$entry['slot']] = [
                            'teacher' => $entry['teacher'],
                            'subject' => $entry['subject']
                        ];
                        $schedule[$entry['teacher']][$day][$entry['slot']] = [
                            'section' => $sectionId,
                            'subject' => $entry['subject']
                        ];
                    }
                }
            } else {
                // Strategy 2: More aggressive - try different orderings (later passes)
                // Shuffle the filled slots and try packing again
                shuffle($filledSlots);
                
                $targetSlotIndex = 0;
                $successfullyPlaced = 0;
                
                foreach ($filledSlots as $entry) {
                    $placed = false;
                    
                    // Reset target slot index for each entry to allow more flexibility
                    $localTargetIndex = 0;
                    
                    while ($localTargetIndex < count($availableSlots) && !$placed) {
                        $targetSlot = $availableSlots[$localTargetIndex];
                        
                        if (!isSectionAvailable($section, $day, $targetSlot)) {
                            $localTargetIndex++;
                            continue;
                        }
                        
                        $teacherAvailable = false;
                        foreach ($teachers as $t) {
                            if ($t['id'] === $entry['teacher']) {
                                $teacherAvailable = isTeacherAvailable($t, $day, $targetSlot);
                                break;
                            }
                        }
                        
                        if (!$teacherAvailable) {
                            $localTargetIndex++;
                            continue;
                        }
                        
                        if (!isTeacherSlotFree($schedule, $entry['teacher'], $day, $targetSlot)) {
                            $localTargetIndex++;
                            continue;
                        }
                        
                        // Place subject at this slot
                        $sectionSchedule[$sectionId][$day][$targetSlot] = [
                            'teacher' => $entry['teacher'],
                            'subject' => $entry['subject']
                        ];
                        $schedule[$entry['teacher']][$day][$targetSlot] = [
                            'section' => $sectionId,
                            'subject' => $entry['subject']
                        ];
                        
                        // Update assignments array
                        foreach ($assignments as &$assignment) {
                            if ($assignment['section_id'] === $sectionId && 
                                $assignment['day'] === $day && 
                                $assignment['slot_id'] === $entry['slot'] &&
                                $assignment['subject'] === $entry['subject'] &&
                                $assignment['teacher_id'] === $entry['teacher']) {
                                $assignment['slot_id'] = $targetSlot;
                                break;
                            }
                        }
                        
                        $successfullyPlaced++;
                        $placed = true;
                        
                        if ($entry['slot'] !== $targetSlot) {
                            $gapsRemovedThisPass++;
                        }
                    }
                    
                    // If we couldn't place this entry, put it back in its original slot
                    if (!$placed) {
                        $sectionSchedule[$sectionId][$day][$entry['slot']] = [
                            'teacher' => $entry['teacher'],
                            'subject' => $entry['subject']
                        ];
                        $schedule[$entry['teacher']][$day][$entry['slot']] = [
                            'section' => $sectionId,
                            'subject' => $entry['subject']
                        ];
                    }
                }
            }
        }
        
        // If no gaps were removed this pass, no point trying again
        if ($gapsRemovedThisPass === 0) {
            break;
        }
    }
    
    // Step 4.5: ULTRA-AGGRESSIVE GAP FILLING - Fill ALL remaining gaps
    // ENHANCED: Multiple passes with relaxed constraints to eliminate ALL gaps
    $maxGapFillingPasses = 5; // Increased from 3 to 5 for more aggressive gap filling
    
    for ($gapPass = 0; $gapPass < $maxGapFillingPasses; $gapPass++) {
        $gapsFilledThisPass = 0;
        
        foreach ($availableDays as $day) {
            if (!isset($sectionSchedule[$sectionId][$day])) continue;
            
            // Find all gaps on this day
            $filledSlots = [];
            $emptySlots = [];
            
            foreach ($availableSlots as $slot) {
                if (isset($sectionSchedule[$sectionId][$day][$slot])) {
                    $filledSlots[] = $slot;
                } else {
                    $emptySlots[] = $slot;
                }
            }
            
            if (empty($filledSlots) || empty($emptySlots)) continue;
            
            // Get slot numbers to identify gaps
            $filledSlotNumbers = array_map(function($s) { return (int)str_replace('p', '', $s); }, $filledSlots);
            $emptySlotNumbers = array_map(function($s) { return (int)str_replace('p', '', $s); }, $emptySlots);
            
            $minFilled = min($filledSlotNumbers);
            $maxFilled = max($filledSlotNumbers);
            
            // Try to fill each gap
            foreach ($emptySlotNumbers as $emptyNum) {
                // Only fill if it's a gap (between filled slots)
                if ($emptyNum <= $minFilled || $emptyNum >= $maxFilled) continue;
                
                $gapSlot = 'p' . $emptyNum;
                
                // Check if section is available at this slot
                if (!isSectionAvailable($section, $day, $gapSlot)) continue;
                
                // Strategy based on pass number
                $subjectPlaced = false;
                
                if ($gapPass < 3) {
                    // Strategy 1: Only place subjects that still need units (strict unit compliance)
                    foreach ($sectionSubjects as $subj) {
                        if ($subjectPlaced) break;
                        
                        $subjectName = $subj['name'];
                        $requiredUnits = $subj['units'];
                        $currentUnits = isset($subjectUsagePerWeek[$sectionId][$subjectName]) ? $subjectUsagePerWeek[$sectionId][$subjectName] : 0;
                        
                        // Skip if already used today (prevent same-day duplicates)
                        if (isset($subjectUsagePerDay[$sectionId][$day][$subjectName]) && $subjectUsagePerDay[$sectionId][$day][$subjectName] > 0) {
                            continue;
                        }
                        
                        // Skip if already has required units (prevent unit excess)
                        if ($currentUnits >= $requiredUnits) {
                            continue;
                        }
                        
                        $eligible = findEligibleTeachers($subjectName, $day, $gapSlot, $grade, $teachers, $subjects, $schedule, $teacherPeriodCount, $sectionTeacherAssignment, $sectionId);
                        
                        if (!empty($eligible)) {
                            $teacher = $eligible[0];
                            if (!isset($sectionTeacherAssignment[$sectionId][$subjectName])) {
                                $sectionTeacherAssignment[$sectionId][$subjectName] = $teacher['id'];
                            }
                            
                            // Place the subject
                            $schedule[$teacher['id']][$day][$gapSlot] = ['section'=>$sectionId,'subject'=>$subjectName];
                            $sectionSchedule[$sectionId][$day][$gapSlot] = ['teacher'=>$teacher['id'],'subject'=>$subjectName];
                            if (!isset($teacherPeriodCount[$teacher['id']])) $teacherPeriodCount[$teacher['id']] = 0;
                            $teacherPeriodCount[$teacher['id']]++;
                            if (!isset($subjectUsagePerDay[$sectionId][$day])) $subjectUsagePerDay[$sectionId][$day] = [];
                            if (!isset($subjectUsagePerDay[$sectionId][$day][$subjectName])) $subjectUsagePerDay[$sectionId][$day][$subjectName] = 0;
                            $subjectUsagePerDay[$sectionId][$day][$subjectName]++;
                            if (!isset($subjectUsagePerWeek[$sectionId][$subjectName])) $subjectUsagePerWeek[$sectionId][$subjectName] = 0;
                            $subjectUsagePerWeek[$sectionId][$subjectName]++;
                            $assignments[] = ['teacher_id'=>$teacher['id'],'day'=>$day,'slot_id'=>$gapSlot,'section_id'=>$sectionId,'subject'=>$subjectName];
                            $slotsFilledForSection++;
                            $gapsFilledThisPass++;
                            $subjectPlaced = true;
                        }
                    }
                } else {
                    // Strategy 2: More flexible - allow subjects that could benefit from extra units
                    // DISABLED: To strictly follow units, we don't allow extras even in gap filling
                    // This ensures we never exceed required units
                    continue; // Skip this strategy to maintain strict unit compliance
                }
            }
        }
    }
    
    // Step 4.6: FINAL AGGRESSIVE SLOT FILLING - DISABLED for strict unit compliance
    // We don't fill extra slots to avoid exceeding required units
    // Only fill if there are unfilled required units and no gaps
    $allUnitsMet = true;
    foreach ($sectionSubjects as $subj) {
        $subjectName = $subj['name'];
        $requiredUnits = $subj['units'];
        $currentUnits = isset($subjectUsagePerWeek[$sectionId][$subjectName]) ? $subjectUsagePerWeek[$sectionId][$subjectName] : 0;
        if ($currentUnits < $requiredUnits) {
            $allUnitsMet = false;
            break;
        }
    }
    
    if (!$allUnitsMet) {
        // Only proceed with final filling if units are not met
        $maxFinalFillingPasses = 3;
        
        for ($finalPass = 0; $finalPass < $maxFinalFillingPasses; $finalPass++) {
            $slotsFilledThisPass = 0;
            
            foreach ($availableDays as $day) {
                foreach ($availableSlots as $slot) {
                    // Skip if slot is already filled
                    if (!isSectionSlotFree($sectionSchedule, $sectionId, $day, $slot)) continue;
                    if (!isSectionAvailable($section, $day, $slot)) continue;
                    
                    // Try to place only subjects that still need units
                    $subjectPlaced = false;
                    
                    foreach ($sectionSubjects as $subj) {
                        if ($subjectPlaced) break;
                        
                        $subjectName = $subj['name'];
                        $requiredUnits = $subj['units'];
                        $currentUnits = isset($subjectUsagePerWeek[$sectionId][$subjectName]) ? $subjectUsagePerWeek[$sectionId][$subjectName] : 0;
                        
                        // STRICT: Only place if units are not met
                        if ($currentUnits >= $requiredUnits) continue;
                        
                        // STRICT: Never repeat on same day
                        if (isset($subjectUsagePerDay[$sectionId][$day][$subjectName]) && $subjectUsagePerDay[$sectionId][$day][$subjectName] > 0) {
                            continue;
                        }
                        
                        $eligible = findEligibleTeachers($subjectName, $day, $slot, $grade, $teachers, $subjects, $schedule, $teacherPeriodCount, $sectionTeacherAssignment, $sectionId);
                        
                        if (!empty($eligible)) {
                            // Sort by teacher load to prefer less loaded teachers
                            usort($eligible, function($a, $b) use ($teacherPeriodCount) {
                                $aLoad = isset($teacherPeriodCount[$a['id']]) ? $teacherPeriodCount[$a['id']] : 0;
                                $bLoad = isset($teacherPeriodCount[$b['id']]) ? $teacherPeriodCount[$b['id']] : 0;
                                return $aLoad - $bLoad;
                            });
                            
                            $teacher = $eligible[0];
                            if (!isset($sectionTeacherAssignment[$sectionId][$subjectName])) {
                                $sectionTeacherAssignment[$sectionId][$subjectName] = $teacher['id'];
                            }
                            
                            if (!isTeacherSlotFree($schedule, $teacher['id'], $day, $slot)) continue;
                            
                            // Place the subject
                            $schedule[$teacher['id']][$day][$slot] = ['section'=>$sectionId,'subject'=>$subjectName];
                            $sectionSchedule[$sectionId][$day][$slot] = ['teacher'=>$teacher['id'],'subject'=>$subjectName];
                            if (!isset($teacherPeriodCount[$teacher['id']])) $teacherPeriodCount[$teacher['id']] = 0;
                            $teacherPeriodCount[$teacher['id']]++;
                            if (!isset($subjectUsagePerDay[$sectionId][$day])) $subjectUsagePerDay[$sectionId][$day] = [];
                            if (!isset($subjectUsagePerDay[$sectionId][$day][$subjectName])) $subjectUsagePerDay[$sectionId][$day][$subjectName] = 0;
                            $subjectUsagePerDay[$sectionId][$day][$subjectName]++;
                            if (!isset($subjectUsagePerWeek[$sectionId][$subjectName])) $subjectUsagePerWeek[$sectionId][$subjectName] = 0;
                            $subjectUsagePerWeek[$sectionId][$subjectName]++;
                            $assignments[] = ['teacher_id'=>$teacher['id'],'day'=>$day,'slot_id'=>$slot,'section_id'=>$sectionId,'subject'=>$subjectName];
                            $slotsFilledForSection++;
                            $slotsFilledThisPass++;
                            $subjectPlaced = true;
                        }
                    }
                }
            }
            
            // If no slots were filled this pass, no point trying again
            if ($slotsFilledThisPass === 0) {
                break;
            }
        }
    }
    
        // Log if section wasn't fully filled
    if ($slotsFilledForSection < $totalSlotsNeeded) {
        $fillPercentage = round(($slotsFilledForSection / $totalSlotsNeeded) * 100, 1);
        
        // Check units compliance
        $unitsCompliance = [];
        foreach ($sectionSubjects as $subj) {
            $subjectName = $subj['name'];
            $requiredUnits = $subj['units'];
            $actualUnits = isset($subjectUsagePerWeek[$sectionId][$subjectName]) ? 
                $subjectUsagePerWeek[$sectionId][$subjectName] : 0;
            $unitsCompliance[] = "$subjectName: $actualUnits/$requiredUnits units";
        }
        
        $failedAssignments[] = [
            'section' => $sectionId,
            'subject' => 'INCOMPLETE',
            'reason' => "Section filled $slotsFilledForSection of $totalSlotsNeeded slots ($fillPercentage%). Units: " . implode(', ', $unitsCompliance)
        ];
    }
}

// ================================================================
// Step 5: CONFLICT DETECTION - Check for unit compliance and same-day duplicates
// This runs AFTER all sections have been scheduled
// ================================================================
foreach ($sections as $section) {
    $sectionId = $section['id'];
    $grade = $section['grade'];
    $strand = $section['strand'];
    
    // Get subjects for this section
    $sectionSubjects = [];
    foreach ($subjects as $subj) {
        if ($grade <= 10) {
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
    
    // Check 1: Unit compliance - subjects must appear exactly N times per week
    foreach ($uniqueSubjects as $subj) {
        $subjectName = $subj['name'];
        $requiredUnits = $subj['units'];
        $actualUnits = isset($subjectUsagePerWeek[$sectionId][$subjectName]) ? 
            $subjectUsagePerWeek[$sectionId][$subjectName] : 0;
        
        if ($actualUnits < $requiredUnits) {
            $conflicts[] = [
                'type' => 'UNIT_DEFICIT',
                'section' => $section['name'],
                'section_id' => $sectionId,
                'subject' => $subjectName,
                'required_units' => $requiredUnits,
                'actual_units' => $actualUnits,
                'deficit' => $requiredUnits - $actualUnits,
                'message' => "Subject '$subjectName' in section {$section['name']} has only $actualUnits of $requiredUnits required units (deficit: " . ($requiredUnits - $actualUnits) . ")"
            ];
        } elseif ($actualUnits > $requiredUnits) {
            $conflicts[] = [
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
    
    // Check 2: Same-day duplicates - each subject should appear at most once per day
    $availableDays = getDaysForGrade($grade);
    foreach ($availableDays as $day) {
        if (!isset($subjectUsagePerDay[$sectionId][$day])) continue;
        
        foreach ($subjectUsagePerDay[$sectionId][$day] as $subjectName => $count) {
            if ($count > 1) {
                $conflicts[] = [
                'type' => 'SAME_DAY_DUPLICATE',
                'section' => $section['name'],
                'section_id' => $sectionId,
                'subject' => $subjectName,
                'day' => $day,
                'occurrences' => $count,
                'message' => "Subject '$subjectName' appears $count times on $day in section {$section['name']} (should appear only once per day)"
            ];
        }
    }
}

// Check 3: Gap detection - subjects should be consecutive with no empty slots between them
// ENHANCED: Include diagnostic information about why gaps exist
foreach ($availableDays as $day) {
    if (!isset($sectionSchedule[$sectionId][$day])) continue;
    
    $availableSlots = getSlotsForGrade($grade);
    $filledSlots = [];
    $emptySlots = [];
    
    foreach ($availableSlots as $slot) {
        if (isset($sectionSchedule[$sectionId][$day][$slot])) {
            $filledSlots[] = $slot;
        } else {
            $emptySlots[] = $slot;
        }
    }
    
    // Check if there are empty slots between filled slots (gaps)
    if (!empty($filledSlots) && !empty($emptySlots)) {
        // Get slot numbers
        $filledSlotNumbers = array_map(function($s) { return (int)str_replace('p', '', $s); }, $filledSlots);
        $emptySlotNumbers = array_map(function($s) { return (int)str_replace('p', '', $s); }, $emptySlots);
        
        $minFilled = min($filledSlotNumbers);
        $maxFilled = max($filledSlotNumbers);
        
        // Check if any empty slot is between min and max filled slots
        foreach ($emptySlotNumbers as $emptyNum) {
            if ($emptyNum > $minFilled && $emptyNum < $maxFilled) {
                // Analyze why this gap exists
                $gapSlot = 'p' . $emptyNum;
                $diagnostic = [];
                
                // Check if section is unavailable at this slot
                if (!isSectionAvailable($section, $day, $gapSlot)) {
                    $diagnostic[] = "Section unavailable at this time";
                }
                
                // Check what subjects are scheduled before and after the gap
                $beforeSlot = 'p' . ($emptyNum - 1);
                $afterSlot = 'p' . ($emptyNum + 1);
                $beforeSubject = isset($sectionSchedule[$sectionId][$day][$beforeSlot]) ? $sectionSchedule[$sectionId][$day][$beforeSlot]['subject'] : 'none';
                $afterSubject = isset($sectionSchedule[$sectionId][$day][$afterSlot]) ? $sectionSchedule[$sectionId][$day][$afterSlot]['subject'] : 'none';
                
                if ($beforeSubject !== 'none' || $afterSubject !== 'none') {
                    $diagnostic[] = "Between: $beforeSubject → [GAP] → $afterSubject";
                }
                
                // Check if any teachers could fill this gap
                $couldFillGap = false;
                foreach ($uniqueSubjects as $subj) {
                    $subjectName = $subj['name'];
                    $currentUnits = isset($subjectUsagePerWeek[$sectionId][$subjectName]) ? $subjectUsagePerWeek[$sectionId][$subjectName] : 0;
                    $requiredUnits = $subj['units'];
                    
                    // Only check subjects that still need units
                    if ($currentUnits < $requiredUnits) {
                        // Check if subject already used today
                        $usedToday = isset($subjectUsagePerDay[$sectionId][$day][$subjectName]) && $subjectUsagePerDay[$sectionId][$day][$subjectName] > 0;
                        if (!$usedToday) {
                            $eligible = findEligibleTeachers($subjectName, $day, $gapSlot, $grade, $teachers, $subjects, $schedule, $teacherPeriodCount, $sectionTeacherAssignment, $sectionId);
                            if (!empty($eligible)) {
                                $couldFillGap = true;
                                break;
                            }
                        }
                    }
                }
                
                if (!$couldFillGap) {
                    $diagnostic[] = "No available teachers to fill this gap";
                }
                
                $diagnosticMessage = !empty($diagnostic) ? " | Cause: " . implode("; ", $diagnostic) : "";
                
                $conflicts[] = [
                    'type' => 'SCHEDULE_GAP',
                    'section' => $section['name'],
                    'section_id' => $sectionId,
                    'day' => $day,
                    'gap_slot' => $gapSlot,
                    'before_subject' => $beforeSubject,
                    'after_subject' => $afterSubject,
                    'diagnostic' => $diagnostic,
                    'message' => "Gap detected on $day in section {$section['name']} at slot $gapSlot (subjects should be consecutive)$diagnosticMessage"
                ];
            }
        }
    }
}
}

// ================================================================
// CONFLICT DETECTION COMPLETE - Save schedule and report conflicts
// Note: Schedule is saved even if conflicts exist, allowing users to
// review and manually fix conflicts through the UI
// ================================================================

// BUGFIX: Allow partial generation - don't fail if no assignments were generated
// This allows running auto-generate even when no teachers have subjects assigned
// It will clear existing schedules and create an empty schedule if needed
if (count($assignments) == 0) {
    // Log the issue but don't fail - allow empty schedule generation
    error_log("Auto-schedule: No assignments generated - no teachers have subjects assigned or no eligible teachers found | Term: $currentTerm | Semester: $currentSemester");
    
    // Still proceed to clear and save empty schedule
}

// PARTIAL GENERATION SUPPORT: Proceed with whatever assignments were generated
// Even if some sections/subjects failed, we'll save what we could schedule
// Clear existing schedules (only if we have assignments to insert)
$db->query("DELETE FROM schedules");

// Deduplicate assignments array to prevent unique constraint violations
// Keep only the last occurrence of each teacher/day/slot combination
$uniqueAssignments = [];
$assignmentKeys = [];

foreach ($assignments as $assignment) {
    $key = $assignment['teacher_id'] . '|' . $assignment['day'] . '|' . $assignment['slot_id'];
    
    // If this key already exists, remove the old one
    if (isset($assignmentKeys[$key])) {
        $oldIndex = $assignmentKeys[$key];
        unset($uniqueAssignments[$oldIndex]);
    }
    
    // Add the new assignment
    $uniqueAssignments[] = $assignment;
    $assignmentKeys[$key] = count($uniqueAssignments) - 1;
}

// Re-index the array
$uniqueAssignments = array_values($uniqueAssignments);

// BUGFIX: Validate prepare statement before using it
$stmt = $db->prepare("INSERT INTO schedules (teacher_id, day, slot_id, section_id, subject) VALUES (?, ?, ?, ?, ?)");

if ($stmt === false) {
    // Prepare statement failed - log error and return error response
    $dbError = $db->error;
    error_log("Auto-schedule database prepare failed: $dbError | Term: $currentTerm | Semester: $currentSemester");
    
    $db->close();
    
    $output = ob_get_contents();
    if ($output) {
        ob_clean();
    }
    
    respondError("Database operation failed: Unable to prepare schedule insert statement. Error: $dbError", 500);
}

$successCount = 0;

foreach ($uniqueAssignments as $assignment) {
    $stmt->bind_param('sssss', 
        $assignment['teacher_id'],
        $assignment['day'],
        $assignment['slot_id'],
        $assignment['section_id'],
        $assignment['subject']
    );
    if ($stmt->execute()) {
        $successCount++;
    }
}

$stmt->close();
$db->close();

// Calculate teacher load statistics
$teacherLoadStats = [];
foreach ($teacherPeriodCount as $teacherId => $periodCount) {
    $teacher = null;
    foreach ($teachers as $t) {
        if ($t['id'] === $teacherId) {
            $teacher = $t;
            break;
        }
    }
    if ($teacher) {
        // Determine max load for this teacher
        $maxLoad = null;
        
        if ($teacher['load'] && $teacher['load'] > 0) {
            // Use teacher's custom load
            $maxLoad = $teacher['load'];
        } else {
            // Determine based on what they're actually teaching
            $teachesJHS = false;
            $teachesSHS = false;
            
            foreach ($assignments as $assignment) {
                if ($assignment['teacher_id'] === $teacherId) {
                    foreach ($sections as $sec) {
                        if ($sec['id'] === $assignment['section_id']) {
                            if ($sec['grade'] <= 10) {
                                $teachesJHS = true;
                            } else {
                                $teachesSHS = true;
                            }
                            break;
                        }
                    }
                }
            }
            
            // Use appropriate max load
            if ($teachesJHS && $teachesSHS) {
                $maxLoad = max($jhsMaxPeriodsPerWeek, $shsMaxPeriodsPerWeek);
            } else if ($teachesJHS) {
                $maxLoad = $jhsMaxPeriodsPerWeek;
            } else if ($teachesSHS) {
                $maxLoad = $shsMaxPeriodsPerWeek;
            } else {
                $maxLoad = $jhsMaxPeriodsPerWeek; // default
            }
        }
        
        $loadPercentage = round(($periodCount / $maxLoad) * 100, 1);
        
        // Flag overloaded teachers
        $isOverloaded = $loadPercentage > 100;
        
        $teacherLoadStats[] = [
            'teacher_id' => $teacherId,
            'teacher_name' => $teacher['name'],
            'periods' => $periodCount,
            'max_periods' => $maxLoad,
            'load_percentage' => $loadPercentage,
            'is_overloaded' => $isOverloaded,
            'custom_load' => ($teacher['load'] && $teacher['load'] > 0) ? $teacher['load'] : null
        ];
    }
}

// Sort teacher load stats by load percentage (descending) to show overloaded teachers first
usort($teacherLoadStats, function($a, $b) {
    return $b['load_percentage'] - $a['load_percentage'];
});

// Group failed assignments by section for better visibility
$failedBySection = [];
foreach ($failedAssignments as $failed) {
    $sectionId = $failed['section'];
    if (!isset($failedBySection[$sectionId])) {
        $failedBySection[$sectionId] = [];
    }
    $failedBySection[$sectionId][] = $failed;
}

// Generate units compliance report
$unitsComplianceReport = [];
foreach ($sections as $section) {
    $sectionId = $section['id'];
    $grade = $section['grade'];
    $strand = $section['strand'];
    
    // Get subjects for this section
    $sectionSubjects = [];
    foreach ($subjects as $subj) {
        if ($grade <= 10) {
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
    
    $subjectCompliance = [];
    $totalRequiredUnits = 0;
    $totalActualUnits = 0;
    
    foreach ($uniqueSubjects as $subj) {
        $subjectName = $subj['name'];
        $requiredUnits = $subj['units'];
        $actualUnits = isset($subjectUsagePerWeek[$sectionId][$subjectName]) ? 
            $subjectUsagePerWeek[$sectionId][$subjectName] : 0;
        
        $totalRequiredUnits += $requiredUnits;
        $totalActualUnits += $actualUnits;
        
        $compliance = $requiredUnits > 0 ? round(($actualUnits / $requiredUnits) * 100, 1) : 100;
        $subjectCompliance[] = [
            'subject' => $subjectName,
            'required' => $requiredUnits,
            'actual' => $actualUnits,
            'compliance' => $compliance
        ];
    }
    
    $overallCompliance = $totalRequiredUnits > 0 ? round(($totalActualUnits / $totalRequiredUnits) * 100, 1) : 100;
    
    $unitsComplianceReport[] = [
        'section_id' => $sectionId,
        'section_name' => $section['name'],
        'grade' => $grade,
        'strand' => $strand,
        'total_required_units' => $totalRequiredUnits,
        'total_actual_units' => $totalActualUnits,
        'overall_compliance' => $overallCompliance,
        'subject_compliance' => $subjectCompliance
    ];
}

// Clean any output buffer before sending JSON response
$output = ob_get_contents();
if ($output) {
    ob_clean();
}

// Prepare success message with conflict warning if needed
$message = 'Schedule generated successfully';
if (count($conflicts) > 0) {
    $message .= ' with ' . count($conflicts) . ' conflicts detected. Review conflicts in Schedule Conflicts section.';
} else {
    $message .= ' with no conflicts!';
}

respond([
    'success' => true,
    'message' => $message,
    'stats' => [
        'total_assignments' => count($assignments),
        'successful' => $successCount,
        'failed' => count($failedAssignments),
        'teachers_used' => count($teacherPeriodCount),
        'sections_processed' => count($sections),
        'conflicts_detected' => count($conflicts)
    ],
    'conflicts' => $conflicts,
    'has_conflicts' => count($conflicts) > 0,
    'teacher_loads' => $teacherLoadStats,
    'units_compliance' => $unitsComplianceReport,
    'failed_assignments' => $failedAssignments,
    'failed_by_section' => $failedBySection
]);


