import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { ActivationCode, AnalyticsEvent, Lang } from '../types';

const UNLOCKED_STORAGE_KEY = 'linguacraft_unlocked_v1';
const VISIT_SESSION_KEY = 'lc_visit_logged_v1';

export interface UnlockedState {
  allPaid: boolean;
  ids: string[];
}

export function getUnlockedState(): UnlockedState {
  if (typeof window === 'undefined') return { allPaid: false, ids: [] };
  try {
    const raw = window.localStorage.getItem(UNLOCKED_STORAGE_KEY);
    if (!raw) return { allPaid: false, ids: [] };
    const parsed = JSON.parse(raw) as Partial<UnlockedState>;
    return {
      allPaid: Boolean(parsed.allPaid),
      ids: Array.isArray(parsed.ids) ? parsed.ids.filter((x): x is string => typeof x === 'string') : [],
    };
  } catch {
    return { allPaid: false, ids: [] };
  }
}

export function isItemUnlocked(state: UnlockedState, itemId: string): boolean {
  return state.allPaid || state.ids.includes(itemId);
}

export function saveUnlockedEntry(
  targetType: ActivationCode['targetType'],
  targetId: string
): UnlockedState {
  const current = getUnlockedState();
  const next: UnlockedState = {
    allPaid: current.allPaid || targetType === 'all_paid' || targetId === 'all',
    ids:
      targetId && targetId !== 'all' && !current.ids.includes(targetId)
        ? [...current.ids, targetId]
        : current.ids,
  };
  try {
    window.localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function generateRandomActivationCode(prefix = 'LC'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${block(4)}-${block(4)}`;
}

function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDeviceType(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < 768 ? 'mobile' : 'desktop';
}

export async function trackAnalyticsEvent(params: {
  eventType: AnalyticsEvent['eventType'];
  section: string;
  itemTitle: string;
  itemId?: string;
  lang?: Lang;
}): Promise<void> {
  try {
    const id = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await setDoc(doc(db, 'analytics_events', id), {
      eventType: params.eventType,
      section: params.section.slice(0, 40) || 'general',
      itemTitle: (params.itemTitle || 'Activity').slice(0, 180),
      ...(params.itemId ? { itemId: params.itemId.slice(0, 128) } : {}),
      deviceType: getDeviceType(),
      lang: params.lang === 'en' ? 'en' : 'ar',
      dayKey: getTodayKey(),
      createdAt: serverTimestamp(),
    });
  } catch {
    // Telemetry must never interrupt user flow
  }
}

export function trackSessionVisitOnce(lang: Lang): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.sessionStorage.getItem(VISIT_SESSION_KEY)) return;
    window.sessionStorage.setItem(VISIT_SESSION_KEY, '1');
    void trackAnalyticsEvent({
      eventType: 'page_visit',
      section: 'home',
      itemTitle: window.location.search || 'Landing Page',
      lang,
    });
  } catch {
    // Ignore storage block
  }
}

export interface RedeemResult {
  ok: boolean;
  message: string;
  unlockedState?: UnlockedState;
  targetTitle?: string;
}

export async function redeemActivationCode(
  rawCode: string,
  lang: Lang
): Promise<RedeemResult> {
  const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (cleanCode.length < 4) {
    return {
      ok: false,
      message:
        lang === 'ar'
          ? 'يرجى كتابة كود التفعيل بشكل صحيح.'
          : 'Please enter a valid activation code.',
    };
  }

  try {
    const ref = doc(db, 'activation_codes', cleanCode);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        ok: false,
        message:
          lang === 'ar'
            ? 'هذا الكود غير موجود — تأكدي من كتابته كما وصلك من الإدارة.'
            : 'Activation code not found. Please check spelling.',
      };
    }

    const data = snap.data() as Omit<ActivationCode, 'id'>;
    if (!data.active) {
      return {
        ok: false,
        message:
          lang === 'ar'
            ? 'تم إيقاف هذا الكود حالياً من الإدارة.'
            : 'This activation code has been deactivated.',
      };
    }

    if (data.usedCount >= data.maxUses) {
      return {
        ok: false,
        message:
          lang === 'ar'
            ? 'تم استهلاك الحد الأقصى لاستخدامات هذا الكود.'
            : 'This activation code has reached its maximum uses.',
      };
    }

    await updateDoc(ref, { usedCount: data.usedCount + 1 });

    const updatedUnlock = saveUnlockedEntry(data.targetType, data.targetId);
    void trackAnalyticsEvent({
      eventType: 'code_redeem',
      section: 'activation',
      itemTitle: `${cleanCode} · ${data.targetTitle}`,
      itemId: data.targetId,
      lang,
    });

    return {
      ok: true,
      unlockedState: updatedUnlock,
      targetTitle: data.targetTitle,
      message:
        lang === 'ar'
          ? `تم التفعيل بنجاح! مفتوح الآن: ${data.targetTitle}`
          : `Unlocked successfully: ${data.targetTitle}`,
    };
  } catch (err) {
    console.error('Redeem error:', err);
    return {
      ok: false,
      message:
        lang === 'ar'
          ? 'تعذر التحقق من الكود حالياً، حاولي مرة أخرى.'
          : 'Could not verify code right now. Please try again.',
    };
  }
}
