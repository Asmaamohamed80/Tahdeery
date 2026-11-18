export type Lang = 'ar' | 'en';

export type ResourceCategory = 'prep' | 'exam' | 'activity';

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
  instapayHandle: string;
  instapayUrl?: string;
  whatsappNumber: string;
  whiteLabelPriceEgp: number;
  aiCertificatePriceEgp: number;
  seeded: boolean;
  updatedAt?: unknown;
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
  fileName?: string;
  fileDataUrl?: string;
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
  itemType: 'activity' | 'exam' | 'story' | 'whitelabel' | 'certificate' | 'paper';
  itemTitle: string;
  amountEgp: number;
  customerName: string;
  customBrandingName?: string;
  instapayRef?: string;
  status: 'pending_whatsapp' | 'confirmed';
  ownerUid: string;
  createdAt?: unknown;
}

export interface PaymentIntent {
  itemType: OrderRecord['itemType'];
  itemTitle: string;
  amountEgp: number;
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
