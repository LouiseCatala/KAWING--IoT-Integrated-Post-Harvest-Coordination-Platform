<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\Exception as MailerException;
use PHPMailer\PHPMailer\PHPMailer;
require_once __DIR__ . '/email-template.php';

$publicRoot = dirname(__DIR__);
$privateRoot = dirname($publicRoot);
foreach ([$privateRoot . '/vendor/autoload.php', $publicRoot . '/vendor/autoload.php'] as $autoload) {
    if (is_file($autoload)) { require_once $autoload; break; }
}

function smtpIsConfigured(array $smtp): bool {
    return !empty($smtp['enabled'])
        && class_exists(PHPMailer::class)
        && filter_var($smtp['username'] ?? '', FILTER_VALIDATE_EMAIL)
        && ($smtp['password'] ?? '') !== '';
}

function ensureEmailDeliveryTable(PDO $pdo): void {
    $pdo->exec("CREATE TABLE IF NOT EXISTS email_deliveries (
        notification_id VARCHAR(64) PRIMARY KEY,
        recipient_email VARCHAR(191) NOT NULL,
        delivery_status VARCHAR(24) NOT NULL DEFAULT 'pending',
        attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
        last_error VARCHAR(500) NULL,
        sent_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email_delivery_recipient (recipient_email, delivery_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function claimEmailDelivery(PDO $pdo, string $notificationId, string $recipient): bool {
    $insert = $pdo->prepare("INSERT IGNORE INTO email_deliveries (notification_id,recipient_email,delivery_status,attempts) VALUES (?,?,'pending',0)");
    $insert->execute([$notificationId, $recipient]);
    if ($insert->rowCount() === 1) return true;
    $claim = $pdo->prepare("UPDATE email_deliveries SET delivery_status='pending', last_error=NULL WHERE notification_id=? AND delivery_status='failed'");
    $claim->execute([$notificationId]);
    return $claim->rowCount() === 1;
}

function sendKawingEmail(array $smtp, string $recipient, string $subject, string $message, string $appUrl = '', string $recipientName = '', array $details = []): void {
    if (!smtpIsConfigured($smtp)) throw new RuntimeException('SMTP is not configured.');
    if (!filter_var($recipient, FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('Invalid recipient email.');

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = (string) $smtp['host'];
    $mail->SMTPAuth = true;
    $mail->Username = (string) $smtp['username'];
    $mail->Password = (string) $smtp['password'];
    $mail->Port = (int) $smtp['port'];
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->Timeout = 15;
    if (!empty($smtp['ca_bundle'])) {
        $mail->SMTPOptions = ['ssl' => [
            'cafile' => (string) $smtp['ca_bundle'],
            'verify_peer' => true,
            'verify_peer_name' => true,
        ]];
    }
    $mail->SMTPSecure = ($smtp['encryption'] ?? 'tls') === 'ssl'
        ? PHPMailer::ENCRYPTION_SMTPS
        : PHPMailer::ENCRYPTION_STARTTLS;

    $fromEmail = (string) (($smtp['from_email'] ?? '') ?: $smtp['username']);
    $mail->setFrom($fromEmail, (string) ($smtp['from_name'] ?? 'KAWING Notifications'));
    $mail->addAddress($recipient, $recipientName);
    $mail->isHTML(true);
    $mail->Subject = $subject;

    $displayName = $recipientName !== '' ? $recipientName : 'KAWING Member';
    // Public image URLs prevent Gmail from displaying template images as file attachments.
    // Set app_url to the deployed HTTPS domain so Gmail can load these assets.
    $assetBaseUrl = rtrim($appUrl, '/');
    $assetHost = strtolower((string) (parse_url($assetBaseUrl, PHP_URL_HOST) ?: ''));
    $hasPublicAssetHost = $assetBaseUrl !== ''
        && !in_array($assetHost, ['', 'localhost', '127.0.0.1', '::1'], true)
        && !str_ends_with($assetHost, '.local');
    $logoSource = $hasPublicAssetHost ? $assetBaseUrl . '/email-assets/kawing-logo-transparent.png' : '';
    $localLogoPath = dirname(__DIR__) . '/email-assets/kawing-logo-transparent.png';
    if (is_file($localLogoPath)) {
        // Embed the logo so Gmail can display it even when KAWING is running on localhost.
        $mail->addEmbeddedImage($localLogoPath, 'kawing-logo', 'kawing-logo.png', PHPMailer::ENCODING_BASE64, 'image/png');
        $logoSource = 'cid:kawing-logo';
    }
    $heroSource = $hasPublicAssetHost ? $assetBaseUrl . '/email-assets/palay-palay.png' : '';
    $mail->Body = renderKawingEmailTemplate($subject, $message, $displayName, $appUrl, $details, $logoSource, $heroSource);
    $mail->AltBody = "Hello {$displayName},\n\n" . $subject . "\n\n" . $message . ($appUrl !== '' ? "\n\nOpen KAWING: " . $appUrl : '') . "\n\nKAWING\nSmart Post-Harvest Coordination Platform";
    $mail->send();
}

function deliverNotificationEmail(PDO $pdo, array $smtp, array $notification, string $appUrl = ''): array {
    $notificationId = trim((string) ($notification['id'] ?? ''));
    $recipient = trim((string) ($notification['userEmail'] ?? ''));
    if ($notificationId === '' || !filter_var($recipient, FILTER_VALIDATE_EMAIL)) return ['status' => 'skipped', 'reason' => 'invalid_notification'];
    if (empty($notification['sendEmail'])) return ['status' => 'skipped', 'reason' => 'email_not_requested'];
    if (!smtpIsConfigured($smtp)) return ['status' => 'skipped', 'reason' => 'smtp_not_configured'];

    $statement = $pdo->prepare('SELECT data FROM users WHERE email = ? LIMIT 1');
    $statement->execute([$recipient]);
    $user = json_decode((string) ($statement->fetchColumn() ?: '{}'), true);
    if (!is_array($user) || empty($user['emailNotificationsEnabled'])) return ['status' => 'skipped', 'reason' => 'consent_not_given'];

    // The root administrator uses a system placeholder address in the users table.
    // Route admin alerts to the explicitly configured inbox, with safe fallbacks
    // to the SMTP test recipient and then the KAWING sender account.
    $deliveryRecipient = $recipient;
    if (($user['role'] ?? '') === 'admin') {
        $configuredAdminRecipient = trim((string) (
            ($smtp['admin_recipient'] ?? '')
            ?: ($smtp['test_recipient'] ?? '')
            ?: ($smtp['username'] ?? '')
        ));
        if (filter_var($configuredAdminRecipient, FILTER_VALIDATE_EMAIL)) {
            $deliveryRecipient = $configuredAdminRecipient;
        }
    }

    ensureEmailDeliveryTable($pdo);
    if (!claimEmailDelivery($pdo, $notificationId, $deliveryRecipient)) return ['status' => 'skipped', 'reason' => 'already_claimed'];

    try {
        sendKawingEmail(
            $smtp,
            $deliveryRecipient,
            '[KAWING] ' . trim((string) ($notification['title'] ?? 'Account Notification')),
            trim((string) ($notification['message'] ?? 'You have a new KAWING notification.')),
            $appUrl,
            trim((string) ($user['name'] ?? '')),
            is_array($notification['emailDetails'] ?? null) ? $notification['emailDetails'] : []
        );
        $pdo->prepare("UPDATE email_deliveries SET delivery_status='sent', attempts=attempts+1, sent_at=NOW(), last_error=NULL WHERE notification_id=?")->execute([$notificationId]);
        return ['status' => 'sent'];
    } catch (Throwable $error) {
        $safeError = substr($error->getMessage(), 0, 500);
        $pdo->prepare("UPDATE email_deliveries SET delivery_status='failed', attempts=attempts+1, last_error=? WHERE notification_id=?")->execute([$safeError, $notificationId]);
        error_log('[KAWING EMAIL] ' . $notificationId . ': ' . $safeError);
        return ['status' => 'failed'];
    }
}
