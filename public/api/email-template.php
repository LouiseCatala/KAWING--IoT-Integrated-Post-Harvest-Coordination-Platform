<?php
declare(strict_types=1);

/* EASY TO EDIT:
 * - Logo area: KAWING text inside the first header cell
 * - Header artwork: rice icons inside the hero section below
 * - Greeting/email text: $recipientName and $message
 * - Notification details: $details
 * - CTA link: $actionUrl
 * - Footer links: the Help & FAQs, Administrator, and Kiosk anchors
 */
function renderKawingEmailTemplate(string $subject, string $message, string $recipientName, string $actionUrl = '', array $details = [], string $logoSource = '', string $heroSource = ''): string {
    $escape = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $displaySubject = preg_replace('/^\[KAWING\]\s*/i', '', $subject) ?: $subject;
    $safeSubject = $escape($displaySubject);
    $safeMessage = nl2br($escape($message));
    $safeName = $escape($recipientName !== '' ? $recipientName : 'valued user');
    $safeActionUrl = $escape($actionUrl !== '' ? $actionUrl : '#');
    $safeLogoSource = $escape($logoSource);
    $safeHeroSource = $escape($heroSource);
    $heroBackground = $safeHeroSource !== ''
        ? 'background-image:linear-gradient(90deg,rgba(5,63,40,.94) 0%,rgba(5,63,40,.80) 55%,rgba(5,63,40,.40) 100%),url(' . $safeHeroSource . ');background-size:cover;background-position:center;'
        : 'background:#0b6845;';
    $logoMarkup = $safeLogoSource !== ''
        ? '<img src="' . $safeLogoSource . '" width="112" alt="KAWING logo" style="display:block;width:112px;max-width:112px;height:auto;border:0;outline:none;text-decoration:none;margin-left:auto;">'
        : '';
    $detailRows = '';
    foreach ($details as $label => $value) {
        $detailRows .= '<tr><td valign="top" style="padding:12px 16px;color:#6b7f73;font-size:13px;border-bottom:1px solid #e5eee8;width:40%;">' . $escape((string) $label) . '</td><td valign="top" style="padding:12px 16px;color:#173c2c;font-size:13px;font-weight:700;border-bottom:1px solid #e5eee8;">' . $escape((string) $value) . '</td></tr>';
    }
    if ($detailRows === '') {
        $detailRows = '<tr><td style="padding:14px;color:#153326;font-size:14px;line-height:1.6;">' . $safeMessage . '</td></tr>';
    }

    return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><style>@media only screen and (max-width:680px){.email-shell{width:100%!important}.content-pad{padding:28px 20px!important}.hero-pad{padding:28px 22px!important}.hero-art{font-size:54px!important}.footer-link{display:block!important;margin:8px 0!important}.detail-table td{font-size:12px!important}}</style></head><body style="margin:0;padding:0;background:#f3f0e5;font-family:Arial,Helvetica,sans-serif;color:#173c2c;">'
        . '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">A new update needs your attention in KAWING.</div>'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f0e5;"><tr><td align="center" style="padding:32px 12px;">'
        . '<table role="presentation" class="email-shell" width="720" cellspacing="0" cellpadding="0" border="0" style="width:720px;max-width:720px;background:#ffffff;border:1px solid #e1e8df;border-radius:20px;overflow:hidden;">'
        . '<tr><td class="hero-pad" background="' . $safeHeroSource . '" style="padding:38px 40px;' . $heroBackground . '"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td valign="middle" style="text-shadow:0 1px 3px rgba(0,0,0,.45);"><div style="font-size:11px;font-weight:800;letter-spacing:2.3px;color:#d7f4df;">SMART POST-HARVEST COORDINATION</div><div style="margin-top:8px;font-size:35px;line-height:1;font-weight:900;letter-spacing:1.5px;color:#ffffff;">KAWING</div><div style="margin-top:13px;font-size:14px;line-height:1.5;color:#edfff2;">Connecting Farmers. Simplifying Post-Harvest Coordination.</div></td><td class="hero-art" width="145" align="right" valign="middle">' . $logoMarkup . '</td></tr></table></td></tr>'
        . '<tr><td style="height:7px;background:#e6b827;font-size:0;line-height:0;">&nbsp;</td></tr>'
        . '<tr><td class="content-pad" style="padding:38px 44px 34px;"><p style="margin:0 0 8px;color:#6a7c71;font-size:13px;font-weight:700;">Hello, ' . $safeName . '</p><h1 style="margin:0;color:#123d2b;font-size:25px;line-height:1.3;font-weight:800;">' . $safeSubject . '</h1><p style="margin:14px 0 26px;color:#52685b;font-size:15px;line-height:1.7;">' . $safeMessage . '</p>'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:12px;"><tr><td style="font-size:12px;font-weight:800;letter-spacing:1.2px;color:#168259;text-transform:uppercase;">Notification details</td><td align="right"><span style="display:inline-block;padding:6px 11px;border-radius:20px;background:#fff4c7;color:#7c5b00;font-size:11px;font-weight:800;">ACTION REQUIRED</span></td></tr></table>'
        . '<table role="presentation" class="detail-table" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #dbe8df;border-radius:12px;overflow:hidden;background:#fbfdfb;">' . $detailRows . '</table>'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:30px 0 4px;"><a href="' . $safeActionUrl . '" style="display:inline-block;background:#119764;color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:9px;font-size:14px;font-weight:800;letter-spacing:.4px;">OPEN REQUEST IN KAWING&nbsp; →</a><p style="margin:12px 0 0;color:#87978e;font-size:11px;">Sign in to review and respond to this request.</p></td></tr></table></td></tr>'
        . '<tr><td style="padding:26px 40px;background:#edf7ee;border-top:1px solid #dcebdd;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td><strong style="display:block;color:#175c3e;font-size:15px;">Access KAWING Anytime</strong><span style="display:block;margin-top:5px;color:#60766a;font-size:12px;line-height:1.5;">Use the Web Platform or visit your Community Access Kiosk.</span></td><td align="right"><a href="' . $safeActionUrl . '" style="color:#11794e;font-size:12px;font-weight:800;text-decoration:none;">OPEN PORTAL →</a></td></tr></table></td></tr>'
        . '<tr><td style="background:#103d2d;padding:28px 36px;text-align:center;color:#dff3e5;"><strong style="font-size:18px;letter-spacing:1px;color:#ffffff;">KAWING</strong><p style="margin:6px 0 16px;font-size:11px;color:#a9c8b5;">Smart Post-Harvest Coordination Platform</p><p style="margin:0 0 15px;font-size:12px;"><a class="footer-link" href="' . $safeActionUrl . '" style="color:#c6ead3;text-decoration:none;">Help &amp; FAQs</a>&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;<a class="footer-link" href="mailto:admin@kawing.com" style="color:#c6ead3;text-decoration:none;">Contact Administrator</a>&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;<a class="footer-link" href="' . $safeActionUrl . '" style="color:#c6ead3;text-decoration:none;">Community Kiosk</a></p><p style="margin:0;font-size:10px;line-height:1.6;color:#89aa98;">You received this message because email notifications are enabled for your KAWING account.<br>You may change this preference anytime in Profile Settings.</p></td></tr>'
        . '</table></td></tr></table></body></html>';
}
