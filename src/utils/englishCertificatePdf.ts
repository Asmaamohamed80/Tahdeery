/**
 * Renders a high-resolution A4 Landscape English Play Zone Certificate
 * featuring the child's name, unlocked achievement badges across the 4 games,
 * academy branding, gold honor seal, and instant PDF 1.4 binary export.
 */

export interface EnglishGamesCertificateData {
  studentName: string;
  ageGroupLabel: string;
  academyName: string;
  logoDataUrl?: string;
  storiesBuilt: number;
  detectiveScore: number;
  detectiveTotal: number;
  sentencesSolved: number;
  sentencesTotal: number;
  customersServed: number;
  customersTotal: number;
  voiceStars: number;
  badges: Array<{ title: string; unlocked: boolean }>;
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

export async function renderEnglishCertificateCanvas(
  data: EnglishGamesCertificateData
): Promise<HTMLCanvasElement> {
  const width = 1754;
  const height = 1240;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  // 1. Archival Paper
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, width, height);

  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, 'rgba(6, 95, 70, 0.04)');
  wash.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  wash.addColorStop(1, 'rgba(217, 119, 6, 0.05)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);

  // 2. Emerald + Gold Classic Frame
  ctx.strokeStyle = '#065f46';
  ctx.lineWidth = 22;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  ctx.strokeStyle = '#d97706';
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
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Brand Header & Optional Logo
  const logoImg = await loadOptionalImage(data.logoDataUrl);
  const brandLabel = (data.academyName || 'LinguaCraft English Academy').toUpperCase();

  ctx.save();
  if (logoImg) {
    const targetH = 60;
    const targetW = Math.min(170, Math.round((logoImg.width / Math.max(1, logoImg.height)) * targetH));
    const totalW = targetW + 18 + Math.min(620, brandLabel.length * 14);
    const startX = (width - totalW) / 2;
    ctx.drawImage(logoImg, startX, 112, targetW, targetH);
    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 23px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(brandLabel, startX + targetW + 18, 142);
  } else {
    ctx.fillStyle = '#065f46';
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

  // 4. Title & Award Recipient
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d97706';
  ctx.font = 'bold 21px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`ENGLISH PLAY ZONE · ${data.ageGroupLabel.toUpperCase()} · READING & SPEAKING`, width / 2, 232);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 54px Georgia, "Times New Roman", serif';
  ctx.fillText('Young English Champion Certificate', width / 2, 302);

  ctx.fillStyle = '#64748b';
  ctx.font = '22px "Segoe UI", Arial, sans-serif';
  ctx.fillText('PROUDLY PRESENTED TO', width / 2, 358);

  const cleanName = data.studentName.trim() || 'English Star';
  ctx.fillStyle = '#0c4a6e';
  ctx.font = 'bold 70px Georgia, "Segoe UI", Tahoma, serif';
  ctx.fillText(cleanName, width / 2, 444);

  const halfRule = Math.max(250, Math.min(480, cleanName.length * 22));
  const grad = ctx.createLinearGradient(width / 2 - halfRule, 0, width / 2 + halfRule, 0);
  grad.addColorStop(0, 'rgba(217, 119, 6, 0.1)');
  grad.addColorStop(0.5, 'rgba(217, 119, 6, 1)');
  grad.addColorStop(1, 'rgba(217, 119, 6, 0.1)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width / 2 - halfRule, 474);
  ctx.lineTo(width / 2 + halfRule, 474);
  ctx.stroke();

  // 5. Subtitle Summary
  ctx.fillStyle = '#1e293b';
  ctx.font = '26px "Segoe UI", Arial, sans-serif';
  ctx.fillText(
    'For outstanding creativity, vocabulary mastery, sentence building & polite English communication',
    width / 2,
    532
  );

  // 6. 4 Achievement Badge Medallions Row
  const badges = data.badges.slice(0, 4);
  const bCardW = 300;
  const bGap = 24;
  const bRowW = badges.length * bCardW + (badges.length - 1) * bGap;
  const bStartX = (width - bRowW) / 2;
  const bY = 576;
  const bH = 152;

  badges.forEach((b, i) => {
    const cx = bStartX + i * (bCardW + bGap);
    ctx.fillStyle = b.unlocked ? '#ecfdf5' : '#f8fafc';
    ctx.strokeStyle = b.unlocked ? '#059669' : '#cbd5e1';
    ctx.lineWidth = b.unlocked ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect(cx, bY, bCardW, bH, 16);
    ctx.fill();
    ctx.stroke();

    // Star medal circle
    ctx.fillStyle = b.unlocked ? '#f59e0b' : '#cbd5e1';
    ctx.beginPath();
    ctx.arc(cx + bCardW / 2, bY + 52, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    drawStarPolygon(ctx, cx + bCardW / 2, bY + 52, 5, 14, 6);
    ctx.fill();

    ctx.fillStyle = b.unlocked ? '#064e3b' : '#64748b';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.title, cx + bCardW / 2, bY + 106);

    ctx.fillStyle = b.unlocked ? '#059669' : '#94a3b8';
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.fillText(b.unlocked ? 'BADGE EARNED' : 'IN PROGRESS', cx + bCardW / 2, bY + 132);
  });

  // 7. Activity Breakdown Box
  const panelX = 210;
  const panelY = 762;
  const panelW = width - 420;
  const panelH = 160;

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0c4a6e';
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
  ctx.fillText('PLAY ZONE PROGRESS SUMMARY', width / 2, panelY + 38);

  ctx.fillStyle = '#334155';
  ctx.font = '21px "Segoe UI", Arial, sans-serif';
  ctx.fillText(
    `Stories Created: ${data.storiesBuilt}   ·   Word Detective: ${data.detectiveScore}/${data.detectiveTotal}   ·   Sentence Race: ${data.sentencesSolved}/${data.sentencesTotal}   ·   Cafe Host: ${data.customersServed}/${data.customersTotal}   ·   Speaking Stars: ${data.voiceStars}`,
    width / 2,
    panelY + 100
  );

  // 8. Footer: Date, Gold Seal & Signature
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

  // Gold Ribbon Seal
  const sealX = width / 2;
  const sealY = footerY - 12;

  ctx.fillStyle = '#065f46';
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

  ctx.fillStyle = '#d97706';
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
  ctx.fillText('ENGLISH', sealX, sealY - 6);
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('STAR', sealX, sealY + 18);

  // Director Right
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width - 540, footerY);
  ctx.lineTo(width - 220, footerY);
  ctx.stroke();

  ctx.fillStyle = '#065f46';
  ctx.font = 'italic bold 26px Georgia, serif';
  ctx.fillText(data.academyName || 'LinguaCraft Academy', width - 380, footerY - 18);
  ctx.fillStyle = '#64748b';
  ctx.font = '18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('English Play Zone Director', width - 380, footerY + 32);

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

export async function downloadEnglishCertificatePdf(
  data: EnglishGamesCertificateData
): Promise<void> {
  const canvas = await renderEnglishCertificateCanvas(data);
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.94);
  const base64 = jpegDataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const jpegBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    jpegBytes[i] = binary.charCodeAt(i);
  }

  const pdfBlob = buildSinglePagePdfFromJpeg(jpegBytes, canvas.width, canvas.height);
  const url = URL.createObjectURL(pdfBlob);

  const safeSlug = (data.studentName.trim() || 'English-Champion')
    .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const link = document.createElement('a');
  link.href = url;
  link.download = `English-Champion-Certificate-${safeSlug || 'Student'}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
