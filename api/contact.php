<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Falta config.php']);
    exit;
}
$cfg = require $configFile;

require __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Honeypot anti-spam: campo oculto que debe llegar vacío.
if (!empty($_POST['website'] ?? '')) {
    echo json_encode(['ok' => true]); // fingimos éxito ante el bot
    exit;
}

$nombre   = trim((string)($_POST['nombre']   ?? ''));
$email    = trim((string)($_POST['email']    ?? ''));
$telefono = trim((string)($_POST['telefono'] ?? ''));
$mensaje  = trim((string)($_POST['mensaje']  ?? ''));

$errores = [];
if ($nombre === '')                             { $errores[] = 'nombre'; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $errores[] = 'email'; }
if ($mensaje === '')                            { $errores[] = 'mensaje'; }

if ($errores) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Datos inválidos', 'campos' => $errores]);
    exit;
}

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host    = $cfg['smtp_host'];
    $mail->Port    = (int) $cfg['smtp_port'];
    $mail->CharSet = 'UTF-8';

    if (($cfg['smtp_user'] ?? '') !== '') {
        $mail->SMTPAuth = true;
        $mail->Username = $cfg['smtp_user'];
        $mail->Password = $cfg['smtp_pass'];
    } else {
        $mail->SMTPAuth = false; // entorno local con Mailpit
    }
    if (($cfg['smtp_secure'] ?? '') !== '') {
        $mail->SMTPSecure = $cfg['smtp_secure']; // 'tls' (587) o 'ssl' (465)
    } else {
        $mail->SMTPAutoTLS = false;
    }

    $mail->setFrom($cfg['from_email'], $cfg['from_name']);
    foreach ((array) $cfg['to'] as $dest) {
        $mail->addAddress($dest);
    }
    $mail->addReplyTo($email, $nombre !== '' ? $nombre : $email);

    $mail->Subject = 'Nuevo mensaje desde la web';
    $mail->Body =
        "Nombre: {$nombre}\n" .
        "Email: {$email}\n" .
        "Teléfono: {$telefono}\n\n" .
        "Mensaje:\n{$mensaje}\n";

    $mail->send();
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'No se pudo enviar el mensaje']);
}