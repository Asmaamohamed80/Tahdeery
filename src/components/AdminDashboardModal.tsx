import { useEffect, useState } from 'react';
import { Download, LogOut, Plus, Trash2, Upload, X } from 'lucide-react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  GRADES,
  type AcademySettings,
  type AffiliateCourse,
  type CourseTrack,
  type GradeResource,
  type Lang,
  type NewsItem,
  type OfficialPaper,
  type OrderRecord,
  type QuestionBankItem,
  type ResourceCategory,
  type StoryItem,
  type TeacherSubscription,
  type WorksheetLevel,
  type WorksheetPack,
  type WorksheetPackItem,
  type WorksheetTrack,
} from '../types';
import {
  STARTER_WORKSHEET_PACKS,
  STORY_COVER_1,
  STORY_COVER_2,
} from '../data/starterCatalog';
import { t } from '../i18n';

export type AdminTab =
  | 'resources'
  | 'packs'
  | 'quizbank'
  | 'courses'
  | 'stories'
  | 'papers'
  | 'news'
  | 'settings'
  | 'orders';

interface AdminDashboardModalProps {
  open: boolean;
  initialTab?: AdminTab;
  lang: Lang;
  user: User | null;
  isAdmin: boolean;
  settings: AcademySettings;
  resources: GradeResource[];
  packs: WorksheetPack[];
  packItems: WorksheetPackItem[];
  courses: AffiliateCourse[];
  questionBank: QuestionBankItem[];
  subscriptions: TeacherSubscription[];
  hasCloudPacks: boolean;
  hasCloudCourses: boolean;
  hasCloudQuestionBank: boolean;
  stories: StoryItem[];
  papers: OfficialPaper[];
  news: NewsItem[];
  orders: OrderRecord[];
  onClose: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSwitchAccount: () => void;
  onSeedStarterData: () => Promise<void>;
  onSeedMissingWorksheetsAndActivities?: () => Promise<void>;
  onSeedStarterPacks?: () => Promise<void>;
  onSeedCoursesAndBank?: () => Promise<void>;
}

