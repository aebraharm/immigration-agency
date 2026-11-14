/**
 * Shared copy and the standalone HTML response for blocked visitors.
 *
 * The markup is intentionally self-contained (no fonts, scripts or CMS data) so
 * the firewall can answer instantly from the edge even while the database or
 * the Next.js server is unavailable.
 */

export const ACCESS_DENIED_BRAND = 'Redpath Immigration Advisory';
export const ACCESS_DENIED_EMAIL = 'hello@redpathimmigration.com';
export const ACCESS_DENIED_TITLE = 'Access denied';
export const ACCESS_DENIED_HEADING = 'Your access has been restricted';
export const ACCESS_DENIED_MESSAGE =
  'This website is not available from your current network address because of a security policy on our side.';
export const ACCESS_DENIED_HINT =
  'If you believe this is an error, contact our office and quote the reference below so we can review the restriction.';

export function renderAccessDeniedHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${ACCESS_DENIED_TITLE} | ${ACCESS_DENIED_BRAND}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 32px 20px; background: #FCFBFB; color: #211A1C;
    font-family: 'Manrope', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .card {
    width: 100%; max-width: 560px; background: #fff; border: 1px solid rgba(33, 26, 28, 0.1);
    border-radius: 24px; padding: 44px 32px; text-align: center;
    box-shadow: 0 24px 60px -40px rgba(34, 22, 25, 0.55);
  }
  .badge {
    width: 56px; height: 56px; margin: 0 auto; border-radius: 18px; background: #FEF2F2;
    display: flex; align-items: center; justify-content: center; color: #DC2626;
  }
  .eyebrow {
    margin: 26px 0 0; font-size: 10px; font-weight: 800; letter-spacing: 0.19em;
    text-transform: uppercase; color: #DC2626;
  }
  h1 {
    margin: 12px 0 0; font-family: 'DM Serif Display', Georgia, 'Times New Roman', serif;
    font-weight: 400; font-size: 34px; line-height: 1.1; letter-spacing: -0.02em; color: #211A1C;
  }
  p { margin: 16px auto 0; max-width: 420px; font-size: 13px; line-height: 1.9; color: #6B5F62; }
  .ref {
    display: inline-block; margin-top: 24px; padding: 8px 14px; border-radius: 999px;
    background: #F7F5F5; border: 1px solid rgba(33, 26, 28, 0.08);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: #6B5F62;
  }
  .actions { margin-top: 30px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
  .button {
    display: inline-flex; align-items: center; justify-content: center; min-height: 44px;
    padding: 0 22px; border-radius: 999px; border: 1px solid #DC2626; background: #DC2626;
    color: #fff; font-size: 13px; font-weight: 700; text-decoration: none;
  }
  .button.secondary { background: #fff; color: #211A1C; border-color: rgba(33, 26, 28, 0.15); }
  .footer { margin-top: 28px; font-size: 10px; color: #9A8F92; }
  @media (max-width: 420px) {
    .card { padding: 34px 22px; border-radius: 20px; }
    h1 { font-size: 28px; }
  }
</style>
</head>
<body>
  <main class="card" role="main">
    <div class="badge" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3z" />
        <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
      </svg>
    </div>
    <p class="eyebrow">Access denied · 403</p>
    <h1>${ACCESS_DENIED_HEADING}</h1>
    <p>${ACCESS_DENIED_MESSAGE}</p>
    <p>${ACCESS_DENIED_HINT}</p>
    <p class="ref">Reference: RESTRICTED-NETWORK</p>
    <div class="actions">
      <a class="button" href="mailto:${ACCESS_DENIED_EMAIL}">Contact our office</a>
      <a class="button secondary" href="/">Try again</a>
    </div>
    <p class="footer">${ACCESS_DENIED_BRAND}</p>
  </main>
</body>
</html>`;
}
