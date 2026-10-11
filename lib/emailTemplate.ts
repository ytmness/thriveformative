const EMAIL_WIDTH = 600;

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
  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "https://thriveformative.com";
  return url.replace(/\/$/, "");
}

export const EMAIL_IMAGE_CIDS = {
  header: "thrive-header",
  watermark: "thrive-watermark",
  footerBar: "thrive-footer-bar",
  footerPhone: "thrive-footer-phone",
} as const;

function cid(id: string): string {
  return `cid:${id}`;
}

function scaledHeight(originalWidth: number, originalHeight: number, targetWidth: number): number {
  return Math.round((originalHeight / originalWidth) * targetWidth);
}

export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#333333;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">${html}</p>`;
}

export function emailSignOff(locale: "en" | "es" = "es"): string {
  const line = locale === "en" ? "Best regards," : "Saludos,";
  return `${emailParagraph(line)}${emailParagraph("<strong>Thrive Formative</strong>")}`;
}

export function buildThriveEmailHtml(bodyHtml: string): string {
  const headerHeight = scaledHeight(ASSETS.header.width, ASSETS.header.height, EMAIL_WIDTH);
  const footerBarHeight = scaledHeight(ASSETS.footerBar.width, ASSETS.footerBar.height, EMAIL_WIDTH);
  const watermarkWidth = 380;

  const headerSrc = cid(EMAIL_IMAGE_CIDS.header);
  const watermarkSrc = `${getEmailAssetBaseUrl()}${ASSETS.watermark.path}`;
  const footerSrc = cid(EMAIL_IMAGE_CIDS.footerBar);
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
        <table role="presentation" width="${EMAIL_WIDTH}" cellspacing="0" cellpadding="0" style="max-width:${EMAIL_WIDTH}px;width:100%;background-color:#ffffff;border-radius:0 0 20px 20px;overflow:hidden;">

          <tr>
            <td style="padding:0;line-height:0;font-size:0;">
              <img src="${headerSrc}" alt="Thrive Formative" width="${EMAIL_WIDTH}" height="${headerHeight}" style="display:block;width:100%;max-width:${EMAIL_WIDTH}px;height:auto;border:0;">
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
            <td style="padding:0;line-height:0;font-size:0;background-color:#cdbba8;border-radius:0 0 20px 20px;">
              <a href="${siteUrl}" style="text-decoration:none;">
                <img src="${footerSrc}" alt="81 2003 6699 · thriveformative.com" width="${EMAIL_WIDTH}" height="${footerBarHeight}" style="display:block;width:100%;max-width:${EMAIL_WIDTH}px;height:auto;border:0;">
              </a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
