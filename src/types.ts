export type Lang = 'ar' | 'en';

export type ResourceCategory = 'prep' | 'exam' | 'worksheet' | 'activity';

export type WorksheetLevel = 'age_3_5' | 'age_5_7' | 'primary' | 'prep_sec';

export type WorksheetTrack =
  | 'arabic_letters'
  | 'english_letters'
  | 'numbers'
  | 'writing_skills'
  | 'general';

export interface WorksheetPack {
  id: string;
  packNumber: number;
  levelId: WorksheetLevel;
  track: WorksheetTrack;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  isPaid: boolean;
  priceEgp: number;
  allowWhiteLabel: boolean;
  authorUid: string;
  createdAt?: unknown;
}

export interface WorksheetPackItem {
  id: string;
  packId: string;
  itemOrder: number;
  titleEn: string;
  titleAr: string;
  kind: 'worksheet' | 'activity';
  isFreeSample: boolean;
  contentText: string;
  fileName?: string;
  fileDataUrl?: string;
  externalUrl?: string;
  authorUid: string;
  createdAt?: unknown;
}

export interface GradeInfo {
  id: string;
  stage: 'primary' | 'prep' | 'secondary';
  nameAr: string;
  nameEn: string;
  shortAr: string;
  shortEn: string;
}

export interface AcademySettings {
  academyNameEn: string;
  academyNameAr: string;
  logoDataUrl?: string;
  instapayHandle: string;
  instapayUrl?: string;
  whatsappNumber: string;
  contactEmail?: string;
  whiteLabelPriceEgp: number;
  aiCertificatePriceEgp: number;
  quizTermPriceEgp?: number;
  termPromoEnabled?: boolean;
  termPromoTitleAr?: string;
  termPromoTitleEn?: string;
  termPromoSubtitleAr?: string;
  termPromoSubtitleEn?: string;
  termPromoDurationDays?: number;
  seeded: boolean;
  updatedAt?: unknown;
}

export type CourseTrack = 'phonics' | 'methodology' | 'ai_teaching' | 'career';

export interface AffiliateCourse {
  id: string;
  titleEn: string;
  titleAr: string;
  provider: string;
  track: CourseTrack;
  descriptionEn: string;
  descriptionAr: string;
  durationLabel: string;
  affiliateUrl: string;
  authorUid: string;
  createdAt?: unknown;
}

