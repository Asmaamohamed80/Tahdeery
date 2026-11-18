import { useRef, useState } from 'react';
import { Award, Download, Sparkles, Upload } from 'lucide-react';
import type { AcademySettings, Lang, PaymentIntent } from '../types';
import { CERTIFICATE_SEAL_IMAGE } from '../data/starterCatalog';
import { t } from '../i18n';

interface CertificateStudioProps {
  lang: Lang;
  settings: AcademySettings;
  onOrderCertificate: (intent: PaymentIntent) => void;
}

type CertTheme = 'sapphire' | 'amber' | 'emerald';

interface AiCertificateResult {
  honorTitle: string;
  citationEn: string;
  citationAr: string;
  portraitFramingNote: string;
  badgeMotto: string;
}

const THEME_STYLES: Record<
  CertTheme,
  {
    nameAr: string;
    nameEn: string;
    border: string;
    accentText: string;
    ring: string;
    bg: string;
  }
> = {
  sapphire: {
    nameAr: 'التفوق الياقوتي الملكي',
    nameEn: 'Royal Sapphire Honor',
    border: 'border-sky-900',
    accentText: 'text-sky-900',
    ring: 'ring-sky-900/30',
    bg: 'bg-gradient-to-br from-slate-50 via-white to-sky-50',
  },
  amber: {
    nameAr: 'التخرج الذهبي',
    nameEn: 'Golden Graduate',
    border: 'border-amber-700',
    accentText: 'text-amber-800',
    ring: 'ring-amber-600/30',
    bg: 'bg-gradient-to-br from-amber-50/40 via-white to-stone-50',
  },
  emerald: {
    nameAr: 'نجم اللغة الإنجليزية',
    nameEn: 'Storybook Emerald Star',
    border: 'border-emerald-800',
    accentText: 'text-emerald-900',
    ring: 'ring-emerald-700/30',
    bg: 'bg-gradient-to-br from-emerald-50/30 via-white to-slate-50',
  },
};

