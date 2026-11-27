import { useState } from 'react';
import { Check, CheckCircle2, Copy, ExternalLink, KeyRound, MessageCircle, X } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { AcademySettings, Lang, PaymentIntent } from '../types';
import { redeemActivationCode, type UnlockedState } from '../utils/analyticsAndUnlock';
import { t } from '../i18n';

interface PaymentModalProps {
  intent: PaymentIntent | null;
  settings: AcademySettings;
  lang: Lang;
  user: User | null;
  onUnlockedSuccess?: (nextState: UnlockedState) => void;
  onClose: () => void;
}

export function PaymentModal({
  intent,
  settings,
  lang,
  user,
  onUnlockedSuccess,
  onClose,
}: PaymentModalProps) {
  const labels = t(lang);
  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customBrandingName, setCustomBrandingName] = useState(intent?.defaultBrandingName || '');
  const [instapayRef, setInstapayRef] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [codeInput, setCodeInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemFeedback, setRedeemFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  if (!intent) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(settings.instapayHandle);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setRedeeming(true);
    setRedeemFeedback(null);
    const res = await redeemActivationCode(codeInput, lang);
    setRedeeming(false);
    setRedeemFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.unlockedState) {
      onUnlockedSuccess?.(res.unlockedState);
      setCodeInput('');
    }
  };

  const buildWhatsappUrl = () => {
    const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const lines = [
      lang === 'ar' ? 'مرحباً، أرغب في تأكيد الدفع عبر إنستاباي:' : 'Hello, I would like to confirm an InstaPay payment:',
      `• ${lang === 'ar' ? 'العنصر' : 'Item'}: ${intent.itemTitle}`,
      `• ${lang === 'ar' ? 'المبلغ' : 'Amount'}: ${intent.amountEgp} EGP`,
      customerName ? `• ${lang === 'ar' ? 'الاسم' : 'Name'}: ${customerName}` : '',
      intent.allowCustomBranding && customBrandingName
        ? `• ${lang === 'ar' ? 'الاسم/السنتر المطلوب بدلاً من اللوجو' : 'Custom Branding Name'}: ${customBrandingName}`
        : '',
      instapayRef ? `• ${lang === 'ar' ? 'مرجع إنستاباي' : 'InstaPay Ref'}: ${instapayRef}` : '',
      intent.extraNote ? `• ${intent.extraNote}` : '',
    ].filter(Boolean);

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const handleProceedWhatsapp = async () => {
    setSubmitting(true);
    try {
      if (user && user.emailVerified) {
        try {
          await addDoc(collection(db, 'orders'), {
            itemType: intent.itemType,
            itemTitle: intent.itemTitle.slice(0, 180),
            amountEgp: Number(intent.amountEgp) || 0,
            customerName: (customerName || user.displayName || 'Customer').slice(0, 100),
            ...(customBrandingName ? { customBrandingName: customBrandingName.slice(0, 120) } : {}),
            ...(instapayRef ? { instapayRef: instapayRef.slice(0, 120) } : {}),
            status: 'pending_whatsapp',
            ownerUid: user.uid,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'orders');
        }
      }
      const waUrl = buildWhatsappUrl();
      window.location.assign(waUrl);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{labels.paymentModalTitle}</h3>
            <p className="text-sm text-slate-600 mt-1">{intent.itemTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.closeBtn}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">
            {lang === 'ar' ? 'الإجمالي المطلوب' : 'Total Amount'}
          </span>
          <span className="text-2xl font-bold text-sky-900 font-mono-num">
            {intent.amountEgp} {labels.egp}
          </span>
        </div>

        {/* Instant Activation Code Box */}
        <form
          onSubmit={handleRedeemCode}
          className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2.5"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
            <KeyRound className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              {lang === 'ar'
                ? 'معك كود تفعيل من الإدارة؟ افتح الملف فوراً:'
                : 'Have an Activation Code? Unlock immediately:'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              dir="ltr"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="LC-XXXX-XXXX"
              className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <button
              type="submit"
              disabled={redeeming || !codeInput.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-600 disabled:opacity-60 whitespace-nowrap"
            >
              {redeeming
                ? lang === 'ar'
                  ? 'جاري التحقق...'
                  : 'Checking...'
                : lang === 'ar'
                ? 'تفعيل الكود'
                : 'Unlock Now'}
            </button>
          </div>
          {redeemFeedback && (
            <div
              className={`flex items-center justify-between gap-2 text-xs font-medium px-3 py-2 rounded-lg ${
                redeemFeedback.ok
                  ? 'bg-white text-emerald-900 border border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {redeemFeedback.ok && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                <span>{redeemFeedback.text}</span>
              </span>
              {redeemFeedback.ok && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-700 text-white rounded hover:bg-emerald-600 shrink-0"
                >
                  {lang === 'ar' ? 'ابدأ التحميل' : 'Go Download'}
                </button>
              )}
            </div>
          )}
        </form>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">{labels.paymentStep1}</p>
          <div className="flex flex-wrap items-center justify-between gap-3 bg-sky-50/70 border border-sky-200 rounded-xl p-4">
            <span className="font-mono text-sm sm:text-base font-semibold text-sky-950 break-all">
              {settings.instapayHandle}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-sky-200 text-sky-900 rounded-lg hover:bg-sky-100 transition-colors whitespace-nowrap"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? labels.copied : labels.copyInstapay}</span>
              </button>
              {settings.instapayUrl && (
                <a
                  href={settings.instapayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{labels.openInstapayLink}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {labels.customerNameField}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={lang === 'ar' ? 'أ. ليلى فرج / مس سارة' : 'e.g. Ms. Laila Farag'}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
            />
          </div>

          {intent.allowCustomBranding && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {labels.customBrandField}
              </label>
              <input
                type="text"
                value={customBrandingName}
                onChange={(e) => setCustomBrandingName(e.target.value)}
                placeholder={lang === 'ar' ? 'اسم المعلم أو السنتر' : 'Teacher or Center Name'}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {labels.instapayRefField}
            </label>
            <input
              type="text"
              value={instapayRef}
              onChange={(e) => setInstapayRef(e.target.value)}
              placeholder="IPA / Reference #1234"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
            />
          </div>
        </div>

        <div className="pt-2 space-y-3 border-t border-slate-200">
          <p className="text-xs text-slate-600">{labels.paymentStep2}</p>
          <button
            type="button"
            disabled={submitting}
            onClick={handleProceedWhatsapp}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{labels.confirmWhatsappBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
