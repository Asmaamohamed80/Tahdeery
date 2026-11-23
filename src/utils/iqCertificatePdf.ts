/**
 * Renders a high-resolution A4 Landscape Certificate for IQ, Psychological Profile,
 * and Visual Memory Assessments on HTML5 Canvas (supporting Arabic & English names)
 * and packages it directly into a downloadable PDF 1.4 binary.
 */

export interface IqCertificateData {
  mode: 'iq' | 'psych' | 'memory';
  participantName: string;
  academyName: string;
  logoDataUrl?: string;
  categoryBanner: string;
  certificateTitle: string;
  primaryHeadline: string;
  heroStats: Array<{ label: string; value: string }>;
  highlightsTitle: string;
  highlights: string[];
  accentTheme?: 'navy' | 'emerald' | 'amber';
}

function loadOptionalImage(src?: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawStarPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i += 1) {
    ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

export async function renderIqCertificateCanvas(
  data: IqCertificateData
): Promise<HTMLCanvasElement> {
  const width = 1754;
  const height = 1240;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  const primaryHex =
    data.accentTheme === 'emerald'
      ? '#065f46'
      : data.accentTheme === 'amber'
      ? '#92400e'
      : '#0c4a6e';
  const goldHex = '#d97706';

  // 1. Archival Cream Paper Background
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, width, height);

  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, 'rgba(12, 74, 110, 0.04)');
  wash.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  wash.addColorStop(1, 'rgba(217, 119, 6, 0.05)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);

  // 2. Layered Honor Border & Corner Rosettes
  ctx.strokeStyle = primaryHex;
  ctx.lineWidth = 22;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  ctx.strokeStyle = goldHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(68, 68, width - 136, height - 136);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(82, 82, width - 164, height - 164);

  const corners: Array<[number, number]> = [
    [68, 68],
    [width - 68, 68],
    [68, height - 68],
    [width - 68, height - 68],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.fillStyle = primaryHex;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Academy Header & Logo
  const logoImg = await loadOptionalImage(data.logoDataUrl);
  const brandLabel = (data.academyName || 'LinguaCraft English Academy').toUpperCase();

  ctx.save();
  if (logoImg) {
    const targetH = 60;
    const targetW = Math.min(
      170,
      Math.round((logoImg.width / Math.max(1, logoImg.height)) * targetH)
    );
    const totalW = targetW + 18 + Math.min(620, brandLabel.length * 14);
    const startX = (width - totalW) / 2;
    ctx.drawImage(logoImg, startX, 112, targetW, targetH);
    ctx.fillStyle = primaryHex;
    ctx.font = 'bold 23px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(brandLabel, startX + targetW + 18, 142);
  } else {
    ctx.fillStyle = primaryHex;
    ctx.font = 'bold 25px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(brandLabel, width / 2, 145);
  }
  ctx.restore();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(410, 190);
  ctx.lineTo(width - 410, 190);
  ctx.stroke();

  // 4. Banner & Certificate Title
  ctx.textAlign = 'center';
  ctx.fillStyle = goldHex;
  ctx.font = 'bold 21px "Segoe UI", Arial, sans-serif';
  ctx.fillText(data.categoryBanner.toUpperCase(), width / 2, 232);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 54px Georgia, "Segoe UI", serif';
  ctx.fillText(data.certificateTitle, width / 2, 302);

  ctx.fillStyle = '#64748b';
  ctx.font = '22px "Segoe UI", Arial, sans-serif';
  ctx.fillText('THIS HONORARY CERTIFICATE IS PROUDLY PRESENTED TO', width / 2, 360);

  // 5. Participant Name (Large & Distinguished, supports Arabic & English)
  const displayName = data.participantName.trim() || 'Brilliant Achiever';
  ctx.fillStyle = primaryHex;
  ctx.font = 'bold 70px Georgia, "Segoe UI", Tahoma, serif';
  ctx.fillText(displayName, width / 2, 446);

  const halfRule = Math.max(250, Math.min(480, displayName.length * 22));
  const grad = ctx.createLinearGradient(width / 2 - halfRule, 0, width / 2 + halfRule, 0);
  grad.addColorStop(0, 'rgba(217, 119, 6, 0.1)');
  grad.addColorStop(0.5, 'rgba(217, 119, 6, 1)');
  grad.addColorStop(1, 'rgba(217, 119, 6, 0.1)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width / 2 - halfRule, 476);
  ctx.lineTo(width / 2 + halfRule, 476);
  ctx.stroke();

  // 6. Primary Evaluation Headline
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 31px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText(data.primaryHeadline, width / 2, 534);

  // 7. Hero Metrics Strip (2 or 3 crisp cards)
  const stats = data.heroStats.slice(0, 3);
  if (stats.length > 0) {
    const cardW = 340;
    const gap = 28;
    const totalRowW = stats.length * cardW + (stats.length - 1) * gap;
    const startX = (width - totalRowW) / 2;
    const stripY = 568;
    const cardH = 104;

    stats.forEach((st, i) => {
      const cx = startX + i * (cardW + gap);
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx, stripY, cardW, cardH, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 17px "Segoe UI", Tahoma, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(st.label, cx + cardW / 2, stripY + 34);

      ctx.fillStyle = primaryHex;
      ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
      ctx.fillText(st.value, cx + cardW / 2, stripY + 78);
    });
  }

  // 8. Breakdown / Highlights Card
  const panelX = 210;
  const panelY = 702;
  const panelW = width - 420;
  const panelH = 228;

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = primaryHex;
  ctx.textAlign = 'center';
  ctx.font = 'bold 21px "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText(data.highlightsTitle, width / 2, panelY + 38);

  const items = data.highlights.slice(0, 4);
  const twoCol = items.length >= 4;
  ctx.fillStyle = '#334155';
  ctx.font = '21px "Segoe UI", Tahoma, Arial, sans-serif';

  if (twoCol) {
    items.forEach((line, idx) => {
      const colX = idx % 2 === 0 ? panelX + 52 : width / 2 + 24;
      const rowY = panelY + 94 + Math.floor(idx / 2) * 62;
      ctx.textAlign = 'left';
      ctx.fillText(line.slice(0, 58), colX, rowY);
    });
  } else {
    items.forEach((line, idx) => {
      ctx.textAlign = 'center';
      ctx.fillText(line.slice(0, 88), width / 2, panelY + 92 + idx * 46);
    });
  }

  // 9. Footer: Date, Gold Seal & Academy Director Signature
  const footerY = 1072;
  const issuedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  ctx.textAlign = 'center';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(220, footerY);
  ctx.lineTo(540, footerY);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
  ctx.fillText(issuedDate, 380, footerY - 18);
  ctx.fillStyle = '#64748b';
  ctx.font = '18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Date Issued', 380, footerY + 32);

  // Scalloped Gold Seal
  const sealX = width / 2;
  const sealY = footerY - 12;

  ctx.fillStyle = primaryHex;
  ctx.beginPath();
  ctx.moveTo(sealX - 28, sealY + 30);
  ctx.lineTo(sealX - 48, sealY + 106);
  ctx.lineTo(sealX - 18, sealY + 88);
  ctx.lineTo(sealX - 4, sealY + 106);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sealX + 28, sealY + 30);
  ctx.lineTo(sealX + 48, sealY + 106);
  ctx.lineTo(sealX + 18, sealY + 88);
  ctx.lineTo(sealX + 4, sealY + 106);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = goldHex;
  drawStarPolygon(ctx, sealX, sealY, 16, 62, 52);
  ctx.fill();

  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(sealX, sealY, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 44, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('OFFICIAL', sealX, sealY - 6);
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('HONOR', sealX, sealY + 18);

  // Signature Right
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width - 540, footerY);
  ctx.lineTo(width - 220, footerY);
  ctx.stroke();

  ctx.fillStyle = primaryHex;
  ctx.font = 'italic bold 26px Georgia, serif';
  ctx.fillText(data.academyName || 'LinguaCraft Academy', width - 380, footerY - 18);
  ctx.fillStyle = '#64748b';
  ctx.font = '18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Cognitive & Learning Lab', width - 380, footerY + 32);

  return canvas;
}

