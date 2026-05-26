<?php
// Copiar a api/config.php y completar. config.php NO se commitea.
return [
    'smtp_host'   => 'c0000000.ferozo.com',         // host SMTP de Donweb (ver cPanel » Cuentas de correo » Conf.)
    'smtp_port'   => 587,                            // 587 (TLS) o 465 (SSL)
    'smtp_secure' => 'tls',                          // 'tls' | 'ssl'
    'smtp_user'   => 'contacto@NUEVO_DOMINIO',       // casilla creada en Donweb
    'smtp_pass'   => 'CAMBIAR',
    'from_email'  => 'contacto@NUEVO_DOMINIO',       // mejor que coincida con el dominio (SPF/DKIM)
    'from_name'   => 'Web Luz Contable-Legal',
    'to'          => ['contacto@NUEVO_DOMINIO'],     // podés poner varias casillas
];