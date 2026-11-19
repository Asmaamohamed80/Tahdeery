export function downloadTextOrHtmlFile(options: {
  fileName: string;
  title: string;
  subtitle?: string;
  bodyText: string;
  fileDataUrl?: string;
  brandHeader?: string;
  logoDataUrl?: string;
}) {
  const { fileName, title, subtitle, bodyText, fileDataUrl, brandHeader, logoDataUrl } = options;

  const triggerDownload = (href: string, name: string) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (fileDataUrl && fileDataUrl.startsWith('data:')) {
    // If it's an image file and a site logo is configured, prepend a crisp top brand strip
    // above the image so the original prep/worksheet/story/activity artwork is never covered.
    if (fileDataUrl.startsWith('data:image/') && logoDataUrl) {
      const sheetImg = new Image();
      sheetImg.onload = () => {
        const headerHeight = Math.max(56, Math.round(sheetImg.width * 0.065));
        const canvas = document.createElement('canvas');
        canvas.width = sheetImg.width;
        canvas.height = sheetImg.height + headerHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          triggerDownload(fileDataUrl, fileName || 'document');
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, headerHeight);
        ctx.drawImage(sheetImg, 0, headerHeight);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, headerHeight - 1);
        ctx.lineTo(canvas.width, headerHeight - 1);
        ctx.stroke();

        const logoImg = new Image();
        logoImg.onload = () => {
          const pad = Math.round(headerHeight * 0.16);
          const maxLogoH = headerHeight - pad * 2;
          const scale = maxLogoH / Math.max(1, logoImg.height);
          const drawW = Math.min(maxLogoH * 2.6, Math.round(logoImg.width * scale));
          const drawH = Math.round(logoImg.height * (drawW / Math.max(1, logoImg.width)));
          const drawY = Math.round((headerHeight - drawH) / 2);
          ctx.drawImage(logoImg, pad * 1.5, drawY, drawW, drawH);

          ctx.fillStyle = '#0c4a6e';
          ctx.font = `bold ${Math.max(14, Math.round(headerHeight * 0.34))}px "Segoe UI", Arial, sans-serif`;
          ctx.textBaseline = 'middle';
          ctx.fillText(
            brandHeader || 'LinguaCraft English Academy',
            pad * 2.5 + drawW,
            headerHeight / 2
          );

          const outName = fileName
            ? fileName.replace(/\.[^.]+$/, '.png')
            : 'branded-sheet.png';
          triggerDownload(canvas.toDataURL('image/png'), outName);
        };
        logoImg.onerror = () => triggerDownload(fileDataUrl, fileName || 'document');
        logoImg.src = logoDataUrl;
      };
      sheetImg.onerror = () => triggerDownload(fileDataUrl, fileName || 'document');
      sheetImg.src = fileDataUrl;
      return;
    }

    triggerDownload(fileDataUrl, fileName || 'document');
    return;
  }

  const safeTitle = escapeHtml(title);
  const safeSub = subtitle ? escapeHtml(subtitle) : '';
  const safeBrand = escapeHtml(brandHeader || 'LinguaCraft English Academy');
  const safeBody = escapeHtml(bodyText).replace(/\n/g, '<br/>');
  const safeLogo =
    logoDataUrl && logoDataUrl.startsWith('data:image/')
      ? `<img src="${logoDataUrl}" alt="${safeBrand}" class="brand-logo" />`
      : '';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 36px auto; max-width: 840px; color: #0f172a; line-height: 1.65; }
  .header { border-bottom: 2px solid #0c4a6e; padding-bottom: 12px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .brand-wrap { display: flex; align-items: center; gap: 12px; }
  .brand-logo { height: 40px; width: auto; max-width: 120px; object-fit: contain; border-radius: 6px; }
  .brand { font-size: 14px; font-weight: 700; color: #0c4a6e; letter-spacing: 0.03em; }
  h1 { font-size: 22px; margin: 0 0 6px; color: #0f172a; }
  .sub { font-size: 13px; color: #475569; margin: 0 0 20px; }
  .content { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; font-size: 15px; }
</style>
</head>
<body>
  <div class="header">
    <div class="brand-wrap">
      ${safeLogo}
      <span class="brand">${safeBrand}</span>
    </div>
    <span style="font-size:12px;color:#64748b;">English Language Resource</span>
  </div>
  <h1>${safeTitle}</h1>
  ${safeSub ? `<p class="sub">${safeSub}</p>` : ''}
  <div class="content">${safeBody}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  triggerDownload(
    url,
    fileName.endsWith('.html') ? fileName : `${fileName.replace(/\.[^.]+$/, '')}.html`
  );
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
