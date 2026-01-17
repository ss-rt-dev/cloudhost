<?php
session_start();
header('Content-Type: application/json');

$usersDir = 'users';

// Hole Daten aus POST
$email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
$password = $_POST['password'] ?? '';

// Validierung
if (empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Bitte füllen Sie alle Felder aus']);
    exit;
}

// Suche User-Datei
$userFile = $usersDir . '/' . md5($email) . '.json';

if (!file_exists($userFile)) {
    echo json_encode(['success' => false, 'message' => 'E-Mail oder Passwort falsch']);
    exit;
}

// Lade User-Daten
$userData = json_decode(file_get_contents($userFile), true);

// Prüfe Passwort
if (password_verify($password, $userData['password'])) {
    // Login erfolgreich - Speichere in Session
    $_SESSION['user_id'] = md5($email);
    $_SESSION['email'] = $email;
    $_SESSION['logged_in'] = true;
    
    echo json_encode(['success' => true, 'message' => 'Login erfolgreich!']);
} else {
    echo json_encode(['success' => false, 'message' => 'E-Mail oder Passwort falsch']);
}
?>
