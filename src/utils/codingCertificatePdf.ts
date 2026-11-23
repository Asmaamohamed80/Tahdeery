/**
 * Generates a high-resolution A4 Landscape Coding Certificate on an HTML5 Canvas
 * (preserving full Arabic + English typography, academy logo, gold seal, and student name)
 * and packages it into a genuine, spec-compliant single-page PDF 1.4 binary for instant download.
 */

export interface CodingCertificateData {
  studentName: string;
  academyName: string;
  logoDataUrl?: string;
  codeQuestSolved: number;
  codeQuestTotal: number;
  logicLabSolved: number;
  logicLabTotal: number;
  lang: 'ar' | 'en';
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

export async function renderCodingCertificateCanvas(
  data: CodingCertificateData
): Promise<HTMLCanvasElement> {
  const width = 1754;
  const height = 1240;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // 1. Archival warm ivory paper backdrop
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, width, height);

  // Subtle top & bottom gradient accent wash
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, 'rgba(12, 74, 110, 0.04)');
  wash.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  wash.addColorStop(1, 'rgba(217, 119, 6, 0.05)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);

  // 2. Royal Navy & Burnished Gold Architectural Frames
  ctx.strokeStyle = '#0c4a6e';
  ctx.lineWidth = 22;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 4;
  ctx.strokeRect(68, 68, width - 136, height - 136);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(82, 82, width - 164, height - 164);

  // Corner gold medallions
  const corners: Array<[number, number]> = [
    [68, 68],
    [width - 68, 68],
    [68, height - 68],
    [width - 68, height - 68],
  ];
  corners.forEach(([cx, cy]) => {
    ctx.fillStyle = '#0c4a6e';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Header Brand + Logo
  const logoImg = await loadOptionalImage(data.logoDataUrl);
  const brandLabel = (data.academyName || 'LinguaCraft English Academy').toUpperCase();

  ctx.save();
  if (logoImg) {
    const targetH = 64;
    const targetW = Math.min(180, Math.round((logoImg.width / Math.max(1, logoImg.height)) * targetH));
    const totalW = targetW + 20 + Math.min(600, brandLabel.length * 14);
    const startX = (width - totalW) / 2;
    ctx.drawImage(logoImg, startX, 118, targetW, targetH);
    ctx.fillStyle = '#0c4a6e';
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(brandLabel, startX + targetW + 20, 150);
  } else {
    ctx.fillStyle = '#0c4a6e';
    ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(brandLabel, width / 2, 152);
  }
  ctx.restore();

  // Divider line under brand
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(420, 198);
  ctx.lineTo(width - 420, 198);
  ctx.stroke();

  // 4. Certificate Title & Subheader
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d97706';
  ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
  ctx.fillText('JUNIOR COMPUTER SCIENCE & ENGLISH CODING LAB', width / 2, 245);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 58px Georgia, "Times New Roman", serif';
  ctx.fillText('Certificate of Coding Excellence', width / 2, 318);

  ctx.fillStyle = '#475569';
  ctx.font = '24px "Segoe UI", Arial, sans-serif';
  ctx.fillText('THIS HONOR IS PROUDLY PRESENTED TO', width / 2, 382);

  // 5. Highlighted Student Name Banner
  const cleanName = data.studentName.trim() || 'Young Coder';
  ctx.fillStyle = '#0c4a6e';
  ctx.font = 'bold 74px Georgia, "Segoe UI", Tahoma, serif';
  ctx.fillText(cleanName, width / 2, 476);

  // Ornamental gold rule under student name
  const nameLineHalf = Math.max(260, Math.min(480, cleanName.length * 22));
  const lineGrad = ctx.createLinearGradient(
    width / 2 - nameLineHalf,
    0,
    width / 2 + nameLineHalf,
    0
  );
  lineGrad.addColorStop(0, 'rgba(217, 119, 6, 0.1)');
  lineGrad.addColorStop(0.5, 'rgba(217, 119, 6, 1)');
  lineGrad.addColorStop(1, 'rgba(217, 119, 6, 0.1)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width / 2 - nameLineHalf, 508);
  ctx.lineTo(width / 2 + nameLineHalf, 508);
  ctx.stroke();

  // 6. Achievement Summary
  const totalSolved = data.codeQuestSolved + data.logicLabSolved;
  const totalMissions = data.codeQuestTotal + data.logicLabTotal;

  ctx.fillStyle = '#1e293b';
  ctx.font = '28px "Segoe UI", Arial, sans-serif';
  ctx.fillText(
    `For successfully completing ${totalSolved} of ${totalMissions} interactive programming missions`,
    width / 2,
    572
  );
  ctx.fillStyle = '#475569';
  ctx.font = '23px "Segoe UI", Arial, sans-serif';
  ctx.fillText(
    `CodeQuest Robot Leo (${data.codeQuestSolved}/${data.codeQuestTotal})   ·   LogicLab If/Else & Debugging (${data.logicLabSolved}/${data.logicLabTotal})`,
    width / 2,
    618
  );

  // 7. Mastered Skills Panel
  const boxX = 220;
  const boxY = 668;
  const boxW = width - 440;
  const boxH = 264;

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0c4a6e';
  ctx.font = 'bold 21px "Segoe UI", Arial, sans-serif';
  ctx.fillText('PROGRAMMING & ENGLISH CONCEPTS MASTERED', width / 2, boxY + 42);

  const skillsLeft = [
    '• Sequencing & Algorithmic Thinking (moveForward, turnRight)',
    '• Loops & Pattern Optimization (for / repeat blocks)',
    '• Real JavaScript & English Command Syntax',
  ];
  const skillsRight = [
    '• Conditional Decisions (if / else if / else branching)',
    '• Operators & Modulo Math (===, % 2 === 0)',
    '• Debugging & Fixing Broken Logic (Bug Hunter)',
  ];

  ctx.textAlign = 'left';
  ctx.fillStyle = '#334155';
  ctx.font = '22px "Segoe UI", Arial, sans-serif';
  skillsLeft.forEach((line, idx) => {
    ctx.fillText(line, boxX + 46, boxY + 98 + idx * 54);
  });
  skillsRight.forEach((line, idx) => {
    ctx.fillText(line, width / 2 + 24, boxY + 98 + idx * 54);
  });

  // 8. Gold Honor Seal + Date + Signature Footer
  const footerY = 1072;

  // Date (Left)
  const formattedDate = new Date().toLocaleDateString('en-US', {
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
  ctx.fillText(formattedDate, 380, footerY - 18);
  ctx.fillStyle = '#64748b';
  ctx.font = '18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Date Issued', 380, footerY + 32);

  // Center Gold Seal
  const sealX = width / 2;
  const sealY = footerY - 12;

  // Ribbon tails
  ctx.fillStyle = '#0c4a6e';
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

  // Scalloped gold star seal
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
  ctx.fillText('VERIFIED', sealX, sealY - 6);
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('CODER', sealX, sealY + 18);

  // Signature (Right)
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width - 540, footerY);
  ctx.lineTo(width - 220, footerY);
  ctx.stroke();

  ctx.fillStyle = '#0c4a6e';
  ctx.font = 'italic bold 26px Georgia, serif';
  ctx.fillText(data.academyName || 'LinguaCraft Academy', width - 380, footerY - 18);
  ctx.fillStyle = '#64748b';
  ctx.font = '18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Coding Program Director', width - 380, footerY + 32);

  return canvas;
}

/**
 * Packages a JPEG Uint8Array into a valid, standalone A4 Landscape PDF 1.4 Blob.
 */
function buildSinglePagePdfFromJpeg(
  jpegBytes: Uint8Array,
  imgWidth: number,
  imgHeight: number
): Blob {
  const encoder = new TextEncoder();
  const pageW = 841.89; // A4 Landscape width in points
  const pageH = 595.28; // A4 Landscape height in points

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

  // Header + binary marker
  pushStr('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Obj 1: Catalog
  offsets.push(cursor);
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages
  offsets.push(cursor);
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Obj 3: Page
  offsets.push(cursor);
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // Obj 4: Embedded JPEG Image
  offsets.push(cursor);
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr('\nendstream\nendobj\n');

  // Obj 5: Drawing Contents
  offsets.push(cursor);
  pushStr(`5 0 obj\n<< /Length ${contentsBytes.length} >>\nstream\n`);
  pushBytes(contentsBytes);
  pushStr('\nendstream\nendobj\n');

  // Cross-reference table
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

export async function downloadCodingCertificatePdf(data: CodingCertificateData): Promise<void> {
  const canvas = await renderCodingCertificateCanvas(data);
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.94);
  const base64 = jpegDataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const jpegBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    jpegBytes[i] = binary.charCodeAt(i);
  }

  const pdfBlob = buildSinglePagePdfFromJpeg(jpegBytes, canvas.width, canvas.height);
  const url = URL.createObjectURL(pdfBlob);

  const safeSlug = (data.studentName.trim() || 'Junior-Coder')
    .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const link = document.createElement('a');
  link.href = url;
  link.download = `Coding-Certificate-${safeSlug || 'Student'}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