export function CertificateStudio({
  lang,
  settings,
  onOrderCertificate,
}: CertificateStudioProps) {
  const labels = t(lang);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [studentName, setStudentName] = useState('Youssef Ahmed');
  const [grade, setGrade] = useState('Primary 4');
  const [achievement, setAchievement] = useState(
    'Outstanding performance in English reading fluency and vocabulary'
  );
  const [teacherName, setTeacherName] = useState('Ms. Laila Farag');
  const [theme, setTheme] = useState<CertTheme>('sapphire');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoMimeType, setPhotoMimeType] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState<AiCertificateResult>({
    honorTitle: 'Certificate of English Excellence',
    citationEn:
      'Presented with pride for demonstrating remarkable dedication, reading fluency, and confidence in English Language studies.',
    citationAr:
      'تُمنح هذه الشهادة تقديراً للتميز والاجتهاد الملحوظ في مهارات القراءة والتحدث باللغة الإنجليزية.',
    portraitFramingNote: 'Centered academic portrait frame with golden honor crest.',
    badgeMotto: 'Fluency & Bright Minds',
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setPhotoPreview(dataUrl);
      const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
      if (match) {
        setPhotoMimeType(match[1]);
        setPhotoBase64(match[2]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAi = async () => {
    setLoadingAi(true);
    setAiError('');
    try {
      const response = await fetch('/api/ai/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          grade,
          achievement,
          teacherName,
          theme: THEME_STYLES[theme].nameEn,
          photoBase64: photoBase64 || undefined,
          photoMimeType: photoMimeType || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'AI service unavailable');
      }
      setAiResult(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate AI citation');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleDownloadSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 980;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#fdfcf9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = theme === 'amber' ? '#b45309' : theme === 'emerald' ? '#065f46' : '#0c4a6e';
    ctx.lineWidth = 18;
    ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

    ctx.lineWidth = 3;
    ctx.strokeRect(58, 58, canvas.width - 116, canvas.height - 116);

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.font = 'bold 42px Georgia, serif';
    ctx.fillText(aiResult.honorTitle, canvas.width / 2, 165);

    ctx.fillStyle = '#475569';
    ctx.font = '24px Georgia, serif';
    ctx.fillText('THIS CERTIFICATE IS PROUDLY PRESENTED TO', canvas.width / 2, 225);

    ctx.fillStyle = theme === 'amber' ? '#92400e' : '#0c4a6e';
    ctx.font = 'bold 62px Georgia, serif';
    ctx.fillText(studentName || 'Student Name', canvas.width / 2, 320);

    ctx.fillStyle = '#334155';
    ctx.font = '26px sans-serif';
    ctx.fillText(`${grade} · ${aiResult.badgeMotto}`, canvas.width / 2, 375);

    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ');
      let line = '';
      let currY = y;
      for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth && line) {
          ctx.fillText(line.trim(), x, currY);
          line = word + ' ';
          currY += lineHeight;
        } else {
          line = testLine;
        }
      }
      if (line) ctx.fillText(line.trim(), x, currY);
    };

    ctx.fillStyle = '#1e293b';
    ctx.font = '26px Georgia, serif';
    wrapText(aiResult.citationEn, canvas.width / 2, 465, 920, 40);

    ctx.fillStyle = '#64748b';
    ctx.font = '22px sans-serif';
    ctx.fillText(`Awarded by: ${teacherName}`, canvas.width / 2, 845);

    // Watermark for free preview
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-0.32);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    ctx.font = 'bold 92px sans-serif';
    ctx.fillText('SAMPLE PREVIEW', 0, 0);
    ctx.restore();

    const finishExport = () => {
      const link = document.createElement('a');
      link.download = `Certificate_Preview_${studentName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    if (photoPreview) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 665, 95, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, canvas.width / 2 - 95, 570, 190, 190);
        ctx.restore();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 665, 95, 0, Math.PI * 2);
        ctx.stroke();
        finishExport();
      };
      img.src = photoPreview;
    } else {
      finishExport();
    }
  };

  const activeTheme = THEME_STYLES[theme];

  return (
    <section id="certificates" className="py-16 sm:py-20 border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <Award className="w-4 h-4" />
            <span>
              {lang === 'ar' ? 'شهادات التقدير بالذكاء الاصطناعي' : 'AI Appreciation Certificates'} ·{' '}
              <span className="font-mono-num">{settings.aiCertificatePriceEgp} {labels.egp}</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
            {labels.certsTitle}
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">{labels.certsLead}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Controls */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {labels.studentNameLabel}
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {labels.gradeLabel}
                </label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {labels.achievementLabel}
              </label>
              <textarea
                rows={2}
                value={achievement}
                onChange={(e) => setAchievement(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {labels.teacherOrSchoolLabel}
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {labels.certThemeLabel}
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as CertTheme)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
                >
                  {Object.entries(THEME_STYLES).map(([key, val]) => (
                    <option key={key} value={key}>
                      {lang === 'ar' ? val.nameAr : val.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {labels.uploadChildPhoto}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-dashed border-slate-300 rounded-xl hover:border-sky-900 hover:text-sky-900 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {photoPreview
                    ? lang === 'ar'
                      ? 'تم رفع صورة الطفل — اضغط للتغيير'
                      : 'Child photo loaded — Click to change'
                    : labels.uploadChildPhoto}
                </span>
              </button>
            </div>

            {aiError && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {aiError}
              </p>
            )}

            <button
              type="button"
              disabled={loadingAi}
              onClick={handleGenerateAi}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loadingAi ? labels.generating : labels.generateAiCertBtn}</span>
            </button>
          </div>

          {/* Live Certificate Preview Stage */}
          <div className="lg:col-span-7 space-y-4">
            <div
              dir="ltr"
              className={`relative rounded-2xl border-4 ${activeTheme.border} ${activeTheme.bg} p-6 sm:p-10 shadow-sm overflow-hidden`}
            >
              <div className="border border-slate-300/80 rounded-xl p-6 sm:p-8 text-center space-y-5 relative z-10">
                <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
                  <span className="font-semibold tracking-wider uppercase">{settings.academyNameEn}</span>
                  <span>{aiResult.badgeMotto}</span>
                </div>

                <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${activeTheme.accentText}`}>
                  {aiResult.honorTitle}
                </h3>

                <p className="text-xs tracking-widest uppercase text-slate-500">
                  This Certificate of Appreciation is Proudly Presented To
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
                  <div
                    className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-amber-500 ring-8 ${activeTheme.ring} bg-slate-100 flex items-center justify-center shrink-0 shadow-md`}
                  >
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt={studentName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={CERTIFICATE_SEAL_IMAGE}
                        alt="Academic Honor Crest"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="text-center sm:text-left space-y-1.5">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">{studentName || 'Student Name'}</p>
                    <p className="text-sm font-semibold text-slate-600">{grade}</p>
                    <p className="text-xs text-slate-500 max-w-xs">{aiResult.portraitFramingNote}</p>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-slate-700 max-w-xl mx-auto leading-relaxed italic">
                  “{aiResult.citationEn}”
                </p>

                {lang === 'ar' && (
                  <p dir="rtl" className="text-xs text-slate-500 max-w-xl mx-auto">
                    {aiResult.citationAr}
                  </p>
                )}

                <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{teacherName}</p>
                    <p className="text-slate-500">Instructor / Signature</p>
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-400">
                    <img
                      src={CERTIFICATE_SEAL_IMAGE}
                      alt="Official Seal"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>{labels.downloadSampleCert}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onOrderCertificate({
                    itemType: 'certificate',
                    itemTitle: `AI Appreciation Certificate — ${studentName} (${grade})`,
                    amountEgp: settings.aiCertificatePriceEgp,
                    extraNote: `Theme: ${THEME_STYLES[theme].nameEn} | Achievement: ${achievement}`,
                  })
                }
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors whitespace-nowrap"
              >
                <Award className="w-4 h-4" />
                <span>
                  {labels.orderHdCert} · {settings.aiCertificatePriceEgp} {labels.egp}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
