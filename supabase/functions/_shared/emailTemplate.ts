const EMAIL_WIDTH = 600;
const HEADER_DISPLAY_WIDTH = 720;
const HEADER_HEIGHT_SCALE = 2.5;

const ASSETS = {
  header: { path: "/emails/header.png", width: 2219, height: 273 },
  watermark: { path: "/emails/watermark.png", width: 1920, height: 1080 },
  footerBar: { path: "/emails/footer-bar.png", width: 1991, height: 191 },
  footerPhone: { path: "/emails/footer-phone.png", width: 525, height: 68 },
} as const;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getEmailAssetBaseUrl(): string {
  const url = Deno.env.get("SITE_URL")?.trim() || "https://thriveformative.com";
  return url.replace(/\/$/, "");
}

function assetUrl(path: string): string {
  return `${getEmailAssetBaseUrl()}${path}`;
}

function scaledHeight(originalWidth: number, originalHeight: number, targetWidth: number): number {
  return Math.round((originalHeight / originalWidth) * targetWidth);
}

export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#333333;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">${html}</p>`;
}

export function emailSignOff(): string {
  return `${emailParagraph("Saludos,")}${emailParagraph("<strong>Thrive Formative</strong>")}`;
}

export function buildThriveEmailHtml(bodyHtml: string): string {
  const headerHeight = Math.round(
    scaledHeight(ASSETS.header.width, ASSETS.header.height, HEADER_DISPLAY_WIDTH) * HEADER_HEIGHT_SCALE,
  );
  const footerBarHeight = scaledHeight(ASSETS.footerBar.width, ASSETS.footerBar.height, EMAIL_WIDTH);
  const footerPhoneWidth = 220;
  const footerPhoneHeight = scaledHeight(ASSETS.footerPhone.width, ASSETS.footerPhone.height, footerPhoneWidth);
  const watermarkWidth = 380;

  const headerSrc = assetUrl(ASSETS.header.path);
  const watermarkSrc = assetUrl(ASSETS.watermark.path);
  const footerBarSrc = assetUrl(ASSETS.footerBar.path);
  const footerPhoneSrc = assetUrl(ASSETS.footerPhone.path);
  const siteUrl = getEmailAssetBaseUrl();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thrive Formative</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f5f0;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f7f5f0;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="${EMAIL_WIDTH}" cellspacing="0" cellpadding="0" style="max-width:${EMAIL_WIDTH}px;width:100%;background-color:#ffffff;border-radius:0 0 20px 20px;overflow:visible;">

          <tr>
            <td align="center" style="padding:0;line-height:0;font-size:0;overflow:visible;">
              <img src="${headerSrc}" alt="Thrive Formative" width="${HEADER_DISPLAY_WIDTH}" height="${headerHeight}" style="display:block;width:${HEADER_DISPLAY_WIDTH}px;max-width:none;height:${headerHeight}px;border:0;margin:0 auto;">
            </td>
          </tr>

          <tr>
            <td bgcolor="#ffffff" background="${watermarkSrc}" style="padding:36px 40px 32px;background-color:#ffffff;background-image:url('${watermarkSrc}');background-repeat:no-repeat;background-position:center center;background-size:${watermarkWidth}px auto;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size:15px;line-height:1.65;color:#333333;">
                    ${bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td bgcolor="#cdbba8" background="${footerBarSrc}" style="padding:0;background-color:#cdbba8;background-image:url('${footerBarSrc}');background-repeat:no-repeat;background-position:right bottom;background-size:${EMAIL_WIDTH}px auto;border-radius:0 0 20px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="middle" style="padding:${Math.max(14, Math.round(footerBarHeight * 0.28))}px 20px ${Math.max(10, Math.round(footerBarHeight * 0.18))}px 22px;min-height:${footerBarHeight}px;">
                    <a href="tel:+528120036699" style="text-decoration:none;">
                      <img src="${footerPhoneSrc}" alt="81 2003 6699" width="${footerPhoneWidth}" height="${footerPhoneHeight}" style="display:block;border:0;height:auto;max-width:100%;">
                    </a>
                  </td>
                  <td width="42%" valign="middle" align="right" style="padding:0;line-height:0;font-size:0;min-height:${footerBarHeight}px;">
                    <a href="${siteUrl}" style="text-decoration:none;display:block;width:100%;min-height:${footerBarHeight}px;line-height:${footerBarHeight}px;">&nbsp;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
