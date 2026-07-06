<?php
// ============================================================
// API: /api/stats.php
// GET → returns dashboard summary stats
// ============================================================
require_once 'config.php';

$db = getDB();

$teachers  = $db->query("SELECT COUNT(*) as c FROM teachers")->fetch_assoc()['c'];
$sections  = $db->query("SELECT COUNT(*) as c FROM sections")->fetch_assoc()['c'];
$assigned  = $db->query("SELECT COUNT(*) as c FROM schedules WHERE section_id != ''")->fetch_assoc()['c'];

// conflicts = slots where same section+day+slot has 2+ teachers
$conflRow  = $db->query("
    SELECT COUNT(*) as c FROM (
        SELECT day, slot_id, section_id
        FROM schedules WHERE section_id != ''
        GROUP BY day, slot_id, section_id
        HAVING COUNT(teacher_id) > 1
    ) sub
")->fetch_assoc()['c'];

// section completion: 40 max periods each (8 × 5)
$secCompletion = [];
$res = $db->query("
    SELECT sec.id, sec.name, sec.grade,
        COUNT(sch.id) as filled
    FROM sections sec
    LEFT JOIN schedules sch ON sch.section_id = sec.id AND sch.section_id != ''
    GROUP BY sec.id
    ORDER BY sec.grade, sec.name
");
while ($row = $res->fetch_assoc()) {
    $secCompletion[] = [
        'id'     => $row['id'],
        'name'   => $row['name'],
        'grade'  => (int)$row['grade'],
        'filled' => (int)$row['filled'],
        'total'  => 40,
        'pct'    => round(($row['filled'] / 40) * 100),
    ];
}

$db->close();
respond([
    'success'            => true,
    'teachers'           => (int)$teachers,
    'sections'           => (int)$sections,
    'assigned_periods'   => (int)$assigned,
    'conflicts'          => (int)$conflRow,
    'section_completion' => $secCompletion,
]);
