import { useState, type FormEvent } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  Mail,
  MessageSquare,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type { AcademySettings, Lang } from '../types';
import { t } from '../i18n';

interface AboutAndContactSectionProps {
  lang: Lang;
  settings: AcademySettings;
}

const DEFAULT_CONTACT_EMAIL = 'lailafarag210@gmail.com';
const PUBLISHER_DOMAIN = 'tahdeery.vercel.app';

type ContactTopic = 'general' | 'affiliate' | 'subscription' | 'curriculum';

export function AboutAndContactSection({ lang, settings }: AboutAndContactSectionProps) {
  const labels = t(lang);
  const academyName = lang === 'ar' ? settings.academyNameAr : settings.academyNameEn;
  const publisherEmail = (settings.contactEmail || DEFAULT_CONTACT_EMAIL).trim() || DEFAULT_CONTACT_EMAIL;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<ContactTopic>('general');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const cleanWhatsapp = (settings.whatsappNumber || '+201000000000').replace(/[^0-9]/g, '');

  const topicLabels: Record<ContactTopic, { ar: string; en: string }> = {
    general: { ar: 'استفسار عام أو دعم فني', en: 'General Support & Inquiries' },
    affiliate: {
      ar: 'الشراكات التعليمية وبرامج التسويق (Affiliate)',
      en: 'Educational Partnerships & Affiliate Programs',
    },
    subscription: {
      ar: 'اشتراكات المعلمين والمدارس',
      en: 'Teacher & School Subscriptions',
    },
    curriculum: {
      ar: 'المناهج والأوراق التعليمية',
      en: 'Curriculum & Teaching Resources',
    },
  };

  const buildMailtoHref = () => {
    const subject = encodeURIComponent(
      `[${academyName}] ${lang === 'ar' ? topicLabels[topic].ar : topicLabels[topic].en}`
    );
    const body = encodeURIComponent(
      `${lang === 'ar' ? 'الاسم' : 'Name'}: ${name.trim() || '-'}\n` +
        `${lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}: ${email.trim() || '-'}\n` +
        `${lang === 'ar' ? 'الموضوع' : 'Topic'}: ${
          lang === 'ar' ? topicLabels[topic].ar : topicLabels[topic].en
        }\n\n` +
        `${message.trim()}`
    );
    return `mailto:${publisherEmail}?subject=${subject}&body=${body}`;
  };

  const buildWhatsappHref = () => {
    const text = encodeURIComponent(
      `مرحباً ${academyName}،\n` +
        `الاسم: ${name.trim() || '-'}\n` +
        `البريد: ${email.trim() || '-'}\n` +
        `الموضوع: ${topicLabels[topic].ar}\n` +
        `الرسالة: ${message.trim()}`
    );
    return `https://wa.me/${cleanWhatsapp}?text=${text}`;
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(publisherEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    } catch {
      setCopiedEmail(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى كتابة الاسم بشكل صحيح.'
          : 'Please enter your full name.'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال بريد إلكتروني صحيح للتواصل.'
          : 'Please enter a valid email address.'
      );
      return;
    }

    if (!trimmedMessage || trimmedMessage.length < 8) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى كتابة تفاصيل الرسالة (8 أحرف على الأقل).'
          : 'Please include a short message (at least 8 characters).'
      );
      return;
    }

    setErrorMsg('');
    setSubmitted(true);
    window.location.href = buildMailtoHref();
  };

  return (
    <>
      {/* About Us Section */}
      <section id="about" className="py-16 sm:py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2.5">
                <p className="text-xs font-semibold tracking-wide text-sky-900 uppercase">
                  {lang === 'ar' ? 'عن المنصة والأكاديمية' : 'About Our Educational Platform'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance leading-tight">
                  {lang === 'ar'
                    ? `${academyName} — منصة تعليمية متكاملة لمعلمي اللغة الإنجليزية والطلاب`
                    : `${academyName} — Bilingual ESL Teaching & Learning Hub`}
                </h2>
              </div>

              <p className="text-base text-slate-600 leading-relaxed">
                {lang === 'ar'
                  ? 'أكاديمية لينجوا كرافت هي بوابة تعليمية مستقلة متخصصة في خدمة معلمي اللغة الإنجليزية وأولياء الأمور والطلاب في المراحل التأسيسية والابتدائية والإعدادية والثانوية. نوفر تحضيرات الدروس الإلكترونية، حزم أوراق العمل المرقّمة للتأسيس، بنوك الأسئلة والكويزات التفاعلية، القصص الإنجليزية المصورة، والألعاب التعليمية وتطوير المهارات.'
                  : 'LinguaCraft Academy is an educator-led bilingual EdTech portal serving English language teachers, schools, parents, and K-12 learners. We publish structured electronic lesson preparations, numbered foundation worksheet packs, interactive quiz studios, illustrated graded stories, and curated professional development recommendations.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <BookOpen className="w-4 h-4 text-sky-900 shrink-0" />
                    <span>
                      {lang === 'ar' ? 'محتوى تربوي ومنهجي موثوق' : 'Structured Curriculum Focus'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lang === 'ar'
                      ? 'إعداد وإشراف تربوي متخصص لتبسيط تدريس اللغة الإنجليزية، الصوتيات، وتنمية التفكير الإبداعي والمنطقي للأطفال.'
                      : 'Designed by experienced ESL educators to streamline lesson planning, early phonics instruction, and interactive student practice.'}
                  </p>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? 'الشفافية والشراكات التعليمية'
                        : 'Editorial & Affiliate Transparency'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lang === 'ar'
                      ? 'نرشح للمعلمين كورسات وأدوات تدريبية عالمية مختارة بعناية؛ قد تحصل المنصة على عمولة شريك دون أي تكلفة إضافية على المستخدم.'
                      : 'We review and recommend teacher training courses and EdTech platforms; select partner links may earn an affiliate commission at zero extra cost to users.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'ar' ? 'بطاقة التعريف والنشر الرسمية' : 'Official Publisher Profile'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'بيانات المنصة المعتمدة للتواصل والشراكات التعليمية'
                    : 'Verified platform identity for educators, partners, and affiliate networks'}
                </p>
              </div>

              <dl className="divide-y divide-slate-200 text-sm">
                <div className="py-3 flex items-center justify-between gap-4">
                  <dt className="text-slate-500">
                    {lang === 'ar' ? 'اسم المنصة' : 'Platform Name'}
                  </dt>
                  <dd className="font-semibold text-slate-900 text-end">{academyName}</dd>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <dt className="text-slate-500">
                    {lang === 'ar' ? 'التخصص' : 'Primary Vertical'}
                  </dt>
                  <dd className="font-semibold text-slate-900 text-end">
                    {lang === 'ar'
                      ? 'التعليم وتطوير مهارات اللغة الإنجليزية'
                      : 'Education, ESL Curriculum & EdTech'}
                  </dd>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <dt className="text-slate-500">
                    {lang === 'ar' ? 'الإدارة والتحرير' : 'Founder & Lead Educator'}
                  </dt>
                  <dd className="font-semibold text-slate-900 text-end">
                    {lang === 'ar' ? 'أ. ليلى فرج' : 'Laila Farag'}
                  </dd>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <dt className="text-slate-500">
                    {lang === 'ar' ? 'الموقع الرسمي' : 'Official Website'}
                  </dt>
                  <dd className="font-mono-num font-semibold text-sky-900 text-end">
                    {PUBLISHER_DOMAIN}
                  </dd>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <dt className="text-slate-500">
                    {lang === 'ar' ? 'البريد الرسمي' : 'Official Email'}
                  </dt>
                  <dd className="font-mono-num font-semibold text-slate-900 text-end">
                    <a
                      href={`mailto:${publisherEmail}`}
                      className="text-sky-900 hover:underline underline-offset-4"
                    >
                      {publisherEmail}
                    </a>
                  </dd>
                </div>
              </dl>

              <p
                id="affiliate-disclosure"
                className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-200"
              >
                <strong className="text-slate-900">
                  {lang === 'ar' ? 'إفصاح الشراكة (Affiliate Disclosure): ' : 'Affiliate Disclosure: '}
                </strong>
                {lang === 'ar'
                  ? 'تشارك الأكاديمية في برامج تسويق بالعمولة تعليمية (بما في ذلك شبكة Impact وغيرها من منصات الكورسات العالمية). عند التسجيل عبر الروابط الموصى بها في قسم الكورسات، قد نحصل على عمولة دعم لاستمرار المحتوى المجاني دون تحميلك أي رسوم إضافية.'
                  : 'LinguaCraft Academy participates in educational affiliate marketing programs (including Impact.com partner programs and course marketplaces). When you enroll through partner links in our Courses section, we may earn a commission at no extra cost to you, helping keep free lesson plans and student tools accessible.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl space-y-2.5">
            <p className="text-xs font-semibold tracking-wide text-sky-900 uppercase">
              {lang === 'ar' ? 'تواصل معنا مباشرة' : 'Contact & Partnerships'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              {lang === 'ar'
                ? 'تواصل مع إدارة الأكاديمية للدعم أو الشراكات التعليمية'
                : 'Get in Touch for Support, Schools & Affiliate Partnerships'}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {lang === 'ar'
                ? 'للاستفسار عن المناهج، اشتراكات الترم للمعلمين، طلب النسخ المخصصة للمدارس والسناتر، أو التعاون التجاري والشراكات عبر البريد الإلكتروني أو الواتساب.'
                : 'Reach our team directly regarding curriculum licensing, teacher term subscriptions, partner programs, or general educational support.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Direct Contact Channels */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-sky-900" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      {lang === 'ar'
                        ? 'البريد الإلكتروني الرسمي والشراكات'
                        : 'Official & Partnership Email'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === 'ar'
                        ? 'مناسب للتعاون المؤسسي وشبكات التسويق (Impact) والدعم'
                        : 'For affiliate networks, media, and institutional inquiries'}
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <a
                        href={`mailto:${publisherEmail}`}
                        className="font-mono-num text-sm font-semibold text-sky-900 hover:underline underline-offset-4 break-all"
                      >
                        {publisherEmail}
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                      >
                        {copiedEmail ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{labels.copied}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? 'نسخ' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      {lang === 'ar' ? 'دعم المعلمين والطلاب عبر واتساب' : 'WhatsApp Support Desk'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === 'ar'
                        ? 'لتأكيد الطلبات، أكواد التفعيل، والملفات المخصصة'
                        : 'For activation codes, custom school editions, and quick help'}
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-3">
                      <span
                        dir="ltr"
                        className="font-mono-num text-sm font-semibold text-slate-900"
                      >
                        {settings.whatsappNumber}
                      </span>
                      <a
                        href={`https://wa.me/${cleanWhatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap"
                      >
                        <span>{lang === 'ar' ? 'مراسلة واتساب' : 'Chat on WhatsApp'}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Globe className="w-4 h-4 text-sky-900" />
                  <span>{lang === 'ar' ? 'مواعيد الرد والتغطية' : 'Response Hours & Coverage'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'ar'
                    ? 'نستقبل رسائل المعلمين وأولياء الأمور والشركاء طوال الأسبوع باللغتين العربية والإنجليزية، ويتم الرد عادةً خلال 24 ساعة.'
                    : 'We respond to educators, parents, and affiliate partners in both English and Arabic within 24 business hours.'}
                </p>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'ar' ? 'أرسل رسالة مباشرة' : 'Send Us a Direct Message'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'املأ البيانات وسيتم تجهيز رسالتك للإرسال عبر البريد الإلكتروني أو واتساب فوراً.'
                    : 'Fill out the form below to send your inquiry directly via email or WhatsApp.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-700">
                    {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: أ. سارة محمود' : 'e.g., Sarah Ahmed'}
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-900/20 focus:border-sky-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-700">
                    {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-900/20 focus:border-sky-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-topic" className="block text-xs font-semibold text-slate-700">
                  {lang === 'ar' ? 'نوع الاستفسار' : 'Inquiry Topic'}
                </label>
                <select
                  id="contact-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as ContactTopic)}
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-900/20 focus:border-sky-900"
                >
                  {(Object.keys(topicLabels) as ContactTopic[]).map((key) => (
                    <option key={key} value={key}>
                      {lang === 'ar' ? topicLabels[key].ar : topicLabels[key].en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-700">
                  {lang === 'ar' ? 'الرسالة' : 'Message'}
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'اكتب تفاصيل استفسارك أو طلب الشراكة هنا...'
                      : 'Write your message, question, or partnership inquiry here...'
                  }
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-900/20 focus:border-sky-900 resize-y"
                />
              </div>

              {errorMsg && (
                <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                  {errorMsg}
                </p>
              )}

              {submitted && !errorMsg && (
                <div className="flex items-start gap-2.5 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    {lang === 'ar'
                      ? `تم تجهيز رسالتك للإرسال إلى ${publisherEmail}. يمكنك أيضاً المتابعة مباشرة عبر زر الواتساب.`
                      : `Your message is ready to send to ${publisherEmail}. You can also reach us directly via WhatsApp below.`}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إرسال عبر البريد الإلكتروني' : 'Send via Email'}</span>
                </button>

                <a
                  href={buildWhatsappHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  <span>{lang === 'ar' ? 'إرسال عبر واتساب' : 'Send via WhatsApp'}</span>
                </a>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
