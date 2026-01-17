<?php
header('Content-Type: application/json');

// Erstelle users Ordner falls nicht vorhanden
$usersDir = 'users';
if (!file_exists($usersDir)) {
    mkdir($usersDir, 0755, true);
}

// Hole Daten aus POST
$email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
$password = $_POST['password'] ?? '';
$passwordConfirm = $_POST['password_confirm'] ?? '';

// Validierung
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Ungültige E-Mail-Adresse']);
    exit;
}

if (empty($password) || strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Passwort muss mindestens 6 Zeichen lang sein']);
    exit;
}

if ($password !== $passwordConfirm) {
    echo json_encode(['success' => false, 'message' => 'Passwörter stimmen nicht überein']);
    exit;
}

// Prüfe ob User bereits existiert
$userFile = $usersDir . '/' . md5($email) . '.json';
if (file_exists($userFile)) {
    echo json_encode(['success' => false, 'message' => 'Diese E-Mail ist bereits registriert']);
    exit;
}

// Erstelle neuen User
$userData = [
    'email' => $email,
    'password' => password_hash($password, PASSWORD_DEFAULT),
    'created_at' => date('Y-m-d H:i:s'),
    'orders' => []
];

// Speichere User-Daten
if (file_put_contents($userFile, json_encode($userData, JSON_PRETTY_PRINT))) {
    echo json_encode(['success' => true, 'message' => 'Registrierung erfolgreich! Sie können sich jetzt einloggen.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Fehler beim Speichern. Bitte versuchen Sie es erneut.']);
}
?>
