import { useState } from 'react';
import { Download, LogOut, Plus, Trash2, Upload, X } from 'lucide-react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  GRADES,
  type AcademySettings,
  type GradeResource,
  type Lang,
  type NewsItem,
  type OfficialPaper,
  type OrderRecord,
  type ResourceCategory,
  type StoryItem,
} from '../types';
import { STORY_COVER_1, STORY_COVER_2 } from '../data/starterCatalog';
import { t } from '../i18n';

interface AdminDashboardModalProps {
  open: boolean;
  lang: Lang;
  user: User | null;
  isAdmin: boolean;
  settings: AcademySettings;
  resources: GradeResource[];
  stories: StoryItem[];
  papers: OfficialPaper[];
  news: NewsItem[];
  orders: OrderRecord[];
  onClose: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSwitchAccount: () => void;
  onSeedStarterData: () => Promise<void>;
}

type AdminTab = 'resources' | 'stories' | 'papers' | 'news' | 'settings' | 'orders';

export function AdminDashboardModal({
  open,
  lang,
  user,
  isAdmin,
  settings,
  resources,
  stories,
  papers,
  news,
  orders,
  onClose,
  onSignIn,
  onSignOut,
  onSwitchAccount,
  onSeedStarterData,
}: AdminDashboardModalProps) {
  const labels = t(lang);
  const [tab, setTab] = useState<AdminTab>('resources');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Resource form state
  const [gradeId, setGradeId] = useState('prim4');
  const [category, setCategory] = useState<ResourceCategory>('prep');
  const [resTitleEn, setResTitleEn] = useState('');
  const [resTitleAr, setResTitleAr] = useState('');
  const [resDescEn, setResDescEn] = useState('');
  const [resDescAr, setResDescAr] = useState('');
  const [resInteractive, setResInteractive] = useState(false);
  const [resPaid, setResPaid] = useState(false);
  const [resPrice, setResPrice] = useState(50);
  const [resAllowWhiteLabel, setResAllowWhiteLabel] = useState(true);
  const [resContent, setResContent] = useState('');
  const [resFileName, setResFileName] = useState('');
  const [resFileDataUrl, setResFileDataUrl] = useState('');

  // Story form state
  const [stTitleEn, setStTitleEn] = useState('');
  const [stTitleAr, setStTitleAr] = useState('');
  const [stLevel, setStLevel] = useState('Primary 4 – 6');
  const [stSummaryEn, setStSummaryEn] = useState('');
  const [stSummaryAr, setStSummaryAr] = useState('');
  const [stPreview, setStPreview] = useState('');
  const [stCover, setStCover] = useState(STORY_COVER_1);
  const [stPrice, setStPrice] = useState(65);
  const [stFileName, setStFileName] = useState('');
  const [stFileDataUrl, setStFileDataUrl] = useState('');

  // Official paper form state
  const [opTitleEn, setOpTitleEn] = useState('');
  const [opTitleAr, setOpTitleAr] = useState('');
  const [opCatEn, setOpCatEn] = useState('Official Form');
  const [opCatAr, setOpCatAr] = useState('نموذج رسمي');
  const [opDescEn, setOpDescEn] = useState('');
  const [opDescAr, setOpDescAr] = useState('');
  const [opContent, setOpContent] = useState('');
  const [opFileName, setOpFileName] = useState('');
  const [opFileDataUrl, setOpFileDataUrl] = useState('');

  // News form state
  const [nwTitleEn, setNwTitleEn] = useState('');
  const [nwTitleAr, setNwTitleAr] = useState('');
  const [nwBodyEn, setNwBodyEn] = useState('');
  const [nwBodyAr, setNwBodyAr] = useState('');
  const [nwTagEn, setNwTagEn] = useState('Announcement');
  const [nwTagAr, setNwTagAr] = useState('إعلان');

  // Settings form state
  const [instapayHandle, setInstapayHandle] = useState(settings.instapayHandle);
  const [instapayUrl, setInstapayUrl] = useState(settings.instapayUrl || '');
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [whiteLabelPrice, setWhiteLabelPrice] = useState(settings.whiteLabelPriceEgp);
  const [certPrice, setCertPrice] = useState(settings.aiCertificatePriceEgp);

  if (!open) return null;

  const handleFileRead = (
    file: File | undefined,
    onDone: (name: string, dataUrl: string) => void
  ) => {
    if (!file) return;
    if (file.size > 400 * 1024) {
      setFeedback(
        lang === 'ar'
          ? 'حجم الملف يجب أن يكون أقل من 400 كيلوبايت للحفظ المباشر في قاعدة البيانات.'
          : 'File must be under 400KB for direct Firestore storage.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onDone(file.name, String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setFeedback('');
    try {
      await addDoc(collection(db, 'grades_resources'), {
        gradeId,
        category,
        titleEn: (resTitleEn || resTitleAr).slice(0, 160),
        titleAr: (resTitleAr || resTitleEn).slice(0, 160),
        descriptionEn: (resDescEn || resDescAr || 'English curriculum resource').slice(0, 1200),
        descriptionAr: (resDescAr || resDescEn || 'ملف تعليمي للغة الإنجليزية').slice(0, 1200),
        isInteractive: resInteractive,
        isPaid: resPaid,
        priceEgp: resPaid ? Number(resPrice) || 0 : 0,
        allowWhiteLabel: resAllowWhiteLabel,
        contentText: (resContent || resDescEn || resDescAr || 'English Resource Content').slice(0, 25000),
        ...(resFileName ? { fileName: resFileName.slice(0, 180) } : {}),
        ...(resFileDataUrl ? { fileDataUrl: resFileDataUrl.slice(0, 600000) } : {}),
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
      setResTitleEn('');
      setResTitleAr('');
      setResDescEn('');
      setResDescAr('');
      setResContent('');
      setResFileName('');
      setResFileDataUrl('');
      setFeedback(lang === 'ar' ? 'تمت إضافة العنصر بنجاح!' : 'Resource added successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'grades_resources');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDoc = async (colName: string, id: string) => {
    setBusy(true);
    try {
      await deleteDoc(doc(db, colName, id));
      setFeedback(lang === 'ar' ? 'تم الحذف نهائياً.' : 'Deleted successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${colName}/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await addDoc(collection(db, 'stories'), {
        titleEn: (stTitleEn || stTitleAr).slice(0, 160),
        titleAr: (stTitleAr || stTitleEn).slice(0, 160),
        levelLabel: stLevel.slice(0, 60),
        summaryEn: (stSummaryEn || stSummaryAr).slice(0, 1000),
        summaryAr: (stSummaryAr || stSummaryEn).slice(0, 1000),
        previewExcerpt: (stPreview || stSummaryEn || 'Chapter 1 preview...').slice(0, 2000),
        coverUrl: stCover.slice(0, 500),
        isPaid: true,
        priceEgp: Number(stPrice) || 50,
        ...(stFileName ? { fileName: stFileName.slice(0, 180) } : {}),
        ...(stFileDataUrl ? { fileDataUrl: stFileDataUrl.slice(0, 600000) } : {}),
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
      setStTitleEn('');
      setStTitleAr('');
      setStSummaryEn('');
      setStSummaryAr('');
      setStPreview('');
      setStFileName('');
      setStFileDataUrl('');
      setFeedback(lang === 'ar' ? 'تمت إضافة القصة بنجاح!' : 'Story added!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'stories');
    } finally {
      setBusy(false);
    }
  };

  const handleAddPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await addDoc(collection(db, 'official_papers'), {
        titleEn: (opTitleEn || opTitleAr).slice(0, 160),
        titleAr: (opTitleAr || opTitleEn).slice(0, 160),
        categoryEn: opCatEn.slice(0, 80),
        categoryAr: opCatAr.slice(0, 80),
        descriptionEn: (opDescEn || opDescAr).slice(0, 1000),
        descriptionAr: (opDescAr || opDescEn).slice(0, 1000),
        contentText: (opContent || opDescEn || opDescAr || 'Official School Template').slice(0, 20000),
        ...(opFileName ? { fileName: opFileName.slice(0, 180) } : {}),
        ...(opFileDataUrl ? { fileDataUrl: opFileDataUrl.slice(0, 600000) } : {}),
        isPaid: false,
        priceEgp: 0,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
      setOpTitleEn('');
      setOpTitleAr('');
      setOpDescEn('');
      setOpDescAr('');
      setOpContent('');
      setOpFileName('');
      setOpFileDataUrl('');
      setFeedback(lang === 'ar' ? 'تمت إضافة الورقة الرسمية بنجاح!' : 'Official paper added!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'official_papers');
    } finally {
      setBusy(false);
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await addDoc(collection(db, 'news'), {
        titleEn: (nwTitleEn || nwTitleAr).slice(0, 160),
        titleAr: (nwTitleAr || nwTitleEn).slice(0, 160),
        bodyEn: (nwBodyEn || nwBodyAr).slice(0, 2500),
        bodyAr: (nwBodyAr || nwBodyEn).slice(0, 2500),
        tagEn: nwTagEn.slice(0, 60),
        tagAr: nwTagAr.slice(0, 60),
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
      setNwTitleEn('');
      setNwTitleAr('');
      setNwBodyEn('');
      setNwBodyAr('');
      setFeedback(lang === 'ar' ? 'تم نشر الخبر بنجاح!' : 'News published!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'news');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        academyNameEn: settings.academyNameEn,
        academyNameAr: settings.academyNameAr,
        instapayHandle: instapayHandle.slice(0, 120),
        instapayUrl: instapayUrl.slice(0, 300),
        whatsappNumber: whatsappNumber.slice(0, 25),
        whiteLabelPriceEgp: Number(whiteLabelPrice) || 0,
        aiCertificatePriceEgp: Number(certPrice) || 0,
        seeded: true,
        updatedAt: serverTimestamp(),
      });
      setFeedback(lang === 'ar' ? 'تم حفظ إعدادات الدفع والأسعار!' : 'Payment & pricing settings saved!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    setBusy(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'confirmed' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    } finally {
      setBusy(false);
    }
  };

  const handleExportZip = async () => {
    if (!user) return;
    setBusy(true);
    setFeedback('');
    try {
      const idToken = await user.getIdToken();
      const resp = await fetch('/api/admin/export-zip', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to export ZIP');
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tahdeery-linguacraft.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setFeedback(
        lang === 'ar'
          ? 'تم تحميل ملف المشروع المضغوط (ZIP) جاهزاً للرفع على GitHub.'
          : 'Project ZIP downloaded and ready for GitHub.'
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'ZIP export failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full p-6 sm:p-8 shadow-xl max-h-[92vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{labels.adminPanelTitle}</h2>
            {user && (
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && user && (
              <button
                type="button"
                disabled={busy}
                onClick={handleExportZip}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-900 rounded-lg hover:bg-sky-800 disabled:opacity-60 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تنزيل المشروع ZIP' : 'Download Project ZIP'}</span>
              </button>
            )}
            {user && (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{labels.signOutBtn}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={labels.closeBtn}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!user || !isAdmin ? (
          <div className="py-10 text-center space-y-4">
            <p className="text-sm text-slate-600 max-w-md mx-auto">{labels.adminRestricted}</p>
            {user && (
              <p className="text-xs text-slate-500">
                {lang === 'ar' ? 'الحساب المسجل حالياً:' : 'Currently signed in as:'}{' '}
                <strong className="text-slate-800">{user.email}</strong>
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!user ? (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="px-5 py-2.5 bg-sky-900 text-white text-sm font-semibold rounded-xl hover:bg-sky-800"
                >
                  {labels.signInWithGoogle}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onSwitchAccount}
                    className="px-5 py-2.5 bg-sky-900 text-white text-sm font-semibold rounded-xl hover:bg-sky-800"
                  >
                    {lang === 'ar'
                      ? 'تبديل الحساب والدخول بحساب الأدمن'
                      : 'Switch Google Account (Sign In as Admin)'}
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200"
                  >
                    {labels.signOutBtn}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
                {(
                  [
                    ['resources', lang === 'ar' ? 'الصفوف والتحضير' : 'Grades & Preps'],
                    ['stories', lang === 'ar' ? 'القصص' : 'Stories'],
                    ['papers', lang === 'ar' ? 'الأوراق الرسمية' : 'Official Papers'],
                    ['news', lang === 'ar' ? 'الأخبار' : 'News'],
                    ['settings', lang === 'ar' ? 'إنستاباي والأسعار' : 'InstaPay & Pricing'],
                    ['orders', lang === 'ar' ? 'الطلبات' : 'Orders'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {!settings.seeded && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onSeedStarterData}
                  className="px-3.5 py-2 text-xs font-semibold bg-amber-100 text-amber-900 rounded-lg hover:bg-amber-200 transition-colors"
                >
                  {lang === 'ar' ? 'حفظ المحتوى الافتراضي للتحكم الكامل' : 'Sync Starter Catalog to Cloud'}
                </button>
              )}
            </div>

            {feedback && (
              <p className="text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
                {feedback}
              </p>
            )}

            {tab === 'resources' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form onSubmit={handleAddResource} className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    {lang === 'ar' ? 'إضافة تحضير / امتحان / نشاط' : 'Add Grade Prep, Exam, or Activity'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={gradeId}
                      onChange={(e) => setGradeId(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      {GRADES.map((g) => (
                        <option key={g.id} value={g.id}>
                          {lang === 'ar' ? g.nameAr : g.nameEn}
                        </option>
                      ))}
                    </select>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="prep">{labels.catPrep}</option>
                      <option value="exam">{labels.catExam}</option>
                      <option value="activity">{labels.catActivity}</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'العنوان بالعربية' : 'Arabic Title'}
                    value={resTitleAr}
                    onChange={(e) => setResTitleAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'العنوان بالإنجليزية' : 'English Title'}
                    value={resTitleEn}
                    onChange={(e) => setResTitleEn(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <textarea
                    rows={2}
                    placeholder={lang === 'ar' ? 'وصف مختصر بالعربية' : 'Arabic Description'}
                    value={resDescAr}
                    onChange={(e) => setResDescAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <textarea
                    rows={2}
                    placeholder={lang === 'ar' ? 'وصف بالإنجليزية أو نص التحضير' : 'English Description / Content'}
                    value={resContent}
                    onChange={(e) => {
                      setResContent(e.target.value);
                      if (!resDescEn) setResDescEn(e.target.value.slice(0, 140));
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <div className="flex flex-wrap gap-4 text-xs">
                    <label className="inline-flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={resInteractive}
                        onChange={(e) => setResInteractive(e.target.checked)}
                      />
                      <span>{lang === 'ar' ? 'تفاعلي' : 'Interactive'}</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={resPaid}
                        onChange={(e) => setResPaid(e.target.checked)}
                      />
                      <span>{lang === 'ar' ? 'مدفوع (إنستاباي)' : 'Paid'}</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={resAllowWhiteLabel}
                        onChange={(e) => setResAllowWhiteLabel(e.target.checked)}
                      />
                      <span>{lang === 'ar' ? 'يتيح نسخة بدون لوجو' : 'Allow White-Label'}</span>
                    </label>
                  </div>
                  {resPaid && (
                    <input
                      type="number"
                      min={1}
                      value={resPrice}
                      onChange={(e) => setResPrice(Number(e.target.value))}
                      placeholder="Price EGP"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">
                      {resFileName || (lang === 'ar' ? 'إرفاق ملف للتحميل (اختياري)' : 'Attach file (optional)')}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        handleFileRead(e.target.files?.[0], (n, d) => {
                          setResFileName(n);
                          setResFileDataUrl(d);
                        })
                      }
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'إضافة للمنصة' : 'Publish Resource'}</span>
                  </button>
                </form>

                <div className="lg:col-span-7 divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {resources.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {lang === 'ar' ? item.titleAr : item.titleEn}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.gradeId} · {item.category} · {item.isPaid ? `${item.priceEgp} EGP` : 'Free'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc('grades_resources', item.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                        title={lang === 'ar' ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'stories' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form onSubmit={handleAddStory} className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    {lang === 'ar' ? 'إضافة قصة إنجليزية (مدفوعة)' : 'Add Paid English Story'}
                  </h3>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'اسم القصة بالعربية' : 'Arabic Title'}
                    value={stTitleAr}
                    onChange={(e) => setStTitleAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'اسم القصة بالإنجليزية' : 'English Title'}
                    value={stTitleEn}
                    onChange={(e) => setStTitleEn(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={stLevel}
                      onChange={(e) => setStLevel(e.target.value)}
                      placeholder="Level (e.g. Primary 4)"
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <input
                      type="number"
                      value={stPrice}
                      onChange={(e) => setStPrice(Number(e.target.value))}
                      placeholder="Price EGP"
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <select
                    value={stCover}
                    onChange={(e) => setStCover(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    <option value={STORY_COVER_1}>Cover: Magical Library Balloon</option>
                    <option value={STORY_COVER_2}>Cover: Lighthouse Voyage</option>
                  </select>
                  <textarea
                    rows={2}
                    placeholder={lang === 'ar' ? 'ملخص القصة' : 'Summary'}
                    value={stSummaryAr}
                    onChange={(e) => {
                      setStSummaryAr(e.target.value);
                      setStSummaryEn(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <textarea
                    rows={2}
                    placeholder={lang === 'ar' ? 'مقتطف مجاني للقراءة' : 'Free preview excerpt'}
                    value={stPreview}
                    onChange={(e) => setStPreview(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <label className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{stFileName || (lang === 'ar' ? 'رفع ملف القصة' : 'Attach story file')}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        handleFileRead(e.target.files?.[0], (n, d) => {
                          setStFileName(n);
                          setStFileDataUrl(d);
                        })
                      }
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                  >
                    {lang === 'ar' ? 'نشر القصة' : 'Publish Story'}
                  </button>
                </form>

                <div className="lg:col-span-7 divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {stories.map((story) => (
                    <div key={story.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {lang === 'ar' ? story.titleAr : story.titleEn}
                        </p>
                        <p className="text-xs text-slate-500">
                          {story.levelLabel} · {story.priceEgp} EGP
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc('stories', story.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'papers' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form onSubmit={handleAddPaper} className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    {lang === 'ar' ? 'إضافة ورقة رسمية / نموذج' : 'Add Official Paper / Form'}
                  </h3>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'العنوان بالعربية' : 'Arabic Title'}
                    value={opTitleAr}
                    onChange={(e) => setOpTitleAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'العنوان بالإنجليزية' : 'English Title'}
                    value={opTitleEn}
                    onChange={(e) => setOpTitleEn(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={opCatAr}
                      onChange={(e) => setOpCatAr(e.target.value)}
                      placeholder="التصنيف بالعربية"
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={opCatEn}
                      onChange={(e) => setOpCatEn(e.target.value)}
                      placeholder="English Category"
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <textarea
                    rows={3}
                    placeholder={lang === 'ar' ? 'الوصف أو محتوى الورقة' : 'Description / Template text'}
                    value={opContent}
                    onChange={(e) => {
                      setOpContent(e.target.value);
                      setOpDescAr(e.target.value.slice(0, 140));
                      setOpDescEn(e.target.value.slice(0, 140));
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <label className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{opFileName || (lang === 'ar' ? 'رفع ملف (اختياري)' : 'Attach file (optional)')}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        handleFileRead(e.target.files?.[0], (n, d) => {
                          setOpFileName(n);
                          setOpFileDataUrl(d);
                        })
                      }
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                  >
                    {lang === 'ar' ? 'نشر الورقة الرسمية' : 'Publish Official Paper'}
                  </button>
                </form>

                <div className="lg:col-span-7 divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {papers.map((paper) => (
                    <div key={paper.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {lang === 'ar' ? paper.titleAr : paper.titleEn}
                        </p>
                        <p className="text-xs text-slate-500">
                          {lang === 'ar' ? paper.categoryAr : paper.categoryEn}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc('official_papers', paper.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'news' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form onSubmit={handleAddNews} className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    {lang === 'ar' ? 'نشر خبر أو إعلان جديد' : 'Publish News / Announcement'}
                  </h3>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'عنوان الخبر بالعربية' : 'Arabic Headline'}
                    value={nwTitleAr}
                    onChange={(e) => setNwTitleAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'عنوان الخبر بالإنجليزية' : 'English Headline'}
                    value={nwTitleEn}
                    onChange={(e) => setNwTitleEn(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={nwTagAr}
                      onChange={(e) => setNwTagAr(e.target.value)}
                      placeholder="التصنيف"
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={nwTagEn}
                      onChange={(e) => setNwTagEn(e.target.value)}
                      placeholder="Tag"
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder={lang === 'ar' ? 'نص الخبر بالعربية' : 'Arabic Body'}
                    value={nwBodyAr}
                    onChange={(e) => setNwBodyAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <textarea
                    rows={3}
                    required
                    placeholder={lang === 'ar' ? 'نص الخبر بالإنجليزية' : 'English Body'}
                    value={nwBodyEn}
                    onChange={(e) => setNwBodyEn(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                  >
                    {lang === 'ar' ? 'نشر الخبر' : 'Post News'}
                  </button>
                </form>

                <div className="lg:col-span-7 divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {news.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {lang === 'ar' ? item.titleAr : item.titleEn}
                        </p>
                        <p className="text-xs text-slate-500">
                          {lang === 'ar' ? item.tagAr : item.tagEn}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc('news', item.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'settings' && (
              <form onSubmit={handleSaveSettings} className="max-w-xl bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'ar' ? 'عنوان حساب إنستاباي (IPA / Handle)' : 'InstaPay Handle'}
                  </label>
                  <input
                    type="text"
                    required
                    value={instapayHandle}
                    onChange={(e) => setInstapayHandle(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رابط الدفع المباشر لإنستاباي (اختياري)' : 'InstaPay Payment Link (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={instapayUrl}
                    onChange={(e) => setInstapayUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رقم الواتساب بالصيغة الدولية (مثال: 2010...)' : 'WhatsApp Number (e.g. 2010...)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'ar' ? 'سعر النسخة المخصصة بدون لوجو (ج.م)' : 'White-Label Exam Price (EGP)'}
                    </label>
                    <input
                      type="number"
                      value={whiteLabelPrice}
                      onChange={(e) => setWhiteLabelPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'ar' ? 'سعر شهادة التقدير بالـ AI (ج.م)' : 'AI Certificate Price (EGP)'}
                    </label>
                    <input
                      type="number"
                      value={certPrice}
                      onChange={(e) => setCertPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800"
                >
                  {lang === 'ar' ? 'حفظ الإعدادات' : 'Save Payment Settings'}
                </button>
              </form>
            )}

            {tab === 'orders' && (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
                {orders.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500 text-center">
                    {lang === 'ar' ? 'لا توجد طلبات مسجلة حتى الآن.' : 'No orders logged yet.'}
                  </p>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="p-4 flex flex-wrap items-center justify-between gap-4 bg-white">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{order.itemTitle}</p>
                        <p className="text-xs text-slate-500">
                          {order.customerName} · {order.amountEgp} EGP ·{' '}
                          {order.customBrandingName ? `Brand: ${order.customBrandingName} · ` : ''}
                          {order.instapayRef ? `Ref: ${order.instapayRef} · ` : ''}
                          {order.status}
                        </p>
                      </div>
                      {order.status !== 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmOrder(order.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-600"
                        >
                          {lang === 'ar' ? 'تأكيد الاستلام' : 'Mark Confirmed'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
