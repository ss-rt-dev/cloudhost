<?php
header('Content-Type: application/json');

// Erstelle Ordner falls nicht vorhanden
$usersDir = 'users';
$ordersDir = 'orders';
if (!file_exists($usersDir)) {
    mkdir($usersDir, 0755, true);
}
if (!file_exists($ordersDir)) {
    mkdir($ordersDir, 0755, true);
}

// Hole Daten aus POST
$email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
$password = $_POST['password'] ?? '';
$fullname = htmlspecialchars($_POST['fullname'] ?? '');
$planName = htmlspecialchars($_POST['plan_name'] ?? '');
$planPrice = htmlspecialchars($_POST['plan_price'] ?? '');

// Validierung
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Ungültige E-Mail-Adresse']);
    exit;
}

if (empty($password) || strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Passwort muss mindestens 6 Zeichen lang sein']);
    exit;
}

if (empty($fullname) || empty($planName)) {
    echo json_encode(['success' => false, 'message' => 'Bitte füllen Sie alle Felder aus']);
    exit;
}

$userFile = $usersDir . '/' . md5($email) . '.json';

// Erstelle oder lade User
if (!file_exists($userFile)) {
    // Neuer User - registriere ihn
    $userData = [
        'email' => $email,
        'password' => password_hash($password, PASSWORD_DEFAULT),
        'fullname' => $fullname,
        'created_at' => date('Y-m-d H:i:s'),
        'orders' => []
    ];
} else {
    // Bestehender User
    $userData = json_decode(file_get_contents($userFile), true);
}

// Erstelle Bestellung
$orderId = uniqid('order_');
$order = [
    'order_id' => $orderId,
    'email' => $email,
    'fullname' => $fullname,
    'plan_name' => $planName,
    'plan_price' => $planPrice,
    'date' => date('Y-m-d H:i:s'),
    'status' => 'pending'
];

// Füge Bestellung zu User hinzu
$userData['orders'][] = $order;

// Speichere User-Daten
file_put_contents($userFile, json_encode($userData, JSON_PRETTY_PRINT));

// Speichere Bestellung separat
$orderFile = $ordersDir . '/' . $orderId . '.json';
file_put_contents($orderFile, json_encode($order, JSON_PRETTY_PRINT));

echo json_encode([
    'success' => true, 
    'message' => 'Bestellung erfolgreich! Ihre Bestellnummer: ' . $orderId,
    'order_id' => $orderId
]);
?>