function buildSinglePagePdfFromJpeg(
  jpegBytes: Uint8Array,
  imgWidth: number,
  imgHeight: number
): Blob {
  const encoder = new TextEncoder();
  const pageW = 841.89;
  const pageH = 595.28;

  const contentsStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentsBytes = encoder.encode(contentsStream);

  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let cursor = 0;

  const pushStr = (s: string) => {
    const b = encoder.encode(s);
    chunks.push(b);
    cursor += b.length;
  };

  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    cursor += b.length;
  };

  pushStr('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  offsets.push(cursor);
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  offsets.push(cursor);
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  offsets.push(cursor);
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  offsets.push(cursor);
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr('\nendstream\nendobj\n');

  offsets.push(cursor);
  pushStr(`5 0 obj\n<< /Length ${contentsBytes.length} >>\nstream\n`);
  pushBytes(contentsBytes);
  pushStr('\nendstream\nendobj\n');

  const xrefOffset = cursor;
  pushStr(`xref\n0 ${offsets.length + 1}\n`);
  pushStr('0000000000 65535 f \n');
  offsets.forEach((off) => {
    pushStr(`${String(off).padStart(10, '0')} 00000 n \n`);
  });

  pushStr(
    `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  const merged = new Uint8Array(cursor);
  let pos = 0;
  for (const c of chunks) {
    merged.set(c, pos);
    pos += c.length;
  }

  return new Blob([merged], { type: 'application/pdf' });
}

export async function downloadIqCertificatePdf(data: IqCertificateData): Promise<void> {
  const canvas = await renderIqCertificateCanvas(data);
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.94);
  const base64 = jpegDataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const jpegBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    jpegBytes[i] = binary.charCodeAt(i);
  }

  const pdfBlob = buildSinglePagePdfFromJpeg(jpegBytes, canvas.width, canvas.height);
  const url = URL.createObjectURL(pdfBlob);

  const safeSlug = (data.participantName.trim() || 'Achiever')
    .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const prefix =
    data.mode === 'iq'
      ? 'IQ-Certificate'
      : data.mode === 'psych'
      ? 'Profile-Certificate'
      : 'Memory-Certificate';

  const link = document.createElement('a');
  link.href = url;
  link.download = `${prefix}-${safeSlug || 'Student'}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