export interface QuizQuestionItem {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface QuestionBankItem {
  id: string;
  gradeId: string;
  unitLabel: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  authorUid: string;
  createdAt?: unknown;
}

export interface TeacherQuiz {
  id: string;
  title: string;
  gradeLabel: string;
  teacherName: string;
  schoolOrCenter?: string;
  isTrial: boolean;
  isPublished: boolean;
  timeLimitMinutes: number;
  questions: QuizQuestionItem[];
  ownerUid: string;
  createdAt?: unknown;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizOwnerUid: string;
  studentName: string;
  studentGroup?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: number[];
  submittedAt?: unknown;
}

export interface TeacherSubscription {
  id: string;
  ownerUid: string;
  teacherName: string;
  teacherEmail?: string;
  termLabel: string;
  active: boolean;
  durationDays?: number;
  expiresAtMs?: number;
  activatedByUid: string;
  activatedAt?: unknown;
}

export interface GradeResource {
  id: string;
  gradeId: string;
  category: ResourceCategory;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  isInteractive: boolean;
  isPaid: boolean;
  priceEgp: number;
  allowWhiteLabel: boolean;
  contentText: string;
  fileName?: string;
  fileDataUrl?: string;
  externalUrl?: string;
  authorUid: string;
  createdAt?: unknown;
}

export interface StoryItem {
  id: string;
  titleEn: string;
  titleAr: string;
  levelLabel: string;
  summaryEn: string;
  summaryAr: string;
  previewExcerpt: string;
  coverUrl: string;
  isPaid: boolean;
  priceEgp: number;
  fileName?: string;
  fileDataUrl?: string;
  externalUrl?: string;
  authorUid: string;
  createdAt?: unknown;
}

export interface OfficialPaper {
  id: string;
  titleEn: string;
  titleAr: string;
  categoryEn: string;
  categoryAr: string;
  descriptionEn: string;
  descriptionAr: string;
  contentText: string;
  coverUrl?: string;
  fileName?: string;
  fileDataUrl?: string;
  externalUrl?: string;
  isPaid: boolean;
  priceEgp: number;
  authorUid: string;
  createdAt?: unknown;
}

export interface NewsItem {
  id: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  tagEn: string;
  tagAr: string;
  authorUid: string;
  createdAt?: unknown;
}

export interface TeacherPrep {
  id: string;
  teacherName: string;
  schoolOrCenter?: string;
  gradeLabel: string;
  unitTitle: string;
  lessonTitle: string;
  objectives: string;
  warmUp?: string;
  vocabulary?: string;
  procedures: string;
  assessment?: string;
  homework?: string;
  ownerUid: string;
  createdAt?: unknown;
}

export interface OrderRecord {
  id: string;
  itemType:
    | 'activity'
    | 'worksheet'
    | 'worksheet_pack'
    | 'exam'
    | 'story'
    | 'whitelabel'
    | 'certificate'
    | 'paper'
    | 'quiz_term';
  itemTitle: string;
  amountEgp: number;
  customerName: string;
  customBrandingName?: string;
  instapayRef?: string;
  status: 'pending_whatsapp' | 'confirmed';
  ownerUid: string;
  createdAt?: unknown;
}

export type VisitorRole = 'all' | 'teacher' | 'student' | 'parent';

export interface ActivationCode {
  id: string;
  code: string;
  targetType: 'resource' | 'pack' | 'story' | 'paper' | 'all_paid';
  targetId: string;
  targetTitle: string;
  note?: string;
  maxUses: number;
  usedCount: number;
  active: boolean;
  durationDays?: number;
  expiresAtMs?: number;
  createdByUid: string;
  createdAt?: unknown;
}

export interface AnalyticsEvent {
  id: string;
  eventType: 'page_visit' | 'file_download' | 'interactive_start' | 'code_redeem';
  section: string;
  itemTitle: string;
  itemId?: string;
  deviceType: 'mobile' | 'desktop';
  lang: Lang;
  dayKey: string;
  createdAt?: unknown;
}

export interface PaymentIntent {
  itemType: OrderRecord['itemType'];
  itemTitle: string;
  amountEgp: number;
  targetType?: ActivationCode['targetType'];
  targetId?: string;
  allowCustomBranding?: boolean;
  defaultBrandingName?: string;
  extraNote?: string;
}

export const GRADES: GradeInfo[] = [
  { id: 'prim1', stage: 'primary', nameAr: 'الصف الأول الابتدائي', nameEn: 'Primary 1', shortAr: '1 ابتدائي', shortEn: 'Grade 1' },
  { id: 'prim2', stage: 'primary', nameAr: 'الصف الثاني الابتدائي', nameEn: 'Primary 2', shortAr: '2 ابتدائي', shortEn: 'Grade 2' },
  { id: 'prim3', stage: 'primary', nameAr: 'الصف الثالث الابتدائي', nameEn: 'Primary 3', shortAr: '3 ابتدائي', shortEn: 'Grade 3' },
  { id: 'prim4', stage: 'primary', nameAr: 'الصف الرابع الابتدائي', nameEn: 'Primary 4', shortAr: '4 ابتدائي', shortEn: 'Grade 4' },
  { id: 'prim5', stage: 'primary', nameAr: 'الصف الخامس الابتدائي', nameEn: 'Primary 5', shortAr: '5 ابتدائي', shortEn: 'Grade 5' },
  { id: 'prim6', stage: 'primary', nameAr: 'الصف السادس الابتدائي', nameEn: 'Primary 6', shortAr: '6 ابتدائي', shortEn: 'Grade 6' },
  { id: 'prep1', stage: 'prep', nameAr: 'الصف الأول الإعدادي', nameEn: 'Preparatory 1', shortAr: '1 إعدادي', shortEn: 'Prep 1' },
  { id: 'prep2', stage: 'prep', nameAr: 'الصف الثاني الإعدادي', nameEn: 'Preparatory 2', shortAr: '2 إعدادي', shortEn: 'Prep 2' },
  { id: 'prep3', stage: 'prep', nameAr: 'الصف الثالث الإعدادي', nameEn: 'Preparatory 3', shortAr: '3 إعدادي', shortEn: 'Prep 3' },
  { id: 'sec1', stage: 'secondary', nameAr: 'الصف الأول الثانوي', nameEn: 'Secondary 1', shortAr: '1 ثانوي', shortEn: 'Sec 1' },
  { id: 'sec2', stage: 'secondary', nameAr: 'الصف الثاني الثانوي', nameEn: 'Secondary 2', shortAr: '2 ثانوي', shortEn: 'Sec 2' },
  { id: 'sec3', stage: 'secondary', nameAr: 'الصف الثالث الثانوي', nameEn: 'Secondary 3', shortAr: '3 ثانوي', shortEn: 'Sec 3' },
];
