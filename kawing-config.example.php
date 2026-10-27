<?php
// Copy this file to kawing-config.php for local PHP/MySQL development.
return [
    'db_host' => '127.0.0.1',
    'db_port' => '3306',
    'db_name' => 'kawing',
    'db_user' => 'root',
    'db_password' => '',
    'iot_api_key' => 'local-palaysense-key',
    'app_url' => 'http://localhost:3000',
    'google_client_id' => '',
    'google_client_secret' => '',
    'admin_api_key' => 'replace-with-a-long-random-admin-key',
    'fish_audio_api_key' => '',
    'fish_audio_reference_id' => 'ad5685d84b4d4e9d8fd74ff3b12b30b2',
    'smtp_enabled' => false,
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 587,
    'smtp_encryption' => 'tls',
    'smtp_username' => 'your-kawing-account@gmail.com',
    'smtp_password' => 'your-16-character-google-app-password',
    'smtp_from_email' => 'your-kawing-account@gmail.com',
    'smtp_from_name' => 'KAWING Notifications',
    'smtp_test_recipient' => 'your-personal-email@example.com',
    // Inbox that receives new-account and logistics-service approval alerts.
    // If blank, KAWING falls back to smtp_test_recipient, then smtp_username.
    'admin_notification_email' => 'your-admin-email@example.com',
];