export function AdminDashboardModal({
  open,
  initialTab = 'resources',
  lang,
  user,
  isAdmin,
  settings,
  resources,
  packs,
  packItems,
  courses,
  questionBank,
  subscriptions,
  hasCloudPacks,
  hasCloudCourses,
  hasCloudQuestionBank,
  stories,
  papers,
  news,
  orders,
  onClose,
  onSignIn,
  onSignOut,
  onSwitchAccount,
  onSeedStarterData,
  onSeedMissingWorksheetsAndActivities,
  onSeedStarterPacks,
  onSeedCoursesAndBank,
}: AdminDashboardModalProps) {
  const labels = t(lang);
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (open) {
      setTab(initialTab);
    }
  }, [open, initialTab]);

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
  const [academyNameAr, setAcademyNameAr] = useState(settings.academyNameAr);
  const [academyNameEn, setAcademyNameEn] = useState(settings.academyNameEn);
  const [logoDataUrl, setLogoDataUrl] = useState(settings.logoDataUrl || '');
  const [instapayHandle, setInstapayHandle] = useState(settings.instapayHandle);
  const [instapayUrl, setInstapayUrl] = useState(settings.instapayUrl || '');
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [whiteLabelPrice, setWhiteLabelPrice] = useState(settings.whiteLabelPriceEgp);
  const [certPrice, setCertPrice] = useState(settings.aiCertificatePriceEgp);
  const [quizTermPrice, setQuizTermPrice] = useState(settings.quizTermPriceEgp ?? 120);

  // Affiliate Course form state
  const [coTitleAr, setCoTitleAr] = useState('');
  const [coTitleEn, setCoTitleEn] = useState('');
  const [coProvider, setCoProvider] = useState('Udemy');
  const [coTrack, setCoTrack] = useState<CourseTrack>('methodology');
  const [coDuration, setCoDuration] = useState('4 Hours · Video');
  const [coDescAr, setCoDescAr] = useState('');
  const [coDescEn, setCoDescEn] = useState('');
  const [coAffiliateUrl, setCoAffiliateUrl] = useState('https://');

  // Question Bank & Teacher Subscriptions state
  const [qbGradeId, setQbGradeId] = useState('prim4');
  const [qbUnitLabel, setQbUnitLabel] = useState('Unit 1');
  const [qbPrompt, setQbPrompt] = useState('');
  const [qbOpt0, setQbOpt0] = useState('');
  const [qbOpt1, setQbOpt1] = useState('');
  const [qbOpt2, setQbOpt2] = useState('');
  const [qbOpt3, setQbOpt3] = useState('');
  const [qbCorrectIdx, setQbCorrectIdx] = useState(0);
  const [qbExplanation, setQbExplanation] = useState('');

  const [subUidInput, setSubUidInput] = useState('');
  const [subNameInput, setSubNameInput] = useState('');
  const [subEmailInput, setSubEmailInput] = useState('');
  const [subTermInput, setSubTermInput] = useState('2026 Term 1');

  // Worksheet Pack & Bulk Sheet upload form state
  const [packNumber, setPackNumber] = useState(packs.length + 1);
  const [packLevel, setPackLevel] = useState<WorksheetLevel>('age_3_5');
  const [packTrack, setPackTrack] = useState<WorksheetTrack>('arabic_letters');
  const [packTitleAr, setPackTitleAr] = useState('');
  const [packTitleEn, setPackTitleEn] = useState('');
  const [packDescAr, setPackDescAr] = useState('');
  const [packDescEn, setPackDescEn] = useState('');
  const [packPaid, setPackPaid] = useState(false);
  const [packPrice, setPackPrice] = useState(50);
  const [packAllowWhiteLabel, setPackAllowWhiteLabel] = useState(true);

  const [targetPackId, setTargetPackId] = useState(packs[0]?.id || '');
  const [sheetKind, setSheetKind] = useState<'worksheet' | 'activity'>('worksheet');
  const [sheetTitleAr, setSheetTitleAr] = useState('');
  const [sheetTitleEn, setSheetTitleEn] = useState('');
  const [sheetContent, setSheetContent] = useState('');
  const [sheetIsSample, setSheetIsSample] = useState(true);
  const [bulkFiles, setBulkFiles] = useState<{ name: string; dataUrl: string }[]>([]);

  useEffect(() => {
    setAcademyNameAr(settings.academyNameAr);
    setAcademyNameEn(settings.academyNameEn);
    setLogoDataUrl(settings.logoDataUrl || '');
    setInstapayHandle(settings.instapayHandle);
    setInstapayUrl(settings.instapayUrl || '');
    setWhatsappNumber(settings.whatsappNumber);
    setWhiteLabelPrice(settings.whiteLabelPriceEgp);
    setCertPrice(settings.aiCertificatePriceEgp);
    setQuizTermPrice(settings.quizTermPriceEgp ?? 120);
  }, [settings]);

  useEffect(() => {
    if (!targetPackId && packs.length > 0) {
      setTargetPackId(packs[0].id);
    }
    setPackNumber(
      packs.length > 0 ? Math.max(...packs.map((p) => p.packNumber)) + 1 : 1
    );
  }, [packs, targetPackId]);

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

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFeedback(
        lang === 'ar' ? 'يرجى اختيار ملف صورة (PNG أو JPG أو WebP).' : 'Please select an image file.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const rawUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        const maxW = 240;
        const maxH = 90;
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        const targetW = Math.max(1, Math.round(img.width * ratio));
        const targetH = Math.max(1, Math.round(img.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, targetW, targetH);
        let compressed = canvas.toDataURL('image/png');
        if (compressed.length > 140000) {
          compressed = canvas.toDataURL('image/jpeg', 0.85);
        }
        if (compressed.length > 149000) {
          compressed = canvas.toDataURL('image/jpeg', 0.68);
        }
        setLogoDataUrl(compressed);
        setFeedback(
          lang === 'ar'
            ? 'تم تجهيز اللوجو بنجاح! اضغط «حفظ الإعدادات» لتطبيقه على كل التحضيرات والأوراق.'
            : 'Logo ready! Click Save Settings to apply it across all downloads and sections.'
        );
      };
      img.onerror = () => {
        setFeedback(
          lang === 'ar' ? 'تعذر قراءة الصورة، جرب صورة أخرى.' : 'Could not load image file.'
        );
      };
      img.src = rawUrl;
    };
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

  const handleBulkFilesRead = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const loaded: { name: string; dataUrl: string }[] = [];
    const oversized: string[] = [];

    await Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<void>((resolve) => {
            if (file.size > 400 * 1024) {
              oversized.push(file.name);
              resolve();
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              loaded.push({ name: file.name, dataUrl: String(reader.result || '') });
              resolve();
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(file);
          })
      )
    );

    setBulkFiles(loaded);
    if (oversized.length > 0) {
      setFeedback(
        lang === 'ar'
          ? `تم استبعاد ${oversized.length} ملف لأن حجمه أكبر من 400 كيلوبايت.`
          : `Skipped ${oversized.length} file(s) over 400KB limit.`
      );
    } else if (loaded.length > 0) {
      setFeedback(
        lang === 'ar'
          ? `تم تجهيز ${loaded.length} ملف للرفع دفعة واحدة.`
          : `${loaded.length} file(s) queued for upload.`
      );
    }
  };

  const handleCreatePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setFeedback('');
    try {
      const ref = await addDoc(collection(db, 'worksheet_packs'), {
        packNumber: Math.max(1, Math.min(9999, Number(packNumber) || 1)),
        levelId: packLevel,
        track: packTrack,
        titleEn: (packTitleEn || packTitleAr).slice(0, 160),
        titleAr: (packTitleAr || packTitleEn).slice(0, 160),
        descriptionEn: (packDescEn || packDescAr || 'Numbered worksheet & activity pack').slice(0, 1200),
        descriptionAr: (packDescAr || packDescEn || 'حزمة أوراق عمل وأنشطة مرقمة').slice(0, 1200),
        isPaid: packPaid,
        priceEgp: packPaid ? Number(packPrice) || 0 : 0,
        allowWhiteLabel: packAllowWhiteLabel,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
      setTargetPackId(ref.id);
      setPackTitleAr('');
      setPackTitleEn('');
      setPackDescAr('');
      setPackDescEn('');
      setFeedback(lang === 'ar' ? 'تم إنشاء رقم المجموعة بنجاح!' : 'Numbered pack created!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'worksheet_packs');
    } finally {
      setBusy(false);
    }
  };

  const handleAddSheetsToPack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !targetPackId) return;
    setBusy(true);
    setFeedback('');
    try {
      const batch = writeBatch(db);
      // Ensure starter parent pack exists in Firestore if adding directly before manual sync
      const starterMatch = STARTER_WORKSHEET_PACKS.find((p) => p.id === targetPackId);
      if (!hasCloudPacks && starterMatch) {
        const { id, ...rest } = starterMatch;
        batch.set(doc(db, 'worksheet_packs', id), {
          ...rest,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
        });
      }

      const existingCount = packItems.filter((s) => s.packId === targetPackId).length;

      if (bulkFiles.length > 0) {
        bulkFiles.forEach((f, idx) => {
          const cleanName = f.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
          const baseTitleAr = sheetTitleAr ? `${sheetTitleAr} (${idx + 1})` : cleanName || `ورقة ${existingCount + idx + 1}`;
          const baseTitleEn = sheetTitleEn ? `${sheetTitleEn} (${idx + 1})` : cleanName || `Sheet ${existingCount + idx + 1}`;
          const sheetRef = doc(collection(db, 'worksheet_items'));
          batch.set(sheetRef, {
            packId: targetPackId,
            itemOrder: existingCount + idx + 1,
            titleEn: baseTitleEn.slice(0, 160),
            titleAr: baseTitleAr.slice(0, 160),
            kind: sheetKind,
            isFreeSample: sheetIsSample,
            contentText: (sheetContent || baseTitleEn).slice(0, 25000),
            fileName: f.name.slice(0, 180),
            fileDataUrl: f.dataUrl.slice(0, 600000),
            authorUid: user.uid,
            createdAt: serverTimestamp(),
          });
        });
      } else {
        const sheetRef = doc(collection(db, 'worksheet_items'));
        batch.set(sheetRef, {
          packId: targetPackId,
          itemOrder: existingCount + 1,
          titleEn: (sheetTitleEn || sheetTitleAr || `Sheet ${existingCount + 1}`).slice(0, 160),
          titleAr: (sheetTitleAr || sheetTitleEn || `ورقة ${existingCount + 1}`).slice(0, 160),
          kind: sheetKind,
          isFreeSample: sheetIsSample,
          contentText: (sheetContent || sheetTitleAr || sheetTitleEn || 'Worksheet').slice(0, 25000),
          authorUid: user.uid,
          createdAt: serverTimestamp(),
        });
      }

      await batch.commit();
      setSheetTitleAr('');
      setSheetTitleEn('');
      setSheetContent('');
      setBulkFiles([]);
      setFeedback(
        lang === 'ar'
          ? 'تم رفع مجموعة الأوراق وحفظها داخل الرقم المحدد!'
          : 'Sheets uploaded to the selected pack!'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'worksheet_items');
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePackAndItems = async (packId: string) => {
    setBusy(true);
    try {
      const batch = writeBatch(db);
      packItems
        .filter((s) => s.packId === packId)
        .forEach((s) => batch.delete(doc(db, 'worksheet_items', s.id)));
      batch.delete(doc(db, 'worksheet_packs', packId));
      await batch.commit();
      setFeedback(lang === 'ar' ? 'تم حذف المجموعة وكل الأوراق بداخلها.' : 'Pack and all sheets deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `worksheet_packs/${packId}`);
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
    setFeedback('');
    const cleanEn = (academyNameEn.trim() || settings.academyNameEn).slice(0, 100);
    const cleanAr = (academyNameAr.trim() || settings.academyNameAr).slice(0, 100);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        academyNameEn: cleanEn.length >= 2 ? cleanEn : 'LinguaCraft Academy',
        academyNameAr: cleanAr.length >= 2 ? cleanAr : 'أكاديمية اللغات',
        ...(logoDataUrl ? { logoDataUrl: logoDataUrl.slice(0, 150000) } : {}),
        instapayHandle: instapayHandle.slice(0, 120),
        instapayUrl: instapayUrl.slice(0, 300),
        whatsappNumber: whatsappNumber.slice(0, 25),
        whiteLabelPriceEgp: Number(whiteLabelPrice) || 0,
        aiCertificatePriceEgp: Number(certPrice) || 0,
        quizTermPriceEgp: Number(quizTermPrice) || 0,
        seeded: true,
        updatedAt: serverTimestamp(),
      });
      setFeedback(
        lang === 'ar'
          ? 'تم حفظ اللوجو وإعدادات الدفع والأسعار بنجاح!'
          : 'Logo, payment & pricing settings saved!'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmOrder = async (order: OrderRecord, activateQuizTerm = false) => {
    if (!user) return;
    setBusy(true);
    try {
      if (activateQuizTerm && order.ownerUid) {
        const batch = writeBatch(db);
        batch.update(doc(db, 'orders', order.id), { status: 'confirmed' });
        batch.set(doc(db, 'teacher_subscriptions', order.ownerUid), {
          ownerUid: order.ownerUid,
          teacherName: (order.customerName || 'Teacher').slice(0, 100),
          termLabel: 'Active Term',
          active: true,
          activatedByUid: user.uid,
          activatedAt: serverTimestamp(),
        });
        await batch.commit();
        setFeedback(
          lang === 'ar'
            ? 'تم تأكيد الطلب وتفعيل اشتراك الترم للمعلم فوراً!'
            : 'Order confirmed & Teacher Term Subscription activated!'
        );
      } else {
        await updateDoc(doc(db, 'orders', order.id), { status: 'confirmed' });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    } finally {
      setBusy(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!coAffiliateUrl.startsWith('https://')) {
      setFeedback(
        lang === 'ar'
          ? 'يجب أن يبدأ رابط الإحالة بـ https://'
          : 'Affiliate URL must start with https://'
      );
      return;
    }
    setBusy(true);
    setFeedback('');
    try {
      await addDoc(collection(db, 'affiliate_courses'), {
        titleEn: (coTitleEn || coTitleAr).slice(0, 160),
        titleAr: (coTitleAr || coTitleEn).slice(0, 160),
        provider: coProvider.trim().slice(0, 80) || 'Partner',
        track: coTrack,
        durationLabel: coDuration.trim().slice(0, 80) || 'Self-Paced',
        descriptionEn: (coDescEn || coDescAr || 'Teacher training course').slice(0, 1000),
        descriptionAr: (coDescAr || coDescEn || 'كورس تدريبي لتطوير مهارات المعلم').slice(0, 1000),
        affiliateUrl: coAffiliateUrl.trim().slice(0, 500),
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
      setCoTitleAr('');
      setCoTitleEn('');
      setCoDescAr('');
      setCoDescEn('');
      setCoAffiliateUrl('https://');
      setFeedback(lang === 'ar' ? 'تمت إضافة الكورس بنجاح!' : 'Affiliate course added!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'affiliate_courses');
    } finally {
      setBusy(false);
    }
  };

  const handleAddQuestionBankItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleanOptions = [qbOpt0.trim(), qbOpt1.trim(), qbOpt2.trim(), qbOpt3.trim()].filter(Boolean);
    if (qbPrompt.trim().length < 3 || cleanOptions.length < 2) {
      setFeedback(
        lang === 'ar' ? 'اكتب نص السؤال وخيارين على الأقل.' : 'Provide prompt and at least 2 options.'
      );
      return;
    }
    setBusy(true);
    setFeedback('');
    try {
      await addDoc(collection(db, 'question_bank'), {
        gradeId: qbGradeId,
        unitLabel: (qbUnitLabel.trim() || 'General').slice(0, 100),
        prompt: qbPrompt.trim().slice(0, 600),
        options: cleanOptions.map((o) => o.slice(0, 200)),
        correctIndex: Math.min(qbCorrectIdx, cleanOptions.length - 1),
        ...(qbExplanation.trim() ? { explanation: qbExplanation.trim().slice(0, 500) } : {}),
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
      setQbPrompt('');
      setQbOpt0('');
      setQbOpt1('');
      setQbOpt2('');
      setQbOpt3('');
      setQbCorrectIdx(0);
      setQbExplanation('');
      setFeedback(lang === 'ar' ? 'تمت إضافة السؤال إلى بنك الأسئلة!' : 'Question added to bank!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'question_bank');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subUidInput.trim()) return;
    setBusy(true);
    setFeedback('');
    const targetUid = subUidInput.trim().slice(0, 128);
    try {
      await setDoc(doc(db, 'teacher_subscriptions', targetUid), {
        ownerUid: targetUid,
        teacherName: (subNameInput.trim() || 'Subscribed Teacher').slice(0, 100),
        ...(subEmailInput.trim() ? { teacherEmail: subEmailInput.trim().slice(0, 160) } : {}),
        termLabel: (subTermInput.trim() || 'Active Term').slice(0, 80),
        active: true,
        activatedByUid: user.uid,
        activatedAt: serverTimestamp(),
      });
      setSubUidInput('');
      setSubNameInput('');
      setSubEmailInput('');
      setFeedback(lang === 'ar' ? 'تم تفعيل اشتراك المعلم للترم بنجاح!' : 'Teacher subscription activated!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `teacher_subscriptions/${targetUid}`);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleSubscription = async (sub: TeacherSubscription) => {
    if (!user) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'teacher_subscriptions', sub.id), {
        active: !sub.active,
        activatedByUid: user.uid,
        activatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teacher_subscriptions/${sub.id}`);
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
                    ['packs', lang === 'ar' ? 'مجموعات أوراق العمل' : 'Worksheet Packs'],
                    ['quizbank', lang === 'ar' ? 'بنك الأسئلة والاشتراكات' : 'Question Bank & Subs'],
                    ['courses', lang === 'ar' ? 'الكورسات (Affiliate)' : 'Affiliate Courses'],
                    ['stories', lang === 'ar' ? 'القصص' : 'Stories'],
                    ['papers', lang === 'ar' ? 'الأوراق الرسمية' : 'Official Papers'],
                    ['news', lang === 'ar' ? 'الأخبار' : 'News'],
                    ['settings', lang === 'ar' ? 'الإعدادات واللوجو والأسعار' : 'Logo, InstaPay & Pricing'],
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

              <div className="flex flex-wrap items-center gap-2">
                {!settings.seeded ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onSeedStarterData}
                    className="px-3.5 py-2 text-xs font-semibold bg-amber-100 text-amber-900 rounded-lg hover:bg-amber-200 transition-colors"
                  >
                    {lang === 'ar' ? 'حفظ المحتوى الافتراضي للتحكم الكامل' : 'Sync Starter Catalog to Cloud'}
                  </button>
                ) : (
                  <>
                    {onSeedCoursesAndBank &&
                      (!hasCloudCourses || !hasCloudQuestionBank) && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={onSeedCoursesAndBank}
                          className="px-3.5 py-2 text-xs font-semibold bg-sky-100 text-sky-900 rounded-lg hover:bg-sky-200 transition-colors"
                        >
                          {lang === 'ar'
                            ? 'استيراد الكورسات وبنك الأسئلة الافتراضي'
                            : 'Sync Starter Courses & Question Bank'}
                        </button>
                      )}
                    {onSeedMissingWorksheetsAndActivities &&
                      !resources.some((r) => r.category === 'worksheet') && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              await onSeedMissingWorksheetsAndActivities();
                              setFeedback(
                                lang === 'ar'
                                  ? 'تمت إضافة نماذج أوراق العمل والأنشطة العادية الجاهزة!'
                                  : 'Starter worksheets and printable activities added!'
                              );
                            } finally {
                              setBusy(false);
                            }
                          }}
                          className="px-3.5 py-2 text-xs font-semibold bg-emerald-100 text-emerald-900 rounded-lg hover:bg-emerald-200 transition-colors"
                        >
                          {lang === 'ar'
                            ? 'إضافة نماذج أوراق العمل والأنشطة العادية'
                            : 'Add Starter Worksheets & Printable Activities'}
                        </button>
                      )}
                  </>
                )}
              </div>
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
                    {lang === 'ar'
                      ? 'إضافة تحضير / امتحان / ورقة عمل / نشاط'
                      : 'Add Prep, Exam, Worksheet, or Activity'}
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
                      <option value="worksheet">{labels.catWorksheet}</option>
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
                  <div className="space-y-1.5">
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
                    <p className="text-[11px] text-slate-500">
                      {lang === 'ar'
                        ? 'اترك خيار "تفاعلي" غير محدد لإضافة أوراق عمل أو أنشطة صفية عادية للطباعة.'
                        : 'Leave "Interactive" unchecked for printable worksheets or regular classroom activities.'}
                    </p>
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
                          {item.gradeId} ·{' '}
                          {item.category === 'prep'
                            ? labels.catPrep
                            : item.category === 'exam'
                            ? labels.catExam
                            : item.category === 'worksheet'
                            ? labels.catWorksheet
                            : labels.catActivity}{' '}
                          · {item.isInteractive ? labels.interactiveLabel : labels.nonInteractiveLabel} ·{' '}
                          {item.isPaid ? `${item.priceEgp} ${labels.egp}` : labels.freeLabel}
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

            {tab === 'packs' && (
              <div className="space-y-6">
                {!hasCloudPacks && onSeedStarterPacks && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-amber-950 font-medium">
                      {lang === 'ar'
                        ? 'الحزم التأسيسية (01–04) معروضة حالياً كمعاينة. احفظها في السحابة لتتمكني من التعديل عليها أو رفع أوراق إضافية عليها.'
                        : 'Starter Packs (01–04) are in preview mode. Sync them to cloud to edit or add your own files.'}
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await onSeedStarterPacks();
                          setFeedback(
                            lang === 'ar'
                              ? 'تم حفظ الحزم التأسيسية (01–04) في قاعدة البيانات!'
                              : 'Starter worksheet packs synced to cloud!'
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-amber-200 text-amber-950 rounded-lg hover:bg-amber-300 whitespace-nowrap"
                    >
                      {lang === 'ar' ? 'تفعيل الحزم التأسيسية (01–04)' : 'Sync Starter Packs (01–04)'}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 space-y-6">
                    {/* Form 1: Create Numbered Pack */}
                    <form onSubmit={handleCreatePack} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        {lang === 'ar' ? '1. إنشاء رقم / حزمة أوراق عمل جديدة' : '1. Create Numbered Worksheet Pack'}
                      </h3>
                      <div className="grid grid-cols-3 gap-2.5">
                        <input
                          type="number"
                          min={1}
                          required
                          value={packNumber}
                          onChange={(e) => setPackNumber(Number(e.target.value))}
                          placeholder={lang === 'ar' ? 'الرقم' : 'No.'}
                          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono-num"
                        />
                        <select
                          value={packLevel}
                          onChange={(e) => setPackLevel(e.target.value as WorksheetLevel)}
                          className="col-span-2 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        >
                          <option value="age_3_5">{labels.packLevelAge35}</option>
                          <option value="age_5_7">{labels.packLevelAge57}</option>
                          <option value="primary">{labels.packLevelPrimary}</option>
                          <option value="prep_sec">{labels.packLevelPrepSec}</option>
                        </select>
                      </div>
                      <select
                        value={packTrack}
                        onChange={(e) => setPackTrack(e.target.value as WorksheetTrack)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="arabic_letters">{labels.packTrackArabic}</option>
                        <option value="english_letters">{labels.packTrackEnglish}</option>
                        <option value="numbers">{labels.packTrackNumbers}</option>
                        <option value="writing_skills">{labels.packTrackWriting}</option>
                        <option value="general">{labels.packTrackGeneral}</option>
                      </select>
                      <input
                        type="text"
                        required
                        placeholder={lang === 'ar' ? 'اسم الحزمة بالعربية (مثال: حروف المد والكتابة)' : 'Arabic Pack Title'}
                        value={packTitleAr}
                        onChange={(e) => setPackTitleAr(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        required
                        placeholder={lang === 'ar' ? 'اسم الحزمة بالإنجليزية' : 'English Pack Title'}
                        value={packTitleEn}
                        onChange={(e) => setPackTitleEn(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <textarea
                        rows={2}
                        placeholder={lang === 'ar' ? 'وصف مختصر للحزمة والمستوى' : 'Pack description'}
                        value={packDescAr}
                        onChange={(e) => {
                          setPackDescAr(e.target.value);
                          setPackDescEn(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <div className="flex flex-wrap gap-4 text-xs">
                        <label className="inline-flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={packPaid}
                            onChange={(e) => setPackPaid(e.target.checked)}
                          />
                          <span>{lang === 'ar' ? 'حزمة مدفوعة' : 'Paid Pack'}</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={packAllowWhiteLabel}
                            onChange={(e) => setPackAllowWhiteLabel(e.target.checked)}
                          />
                          <span>{lang === 'ar' ? 'يتيح نسخة باسم المعلم' : 'Allow White-Label'}</span>
                        </label>
                      </div>
                      {packPaid && (
                        <input
                          type="number"
                          min={1}
                          value={packPrice}
                          onChange={(e) => setPackPrice(Number(e.target.value))}
                          placeholder="Price EGP"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      )}
                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'إنشاء رقم المجموعة' : 'Create Numbered Pack'}</span>
                      </button>
                    </form>

                    {/* Form 2: Bulk Upload / Add Sheets onto a Pack Number */}
                    <form onSubmit={handleAddSheetsToPack} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        {lang === 'ar'
                          ? '2. رفع مجموعة أوراق أو أنشطة على رقم محدد'
                          : '2. Upload Multiple Sheets into a Pack'}
                      </h3>
                      <select
                        value={targetPackId}
                        onChange={(e) => setTargetPackId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        {packs
                          .slice()
                          .sort((a, b) => a.packNumber - b.packNumber)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {String(p.packNumber).padStart(2, '0')}. {lang === 'ar' ? p.titleAr : p.titleEn}
                            </option>
                          ))}
                      </select>
                      <div className="grid grid-cols-2 gap-2.5">
                        <select
                          value={sheetKind}
                          onChange={(e) => setSheetKind(e.target.value as 'worksheet' | 'activity')}
                          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        >
                          <option value="worksheet">{labels.catWorksheet}</option>
                          <option value="activity">{labels.catActivity} ({labels.nonInteractiveLabel})</option>
                        </select>
                        <label className="inline-flex items-center gap-1.5 px-2 text-xs">
                          <input
                            type="checkbox"
                            checked={sheetIsSample}
                            onChange={(e) => setSheetIsSample(e.target.checked)}
                          />
                          <span>{lang === 'ar' ? 'متاح مجاناً للمعاينة' : 'Free Preview Sheet'}</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder={
                          lang === 'ar'
                            ? 'اسم الورقة (اختياري عند رفع ملفات متعددة)'
                            : 'Sheet title (optional for bulk upload)'
                        }
                        value={sheetTitleAr}
                        onChange={(e) => {
                          setSheetTitleAr(e.target.value);
                          setSheetTitleEn(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <textarea
                        rows={2}
                        placeholder={lang === 'ar' ? 'نص التمرين (اختياري)' : 'Exercise text (optional)'}
                        value={sheetContent}
                        onChange={(e) => setSheetContent(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <label className="flex items-center gap-2 px-3 py-2.5 text-xs bg-white border border-dashed border-sky-400 rounded-lg cursor-pointer hover:bg-sky-50">
                        <Upload className="w-4 h-4 text-sky-900 shrink-0" />
                        <span className="truncate font-medium text-sky-950">
                          {bulkFiles.length > 0
                            ? lang === 'ar'
                              ? `تم اختيار ${bulkFiles.length} ملف للرفع معاً`
                              : `${bulkFiles.length} file(s) ready`
                            : lang === 'ar'
                            ? 'اختر ملف واحد أو عدة ملفات معاً (صور / PDF / HTML)'
                            : 'Select 1 or multiple files (Images / PDF / HTML)'}
                        </span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => handleBulkFilesRead(e.target.files)}
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={busy || !targetPackId}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-60"
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {bulkFiles.length > 1
                            ? lang === 'ar'
                              ? `رفع ${bulkFiles.length} ملفات على هذا الرقم`
                              : `Upload ${bulkFiles.length} Sheets`
                            : lang === 'ar'
                            ? 'إضافة للمجموعة المختارة'
                            : 'Add Sheet to Pack'}
                        </span>
                      </button>
                    </form>
                  </div>

                  {/* Right column: List of Packs & their nested sheets */}
                  <div className="lg:col-span-7 space-y-3">
                    {packs
                      .slice()
                      .sort((a, b) => a.packNumber - b.packNumber)
                      .map((pack) => {
                        const sheets = packItems
                          .filter((s) => s.packId === pack.id)
                          .sort((a, b) => a.itemOrder - b.itemOrder);
                        return (
                          <div key={pack.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            <div className="p-3.5 bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-200">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">
                                  <span className="font-mono-num text-sky-900 me-1.5">
                                    {String(pack.packNumber).padStart(2, '0')}.
                                  </span>
                                  {lang === 'ar' ? pack.titleAr : pack.titleEn}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {sheets.length} {labels.packSheetsUnit} ·{' '}
                                  {pack.isPaid ? `${pack.priceEgp} ${labels.egp}` : labels.freeLabel}
                                </p>
                              </div>
                              {hasCloudPacks && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePackAndItems(pack.id)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                                  title={lang === 'ar' ? 'حذف الحزمة بالكامل' : 'Delete pack'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {sheets.length > 0 && (
                              <div className="divide-y divide-slate-100">
                                {sheets.map((sheet) => (
                                  <div key={sheet.id} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                                    <span className="text-slate-700 truncate">
                                      <span className="font-mono-num text-slate-400 me-1.5">#{sheet.itemOrder}</span>
                                      {lang === 'ar' ? sheet.titleAr : sheet.titleEn}
                                    </span>
                                    {hasCloudPacks && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteDoc('worksheet_items', sheet.id)}
                                        className="text-rose-600 hover:text-rose-800 shrink-0"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
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
              <form onSubmit={handleSaveSettings} className="max-w-2xl bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {lang === 'ar' ? 'لوجو الموقع والاسم الرسمي' : 'Academy Logo & Brand Name'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lang === 'ar'
                          ? 'يظهر تلقائياً في شريط صغير أعلى التحضير وأوراق العمل والقصص والأنشطة والشهادات دون تداخل مع المحتوى.'
                          : 'Appears neatly in a slim top bar on preps, worksheets, stories, activities, and certificates without altering layout.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="h-16 min-w-[130px] px-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                      {logoDataUrl ? (
                        <img
                          src={logoDataUrl}
                          alt={academyNameEn}
                          className="max-h-12 w-auto object-contain"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {lang === 'ar' ? 'لا يوجد لوجو بعد' : 'No logo uploaded'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {logoDataUrl
                            ? lang === 'ar'
                              ? 'تغيير اللوجو'
                              : 'Change Logo'
                            : lang === 'ar'
                            ? 'رفع لوجو الموقع'
                            : 'Upload Site Logo'}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                          className="hidden"
                        />
                      </label>

                      {logoDataUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoDataUrl('');
                            setFeedback(
                              lang === 'ar'
                                ? 'تم مسح اللوجو من المعاينة. اضغط حفظ لتأكيد الإزالة.'
                                : 'Logo cleared. Click Save to apply.'
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'حذف اللوجو' : 'Remove'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === 'ar' ? 'اسم الأكاديمية / المنصة (بالعربي)' : 'Academy Name (Arabic)'}
                      </label>
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={100}
                        value={academyNameAr}
                        onChange={(e) => setAcademyNameAr(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === 'ar' ? 'اسم الأكاديمية / المنصة (بالإنجليزي)' : 'Academy Name (English)'}
                      </label>
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={100}
                        dir="ltr"
                        value={academyNameEn}
                        onChange={(e) => setAcademyNameEn(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'ar' ? 'سعر اشتراك الكويزات بالترم (ج.م)' : 'Quiz Term Subscription (EGP)'}
                    </label>
                    <input
                      type="number"
                      value={quizTermPrice}
                      onChange={(e) => setQuizTermPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800"
                >
                  {lang === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
                </button>
              </form>
            )}

            {tab === 'courses' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={handleAddCourse}
                  className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3"
                >
                  <h3 className="text-sm font-bold text-slate-900">
                    {lang === 'ar' ? 'إضافة كورس Affiliate مجاني التصفح' : 'Add Affiliate Course'}
                  </h3>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'اسم الكورس بالعربي' : 'Arabic Title'}
                    value={coTitleAr}
                    onChange={(e) => setCoTitleAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'اسم الكورس بالإنجليزي' : 'English Title'}
                    value={coTitleEn}
                    onChange={(e) => setCoTitleEn(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder={lang === 'ar' ? 'المنصة (Udemy / Coursera...)' : 'Provider'}
                      value={coProvider}
                      onChange={(e) => setCoProvider(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <select
                      value={coTrack}
                      onChange={(e) => setCoTrack(e.target.value as CourseTrack)}
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="phonics">{lang === 'ar' ? 'الصوتيات والتأسيس' : 'Phonics'}</option>
                      <option value="methodology">{lang === 'ar' ? 'طرق التدريس' : 'Methodology'}</option>
                      <option value="ai_teaching">{lang === 'ar' ? 'الذكاء الاصطناعي' : 'AI Teaching'}</option>
                      <option value="career">{lang === 'ar' ? 'التدريس الأونلاين' : 'Online Career'}</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'المدة أو الوصف المختصر' : 'Duration Label'}
                    value={coDuration}
                    onChange={(e) => setCoDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <textarea
                    rows={2}
                    placeholder={lang === 'ar' ? 'وصف فائدة الكورس للمدرس (عربي)' : 'Arabic Description'}
                    value={coDescAr}
                    onChange={(e) => setCoDescAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="url"
                    required
                    dir="ltr"
                    placeholder="https://affiliate-link.com/..."
                    value={coAffiliateUrl}
                    onChange={(e) => setCoAffiliateUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                  >
                    {lang === 'ar' ? 'نشر الكورس في القسم' : 'Publish Course'}
                  </button>
                </form>

                <div className="lg:col-span-7 divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden max-h-[460px] overflow-y-auto">
                  {courses.map((c) => (
                    <div key={c.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {lang === 'ar' ? c.titleAr : c.titleEn}
                        </p>
                        <p className="text-xs text-slate-500 truncate" dir="ltr">
                          {c.provider} · {c.affiliateUrl}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc('affiliate_courses', c.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'quizbank' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Add Question to Bank */}
                  <form
                    onSubmit={handleAddQuestionBankItem}
                    className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3"
                  >
                    <h3 className="text-sm font-bold text-slate-900">
                      {lang === 'ar' ? 'إضافة سؤال جديد إلى بنك الأسئلة' : 'Add Question to Bank'}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={qbGradeId}
                        onChange={(e) => setQbGradeId(e.target.value)}
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        {GRADES.map((g) => (
                          <option key={g.id} value={g.id}>
                            {lang === 'ar' ? g.nameAr : g.nameEn}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        placeholder={lang === 'ar' ? 'الوحدة / الموضوع' : 'Unit / Topic'}
                        value={qbUnitLabel}
                        onChange={(e) => setQbUnitLabel(e.target.value)}
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      dir="ltr"
                      placeholder="Question prompt..."
                      value={qbPrompt}
                      onChange={(e) => setQbPrompt(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <div className="grid grid-cols-2 gap-2" dir="ltr">
                      <input
                        type="text"
                        required
                        placeholder="Option 1"
                        value={qbOpt0}
                        onChange={(e) => setQbOpt0(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Option 2"
                        value={qbOpt1}
                        onChange={(e) => setQbOpt1(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Option 3"
                        value={qbOpt2}
                        onChange={(e) => setQbOpt2(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Option 4"
                        value={qbOpt3}
                        onChange={(e) => setQbOpt3(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={qbCorrectIdx}
                        onChange={(e) => setQbCorrectIdx(Number(e.target.value))}
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value={0}>Correct: Option 1</option>
                        <option value={1}>Correct: Option 2</option>
                        <option value={2}>Correct: Option 3</option>
                        <option value={3}>Correct: Option 4</option>
                      </select>
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="Explanation (optional)"
                        value={qbExplanation}
                        onChange={(e) => setQbExplanation(e.target.value)}
                        className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full px-4 py-2 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                    >
                      {lang === 'ar' ? 'حفظ في بنك الأسئلة' : 'Add to Question Bank'}
                    </button>
                  </form>

                  {/* Manual & List Management for Teacher Term Subscriptions */}
                  <div className="lg:col-span-6 space-y-4">
                    <form
                      onSubmit={handleSaveSubscription}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3"
                    >
                      <h3 className="text-sm font-bold text-slate-900">
                        {lang === 'ar'
                          ? 'تفعيل اشتراك الترم لمعلم يدوياً (أو من الطلبات بضغطة زر)'
                          : 'Activate Teacher Term Subscription'}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          required
                          placeholder="Teacher UID"
                          value={subUidInput}
                          onChange={(e) => setSubUidInput(e.target.value)}
                          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                        />
                        <input
                          type="text"
                          required
                          placeholder={lang === 'ar' ? 'اسم المعلم' : 'Teacher Name'}
                          value={subNameInput}
                          onChange={(e) => setSubNameInput(e.target.value)}
                          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                        <input
                          type="email"
                          placeholder={lang === 'ar' ? 'إيميل المعلم (اختياري)' : 'Teacher Email'}
                          value={subEmailInput}
                          onChange={(e) => setSubEmailInput(e.target.value)}
                          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                        <input
                          type="text"
                          required
                          placeholder="2026 Term 1"
                          value={subTermInput}
                          onChange={(e) => setSubTermInput(e.target.value)}
                          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={busy}
                        className="px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-600"
                      >
                        {lang === 'ar' ? 'تفعيل اشتراك الترم الآن' : 'Activate Term Subscription'}
                      </button>
                    </form>

                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden max-h-56 overflow-y-auto">
                      {subscriptions.length === 0 ? (
                        <p className="p-4 text-xs text-slate-500 text-center">
                          {lang === 'ar' ? 'لا يوجد معلمون مشتركين بعد.' : 'No active teacher subscriptions yet.'}
                        </p>
                      ) : (
                        subscriptions.map((sub) => (
                          <div key={sub.id} className="p-3 bg-white flex items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{sub.teacherName}</p>
                              <p className="text-slate-500 truncate">
                                {sub.termLabel} · {sub.active ? 'Active' : 'Paused'} ·{' '}
                                <span className="font-mono">{sub.ownerUid}</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleToggleSubscription(sub)}
                              className={`px-2.5 py-1 rounded font-semibold shrink-0 ${
                                sub.active
                                  ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {sub.active
                                ? lang === 'ar'
                                  ? 'إيقاف'
                                  : 'Pause'
                                : lang === 'ar'
                                ? 'تفعيل'
                                : 'Activate'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Question Bank Items List */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden max-h-72 overflow-y-auto">
                  {questionBank.map((qb) => (
                    <div key={qb.id} className="p-3.5 bg-white flex items-center justify-between gap-3">
                      <div className="min-w-0" dir="ltr">
                        <p className="text-xs font-semibold text-sky-900">
                          {qb.gradeId} · {qb.unitLabel}
                        </p>
                        <p className="text-sm font-medium text-slate-900 truncate">{qb.prompt}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc('question_bank', qb.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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
                        <div className="flex flex-wrap items-center gap-2">
                          {order.itemType === 'quiz_term' ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleConfirmOrder(order, true)}
                              className="px-3.5 py-1.5 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                            >
                              {lang === 'ar'
                                ? 'تأكيد وتفعيل اشتراك الترم للمدرس'
                                : 'Confirm & Activate Quiz Term'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleConfirmOrder(order, false)}
                              className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-600"
                            >
                              {lang === 'ar' ? 'تأكيد الاستلام' : 'Mark Confirmed'}
                            </button>
                          )}
                        </div>
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
