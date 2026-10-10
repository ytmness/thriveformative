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

export function emailSignOff(): string {
  return `${emailParagraph("Saludos,")}${emailParagraph("<strong>Thrive Formative</strong>")}`;
}

export function buildThriveEmailHtml(bodyHtml: string): string {
  const headerHeight = scaledHeight(ASSETS.header.width, ASSETS.header.height, EMAIL_WIDTH);
  const footerBarHeight = scaledHeight(ASSETS.footerBar.width, ASSETS.footerBar.height, EMAIL_WIDTH);
  const footerPhoneWidth = 220;
  const footerPhoneHeight = scaledHeight(ASSETS.footerPhone.width, ASSETS.footerPhone.height, footerPhoneWidth);
  const watermarkWidth = 380;

  const headerSrc = cid(EMAIL_IMAGE_CIDS.header);
  const watermarkSrc = cid(EMAIL_IMAGE_CIDS.watermark);
  const footerBarSrc = cid(EMAIL_IMAGE_CIDS.footerBar);
  const footerPhoneSrc = cid(EMAIL_IMAGE_CIDS.footerPhone);
  const watermarkHeight = scaledHeight(ASSETS.watermark.width, ASSETS.watermark.height, watermarkWidth);
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
            <td bgcolor="#ffffff" style="padding:28px 40px 24px;background-color:#ffffff;">
              <img src="${watermarkSrc}" alt="" width="${watermarkWidth}" height="${watermarkHeight}" style="display:block;margin:8px auto -${Math.round(watermarkHeight * 0.72)}px;border:0;max-width:100%;height:auto;">
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
            <td bgcolor="#cdbba8" style="padding:0;line-height:0;font-size:0;background-color:#cdbba8;border-radius:0 0 20px 20px;">
              <a href="${siteUrl}" style="text-decoration:none;">
                <img src="${footerBarSrc}" alt="thriveformative.com" width="${EMAIL_WIDTH}" height="${footerBarHeight}" style="display:block;width:100%;max-width:${EMAIL_WIDTH}px;height:auto;border:0;">
              </a>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:-${footerBarHeight}px;">
                <tr>
                  <td height="${footerBarHeight}" valign="middle" style="padding:0 12px 0 22px;height:${footerBarHeight}px;">
                    <a href="tel:+528120036699" style="text-decoration:none;">
                      <img src="${footerPhoneSrc}" alt="81 2003 6699" width="${footerPhoneWidth}" height="${footerPhoneHeight}" style="display:block;border:0;height:auto;max-width:100%;">
                    </a>
                  </td>
                  <td width="46%" height="${footerBarHeight}" valign="middle" align="right" style="height:${footerBarHeight}px;">
                    <a href="${siteUrl}" style="text-decoration:none;display:block;width:100%;height:${footerBarHeight}px;line-height:${footerBarHeight}px;">&nbsp;</a>
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
