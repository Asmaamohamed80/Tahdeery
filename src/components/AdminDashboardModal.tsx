import { useEffect, useState } from 'react';
import {
  BarChart3,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  ImagePlus,
  KeyRound,
  Link2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
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
  type ActivationCode,
  type AffiliateCourse,
  type AnalyticsEvent,
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
import {
  chunkRawText,
  parseStructuredMcqsLocally,
  splitPdfIntoBase64Chunks,
  type PdfChunkPayload,
} from '../utils/questionBankImporter';
import { generateRandomActivationCode, getRemainingDays } from '../utils/analyticsAndUnlock';
import { t } from '../i18n';

export type AdminTab =
  | 'resources'
  | 'packs'
  | 'quizbank'
  | 'courses'
  | 'stories'
  | 'papers'
  | 'news'
  | 'codes'
  | 'analytics'
  | 'links'
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
  activationCodes: ActivationCode[];
  analyticsEvents: AnalyticsEvent[];
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
  onSeedMissingPapers?: () => Promise<void>;
  onStarterItemDeleted?: (id: string) => void;
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
  activationCodes,
  analyticsEvents,
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
  onSeedMissingPapers,
  onStarterItemDeleted,
}: AdminDashboardModalProps) {
  const labels = t(lang);
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [copiedKey, setCopiedKey] = useState<string>('');

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
  const [resExternalUrl, setResExternalUrl] = useState('');

  // Story form state
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [editingStoryAuthorUid, setEditingStoryAuthorUid] = useState<string>('');
  const [stTitleEn, setStTitleEn] = useState('');
  const [stTitleAr, setStTitleAr] = useState('');
  const [stLevel, setStLevel] = useState('Primary 4 – 6');
  const [stSummaryEn, setStSummaryEn] = useState('');
  const [stSummaryAr, setStSummaryAr] = useState('');
  const [stPreview, setStPreview] = useState('');
  const [stCover, setStCover] = useState(STORY_COVER_1);
  const [stPaid, setStPaid] = useState(true);
  const [stPrice, setStPrice] = useState(65);
  const [stFileName, setStFileName] = useState('');
  const [stFileDataUrl, setStFileDataUrl] = useState('');
  const [stExternalUrl, setStExternalUrl] = useState('');

  // Official paper & book form state
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [editingPaperAuthorUid, setEditingPaperAuthorUid] = useState<string>('');
  const [opTitleEn, setOpTitleEn] = useState('');
  const [opTitleAr, setOpTitleAr] = useState('');
  const [opCatEn, setOpCatEn] = useState('Official Form');
  const [opCatAr, setOpCatAr] = useState('نموذج رسمي');
  const [opDescEn, setOpDescEn] = useState('');
  const [opDescAr, setOpDescAr] = useState('');
  const [opContent, setOpContent] = useState('');
  const [opCoverUrl, setOpCoverUrl] = useState('');
  const [opPaid, setOpPaid] = useState(false);
  const [opPrice, setOpPrice] = useState(50);
  const [opFileName, setOpFileName] = useState('');
  const [opFileDataUrl, setOpFileDataUrl] = useState('');
  const [opExternalUrl, setOpExternalUrl] = useState('');

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
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || 'lailafarag210@gmail.com');
  const [whiteLabelPrice, setWhiteLabelPrice] = useState(settings.whiteLabelPriceEgp);
  const [certPrice, setCertPrice] = useState(settings.aiCertificatePriceEgp);
  const [quizTermPrice, setQuizTermPrice] = useState(settings.quizTermPriceEgp ?? 120);
  const [termPromoEnabled, setTermPromoEnabled] = useState(settings.termPromoEnabled !== false);
  const [termPromoDurationDays, setTermPromoDurationDays] = useState(
    settings.termPromoDurationDays ?? 120
  );
  const [termPromoTitleAr, setTermPromoTitleAr] = useState(
    settings.termPromoTitleAr || 'عرض الترم الكامل — افتحي بنك الأسئلة والاختبارات التفاعلية'
  );
  const [termPromoTitleEn, setTermPromoTitleEn] = useState(
    settings.termPromoTitleEn || 'Full Term Pass — Unlock Question Bank & Live Quizzes'
  );
  const [termPromoSubtitleAr, setTermPromoSubtitleAr] = useState(
    settings.termPromoSubtitleAr ||
      'اشتراك مرة واحدة طوال الترم يفتح كل اختبارات الطلاب وتصحيحهم التلقائي ثم يقفل تلقائياً بنهاية المدة.'
  );
  const [termPromoSubtitleEn, setTermPromoSubtitleEn] = useState(
    settings.termPromoSubtitleEn ||
      'One term payment unlocks unlimited live student quizzes and auto-locks automatically when the term ends.'
  );

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

  const [importPdfName, setImportPdfName] = useState('');
  const [importPdfChunks, setImportPdfChunks] = useState<PdfChunkPayload[]>([]);
  const [importPdfTotalPages, setImportPdfTotalPages] = useState(0);
  const [importPdfSizeMb, setImportPdfSizeMb] = useState('');
  const [importPreparing, setImportPreparing] = useState(false);
  const [importRawText, setImportRawText] = useState('');
  const [extractingBank, setExtractingBank] = useState(false);
  const [extractProgress, setExtractProgress] = useState('');
  const [extractedPreview, setExtractedPreview] = useState<
    Array<{
      unitLabel: string;
      prompt: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
    }>
  >([]);

  const [previewFile, setPreviewFile] = useState<{
    title: string;
    fileName?: string;
    fileDataUrl?: string;
    externalUrl?: string;
    contentText?: string;
  } | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');

  const [subUidInput, setSubUidInput] = useState('');
  const [subNameInput, setSubNameInput] = useState('');
  const [subEmailInput, setSubEmailInput] = useState('');
  const [subTermInput, setSubTermInput] = useState('2026 Term 1');
  const [subDurationDays, setSubDurationDays] = useState(settings.termPromoDurationDays ?? 120);

  // Activation codes form state
  const [codeTargetSelection, setCodeTargetSelection] = useState('all_paid:all');
  const [codeMaxUses, setCodeMaxUses] = useState(1);
  const [codeDurationDays, setCodeDurationDays] = useState(0);
  const [codeNote, setCodeNote] = useState('');
  const [lastCreatedCode, setLastCreatedCode] = useState('');
  const [lastCreatedCodeDurationDays, setLastCreatedCodeDurationDays] = useState(0);

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
  const [sheetExternalUrl, setSheetExternalUrl] = useState('');
  const [bulkFiles, setBulkFiles] = useState<{ name: string; dataUrl: string }[]>([]);

  useEffect(() => {
    setAcademyNameAr(settings.academyNameAr);
    setAcademyNameEn(settings.academyNameEn);
    setLogoDataUrl(settings.logoDataUrl || '');
    setInstapayHandle(settings.instapayHandle);
    setInstapayUrl(settings.instapayUrl || '');
    setWhatsappNumber(settings.whatsappNumber);
    setContactEmail(settings.contactEmail || 'lailafarag210@gmail.com');
    setWhiteLabelPrice(settings.whiteLabelPriceEgp);
    setCertPrice(settings.aiCertificatePriceEgp);
    setQuizTermPrice(settings.quizTermPriceEgp ?? 120);
    setTermPromoEnabled(settings.termPromoEnabled !== false);
    setTermPromoDurationDays(settings.termPromoDurationDays ?? 120);
    setTermPromoTitleAr(
      settings.termPromoTitleAr || 'عرض الترم الكامل — افتحي بنك الأسئلة والاختبارات التفاعلية'
    );
    setTermPromoTitleEn(
      settings.termPromoTitleEn || 'Full Term Pass — Unlock Question Bank & Live Quizzes'
    );
    setTermPromoSubtitleAr(
      settings.termPromoSubtitleAr ||
        'اشتراك مرة واحدة طوال الترم يفتح كل اختبارات الطلاب وتصحيحهم التلقائي ثم يقفل تلقائياً بنهاية المدة.'
    );
    setTermPromoSubtitleEn(
      settings.termPromoSubtitleEn ||
        'One term payment unlocks unlimited live student quizzes and auto-locks automatically when the term ends.'
    );
    setSubDurationDays(settings.termPromoDurationDays ?? 120);
  }, [settings]);

  useEffect(() => {
    if (!targetPackId && packs.length > 0) {
      setTargetPackId(packs[0].id);
    }
    setPackNumber(
      packs.length > 0 ? Math.max(...packs.map((p) => p.packNumber)) + 1 : 1
    );
  }, [packs, targetPackId]);

  useEffect(() => {
    if (!previewFile?.fileDataUrl || previewFile.fileDataUrl.startsWith('data:image/')) {
      setPreviewBlobUrl('');
      return;
    }
    try {
      const dataUrl = previewFile.fileDataUrl;
      const commaIdx = dataUrl.indexOf(',');
      if (commaIdx === -1) {
        setPreviewBlobUrl('');
        return;
      }
      const header = dataUrl.slice(0, commaIdx);
      const base64 = dataUrl.slice(commaIdx + 1);
      const mimeMatch = header.match(/data:([^;]+)/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch {
      setPreviewBlobUrl('');
    }
  }, [previewFile]);

  if (!open) return null;

  const formatDataUrlKb = (dataUrl: string): string => {
    if (!dataUrl) return '';
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const kb = Math.max(1, Math.round((base64.length * 0.75) / 1024));
    return `${kb} KB`;
  };

  const MAX_DIRECT_FILE_BYTES = 650 * 1024;

  const validateHttpsExternalUrl = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (!trimmed.startsWith('https://') || trimmed.length < 8 || trimmed.length > 500) {
      setFeedback(
        lang === 'ar'
          ? 'رابط Google Drive أو الملف الخارجي يجب أن يبدأ بـ https:// وألا يتعدى 500 حرف.'
          : 'External link must start with https:// and be under 500 characters.'
      );
      return null;
    }
    return trimmed;
  };

  const handleFileRead = (
    file: File | undefined,
    onDone: (name: string, dataUrl: string) => void
  ) => {
    if (!file) return;
    if (file.size > MAX_DIRECT_FILE_BYTES) {
      setFeedback(
        lang === 'ar'
          ? 'حجم الملف أكبر من 650 كيلوبايت (حد الرفع المباشر). ارفعيه على Google Drive وضعي رابطه في الخانة أسفل الزر ليظهر للمدرسين بشكل عادي!'
          : 'File exceeds 650KB direct-storage limit. Upload it to Google Drive and paste the share link below!'
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

  const handleStoryCoverUpload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFeedback(
        lang === 'ar'
          ? 'يرجى اختيار ملف صورة لغلاف القصة (JPG أو PNG أو WebP).'
          : 'Please select an image file (JPG, PNG, or WebP) for the story cover.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const rawUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        const maxW = 640;
        const maxH = 480;
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        const targetW = Math.max(1, Math.round(img.width * ratio));
        const targetH = Math.max(1, Math.round(img.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        let compressed = canvas.toDataURL('image/jpeg', 0.84);
        if (compressed.length > 115000) {
          compressed = canvas.toDataURL('image/jpeg', 0.7);
        }
        if (compressed.length > 115000) {
          compressed = canvas.toDataURL('image/jpeg', 0.56);
        }
        if (compressed.length > 115000) {
          compressed = canvas.toDataURL('image/jpeg', 0.42);
        }
        setStCover(compressed);
        setFeedback(
          lang === 'ar'
            ? 'تم تجهيز صورة الغلاف بنجاح! يمكنك الآن ضبط السعر والضغط على نشر/حفظ القصة.'
            : 'Custom cover image ready! Set the price and click Publish/Save Story.'
        );
      };
      img.onerror = () => {
        setFeedback(
          lang === 'ar' ? 'تعذر قراءة صورة الغلاف، جربي صورة أخرى.' : 'Could not load cover image.'
        );
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  const handlePaperCoverUpload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFeedback(
        lang === 'ar'
          ? 'يرجى اختيار ملف صورة للغلاف (JPG أو PNG أو WebP).'
          : 'Please select an image file (JPG, PNG, or WebP) for the cover.'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const rawUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        const maxW = 640;
        const maxH = 640;
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        const targetW = Math.max(1, Math.round(img.width * ratio));
        const targetH = Math.max(1, Math.round(img.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        let compressed = canvas.toDataURL('image/jpeg', 0.84);
        if (compressed.length > 115000) {
          compressed = canvas.toDataURL('image/jpeg', 0.7);
        }
        if (compressed.length > 115000) {
          compressed = canvas.toDataURL('image/jpeg', 0.56);
        }
        if (compressed.length > 115000) {
          compressed = canvas.toDataURL('image/jpeg', 0.42);
        }
        setOpCoverUrl(compressed);
        setFeedback(
          lang === 'ar'
            ? 'تم تجهيز صورة الغلاف بنجاح! اضغطي الآن «حفظ التعديلات» لتثبيتها.'
            : 'Cover image ready! Click Save to publish it.'
        );
      };
      img.onerror = () => {
        setFeedback(
          lang === 'ar' ? 'تعذر قراءة صورة الغلاف، جربي صورة أخرى.' : 'Could not load cover image.'
        );
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const validExternal = validateHttpsExternalUrl(resExternalUrl);
    if (validExternal === null) return;
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
        ...(resFileDataUrl ? { fileDataUrl: resFileDataUrl.slice(0, 920000) } : {}),
        ...(validExternal ? { externalUrl: validExternal } : {}),
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
      setResExternalUrl('');
      setFeedback(lang === 'ar' ? 'تمت إضافة العنصر بنجاح!' : 'Resource added successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'grades_resources');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDoc = async (colName: string, id: string, isStarterOnly = false) => {
    setBusy(true);
    try {
      if (!isStarterOnly) {
        await deleteDoc(doc(db, colName, id));
      }
      onStarterItemDeleted?.(id);
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
            if (file.size > MAX_DIRECT_FILE_BYTES) {
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
          ? `تم استبعاد ${oversized.length} ملف لأن حجمه أكبر من 650 كيلوبايت (يمكنك ربطه برابط Google Drive بالأسفل).`
          : `Skipped ${oversized.length} file(s) over 650KB limit (you can paste a Google Drive link below).`
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
    const validExternal = validateHttpsExternalUrl(sheetExternalUrl);
    if (validExternal === null) return;
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
            fileDataUrl: f.dataUrl.slice(0, 920000),
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
          ...(validExternal ? { externalUrl: validExternal } : {}),
          authorUid: user.uid,
          createdAt: serverTimestamp(),
        });
      }

      await batch.commit();
      setSheetTitleAr('');
      setSheetTitleEn('');
      setSheetContent('');
      setSheetExternalUrl('');
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

  const handleDeletePackAndItems = async (pack: WorksheetPack) => {
    setBusy(true);
    try {
      const relatedSheets = packItems.filter((s) => s.packId === pack.id);
      if (pack.authorUid !== 'starter') {
        const batch = writeBatch(db);
        relatedSheets
          .filter((s) => s.authorUid !== 'starter')
          .forEach((s) => batch.delete(doc(db, 'worksheet_items', s.id)));
        batch.delete(doc(db, 'worksheet_packs', pack.id));
        await batch.commit();
      }
      onStarterItemDeleted?.(pack.id);
      relatedSheets.forEach((s) => onStarterItemDeleted?.(s.id));
      setFeedback(lang === 'ar' ? 'تم حذف المجموعة وكل الأوراق بداخلها.' : 'Pack and all sheets deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `worksheet_packs/${pack.id}`);
    } finally {
      setBusy(false);
    }
  };

  const resetStoryForm = () => {
    setEditingStoryId(null);
    setEditingStoryAuthorUid('');
    setStTitleEn('');
    setStTitleAr('');
    setStLevel('Primary 4 – 6');
    setStSummaryEn('');
    setStSummaryAr('');
    setStPreview('');
    setStCover(STORY_COVER_1);
    setStPaid(true);
    setStPrice(65);
    setStFileName('');
    setStFileDataUrl('');
    setStExternalUrl('');
  };

  const handleStartEditStory = (story: StoryItem) => {
    setEditingStoryId(story.id);
    setEditingStoryAuthorUid(story.authorUid || '');
    setStTitleEn(story.titleEn || '');
    setStTitleAr(story.titleAr || '');
    setStLevel(story.levelLabel || 'Primary 4 – 6');
    setStSummaryEn(story.summaryEn || '');
    setStSummaryAr(story.summaryAr || '');
    setStPreview(story.previewExcerpt || '');
    setStCover(story.coverUrl || STORY_COVER_1);
    setStPaid(Boolean(story.isPaid && story.priceEgp > 0));
    setStPrice(story.priceEgp ?? 0);
    setStFileName(story.fileName || '');
    setStFileDataUrl(story.fileDataUrl || '');
    setStExternalUrl(story.externalUrl || '');
    setFeedback('');
  };

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const validExternal = validateHttpsExternalUrl(stExternalUrl);
    if (validExternal === null) return;

    const numericPrice = Math.min(100000, Math.max(0, Math.round(Number(stPrice) || 0)));
    const finalIsPaid = stPaid && numericPrice > 0;
    const finalPrice = finalIsPaid ? numericPrice : 0;
    const cleanCover = (stCover.trim() || STORY_COVER_1).slice(0, 120000);

    setBusy(true);
    try {
      if (editingStoryId) {
        if (editingStoryAuthorUid === 'starter') {
          await setDoc(doc(db, 'stories', editingStoryId), {
            titleEn: (stTitleEn || stTitleAr).slice(0, 160),
            titleAr: (stTitleAr || stTitleEn).slice(0, 160),
            levelLabel: (stLevel.trim() || 'Primary').slice(0, 60),
            summaryEn: (stSummaryEn || stSummaryAr).slice(0, 1000),
            summaryAr: (stSummaryAr || stSummaryEn).slice(0, 1000),
            previewExcerpt: (stPreview || stSummaryEn || 'Chapter 1 preview...').slice(0, 2000),
            coverUrl: cleanCover,
            isPaid: finalIsPaid,
            priceEgp: finalPrice,
            ...(stFileName ? { fileName: stFileName.slice(0, 180) } : {}),
            ...(stFileDataUrl ? { fileDataUrl: stFileDataUrl.slice(0, 920000) } : {}),
            ...(validExternal ? { externalUrl: validExternal } : {}),
            authorUid: user.uid,
            createdAt: serverTimestamp(),
          });
        } else {
          await updateDoc(doc(db, 'stories', editingStoryId), {
            titleEn: (stTitleEn || stTitleAr).slice(0, 160),
            titleAr: (stTitleAr || stTitleEn).slice(0, 160),
            levelLabel: (stLevel.trim() || 'Primary').slice(0, 60),
            summaryEn: (stSummaryEn || stSummaryAr).slice(0, 1000),
            summaryAr: (stSummaryAr || stSummaryEn).slice(0, 1000),
            previewExcerpt: (stPreview || stSummaryEn || 'Chapter 1 preview...').slice(0, 2000),
            coverUrl: cleanCover,
            isPaid: finalIsPaid,
            priceEgp: finalPrice,
            fileName: stFileName ? stFileName.slice(0, 180) : deleteField(),
            fileDataUrl: stFileDataUrl ? stFileDataUrl.slice(0, 920000) : deleteField(),
            externalUrl: validExternal ? validExternal : deleteField(),
          });
        }
        resetStoryForm();
        setFeedback(
          lang === 'ar'
            ? 'تم تحديث القصة والغلاف والسعر بنجاح!'
            : 'Story cover, price, and details updated!'
        );
      } else {
        await addDoc(collection(db, 'stories'), {
          titleEn: (stTitleEn || stTitleAr).slice(0, 160),
          titleAr: (stTitleAr || stTitleEn).slice(0, 160),
          levelLabel: (stLevel.trim() || 'Primary').slice(0, 60),
          summaryEn: (stSummaryEn || stSummaryAr).slice(0, 1000),
          summaryAr: (stSummaryAr || stSummaryEn).slice(0, 1000),
          previewExcerpt: (stPreview || stSummaryEn || 'Chapter 1 preview...').slice(0, 2000),
          coverUrl: cleanCover,
          isPaid: finalIsPaid,
          priceEgp: finalPrice,
          ...(stFileName ? { fileName: stFileName.slice(0, 180) } : {}),
          ...(stFileDataUrl ? { fileDataUrl: stFileDataUrl.slice(0, 920000) } : {}),
          ...(validExternal ? { externalUrl: validExternal } : {}),
          authorUid: user.uid,
          createdAt: serverTimestamp(),
        });
        resetStoryForm();
        setFeedback(lang === 'ar' ? 'تمت إضافة القصة بنجاح!' : 'Story added!');
      }
    } catch (err) {
      handleFirestoreError(
        err,
        editingStoryId ? OperationType.UPDATE : OperationType.CREATE,
        editingStoryId ? `stories/${editingStoryId}` : 'stories'
      );
    } finally {
      setBusy(false);
    }
  };

  const resetPaperForm = () => {
    setEditingPaperId(null);
    setEditingPaperAuthorUid('');
    setOpTitleEn('');
    setOpTitleAr('');
    setOpCatEn('Official Form');
    setOpCatAr('نموذج رسمي');
    setOpDescEn('');
    setOpDescAr('');
    setOpContent('');
    setOpCoverUrl('');
    setOpPaid(false);
    setOpPrice(50);
    setOpFileName('');
    setOpFileDataUrl('');
    setOpExternalUrl('');
  };

  const handleStartEditPaper = (paper: OfficialPaper) => {
    setEditingPaperId(paper.id);
    setEditingPaperAuthorUid(paper.authorUid || '');
    setOpTitleEn(paper.titleEn || '');
    setOpTitleAr(paper.titleAr || '');
    setOpCatEn(paper.categoryEn || 'Official Form');
    setOpCatAr(paper.categoryAr || 'نموذج رسمي');
    setOpDescEn(paper.descriptionEn || '');
    setOpDescAr(paper.descriptionAr || '');
    setOpContent(paper.contentText || '');
    setOpCoverUrl(paper.coverUrl || '');
    setOpPaid(Boolean(paper.isPaid && paper.priceEgp > 0));
    setOpPrice(paper.priceEgp ?? 0);
    setOpFileName(paper.fileName || '');
    setOpFileDataUrl(paper.fileDataUrl || '');
    setOpExternalUrl(paper.externalUrl || '');
    setFeedback('');
  };

  const handleAddPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const validExternal = validateHttpsExternalUrl(opExternalUrl);
    if (validExternal === null) return;
    const numericPrice = Math.min(100000, Math.max(0, Math.round(Number(opPrice) || 0)));
    const finalIsPaid = opPaid && numericPrice > 0;
    const finalPrice = finalIsPaid ? numericPrice : 0;
    const cleanCover = opCoverUrl.trim().slice(0, 120000);

    setBusy(true);
    try {
      if (editingPaperId) {
        if (editingPaperAuthorUid === 'starter') {
          await setDoc(doc(db, 'official_papers', editingPaperId), {
            titleEn: (opTitleEn || opTitleAr).slice(0, 160),
            titleAr: (opTitleAr || opTitleEn).slice(0, 160),
            categoryEn: (opCatEn.trim() || 'Official Form').slice(0, 80),
            categoryAr: (opCatAr.trim() || 'نموذج رسمي').slice(0, 80),
            descriptionEn: (opDescEn || opDescAr).slice(0, 1000),
            descriptionAr: (opDescAr || opDescEn).slice(0, 1000),
            contentText: (opContent || opDescEn || opDescAr || 'Official School Template').slice(0, 20000),
            ...(cleanCover ? { coverUrl: cleanCover } : {}),
            ...(opFileName ? { fileName: opFileName.slice(0, 180) } : {}),
            ...(opFileDataUrl ? { fileDataUrl: opFileDataUrl.slice(0, 920000) } : {}),
            ...(validExternal ? { externalUrl: validExternal } : {}),
            isPaid: finalIsPaid,
            priceEgp: finalPrice,
            authorUid: user.uid,
            createdAt: serverTimestamp(),
          });
        } else {
          await updateDoc(doc(db, 'official_papers', editingPaperId), {
            titleEn: (opTitleEn || opTitleAr).slice(0, 160),
            titleAr: (opTitleAr || opTitleEn).slice(0, 160),
            categoryEn: (opCatEn.trim() || 'Official Form').slice(0, 80),
            categoryAr: (opCatAr.trim() || 'نموذج رسمي').slice(0, 80),
            descriptionEn: (opDescEn || opDescAr).slice(0, 1000),
            descriptionAr: (opDescAr || opDescEn).slice(0, 1000),
            contentText: (opContent || opDescEn || opDescAr || 'Official School Template').slice(0, 20000),
            coverUrl: cleanCover ? cleanCover : deleteField(),
            fileName: opFileName ? opFileName.slice(0, 180) : deleteField(),
            fileDataUrl: opFileDataUrl ? opFileDataUrl.slice(0, 920000) : deleteField(),
            externalUrl: validExternal ? validExternal : deleteField(),
            isPaid: finalIsPaid,
            priceEgp: finalPrice,
          });
        }
        resetPaperForm();
        setFeedback(
          lang === 'ar'
            ? 'تم تحديث الكتاب / الورقة والغلاف بنجاح!'
            : 'Paper / book cover & details updated!'
        );
      } else {
        await addDoc(collection(db, 'official_papers'), {
          titleEn: (opTitleEn || opTitleAr).slice(0, 160),
          titleAr: (opTitleAr || opTitleEn).slice(0, 160),
          categoryEn: (opCatEn.trim() || 'Official Form').slice(0, 80),
          categoryAr: (opCatAr.trim() || 'نموذج رسمي').slice(0, 80),
          descriptionEn: (opDescEn || opDescAr).slice(0, 1000),
          descriptionAr: (opDescAr || opDescEn).slice(0, 1000),
          contentText: (opContent || opDescEn || opDescAr || 'Official School Template').slice(0, 20000),
          ...(cleanCover ? { coverUrl: cleanCover } : {}),
          ...(opFileName ? { fileName: opFileName.slice(0, 180) } : {}),
          ...(opFileDataUrl ? { fileDataUrl: opFileDataUrl.slice(0, 920000) } : {}),
          ...(validExternal ? { externalUrl: validExternal } : {}),
          isPaid: finalIsPaid,
          priceEgp: finalPrice,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
        });
        resetPaperForm();
        setFeedback(lang === 'ar' ? 'تمت إضافة الورقة / الكتاب بنجاح!' : 'Official paper / book added!');
      }
    } catch (err) {
      handleFirestoreError(
        err,
        editingPaperId ? OperationType.UPDATE : OperationType.CREATE,
        editingPaperId ? `official_papers/${editingPaperId}` : 'official_papers'
      );
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
    const safePromoDays = Math.max(1, Math.min(1000, Number(termPromoDurationDays) || 120));
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        academyNameEn: cleanEn.length >= 2 ? cleanEn : 'LinguaCraft Academy',
        academyNameAr: cleanAr.length >= 2 ? cleanAr : 'أكاديمية اللغات',
        ...(logoDataUrl ? { logoDataUrl: logoDataUrl.slice(0, 150000) } : {}),
        instapayHandle: instapayHandle.slice(0, 120),
        instapayUrl: instapayUrl.slice(0, 300),
        whatsappNumber: whatsappNumber.slice(0, 25),
        contactEmail: (contactEmail.trim() || 'lailafarag210@gmail.com').slice(0, 160),
        whiteLabelPriceEgp: Number(whiteLabelPrice) || 0,
        aiCertificatePriceEgp: Number(certPrice) || 0,
        quizTermPriceEgp: Number(quizTermPrice) || 0,
        termPromoEnabled,
        termPromoDurationDays: safePromoDays,
        termPromoTitleAr: termPromoTitleAr.trim().slice(0, 140),
        termPromoTitleEn: termPromoTitleEn.trim().slice(0, 140),
        termPromoSubtitleAr: termPromoSubtitleAr.trim().slice(0, 240),
        termPromoSubtitleEn: termPromoSubtitleEn.trim().slice(0, 240),
        seeded: true,
        updatedAt: serverTimestamp(),
      });
      setFeedback(
        lang === 'ar'
          ? 'تم حفظ الإعدادات وإعلان باقة الترم بنجاح!'
          : 'Settings & Term Offer banner saved!'
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
        const termDays = Math.max(1, Math.min(1000, settings.termPromoDurationDays ?? 120));
        const batch = writeBatch(db);
        batch.update(doc(db, 'orders', order.id), { status: 'confirmed' });
        batch.set(doc(db, 'teacher_subscriptions', order.ownerUid), {
          ownerUid: order.ownerUid,
          teacherName: (order.customerName || 'Teacher').slice(0, 100),
          termLabel: `Term (${termDays}d)`,
          active: true,
          durationDays: termDays,
          expiresAtMs: Date.now() + termDays * 86400000,
          activatedByUid: user.uid,
          activatedAt: serverTimestamp(),
        });
        await batch.commit();
        setFeedback(
          lang === 'ar'
            ? `تم تأكيد الطلب وتفعيل اشتراك الترم للمعلم لمدة ${termDays} يوم (يقفل تلقائياً عند الانتهاء)!`
            : `Order confirmed & Teacher Term activated for ${termDays} days!`
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

  const handlePdfBankFileChange = async (file: File | undefined) => {
    if (!file) return;
    const lower = file.name.toLowerCase();

    // Support plain text / JSON / CSV question files directly
    if (lower.endsWith('.txt') || lower.endsWith('.json') || lower.endsWith('.csv')) {
      try {
        const text = await file.text();
        setImportRawText(text);
        setImportPdfName('');
        setImportPdfChunks([]);
        setImportPdfTotalPages(0);
        setImportPdfSizeMb('');
        const localParsed = parseStructuredMcqsLocally(text, qbUnitLabel.trim() || 'General');
        if (localParsed.length > 0) {
          setExtractedPreview(localParsed);
          setFeedback(
            lang === 'ar'
              ? `تم قراءة الملف النصي واستخراج ${localParsed.length} سؤال مباشرة! راجعيها بالأسفل ثم اضغطي حفظ.`
              : `Parsed ${localParsed.length} questions from file directly!`
          );
        } else {
          setFeedback(
            lang === 'ar'
              ? 'تم تحميل نص الملف في المربع بالأسفل — اضغطي استخراج بالذكاء الاصطناعي.'
              : 'File text loaded below — click Extract to parse questions.'
          );
        }
      } catch {
        setFeedback(lang === 'ar' ? 'تعذر قراءة الملف النصي.' : 'Failed to read text file.');
      }
      return;
    }

    if (file.type && file.type !== 'application/pdf' && !lower.endsWith('.pdf')) {
      setFeedback(
        lang === 'ar'
          ? 'يرجى اختيار ملف PDF أو ملف نصي (.txt / .json).'
          : 'Please select a PDF or text (.txt / .json) file.'
      );
      return;
    }

    setImportPreparing(true);
    setFeedback('');
    try {
      const { totalPages, chunks, skippedOversizedPages } = await splitPdfIntoBase64Chunks(file);
      if (chunks.length === 0) {
        setFeedback(
          lang === 'ar'
            ? 'صفحات هذا الملف كبيرة جداً كصور عالية الدقة. جرّبي ضغطه أو نسخ النص منه في المربع بالأسفل.'
            : 'PDF pages are too large as raw scans. Try compressing or pasting text below.'
        );
        return;
      }
      const mbStr = (file.size / (1024 * 1024)).toFixed(1);
      setImportPdfName(file.name);
      setImportPdfChunks(chunks);
      setImportPdfTotalPages(totalPages);
      setImportPdfSizeMb(mbStr);
      setFeedback(
        lang === 'ar'
          ? chunks.length > 1
            ? `تم تجهيز الملف (${mbStr} ميجا · ${totalPages} صفحة) وتقسيمه تلقائياً إلى ${chunks.length} أجزاء بدون أي تدخل منك!${skippedOversizedPages.length ? ` (تم تخطي ${skippedOversizedPages.length} صفحة ضخمة جداً)` : ''} اضغطي «استخراج الأسئلة الآن».`
            : `تم إرفاق الملف بنجاح (${file.name} · ${mbStr} ميجا · ${totalPages} صفحة). اضغطي «استخراج الأسئلة الآن».`
          : chunks.length > 1
          ? `Prepared ${file.name} (${mbStr} MB, ${totalPages} pages) and auto-split into ${chunks.length} parts. Click Extract now.`
          : `PDF attached (${file.name}, ${mbStr} MB, ${totalPages} pages).`
      );
    } catch {
      setFeedback(
        lang === 'ar'
          ? 'تعذر قراءة هذا الـ PDF (قد يكون محمياً بكلمة سر). يمكنك نسخ الأسئلة ولصقها في الخانة النصية بالأسفل.'
          : 'Could not read PDF (it may be password-protected). Paste question text below.'
      );
    } finally {
      setImportPreparing(false);
    }
  };

  const handleInstantLocalImport = () => {
    if (!importRawText.trim()) {
      setFeedback(
        lang === 'ar'
          ? 'الصقي نص الأسئلة أولاً في المربع للاستيراد المباشر.'
          : 'Paste question text first to import locally.'
      );
      return;
    }
    const parsed = parseStructuredMcqsLocally(importRawText, qbUnitLabel.trim() || 'General');
    if (parsed.length === 0) {
      setFeedback(
        lang === 'ar'
          ? 'لم يطابق النص الصيغة المرقمة (مثال: 1. السؤال ثم a) b) c) d)). استخدمي زر الذكاء الاصطناعي لاستخلاص أي صيغة.'
          : 'No numbered A/B/C/D pattern detected. Use AI extraction for unstructured text.'
      );
      return;
    }
    setExtractedPreview((prev) => [...prev, ...parsed]);
    setFeedback(
      lang === 'ar'
        ? `تم استخراج ${parsed.length} سؤال فوراً بدون AI! راجعيها بالأسفل ثم اضغطي حفظ في البنك.`
        : `Parsed ${parsed.length} questions instantly without AI!`
    );
  };

  const callExtractEndpointWithRetry = async (payload: Record<string, unknown>) => {
    let lastErr = 'Extraction failed';
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1800));
      }
      const resp = await fetch('/api/ai/extract-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await resp.json().catch(() => ({}))) as {
        questions?: Array<{
          unitLabel: string;
          prompt: string;
          options: string[];
          correctIndex: number;
          explanation?: string;
        }>;
        error?: string;
      };
      if (resp.ok) {
        return Array.isArray(data.questions) ? data.questions : [];
      }
      lastErr = data.error || `Error (${resp.status})`;
      // Don't retry client/key errors
      if (resp.status === 400 || resp.status === 403 || lastErr.includes('GEMINI_API_KEY')) {
        throw new Error(lastErr);
      }
    }
    throw new Error(lastErr);
  };

  const handleExtractQuestionsFromPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (importPdfChunks.length === 0 && !importRawText.trim()) {
      setFeedback(
        lang === 'ar'
          ? 'ارفعي ملف PDF أولاً أو الصقي نص الأسئلة للاستخراج.'
          : 'Attach a PDF file or paste question text first.'
      );
      return;
    }
    setExtractingBank(true);
    setExtractProgress('');
    setFeedback('');

    const gradeMeta = GRADES.find((g) => g.id === qbGradeId);
    const gradeLabel = gradeMeta ? gradeMeta.nameEn : qbGradeId;
    const defaultUnit = qbUnitLabel.trim() || 'General';

    const collected: Array<{
      unitLabel: string;
      prompt: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
    }> = [];
    const seenPrompts = new Set(extractedPreview.map((q) => q.prompt.trim().toLowerCase()));

    const pushUnique = (
      items: Array<{
        unitLabel: string;
        prompt: string;
        options: string[];
        correctIndex: number;
        explanation?: string;
      }>
    ) => {
      items.forEach((item) => {
        const key = item.prompt.trim().toLowerCase();
        if (!seenPrompts.has(key)) {
          seenPrompts.add(key);
          collected.push(item);
        }
      });
    };

    try {
      if (importPdfChunks.length > 0) {
        for (let i = 0; i < importPdfChunks.length; i += 1) {
          const chunk = importPdfChunks[i];
          setExtractProgress(
            lang === 'ar'
              ? `جاري استخراج الجزء ${i + 1} من ${importPdfChunks.length} (صفحات ${chunk.label})... تم استخراج ${collected.length} سؤال`
              : `Extracting part ${i + 1}/${importPdfChunks.length} (pages ${chunk.label})... ${collected.length} found`
          );
          const partQuestions = await callExtractEndpointWithRetry({
            pdfBase64: chunk.base64,
            mimeType: 'application/pdf',
            ...(i === 0 && importRawText.trim() ? { rawText: importRawText.trim() } : {}),
            gradeLabel,
            defaultUnit,
            maxQuestions: 25,
          });
          pushUnique(partQuestions);
        }
      } else {
        const textChunks = chunkRawText(importRawText, 10000);
        for (let i = 0; i < textChunks.length; i += 1) {
          setExtractProgress(
            lang === 'ar'
              ? `جاري استخراج الدفعة ${i + 1} من ${textChunks.length}... تم استخراج ${collected.length} سؤال`
              : `Extracting batch ${i + 1}/${textChunks.length}... ${collected.length} found`
          );
          const partQuestions = await callExtractEndpointWithRetry({
            rawText: textChunks[i],
            gradeLabel,
            defaultUnit,
            maxQuestions: 30,
          });
          pushUnique(partQuestions);
        }
      }

      if (collected.length === 0) {
        setFeedback(
          lang === 'ar'
            ? 'لم يتم العثور على أسئلة واضحة في الملف. جرّبي لصق النص مباشرة أو التأكد أن الملف واضح.'
            : 'No readable questions were detected. Try pasting text directly.'
        );
      } else {
        setExtractedPreview((prev) => [...prev, ...collected]);
        setFeedback(
          lang === 'ar'
            ? `تم استخراج ${collected.length} سؤال بنجاح! راجعيها بالأسفل ثم اضغطي حفظ في البنك.`
            : `Extracted ${collected.length} questions! Review below and save to bank.`
        );
      }
    } catch (err) {
      // Save any partial progress already extracted before the error
      if (collected.length > 0) {
        setExtractedPreview((prev) => [...prev, ...collected]);
      } else if (importRawText.trim()) {
        // Automatic offline parser fallback if AI was busy on pasted text
        const localFallback = parseStructuredMcqsLocally(importRawText, defaultUnit);
        if (localFallback.length > 0) {
          setExtractedPreview((prev) => [...prev, ...localFallback]);
          setFeedback(
            lang === 'ar'
              ? `الذكاء الاصطناعي مشغول حالياً، لكن تم استخراج ${localFallback.length} سؤال تلقائياً من النص المنسق! راجعيها ثم اضغطي حفظ.`
              : `AI is busy right now, so ${localFallback.length} questions were extracted directly from your formatted text!`
          );
          return;
        }
      }
      const errMsg = err instanceof Error ? err.message : 'PDF extraction failed';
      setFeedback(
        collected.length > 0
          ? `${lang === 'ar' ? `تم استخراج ${collected.length} سؤال قبل التوقف المؤقت:` : `Extracted ${collected.length} questions before pause:`} ${errMsg}`
          : errMsg
      );
    } finally {
      setExtractingBank(false);
      setExtractProgress('');
    }
  };

  const handleSaveExtractedBatch = async () => {
    if (!user || extractedPreview.length === 0) return;
    setBusy(true);
    setFeedback('');
    try {
      const BATCH_LIMIT = 400;
      for (let start = 0; start < extractedPreview.length; start += BATCH_LIMIT) {
        const slice = extractedPreview.slice(start, start + BATCH_LIMIT);
        const batch = writeBatch(db);
        slice.forEach((item) => {
          const ref = doc(collection(db, 'question_bank'));
          batch.set(ref, {
            gradeId: qbGradeId,
            unitLabel: (item.unitLabel || qbUnitLabel || 'General').slice(0, 100),
            prompt: item.prompt.slice(0, 600),
            options: item.options.slice(0, 4).map((o) => o.slice(0, 200)),
            correctIndex: Math.max(0, Math.min(item.options.length - 1, item.correctIndex)),
            ...(item.explanation ? { explanation: item.explanation.slice(0, 500) } : {}),
            authorUid: user.uid,
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
      const count = extractedPreview.length;
      setExtractedPreview([]);
      setImportPdfName('');
      setImportPdfChunks([]);
      setImportPdfTotalPages(0);
      setImportPdfSizeMb('');
      setImportRawText('');
      setFeedback(
        lang === 'ar'
          ? `تم حفظ ${count} سؤال دفعة واحدة في بنك الأسئلة بنجاح!`
          : `Saved ${count} questions to the question bank!`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'question_bank');
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
    const safeDays = Math.max(0, Math.min(1000, Number(subDurationDays) || 0));
    try {
      await setDoc(doc(db, 'teacher_subscriptions', targetUid), {
        ownerUid: targetUid,
        teacherName: (subNameInput.trim() || 'Subscribed Teacher').slice(0, 100),
        ...(subEmailInput.trim() ? { teacherEmail: subEmailInput.trim().slice(0, 160) } : {}),
        termLabel: (subTermInput.trim() || 'Active Term').slice(0, 80),
        active: true,
        durationDays: safeDays,
        ...(safeDays > 0 ? { expiresAtMs: Date.now() + safeDays * 86400000 } : {}),
        activatedByUid: user.uid,
        activatedAt: serverTimestamp(),
      });
      setSubUidInput('');
      setSubNameInput('');
      setSubEmailInput('');
      setFeedback(
        lang === 'ar'
          ? safeDays > 0
            ? `تم تفعيل اشتراك المعلم لمدة ${safeDays} يوم (يقفل تلقائياً بنهاية المدة)!`
            : 'تم تفعيل اشتراك المعلم (مفتوح) بنجاح!'
          : 'Teacher subscription activated!'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `teacher_subscriptions/${targetUid}`);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleSubscription = async (sub: TeacherSubscription) => {
    if (!user) return;
    setBusy(true);
    const willActivate = !sub.active;
    const renewDays =
      sub.durationDays && sub.durationDays > 0
        ? sub.durationDays
        : settings.termPromoDurationDays ?? 120;
    const isExpired = Boolean(sub.expiresAtMs && sub.expiresAtMs <= Date.now());
    try {
      await updateDoc(doc(db, 'teacher_subscriptions', sub.id), {
        active: willActivate || isExpired,
        ...(willActivate || isExpired
          ? {
              durationDays: renewDays,
              expiresAtMs: Date.now() + renewDays * 86400000,
            }
          : {}),
        activatedByUid: user.uid,
        activatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teacher_subscriptions/${sub.id}`);
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateActivationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setFeedback('');
    try {
      const [rawType, ...rest] = codeTargetSelection.split(':');
      const targetId = rest.join(':') || 'all';
      const targetType = (rawType as ActivationCode['targetType']) || 'all_paid';

      let targetTitle =
        lang === 'ar' ? 'فتح كل الملفات والقصص المدفوعة (VIP)' : 'Full Paid Library Access (VIP)';
      if (targetType === 'resource') {
        const res = resources.find((r) => r.id === targetId);
        if (res) targetTitle = lang === 'ar' ? res.titleAr : res.titleEn;
      } else if (targetType === 'pack') {
        const p = packs.find((pk) => pk.id === targetId);
        if (p) targetTitle = `#${p.packNumber} ${lang === 'ar' ? p.titleAr : p.titleEn}`;
      } else if (targetType === 'story') {
        const st = stories.find((s) => s.id === targetId);
        if (st) targetTitle = lang === 'ar' ? st.titleAr : st.titleEn;
      } else if (targetType === 'paper') {
        const pp = papers.find((p) => p.id === targetId);
        if (pp) targetTitle = lang === 'ar' ? pp.titleAr : pp.titleEn;
      }

      const newCode = generateRandomActivationCode('LC');
      const safeUses = Math.max(1, Math.min(500, Number(codeMaxUses) || 1));
      const safeDays = Math.max(0, Math.min(1000, Number(codeDurationDays) || 0));
      await setDoc(doc(db, 'activation_codes', newCode), {
        code: newCode,
        targetType,
        targetId,
        targetTitle: targetTitle.slice(0, 180),
        ...(codeNote.trim() ? { note: codeNote.trim().slice(0, 160) } : {}),
        maxUses: safeUses,
        usedCount: 0,
        active: true,
        durationDays: safeDays,
        ...(safeDays > 0 ? { expiresAtMs: Date.now() + safeDays * 86400000 } : {}),
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
      });

      setLastCreatedCode(newCode);
      setLastCreatedCodeDurationDays(safeDays);
      setCodeNote('');
      setFeedback(
        lang === 'ar'
          ? safeDays > 0
            ? `تم توليد الكود (${newCode}) بصلاحية ${safeDays} يوم ويقفل تلقائياً بعدها!`
            : `تم توليد الكود (${newCode}) بنجاح! انسخيه وأرسليه للعميل على واتساب.`
          : `Activation code ${newCode} generated!`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'activation_codes');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleCodeActive = async (item: ActivationCode) => {
    setBusy(true);
    try {
      await updateDoc(doc(db, 'activation_codes', item.id), { active: !item.active });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `activation_codes/${item.id}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteActivationCode = async (item: ActivationCode) => {
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'activation_codes', item.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `activation_codes/${item.id}`);
    } finally {
      setBusy(false);
    }
  };

  const handleClearOldAnalytics = async () => {
    if (analyticsEvents.length === 0) return;
    setBusy(true);
    setFeedback('');
    try {
      const slice = analyticsEvents.slice(0, 400);
      const batch = writeBatch(db);
      slice.forEach((ev) => batch.delete(doc(db, 'analytics_events', ev.id)));
      await batch.commit();
      setFeedback(
        lang === 'ar'
          ? `تم مسح ${slice.length} سجل إحصائي بنجاح.`
          : `Cleared ${slice.length} analytics events.`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'analytics_events');
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
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const fileName = `tahdeery-linguacraft-${stamp}.zip`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setFeedback(
        lang === 'ar'
          ? `تم تحميل أحدث نسخة (${fileName})! تأكدي أن تفكي ضغطها وتستبدلي ملفات المشروع الرئيسية مباشرة ثم رفع التحديث إلى GitHub (git push).`
          : `Downloaded latest build (${fileName})! Extract & replace root project files directly before git push.`
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
                    ['analytics', lang === 'ar' ? 'الزيارات والتحميلات' : 'Analytics'],
                    ['codes', lang === 'ar' ? 'أكواد التفعيل' : 'Activation Codes'],
                    ['resources', lang === 'ar' ? 'الصفوف والتحضير' : 'Grades & Preps'],
                    ['packs', lang === 'ar' ? `مجموعات أوراق العمل (${packs.length})` : `Worksheet Packs (${packs.length})`],
                    ['quizbank', lang === 'ar' ? 'بنك الأسئلة والاشتراكات' : 'Question Bank & Subs'],
                    ['courses', lang === 'ar' ? 'الكورسات (Affiliate)' : 'Affiliate Courses'],
                    ['stories', lang === 'ar' ? 'القصص' : 'Stories'],
                    ['papers', lang === 'ar' ? `الأوراق والكتب (${papers.length})` : `Papers & Books (${papers.length})`],
                    ['news', lang === 'ar' ? 'الأخبار' : 'News'],
                    ['links', lang === 'ar' ? 'روابط البوستات' : 'Post Links'],
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
                    {onSeedMissingPapers &&
                      (!papers.some((p) => p.id === 'paper_senior_teacher_book') ||
                        !papers.some((p) => p.id === 'paper_quran_dotted_booklet')) && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              await onSeedMissingPapers();
                              setFeedback(
                                lang === 'ar'
                                  ? 'تمت إضافة كتاب Senior Teacher وكتيب القرآن بالتنقيط وأوراق التحسين والسجلات!'
                                  : 'Added Senior Teacher book, Quran dotted booklet, and teacher record sheets!'
                              );
                            } finally {
                              setBusy(false);
                            }
                          }}
                          className="px-3.5 py-2 text-xs font-semibold bg-amber-100 text-amber-900 rounded-lg hover:bg-amber-200 transition-colors"
                        >
                          {lang === 'ar'
                            ? 'إضافة كتاب Senior Teacher وكتيب القرآن والسجلات'
                            : 'Add Books, Quran Booklet & Sheets'}
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
                  <label className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                    <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {resFileName || (lang === 'ar' ? 'إرفاق ملف مباشر (حتى 650 كيلوبايت)' : 'Attach direct file (up to 650KB)')}
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
                  {resFileDataUrl && (
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                      <span className="text-emerald-900 font-medium truncate">
                        ✓ {resFileName} ({formatDataUrlKb(resFileDataUrl)})
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewFile({
                              title: resTitleAr || resTitleEn || resFileName,
                              fileName: resFileName,
                              fileDataUrl: resFileDataUrl,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-white border border-emerald-300 text-emerald-900 rounded hover:bg-emerald-100"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'معاينة' : 'Preview'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResFileName('');
                            setResFileDataUrl('');
                          }}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                          title={lang === 'ar' ? 'إزالة الملف' : 'Remove file'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <input
                      type="url"
                      dir="ltr"
                      placeholder={
                        lang === 'ar'
                          ? 'أو رابط Google Drive للملفات الكبيرة (https://drive.google.com/...)'
                          : 'Or Google Drive link for large PDFs (https://drive.google.com/...)'
                      }
                      value={resExternalUrl}
                      onChange={(e) => setResExternalUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono-num"
                    />
                    <p className="text-[11px] text-slate-500">
                      {lang === 'ar'
                        ? 'للملفات الأكبر من 650 كيلوبايت: ارفعيها على Google Drive (مشاركة: أي شخص لديه الرابط) وضعي الرابط هنا ليحمّله المدرسون بشكل عادي.'
                        : 'For files over 650KB: upload to Google Drive (Anyone with the link) and paste the link here.'}
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'إضافة للمنصة' : 'Publish Resource'}</span>
                  </button>
                </form>

                <div className="lg:col-span-7 divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden max-h-[560px] overflow-y-auto">
                  {resources.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                      <div className="min-w-0 space-y-1">
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.fileDataUrl ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              <FileText className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">
                                {lang === 'ar' ? 'مرفق:' : 'File:'} {item.fileName || 'uploaded'}
                              </span>
                            </span>
                          ) : item.externalUrl ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                              <ExternalLink className="w-3 h-3" />
                              <span>{lang === 'ar' ? 'مرفق رابط Google Drive' : 'External link'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              <span>{lang === 'ar' ? 'محتوى نصي (بدون ملف مرفق)' : 'Text content only'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewFile({
                              title: lang === 'ar' ? item.titleAr : item.titleEn,
                              fileName: item.fileName,
                              fileDataUrl: item.fileDataUrl,
                              externalUrl: item.externalUrl,
                              contentText: item.contentText,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 rounded-lg"
                          title={lang === 'ar' ? 'معاينة الملف' : 'Preview file'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'عرض' : 'View'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc('grades_resources', item.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                          title={lang === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'packs' && (
              <div className="space-y-6">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-sky-950 leading-relaxed">
                    {lang === 'ar'
                      ? 'هذا التبويب يطابق قسم «مكتبة أوراق العمل وحزم التأسيس المرقّمة» في الصفحة الرئيسية. أما كتاب Senior Teacher وكتيب القرآن وسجل الطلاب ففي تبويب «الأوراق والكتب».'
                      : 'Matches the Worksheet & Foundation Packs section on the homepage. Books, Quran booklet, and student sheets are under Papers & Books.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab('papers')}
                    className="px-3 py-1.5 text-xs font-semibold text-sky-900 bg-white border border-sky-300 rounded-lg hover:bg-sky-100 whitespace-nowrap"
                  >
                    {lang === 'ar' ? `الانتقال إلى الأوراق والكتب (${papers.length})` : `Go to Papers & Books (${papers.length})`}
                  </button>
                </div>
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
                            ? 'اختر ملف واحد أو عدة ملفات معاً (حتى 650 كيلوبايت للملف)'
                            : 'Select 1 or multiple files (up to 650KB each)'}
                        </span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => handleBulkFilesRead(e.target.files)}
                        />
                      </label>
                      {bulkFiles.length > 0 && (
                        <div className="space-y-1.5 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                          {bulkFiles.map((bf, bIdx) => (
                            <div key={`${bf.name}-${bIdx}`} className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-emerald-900 font-medium truncate">
                                ✓ {bf.name} ({formatDataUrlKb(bf.dataUrl)})
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewFile({
                                      title: bf.name,
                                      fileName: bf.name,
                                      fileDataUrl: bf.dataUrl,
                                    })
                                  }
                                  className="px-2 py-0.5 text-[11px] font-semibold bg-white border border-emerald-300 text-emerald-900 rounded hover:bg-emerald-100"
                                >
                                  {lang === 'ar' ? 'معاينة' : 'Preview'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBulkFiles((prev) => prev.filter((_, idx) => idx !== bIdx))}
                                  className="p-0.5 text-rose-600 hover:bg-rose-50 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {bulkFiles.length === 0 && (
                        <input
                          type="url"
                          dir="ltr"
                          placeholder={
                            lang === 'ar'
                              ? 'أو رابط Google Drive لملف كبير (https://drive.google.com/...)'
                              : 'Or Google Drive link for a large file (https://...)'
                          }
                          value={sheetExternalUrl}
                          onChange={(e) => setSheetExternalUrl(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono-num"
                        />
                      )}
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
                              <button
                                type="button"
                                onClick={() => handleDeletePackAndItems(pack)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                                title={lang === 'ar' ? 'حذف الحزمة بالكامل' : 'Delete pack'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {sheets.length > 0 && (
                              <div className="divide-y divide-slate-100">
                                {sheets.map((sheet) => (
                                  <div key={sheet.id} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                                    <div className="min-w-0 space-y-0.5">
                                      <p className="text-slate-800 font-medium truncate">
                                        <span className="font-mono-num text-slate-400 me-1.5">#{sheet.itemOrder}</span>
                                        {lang === 'ar' ? sheet.titleAr : sheet.titleEn}
                                      </p>
                                      <p className="text-[11px] text-slate-500 truncate">
                                        {sheet.fileDataUrl
                                          ? `📎 ${sheet.fileName || (lang === 'ar' ? 'ملف مرفق' : 'File attached')}`
                                          : sheet.externalUrl
                                          ? `🔗 ${lang === 'ar' ? 'رابط Google Drive' : 'External link'}`
                                          : `📝 ${lang === 'ar' ? 'نص بدون مرفق' : 'Text only'}`}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreviewFile({
                                            title: lang === 'ar' ? sheet.titleAr : sheet.titleEn,
                                            fileName: sheet.fileName,
                                            fileDataUrl: sheet.fileDataUrl,
                                            externalUrl: sheet.externalUrl,
                                            contentText: sheet.contentText,
                                          })
                                        }
                                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 rounded"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>{lang === 'ar' ? 'عرض' : 'View'}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteDoc('worksheet_items', sheet.id, sheet.authorUid === 'starter')
                                        }
                                        className="text-rose-600 hover:text-rose-800 p-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
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
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {editingStoryId
                        ? lang === 'ar'
                          ? 'تعديل بيانات القصة والغلاف والسعر'
                          : 'Edit Story Details, Cover & Price'
                        : lang === 'ar'
                        ? 'إضافة قصة إنجليزية جديدة'
                        : 'Add New English Story'}
                    </h3>
                    {editingStoryId && (
                      <button
                        type="button"
                        onClick={resetStoryForm}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                      >
                        {lang === 'ar' ? 'إلغاء التعديل' : 'Cancel Edit'}
                      </button>
                    )}
                  </div>

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {lang === 'ar' ? 'المرحلة / المستوى' : 'Level Label'}
                      </label>
                      <input
                        type="text"
                        value={stLevel}
                        onChange={(e) => setStLevel(e.target.value)}
                        placeholder="Primary 4 – 6"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {lang === 'ar' ? 'السعر بالجنيه (0 = مجانية)' : 'Price EGP (0 = Free)'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100000}
                        disabled={!stPaid}
                        value={stPaid ? stPrice : 0}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setStPrice(val);
                          if (val === 0) setStPaid(false);
                        }}
                        placeholder="65"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono-num disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>
                  </div>

                  <label className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs cursor-pointer">
                    <span className="font-semibold text-slate-800">
                      {lang === 'ar'
                        ? 'قصة مدفوعة (يفتح بالشراء أو كود التفعيل)'
                        : 'Paid Story (Requires InstaPay / Code)'}
                    </span>
                    <input
                      type="checkbox"
                      checked={stPaid}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setStPaid(next);
                        if (next && stPrice <= 0) setStPrice(65);
                      }}
                      className="rounded border-slate-300 text-sky-900"
                    />
                  </label>

                  {/* Custom Cover Image Upload + Built-in Covers + Preview */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
                    <p className="text-xs font-bold text-slate-800">
                      {lang === 'ar' ? 'صورة غلاف القصة:' : 'Story Cover Image:'}
                    </p>
                    <div className="flex items-start gap-3">
                      <div className="w-24 aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                        <img
                          src={stCover || STORY_COVER_1}
                          alt="Story cover preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-900 bg-sky-50 border border-dashed border-sky-300 rounded-lg cursor-pointer hover:bg-sky-100 transition-colors">
                          <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {lang === 'ar'
                              ? 'رفع صورة غلاف من جهازك'
                              : 'Upload Cover From Device'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              handleStoryCoverUpload(e.target.files?.[0]);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <select
                          value={
                            stCover === STORY_COVER_1 || stCover === STORY_COVER_2
                              ? stCover
                              : '__custom__'
                          }
                          onChange={(e) => {
                            if (e.target.value !== '__custom__') {
                              setStCover(e.target.value);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                        >
                          {stCover !== STORY_COVER_1 && stCover !== STORY_COVER_2 && (
                            <option value="__custom__">
                              {lang === 'ar' ? '✓ صورة مخصصة مرفوعة حالياً' : '✓ Custom Uploaded Cover'}
                            </option>
                          )}
                          <option value={STORY_COVER_1}>
                            {lang === 'ar' ? 'غلاف جاهز 1: مكتبة البالون السحرية' : 'Preset 1: Magical Library Balloon'}
                          </option>
                          <option value={STORY_COVER_2}>
                            {lang === 'ar' ? 'غلاف جاهز 2: رحلة المنارة' : 'Preset 2: Lighthouse Voyage'}
                          </option>
                        </select>
                      </div>
                    </div>
                    {!stCover.startsWith('data:') && (
                      <input
                        type="url"
                        dir="ltr"
                        value={stCover === STORY_COVER_1 || stCover === STORY_COVER_2 ? '' : stCover}
                        onChange={(e) => setStCover(e.target.value || STORY_COVER_1)}
                        placeholder={
                          lang === 'ar'
                            ? 'أو الصقي رابط صورة غلاف مباشر (https://...)'
                            : 'Or paste direct image URL (https://...)'
                        }
                        className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg font-mono-num"
                      />
                    )}
                  </div>

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
                  <label className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                    <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{stFileName || (lang === 'ar' ? 'رفع ملف القصة (حتى 650 كيلوبايت)' : 'Attach story file (up to 650KB)')}</span>
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
                  {stFileDataUrl && (
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                      <span className="text-emerald-900 font-medium truncate">
                        ✓ {stFileName} ({formatDataUrlKb(stFileDataUrl)})
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewFile({
                              title: stTitleAr || stTitleEn || stFileName,
                              fileName: stFileName,
                              fileDataUrl: stFileDataUrl,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-white border border-emerald-300 text-emerald-900 rounded hover:bg-emerald-100"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'معاينة' : 'Preview'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStFileName('');
                            setStFileDataUrl('');
                          }}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <input
                    type="url"
                    dir="ltr"
                    placeholder={
                      lang === 'ar'
                        ? 'أو رابط Google Drive للقصة (https://drive.google.com/...)'
                        : 'Or Google Drive link for story PDF (https://...)'
                    }
                    value={stExternalUrl}
                    onChange={(e) => setStExternalUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono-num"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800 disabled:opacity-60"
                  >
                    {editingStoryId
                      ? lang === 'ar'
                        ? 'حفظ تعديلات القصة الآن'
                        : 'Save Story Changes'
                      : lang === 'ar'
                      ? 'نشر القصة'
                      : 'Publish Story'}
                  </button>
                </form>

                <div className="lg:col-span-7 divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {stories.map((story) => (
                    <div key={story.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={story.coverUrl || STORY_COVER_1}
                          alt={lang === 'ar' ? story.titleAr : story.titleEn}
                          referrerPolicy="no-referrer"
                          className="w-14 h-11 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {lang === 'ar' ? story.titleAr : story.titleEn}
                          </p>
                          <p className="text-xs text-slate-500">
                            {story.levelLabel} ·{' '}
                            <span className={story.isPaid && story.priceEgp > 0 ? 'font-semibold text-amber-700' : 'font-semibold text-emerald-700'}>
                              {story.isPaid && story.priceEgp > 0
                                ? `${story.priceEgp} EGP`
                                : lang === 'ar'
                                ? 'مجاني'
                                : 'Free'}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {story.fileDataUrl
                              ? `📎 ${story.fileName || (lang === 'ar' ? 'ملف القصة مرفق' : 'Story file attached')}`
                              : story.externalUrl
                              ? `🔗 ${lang === 'ar' ? 'رابط Google Drive' : 'External link'}`
                              : `📝 ${lang === 'ar' ? 'مقتطف نصي فقط' : 'Excerpt only'}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditStory(story)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg"
                          title={lang === 'ar' ? 'تعديل الغلاف أو السعر' : 'Edit cover or price'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewFile({
                              title: lang === 'ar' ? story.titleAr : story.titleEn,
                              fileName: story.fileName,
                              fileDataUrl: story.fileDataUrl,
                              externalUrl: story.externalUrl,
                              contentText: story.previewExcerpt,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'عرض' : 'View'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc('stories', story.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'papers' && (
              <div className="space-y-4">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-sky-950 leading-relaxed">
                    {lang === 'ar'
                      ? 'هذا التبويب يطابق قسم «كتب وأوراق ونماذج المعلم» في الصفحة الرئيسية (Senior Teacher، سور القرآن بالتنقيط، خطة التحسين، سجل التلاميذ، الدرجات). أما مجموعات التأسيس المرقّمة ففي تبويب «مجموعات أوراق العمل».'
                      : 'Matches Books & Teacher Papers on the homepage. Numbered foundation worksheet packs are under Worksheet Packs.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab('packs')}
                    className="px-3 py-1.5 text-xs font-semibold text-sky-900 bg-white border border-sky-300 rounded-lg hover:bg-sky-100 whitespace-nowrap"
                  >
                    {lang === 'ar' ? `الانتقال إلى مجموعات التأسيس (${packs.length})` : `Go to Worksheet Packs (${packs.length})`}
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form onSubmit={handleAddPaper} className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {editingPaperId
                        ? lang === 'ar'
                          ? 'تعديل الكتاب / الورقة والغلاف'
                          : 'Edit Book / Paper & Cover'
                        : lang === 'ar'
                        ? 'إضافة كتاب / كتيب / ورقة رسمية'
                        : 'Add Book, Booklet, or Official Paper'}
                    </h3>
                    {editingPaperId && (
                      <button
                        type="button"
                        onClick={resetPaperForm}
                        className="text-xs font-semibold text-rose-700 hover:underline"
                      >
                        {lang === 'ar' ? 'إلغاء التعديل' : 'Cancel Edit'}
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'العنوان بالعربية (مثلاً: كتاب Senior Teacher)' : 'Arabic Title'}
                    value={opTitleAr}
                    onChange={(e) => setOpTitleAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'العنوان بالإنجليزية (اختياري)' : 'English Title (Optional)'}
                    value={opTitleEn}
                    onChange={(e) => setOpTitleEn(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={opCatAr}
                      onChange={(e) => setOpCatAr(e.target.value)}
                      placeholder="التصنيف بالعربية (اختياري)"
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
                    placeholder={
                      lang === 'ar'
                        ? 'وصف مختصر أو نص الورقة القابل للطباعة'
                        : 'Short description or printable template text'
                    }
                    value={opContent}
                    onChange={(e) => {
                      setOpContent(e.target.value);
                      if (!editingPaperId) {
                        setOpDescAr(e.target.value.slice(0, 140));
                        setOpDescEn(e.target.value.slice(0, 140));
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  {editingPaperId && (
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'الوصف الظاهر في البطاقة (عربي)' : 'Card description'}
                      value={opDescAr}
                      onChange={(e) => {
                        setOpDescAr(e.target.value);
                        setOpDescEn(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  )}

                  {/* Cover Image Upload (Optional — ideal for Senior Teacher & Quran Dotted Booklet) */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        {lang === 'ar' ? 'صورة الغلاف (اختياري — ارفعيها من جهازك)' : 'Cover Image (Optional)'}
                      </span>
                      {opCoverUrl && (
                        <button
                          type="button"
                          onClick={() => setOpCoverUrl('')}
                          className="text-[11px] font-semibold text-rose-600 hover:underline"
                        >
                          {lang === 'ar' ? 'إزالة الغلاف' : 'Remove Cover'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {opCoverUrl ? (
                        <img
                          src={opCoverUrl}
                          alt="Paper cover preview"
                          referrerPolicy="no-referrer"
                          className="w-16 h-20 object-cover rounded-lg border border-slate-200 bg-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-20 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 text-center px-1 shrink-0">
                          {lang === 'ar' ? 'بدون غلاف' : 'No cover'}
                        </div>
                      )}
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-sky-900 bg-sky-50 border border-dashed border-sky-300 rounded-lg cursor-pointer hover:bg-sky-100">
                        <ImagePlus className="w-4 h-4 shrink-0" />
                        <span>
                          {opCoverUrl
                            ? lang === 'ar'
                              ? 'تغيير صورة الغلاف'
                              : 'Change Cover'
                            : lang === 'ar'
                            ? 'رفع صورة الغلاف من جهازك'
                            : 'Upload Cover Image'}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            handlePaperCoverUpload(e.target.files?.[0]);
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Free / Paid & Price Settings */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        {lang === 'ar' ? 'التسعير' : 'Pricing'}
                      </span>
                      <div className="inline-flex p-0.5 bg-slate-100 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setOpPaid(false);
                            setOpPrice(0);
                          }}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            !opPaid ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {lang === 'ar' ? 'مجاني' : 'Free'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpPaid(true);
                            if (opPrice <= 0) setOpPrice(50);
                          }}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            opPaid ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {lang === 'ar' ? 'مدفوع' : 'Paid'}
                        </button>
                      </div>
                    </div>
                    {opPaid && (
                      <div className="flex items-center gap-2 pt-1">
                        <label className="text-xs font-medium text-slate-600 shrink-0">
                          {lang === 'ar' ? 'السعر (ج.م):' : 'Price (EGP):'}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100000}
                          value={opPrice}
                          onChange={(e) => setOpPrice(Number(e.target.value))}
                          className="w-28 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono-num"
                        />
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                    <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{opFileName || (lang === 'ar' ? 'رفع ملف (حتى 650 كيلوبايت)' : 'Attach file (up to 650KB)')}</span>
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
                  {opFileDataUrl && (
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                      <span className="text-emerald-900 font-medium truncate">
                        ✓ {opFileName} ({formatDataUrlKb(opFileDataUrl)})
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewFile({
                              title: opTitleAr || opTitleEn || opFileName,
                              fileName: opFileName,
                              fileDataUrl: opFileDataUrl,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-white border border-emerald-300 text-emerald-900 rounded hover:bg-emerald-100"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'معاينة' : 'Preview'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpFileName('');
                            setOpFileDataUrl('');
                          }}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <input
                    type="url"
                    dir="ltr"
                    placeholder={
                      lang === 'ar'
                        ? 'أو رابط Google Drive للملفات الكبيرة (https://drive.google.com/...)'
                        : 'Or Google Drive link for large files (https://...)'
                    }
                    value={opExternalUrl}
                    onChange={(e) => setOpExternalUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono-num"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                  >
                    {editingPaperId
                      ? lang === 'ar'
                        ? 'حفظ التعديلات على الكتاب / الورقة'
                        : 'Save Changes'
                      : lang === 'ar'
                      ? 'نشر الورقة / الكتاب'
                      : 'Publish Paper / Book'}
                  </button>
                </form>

                <div className="lg:col-span-7 divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden max-h-[640px] overflow-y-auto">
                  {papers.map((paper) => (
                    <div key={paper.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                      <div className="flex items-center gap-3 min-w-0">
                        {paper.coverUrl ? (
                          <img
                            src={paper.coverUrl}
                            alt={lang === 'ar' ? paper.titleAr : paper.titleEn}
                            referrerPolicy="no-referrer"
                            className="w-12 h-14 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                        ) : (
                          <div className="w-12 h-14 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 text-center px-1 shrink-0">
                            {lang === 'ar' ? 'بلا غلاف' : 'No cover'}
                          </div>
                        )}
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {lang === 'ar' ? paper.titleAr : paper.titleEn}
                          </p>
                          <p className="text-xs text-slate-500">
                            {lang === 'ar' ? paper.categoryAr : paper.categoryEn} ·{' '}
                            <span
                              className={
                                paper.isPaid && paper.priceEgp > 0
                                  ? 'font-semibold text-amber-700'
                                  : 'font-semibold text-emerald-700'
                              }
                            >
                              {paper.isPaid && paper.priceEgp > 0
                                ? `${paper.priceEgp} EGP`
                                : lang === 'ar'
                                ? 'مجاني'
                                : 'Free'}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {paper.fileDataUrl
                              ? `📎 ${paper.fileName || (lang === 'ar' ? 'ملف مرفق' : 'File attached')}`
                              : paper.externalUrl
                              ? `🔗 ${lang === 'ar' ? 'رابط Google Drive' : 'External link'}`
                              : `📝 ${lang === 'ar' ? 'نص جاهز للطباعة' : 'Printable text'}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditPaper(paper)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg"
                          title={lang === 'ar' ? 'تعديل الغلاف أو الملف أو السعر' : 'Edit cover, file, or price'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewFile({
                              title: lang === 'ar' ? paper.titleAr : paper.titleEn,
                              fileName: paper.fileName,
                              fileDataUrl: paper.fileDataUrl,
                              externalUrl: paper.externalUrl,
                              contentText: paper.contentText,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'عرض' : 'View'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteDoc('official_papers', paper.id, paper.authorUid === 'starter')
                          }
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'ar' ? 'رقم الواتساب بالصيغة الدولية (مثال: 2010...)' : 'WhatsApp Number (e.g. 2010...)'}
                    </label>
                    <input
                      type="text"
                      required
                      dir="ltr"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'ar' ? 'البريد الإلكتروني الرسمي للتواصل والشراكات' : 'Official Contact & Partnerships Email'}
                    </label>
                    <input
                      type="email"
                      required
                      dir="ltr"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
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

                {/* Term Promo Banner & Auto-Expiry Settings */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-amber-950">
                        {lang === 'ar'
                          ? 'إعلان باقة الترم في أعلى الموقع والمدة التلقائية'
                          : 'Homepage Term Offer Banner & Auto-Expiry'}
                      </h4>
                      <p className="text-[11px] text-amber-900/80">
                        {lang === 'ar'
                          ? 'يعرض السعر (مثلاً 120 ج.م) والمدة (مثلاً 120 يوم) في أعلى المنصة ويغلق الاشتراك تلقائياً عند انتهاء المدة.'
                          : 'Displays the term offer strip on the homepage and automatically locks subscriptions after N days.'}
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-amber-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termPromoEnabled}
                        onChange={(e) => setTermPromoEnabled(e.target.checked)}
                        className="rounded border-amber-400 text-amber-700"
                      />
                      <span>{lang === 'ar' ? 'إظهار الإعلان في الرئيسية' : 'Show Banner'}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === 'ar' ? 'مدة الترم بالأيام (يقفل بعدها تلقائياً)' : 'Term Duration (Days)'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={termPromoDurationDays}
                        onChange={(e) => setTermPromoDurationDays(Number(e.target.value) || 120)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === 'ar' ? 'عنوان الإعلان بالعربي' : 'Arabic Banner Headline'}
                      </label>
                      <input
                        type="text"
                        maxLength={140}
                        value={termPromoTitleAr}
                        onChange={(e) => setTermPromoTitleAr(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === 'ar' ? 'عنوان الإعلان بالإنجليزي' : 'English Banner Headline'}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        maxLength={140}
                        value={termPromoTitleEn}
                        onChange={(e) => setTermPromoTitleEn(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === 'ar' ? 'وصف الإعلان بالعربي' : 'Arabic Banner Subtitle'}
                      </label>
                      <input
                        type="text"
                        maxLength={240}
                        value={termPromoSubtitleAr}
                        onChange={(e) => setTermPromoSubtitleAr(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === 'ar' ? 'وصف الإعلان بالإنجليزي' : 'English Banner Subtitle'}
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        maxLength={240}
                        value={termPromoSubtitleEn}
                        onChange={(e) => setTermPromoSubtitleEn(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
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
                {/* Smart AI Bulk Importer from PDF or Pasted Text */}
                <form
                  onSubmit={handleExtractQuestionsFromPdf}
                  className="bg-sky-50/70 border border-sky-200 rounded-xl p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-sky-900" />
                        <span>
                          {lang === 'ar'
                            ? 'استيراد أسئلة من ملف PDF دفعة واحدة بالذكاء الاصطناعي'
                            : 'Bulk Import Questions from PDF with AI'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-600">
                        {lang === 'ar'
                          ? 'ارفعي أي ملف PDF (بأي حجم حتى 25 ميجا — يتم تقسيمه تلقائياً!) أو ملف نصي/JSON أو الصقي الأسئلة بالأسفل، وسيستخرجها النظام ويحفظها في البنك لتعمل فوراً في قسم الصفوف ومنصة الكويزات.'
                          : 'Upload any PDF (even large files — auto-split into safe parts!) or TXT/JSON, or paste questions below to import straight into your Question Bank.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <select
                      value={qbGradeId}
                      onChange={(e) => setQbGradeId(e.target.value)}
                      className="md:col-span-3 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      {GRADES.map((g) => (
                        <option key={g.id} value={g.id}>
                          {lang === 'ar' ? g.nameAr : g.nameEn}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'اسم الوحدة (مثلاً Unit 1)' : 'Default Unit / Topic'}
                      value={qbUnitLabel}
                      onChange={(e) => setQbUnitLabel(e.target.value)}
                      className="md:col-span-3 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <label className="md:col-span-6 flex items-center gap-2 px-3 py-2 text-xs bg-white border border-dashed border-sky-400 rounded-lg cursor-pointer hover:bg-sky-50">
                      <Upload className="w-4 h-4 text-sky-900 shrink-0" />
                      <span className="truncate font-medium text-sky-950">
                        {importPreparing
                          ? lang === 'ar'
                            ? 'جاري فحص وتقسيم الملف تلقائياً...'
                            : 'Preparing & splitting PDF...'
                          : importPdfName
                          ? `${importPdfName} (${importPdfSizeMb} MB · ${importPdfTotalPages}p)`
                          : lang === 'ar'
                          ? 'اضغطي لاختيار ملف PDF (بأي حجم) أو TXT/JSON'
                          : 'Choose PDF (any size) or TXT/JSON'}
                      </span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf,.txt,.json,.csv"
                        className="hidden"
                        onChange={(e) => void handlePdfBankFileChange(e.target.files?.[0])}
                      />
                    </label>
                  </div>

                  {importPdfName && importPdfChunks.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                      <span className="text-emerald-950 font-medium">
                        ✓ {importPdfName} — {importPdfSizeMb} MB · {importPdfTotalPages}{' '}
                        {lang === 'ar' ? 'صفحة' : 'pages'} ·{' '}
                        {importPdfChunks.length > 1
                          ? lang === 'ar'
                            ? `مقسم تلقائياً إلى ${importPdfChunks.length} أجزاء جاهزة`
                            : `Auto-split into ${importPdfChunks.length} ready parts`
                          : lang === 'ar'
                          ? 'جاهز للاستخراج'
                          : 'Ready to extract'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setImportPdfName('');
                          setImportPdfChunks([]);
                          setImportPdfTotalPages(0);
                          setImportPdfSizeMb('');
                        }}
                        className="text-xs font-semibold text-rose-700 hover:underline"
                      >
                        {lang === 'ar' ? 'إزالة الملف' : 'Clear PDF'}
                      </button>
                    </div>
                  )}

                  <textarea
                    rows={3}
                    dir="auto"
                    placeholder={
                      lang === 'ar'
                        ? 'أو الصقي نص الأسئلة هنا (مثال: 1. She ___ to school.  a) go  b) goes  c) going  d) went   Answer: b) للاستخراج بالذكاء أو للاستيراد السريع الفوري بدون AI...'
                        : 'Or paste questions text here (e.g., 1. She ___ to school. a) go b) goes ... Answer: b) for AI or instant offline import...'
                    }
                    value={importRawText}
                    onChange={(e) => setImportRawText(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />

                  {extractProgress && (
                    <p className="text-xs font-semibold text-sky-900 bg-white border border-sky-200 rounded-lg px-3.5 py-2">
                      {extractProgress}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={extractingBank || importPreparing || busy}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800 disabled:opacity-60"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>
                        {extractingBank
                          ? lang === 'ar'
                            ? 'جاري استخراج الأسئلة بالذكاء الاصطناعي...'
                            : 'Extracting questions with AI...'
                          : lang === 'ar'
                          ? 'استخراج بالذكاء الاصطناعي الآن'
                          : 'Extract with AI Now'}
                      </span>
                    </button>
                    {importRawText.trim().length > 0 && (
                      <button
                        type="button"
                        disabled={extractingBank || busy}
                        onClick={handleInstantLocalImport}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-60"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'ar'
                            ? 'استيراد سريع للنص المنسق (بدون AI)'
                            : 'Instant Formatted Text Import (No AI)'}
                        </span>
                      </button>
                    )}
                  </div>

                  {extractedPreview.length > 0 && (
                    <div className="bg-white border border-sky-200 rounded-xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-bold text-slate-900">
                          {lang === 'ar'
                            ? `معاينة الأسئلة المستخرجة (${extractedPreview.length} سؤال)`
                            : `Extracted Preview (${extractedPreview.length} questions)`}
                        </p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleSaveExtractedBatch()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-60"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {lang === 'ar'
                              ? `حفظ الكل في بنك الأسئلة (${extractedPreview.length})`
                              : `Save All to Bank (${extractedPreview.length})`}
                          </span>
                        </button>
                      </div>

                      <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                        {extractedPreview.map((item, idx) => (
                          <div key={idx} className="p-3 flex items-start justify-between gap-3 text-xs">
                            <div className="space-y-1 min-w-0" dir="ltr">
                              <p className="font-semibold text-sky-900">{item.unitLabel}</p>
                              <p className="font-medium text-slate-900">
                                {idx + 1}. {item.prompt}
                              </p>
                              <p className="text-slate-600">
                                {item.options.map((opt, oIdx) =>
                                  oIdx === item.correctIndex ? `✓ ${opt}` : opt
                                ).join('  |  ')}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setExtractedPreview((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </form>

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
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            {lang === 'ar' ? 'مدة الاشتراك (يقفل تلقائياً بعدها)' : 'Subscription Duration (Auto-Lock)'}
                          </label>
                          <select
                            value={subDurationDays}
                            onChange={(e) => setSubDurationDays(Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                          >
                            <option value={30}>{lang === 'ar' ? '30 يوم (شهر واحد)' : '30 Days (1 Month)'}</option>
                            <option value={90}>{lang === 'ar' ? '90 يوم (3 شهور)' : '90 Days (3 Months)'}</option>
                            <option value={120}>{lang === 'ar' ? '120 يوم (ترم دراسي كامل)' : '120 Days (Full Term)'}</option>
                            <option value={180}>{lang === 'ar' ? '180 يوم (نصف عام)' : '180 Days (6 Months)'}</option>
                            <option value={0}>{lang === 'ar' ? 'مفتوح بدون انتهاء زمني' : 'No Expiry (Permanent)'}</option>
                          </select>
                        </div>
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
                        subscriptions.map((sub) => {
                          const remDays = getRemainingDays(sub.expiresAtMs);
                          const isExpired = Boolean(sub.active && sub.expiresAtMs && sub.expiresAtMs <= Date.now());
                          return (
                            <div key={sub.id} className="p-3 bg-white flex items-center justify-between gap-2 text-xs">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">{sub.teacherName}</p>
                                <p className="text-slate-500 truncate">
                                  {sub.termLabel} ·{' '}
                                  {isExpired ? (
                                    <span className="text-rose-700 font-semibold">
                                      {lang === 'ar' ? 'منتهي تلقائياً' : 'Expired'}
                                    </span>
                                  ) : sub.active ? (
                                    <span className="text-emerald-700 font-semibold">
                                      {remDays !== null
                                        ? lang === 'ar'
                                          ? `نشط · متبقي ${remDays} يوم`
                                          : `Active · ${remDays}d left`
                                        : lang === 'ar'
                                        ? 'نشط'
                                        : 'Active'}
                                    </span>
                                  ) : (
                                    <span>{lang === 'ar' ? 'متوقف' : 'Paused'}</span>
                                  )}{' '}
                                  · <span className="font-mono">{sub.ownerUid}</span>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => void handleToggleSubscription(sub)}
                                className={`px-2.5 py-1 rounded font-semibold shrink-0 ${
                                  sub.active && !isExpired
                                    ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {sub.active && !isExpired
                                  ? lang === 'ar'
                                    ? 'إيقاف'
                                    : 'Pause'
                                  : isExpired
                                  ? lang === 'ar'
                                    ? 'تجديد المدة'
                                    : 'Renew'
                                  : lang === 'ar'
                                  ? 'تفعيل'
                                  : 'Activate'}
                              </button>
                            </div>
                          );
                        })
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

            {tab === 'links' && (
              <div className="space-y-4">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-1">
                  <h3 className="text-sm font-bold text-sky-950 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-sky-800" />
                    <span>
                      {lang === 'ar'
                        ? 'روابط مباشرة لأقسام المنصة (جاهزة للنسخ في بوستات فيسبوك وواتساب)'
                        : 'Direct Deep Links for Social Media Posts'}
                    </span>
                  </h3>
                  <p className="text-xs text-sky-900/80 leading-relaxed">
                    {lang === 'ar'
                      ? 'أي زائر يضغط على الرابط يفتح له القسم المطلوب فوراً بدون ما يدور من أول الصفحة، ويقدر بعدها يتصفح باقي المنصة بكل سهولة.'
                      : 'Visitors clicking these links jump straight to the target section without scrolling from the top, then explore the rest of the platform freely.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(
                    [
                      {
                        key: 'stories',
                        titleAr: 'قسم القصص الإنجليزية المصورة',
                        titleEn: 'Illustrated English Stories',
                        noteAr: 'مقتطف مجاني للقراءة + شراء النسخة الكاملة',
                        noteEn: 'Free excerpt preview + full story unlock',
                      },
                      {
                        key: 'iq-tests',
                        titleAr: 'اختبارات الذكاء والشخصية والذاكرة (مجاني 100%)',
                        titleEn: 'IQ, Psych & Visual Memory (100% Free)',
                        noteAr: 'مجاني بالنتيجة الفورية + شهادة PDF باسم الطفل مجاناً',
                        noteEn: 'Instant score + free printable PDF certificate',
                      },
                      {
                        key: 'coding-game',
                        titleAr: 'ألعاب تعليم البرمجة للأطفال (مجاني 100%)',
                        titleEn: 'Kids English Coding Games (100% Free)',
                        noteAr: 'لعبتان (ليو + مصنع If/Else) مع النتيجة وشهادة PDF مجاناً',
                        noteEn: 'Robot Leo + LogicLab If/Else with free PDF certificate',
                      },
                      {
                        key: 'english-games',
                        titleAr: 'نادي ألعاب الإنجليزي التفاعلي للأطفال (مجاني 100%)',
                        titleEn: 'Kids English Interactive Mini-Games (100% Free)',
                        noteAr: '3 مستويات للسن · 4 ألعاب ممتدة + نطق ومايكروفون + شهادة PDF مجاناً',
                        noteEn: '3 age tiers · 4 expanded mini-games + mic practice + free PDF certificate',
                      },
                      {
                        key: 'decision-lab',
                        titleAr: 'مختبر صنّاع القرار والمبدعين للأطفال (مجاني 100%)',
                        titleEn: 'Decision Makers & Creators Lab (100% Free)',
                        noteAr: '18 تحدياً في 3 أعمار · محاكاة قرار + غلطة الروبوت + مهام برا الشاشة بدون كهرباء',
                        noteEn: '18 challenges · Decision Sim, Robot Bug Hunt & Safe Off-Screen Missions + PDF award',
                      },
                      {
                        key: 'worksheet-library',
                        titleAr: 'مكتبة حزم أوراق العمل المرقّمة',
                        titleEn: 'Numbered Worksheet Packs',
                        noteAr: 'من التأسيس والروضة حتى الثانوي — نماذج مجانية ومجموعات',
                        noteEn: 'From early years to secondary — free samples & packs',
                      },
                      {
                        key: 'grades',
                        titleAr: 'المكتبة الدراسية حسب الصف (تحضير وامتحانات)',
                        titleEn: 'Grade-Level Curriculum & Preps',
                        noteAr: 'تحضير إلكتروني، امتحانات، وأوراق عمل مجانية ومدفوعة',
                        noteEn: 'Electronic lesson preps, exams & worksheets',
                      },
                      {
                        key: 'certificates',
                        titleAr: 'استوديو شهادات التقدير بالذكاء الاصطناعي',
                        titleEn: 'AI Appreciation Certificate Studio',
                        noteAr: 'معاينة مجانية بصورة الطفل وتنسيق فوري',
                        noteEn: 'Live student photo preview & AI wording',
                      },
                      {
                        key: 'quiz-builder',
                        titleAr: 'بنك الأسئلة ومنصة الكويزات للمعلمين',
                        titleEn: 'Teacher Question Bank & Quiz Builder',
                        noteAr: 'امتحان تجريبي مجاني للمعلمين والطلاب',
                        noteEn: 'Instant quiz links + free trial quiz',
                      },
                      {
                        key: 'teacher-studio',
                        titleAr: 'استوديو تحضير المعلم والنشر على فيسبوك',
                        titleEn: 'Teacher Prep Studio & Facebook Sharing',
                        noteAr: 'صمّم تحضيرك الإلكتروني واحصل على رابط للمشاركة',
                        noteEn: 'Write lesson preps with AI & share directly',
                      },
                      {
                        key: 'courses',
                        titleAr: 'أفضل كورسات تطوير مهارات معلمي الإنجليزية',
                        titleEn: 'Teacher Professional Courses',
                        noteAr: 'تصفح مجاني لأقوى الكورسات التدريبية',
                        noteEn: 'Free curated directory for teachers',
                      },
                    ] as const
                  ).map((item) => {
                    const origin =
                      typeof window !== 'undefined' && window.location.origin
                        ? window.location.origin
                        : 'https://tahdeery.vercel.app';
                    const fullUrl = `${origin}/?go=${item.key}`;
                    const isCopied = copiedKey === item.key;

                    return (
                      <div
                        key={item.key}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900">
                            {lang === 'ar' ? item.titleAr : item.titleEn}
                          </h4>
                          <p className="text-xs text-emerald-700 font-medium">
                            {lang === 'ar' ? item.noteAr : item.noteEn}
                          </p>
                          <p
                            dir="ltr"
                            className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 truncate select-all"
                          >
                            {fullUrl}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(fullUrl);
                              setCopiedKey(item.key);
                              setTimeout(() => setCopiedKey(''), 2000);
                            }}
                            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                              isCopied
                                ? 'bg-emerald-700 text-white'
                                : 'bg-sky-900 text-white hover:bg-sky-800'
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                            <span>
                              {isCopied
                                ? lang === 'ar'
                                  ? 'تم نسخ الرابط!'
                                  : 'Copied!'
                                : lang === 'ar'
                                ? 'نسخ رابط البوست'
                                : 'Copy Link'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              const target = document.getElementById(item.key);
                              if (target) {
                                window.scrollTo({
                                  top: target.getBoundingClientRect().top + window.scrollY - 76,
                                  behavior: 'smooth',
                                });
                              }
                            }}
                            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 whitespace-nowrap"
                          >
                            {lang === 'ar' ? 'انتقال' : 'Jump'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {tab === 'analytics' && (() => {
              const today = new Date();
              const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
                2,
                '0'
              )}-${String(today.getDate()).padStart(2, '0')}`;
              const totalVisits = analyticsEvents.filter((e) => e.eventType === 'page_visit').length;
              const todayVisits = analyticsEvents.filter(
                (e) => e.eventType === 'page_visit' && e.dayKey === todayKey
              ).length;
              const downloadEvents = analyticsEvents.filter((e) => e.eventType === 'file_download');
              const interactiveEvents = analyticsEvents.filter(
                (e) => e.eventType === 'interactive_start' || e.eventType === 'code_redeem'
              );
              const mobileCount = analyticsEvents.filter((e) => e.deviceType === 'mobile').length;
              const mobilePct =
                analyticsEvents.length > 0
                  ? Math.round((mobileCount / analyticsEvents.length) * 100)
                  : 0;

              const downloadRanking = new Map<string, number>();
              downloadEvents.forEach((ev) => {
                downloadRanking.set(ev.itemTitle, (downloadRanking.get(ev.itemTitle) || 0) + 1);
              });
              const topDownloads = Array.from(downloadRanking.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8);

              return (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-sky-50 border border-sky-200 rounded-xl p-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-sky-900" />
                        <span>
                          {lang === 'ar'
                            ? 'سجل الزيارات والتحميلات الفعلي (مباشر)'
                            : 'Live Visitor & Download Analytics'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-600">
                        {lang === 'ar'
                          ? 'يُسجّل تلقائياً كل زيارة جديدة للموقع وكل تحميل ملف أو نشاط تفاعلي مع اسم الملف ونوع الجهاز.'
                          : 'Automatically tracks unique session visits, file downloads, interactive quiz starts, and mobile/desktop usage.'}
                      </p>
                    </div>
                    {analyticsEvents.length > 0 && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleClearOldAnalytics}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
                      >
                        {lang === 'ar' ? 'تصفير السجل' : 'Clear Logs'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-2xl font-bold text-slate-900 font-mono-num">{totalVisits}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {lang === 'ar' ? 'إجمالي الزيارات' : 'Total Visits'}
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-2xl font-bold text-emerald-700 font-mono-num">{todayVisits}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {lang === 'ar' ? 'زيارات اليوم' : "Today's Visits"}
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-2xl font-bold text-sky-900 font-mono-num">
                        {downloadEvents.length}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {lang === 'ar' ? 'مرات تحميل الملفات' : 'File Downloads'}
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-2xl font-bold text-amber-700 font-mono-num">{mobilePct}%</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {lang === 'ar'
                          ? `موبايل (مقابل ${100 - mobilePct}% كمبيوتر)`
                          : `Mobile (${interactiveEvents.length} actions)`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                        {lang === 'ar' ? 'أكثر الملفات تحميلاً' : 'Most Downloaded Files'}
                      </h4>
                      {topDownloads.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">
                          {lang === 'ar'
                            ? 'لم يتم تسجيل تحميلات بعد — سيظهر كل ملف يحمله الزوار هنا فوراً.'
                            : 'No file downloads recorded yet.'}
                        </p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {topDownloads.map(([title, count]) => (
                            <div key={title} className="py-2 flex items-center justify-between gap-2 text-xs">
                              <span className="font-medium text-slate-800 truncate">{title}</span>
                              <span className="font-mono-num font-bold text-sky-900 shrink-0">
                                {count}×
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                        {lang === 'ar'
                          ? `آخر الأنشطة (${analyticsEvents.length})`
                          : `Recent Activity (${analyticsEvents.length})`}
                      </h4>
                      <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                        {analyticsEvents.length === 0 ? (
                          <p className="text-xs text-slate-500 py-4 text-center">
                            {lang === 'ar' ? 'لا توجد أنشطة مسجلة حتى الآن.' : 'No recorded events yet.'}
                          </p>
                        ) : (
                          analyticsEvents.slice(0, 60).map((ev) => (
                            <div key={ev.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                              <div className="min-w-0 space-y-0.5">
                                <p className="font-semibold text-slate-900 truncate">{ev.itemTitle}</p>
                                <p className="text-[11px] text-slate-500">
                                  {ev.eventType === 'file_download'
                                    ? lang === 'ar'
                                      ? '📥 تحميل ملف'
                                      : '📥 Download'
                                    : ev.eventType === 'code_redeem'
                                    ? lang === 'ar'
                                      ? '🔑 تفعيل كود'
                                      : '🔑 Code Redeem'
                                    : ev.eventType === 'interactive_start'
                                    ? lang === 'ar'
                                      ? '▶ نشاط تفاعلي'
                                      : '▶ Interactive'
                                    : lang === 'ar'
                                    ? '👁 زيارة للموقع'
                                    : '👁 Visit'}{' '}
                                  · {ev.section} · {ev.deviceType === 'mobile' ? '📱' : '💻'}
                                </p>
                              </div>
                              <span className="font-mono-num text-[11px] text-slate-400 shrink-0">
                                {ev.dayKey}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {tab === 'codes' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={handleGenerateActivationCode}
                  className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3.5"
                >
                  <h3 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-700" />
                    <span>
                      {lang === 'ar'
                        ? 'توليد كود تفعيل فوري للملفات المدفوعة'
                        : 'Generate Instant Activation Code'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lang === 'ar'
                      ? 'بعد ما العميل يحوّل إنستاباي، ولّدي كوداً هنا وانسخيه في الواتساب — بمجرد ما يكتبه في الموقع يفتحله الملف فوراً.'
                      : 'Generate a code for any paid item or full VIP access and send it to the customer on WhatsApp.'}
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'ar' ? 'المحتوى المطلوب فتحه بالكود' : 'Target Item to Unlock'}
                    </label>
                    <select
                      value={codeTargetSelection}
                      onChange={(e) => setCodeTargetSelection(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="all_paid:all">
                        {lang === 'ar'
                          ? '★ فتح كل الملفات والحزم والقصص المدفوعة (VIP)'
                          : '★ Full Paid Library Access (VIP)'}
                      </option>
                      {resources
                        .filter((r) => r.isPaid)
                        .map((r) => (
                          <option key={r.id} value={`resource:${r.id}`}>
                            [{lang === 'ar' ? 'صف' : 'Grade'}] {lang === 'ar' ? r.titleAr : r.titleEn}
                          </option>
                        ))}
                      {packs
                        .filter((p) => p.isPaid)
                        .map((p) => (
                          <option key={p.id} value={`pack:${p.id}`}>
                            [{lang === 'ar' ? 'حزمة' : 'Pack'} #{p.packNumber}]{' '}
                            {lang === 'ar' ? p.titleAr : p.titleEn}
                          </option>
                        ))}
                      {stories
                        .filter((s) => s.isPaid)
                        .map((s) => (
                          <option key={s.id} value={`story:${s.id}`}>
                            [{lang === 'ar' ? 'قصة' : 'Story'}] {lang === 'ar' ? s.titleAr : s.titleEn}
                          </option>
                        ))}
                      {papers
                        .filter((pp) => pp.isPaid)
                        .map((pp) => (
                          <option key={pp.id} value={`paper:${pp.id}`}>
                            [{lang === 'ar' ? 'كتاب/ورقة' : 'Book/Paper'}] {lang === 'ar' ? pp.titleAr : pp.titleEn}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === 'ar' ? 'أقصى عدد استخدام' : 'Max Uses'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={codeMaxUses}
                        onChange={(e) => setCodeMaxUses(Number(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === 'ar' ? 'مدة الصلاحية (توقيت آلي)' : 'Auto-Expiry Duration'}
                      </label>
                      <select
                        value={codeDurationDays}
                        onChange={(e) => setCodeDurationDays(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value={0}>{lang === 'ar' ? 'دائم (للملفات الفردية)' : 'Permanent'}</option>
                        <option value={30}>{lang === 'ar' ? '30 يوم (شهر)' : '30 Days'}</option>
                        <option value={90}>{lang === 'ar' ? '90 يوم (3 شهور)' : '90 Days'}</option>
                        <option value={120}>{lang === 'ar' ? '120 يوم (ترم كامل)' : '120 Days (Term)'}</option>
                        <option value={180}>{lang === 'ar' ? '180 يوم (نصف عام)' : '180 Days'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === 'ar' ? 'اسم العميل / ملاحظة' : 'Customer Note'}
                      </label>
                      <input
                        type="text"
                        value={codeNote}
                        onChange={(e) => setCodeNote(e.target.value)}
                        placeholder={lang === 'ar' ? 'أ. أحمد — إنستاباي' : 'Client name'}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-2.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {lang === 'ar' ? 'توليد كود تفعيل جديد الآن' : 'Generate New Code'}
                  </button>

                  {lastCreatedCode && (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-bold text-emerald-950">
                        {lang === 'ar' ? 'جاهز للإرسال على الواتساب:' : 'Ready to send:'}
                      </p>
                      <div className="flex items-center justify-between gap-2 bg-white border border-emerald-200 rounded px-3 py-2">
                        <span dir="ltr" className="font-mono text-sm font-bold text-slate-900">
                          {lastCreatedCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const expirySuffixAr =
                              lastCreatedCodeDurationDays > 0
                                ? `\nمدة الصلاحية: ${lastCreatedCodeDurationDays} يوم (يقفل تلقائياً بعدها).`
                                : '';
                            const expirySuffixEn =
                              lastCreatedCodeDurationDays > 0
                                ? `\nValid for ${lastCreatedCodeDurationDays} days (auto-expires afterwards).`
                                : '';
                            const msg =
                              lang === 'ar'
                                ? `تم تأكيد الدفع! كود التفعيل الخاص بك هو: ${lastCreatedCode}${expirySuffixAr}\nادخلي على الموقع واضغطي (تفعيل بكود) في الشريط العلوي لفتح المحتوى فوراً:\nhttps://tahdeery.vercel.app`
                                : `Your activation code is: ${lastCreatedCode}${expirySuffixEn}\nOpen https://tahdeery.vercel.app and click "Redeem Code" to unlock immediately.`;
                            void navigator.clipboard.writeText(msg);
                            setCopiedKey(`code_${lastCreatedCode}`);
                            setTimeout(() => setCopiedKey(''), 2000);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-700 text-white rounded hover:bg-emerald-600"
                        >
                          {copiedKey === `code_${lastCreatedCode}` ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {copiedKey === `code_${lastCreatedCode}`
                              ? labels.copied
                              : lang === 'ar'
                              ? 'نسخ رسالة الواتساب'
                              : 'Copy Message'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </form>

                <div className="lg:col-span-7 space-y-2.5 max-h-[540px] overflow-y-auto">
                  <p className="text-xs font-bold text-slate-700">
                    {lang === 'ar'
                      ? `الأكواد المُصدرة (${activationCodes.length})`
                      : `Issued Codes (${activationCodes.length})`}
                  </p>
                  {activationCodes.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center bg-slate-50 border border-slate-200 rounded-xl">
                      {lang === 'ar'
                        ? 'لم تولّدي أكواد تفعيل بعد.'
                        : 'No activation codes generated yet.'}
                    </p>
                  ) : (
                    activationCodes.map((c) => {
                      const remDays = getRemainingDays(c.expiresAtMs);
                      const isExpired = Boolean(c.expiresAtMs && c.expiresAtMs <= Date.now());
                      return (
                      <div
                        key={c.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span dir="ltr" className="font-mono text-sm font-bold text-sky-950">
                              {c.code}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                c.active && !isExpired && c.usedCount < c.maxUses
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {c.usedCount} / {c.maxUses}{' '}
                              {lang === 'ar' ? 'استخدام' : 'uses'}
                            </span>
                            {isExpired ? (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                                {lang === 'ar' ? 'منتهي الصلاحية' : 'Expired'}
                              </span>
                            ) : remDays !== null ? (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono-num">
                                {lang === 'ar' ? `متبقي ${remDays} يوم` : `${remDays}d left`}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {c.targetTitle}
                            {c.note ? ` · ${c.note}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(c.code);
                              setCopiedKey(`row_${c.id}`);
                              setTimeout(() => setCopiedKey(''), 1500);
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-sky-50 text-sky-900 border border-sky-200 rounded-lg hover:bg-sky-100"
                          >
                            {copiedKey === `row_${c.id}` ? labels.copied : lang === 'ar' ? 'نسخ' : 'Copy'}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleToggleCodeActive(c)}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                          >
                            {c.active
                              ? lang === 'ar'
                                ? 'إيقاف'
                                : 'Pause'
                              : lang === 'ar'
                              ? 'تفعيل'
                              : 'Enable'}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDeleteActivationCode(c)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl max-h-[88vh] flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">{previewFile.title}</h3>
                {previewFile.fileName && (
                  <p className="text-xs text-slate-500 truncate">
                    {previewFile.fileName}
                    {previewFile.fileDataUrl ? ` (${formatDataUrlKb(previewFile.fileDataUrl)})` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {previewFile.fileDataUrl && (
                  <a
                    href={previewFile.fileDataUrl}
                    download={previewFile.fileName || 'file'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تحميل' : 'Download'}</span>
                  </a>
                )}
                {previewFile.externalUrl && (
                  <a
                    href={previewFile.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'فتح الرابط' : 'Open Link'}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto min-h-[260px] bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-center">
              {previewFile.fileDataUrl?.startsWith('data:image/') ? (
                <img
                  src={previewFile.fileDataUrl}
                  alt={previewFile.title}
                  className="max-h-[60vh] w-auto object-contain rounded"
                />
              ) : previewBlobUrl && previewFile.fileDataUrl?.includes('pdf') ? (
                <iframe
                  src={previewBlobUrl}
                  title={previewFile.title}
                  className="w-full h-[60vh] rounded border border-slate-200 bg-white"
                />
              ) : previewFile.fileDataUrl ? (
                <div className="text-center space-y-3 p-6">
                  <FileText className="w-10 h-10 text-sky-800 mx-auto" />
                  <p className="text-sm font-semibold text-slate-900">
                    {lang === 'ar' ? 'الملف مرفق وموجود بنجاح:' : 'File attached successfully:'}{' '}
                    {previewFile.fileName}
                  </p>
                  <a
                    href={previewFile.fileDataUrl}
                    download={previewFile.fileName || 'file'}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                  >
                    <Download className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'تنزيل وفتح الملف على جهازك' : 'Download & Open File'}</span>
                  </a>
                </div>
              ) : previewFile.externalUrl ? (
                <div className="text-center space-y-3 p-6">
                  <ExternalLink className="w-10 h-10 text-sky-800 mx-auto" />
                  <p className="text-xs text-slate-600 font-mono break-all max-w-md">
                    {previewFile.externalUrl}
                  </p>
                  <a
                    href={previewFile.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'فتح الملف في Google Drive' : 'Open in Google Drive'}</span>
                  </a>
                </div>
              ) : (
                <pre className="w-full h-full text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed p-2">
                  {previewFile.contentText || (lang === 'ar' ? 'لا يوجد محتوى نصي.' : 'No text content.')}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
