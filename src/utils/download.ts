export function downloadTextOrHtmlFile(options: {
  fileName: string;
  title: string;
  subtitle?: string;
  bodyText: string;
  fileDataUrl?: string;
  brandHeader?: string;
}) {
  const { fileName, title, subtitle, bodyText, fileDataUrl, brandHeader } = options;

  if (fileDataUrl && fileDataUrl.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = fileDataUrl;
    link.download = fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const safeTitle = escapeHtml(title);
  const safeSub = subtitle ? escapeHtml(subtitle) : '';
  const safeBrand = escapeHtml(brandHeader || 'LinguaCraft English Academy');
  const safeBody = escapeHtml(bodyText).replace(/\n/g, '<br/>');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px auto; max-width: 820px; color: #0f172a; line-height: 1.65; }
  .header { border-bottom: 2px solid #0f4c81; padding-bottom: 14px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: baseline; }
  .brand { font-size: 13px; font-weight: 700; color: #0f4c81; letter-spacing: 0.04em; text-transform: uppercase; }
  h1 { font-size: 22px; margin: 0 0 6px; color: #0f172a; }
  .sub { font-size: 13px; color: #475569; margin: 0 0 20px; }
  .content { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; font-size: 15px; }
</style>
</head>
<body>
  <div class="header">
    <span class="brand">${safeBrand}</span>
    <span style="font-size:12px;color:#64748b;">English Language Resource</span>
  </div>
  <h1>${safeTitle}</h1>
  ${safeSub ? `<p class="sub">${safeSub}</p>` : ''}
  <div class="content">${safeBody}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.html') ? fileName : `${fileName.replace(/\.[^.]+$/, '')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
