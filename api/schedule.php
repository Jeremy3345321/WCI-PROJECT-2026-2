<?php
// ============================================================
// API: /api/schedule.php
// GET  → fetch all schedule data
// POST → save a single period assignment
// DELETE → clear a single period assignment
// ============================================================
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// ---- GET: fetch all schedules ----
if ($method === 'GET') {
    $db = getDB();
    $result = $db->query("SELECT teacher_id, day, slot_id, section_id, subject FROM schedules WHERE section_id != ''");
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $tid  = $row['teacher_id'];
        $day  = $row['day'];
        $slot = $row['slot_id'];
        if (!isset($data[$tid])) $data[$tid] = [];
        if (!isset($data[$tid][$day])) $data[$tid][$day] = [];
        $data[$tid][$day][$slot] = [
            'section'  => $row['section_id'],
            'subject'  => $row['subject'],
        ];
    }
    $db->close();
    respond(['success' => true, 'data' => $data]);
}

// ---- POST: save one period ----
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    $tid     = $body['teacher_id']  ?? '';
    $day     = $body['day']         ?? '';
    $slot    = $body['slot_id']     ?? '';
    $section = $body['section_id']  ?? '';
    $subject = $body['subject']     ?? '';

    if (!$tid || !$day || !$slot) respondError('Missing required fields');

    $validDays  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    $validSlots = ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10'];
    if (!in_array($day, $validDays))  respondError('Invalid day');
    if (!in_array($slot, $validSlots)) respondError('Invalid slot');

    $db = getDB();

    // Verify teacher exists
    $stmt = $db->prepare("SELECT id FROM teachers WHERE id = ?");
    $stmt->bind_param('s', $tid);
    $stmt->execute();
    if (!$stmt->get_result()->fetch_assoc()) respondError('Teacher not found', 404);

    if ($section === '') {
        // Clear this slot
        $stmt = $db->prepare("DELETE FROM schedules WHERE teacher_id=? AND day=? AND slot_id=?");
        $stmt->bind_param('sss', $tid, $day, $slot);
    } else {
        // Upsert
        $stmt = $db->prepare("
            INSERT INTO schedules (teacher_id, day, slot_id, section_id, subject)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE section_id=VALUES(section_id), subject=VALUES(subject)
        ");
        $stmt->bind_param('sssss', $tid, $day, $slot, $section, $subject);
    }

    if ($stmt->execute()) {
        $db->close();
        respond(['success' => true, 'message' => 'Schedule saved']);
    } else {
        $db->close();
        respondError('Database error: ' . $stmt->error, 500);
    }
}

// ---- DELETE: clear all schedules (reset) ----
if ($method === 'DELETE') {
    $db = getDB();
    $db->query("DELETE FROM schedules");
    $db->close();
    respond(['success' => true, 'message' => 'All schedules cleared']);
}

respondError('Method not allowed', 405);
