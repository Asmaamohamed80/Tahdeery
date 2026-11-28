import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { ActivationCode, AnalyticsEvent, Lang } from '../types';

const UNLOCKED_STORAGE_KEY = 'linguacraft_unlocked_v1';
const VISIT_SESSION_KEY = 'lc_visit_logged_v1';

export interface UnlockedState {
  allPaid: boolean;
  allPaidExpiresAtMs?: number | null;
  ids: string[];
  itemExpiries?: Record<string, number>;
}

export function getRemainingDays(expiresAtMs?: number | null): number | null {
  if (!expiresAtMs || typeof expiresAtMs !== 'number') return null;
  const diff = expiresAtMs - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86400000);
}

export function getUnlockedState(): UnlockedState {
  if (typeof window === 'undefined') return { allPaid: false, ids: [], itemExpiries: {} };
  try {
    const raw = window.localStorage.getItem(UNLOCKED_STORAGE_KEY);
    if (!raw) return { allPaid: false, ids: [], itemExpiries: {} };
    const parsed = JSON.parse(raw) as Partial<UnlockedState>;
    const now = Date.now();

    const rawAllExp = typeof parsed.allPaidExpiresAtMs === 'number' ? parsed.allPaidExpiresAtMs : null;
    const activeAllPaid = Boolean(parsed.allPaid) && (!rawAllExp || rawAllExp > now);

    const rawExpiries =
      parsed.itemExpiries && typeof parsed.itemExpiries === 'object' ? parsed.itemExpiries : {};
    const cleanExpiries: Record<string, number> = {};
    const cleanIds = Array.isArray(parsed.ids)
      ? parsed.ids.filter((id): id is string => {
          if (typeof id !== 'string') return false;
          const exp = rawExpiries[id];
          if (typeof exp === 'number') {
            if (exp <= now) return false;
            cleanExpiries[id] = exp;
          }
          return true;
        })
      : [];

    return {
      allPaid: activeAllPaid,
      allPaidExpiresAtMs: activeAllPaid ? rawAllExp : null,
      ids: cleanIds,
      itemExpiries: cleanExpiries,
    };
  } catch {
    return { allPaid: false, ids: [], itemExpiries: {} };
  }
}

export function isItemUnlocked(state: UnlockedState, itemId: string): boolean {
  const now = Date.now();
  if (state.allPaid && (!state.allPaidExpiresAtMs || state.allPaidExpiresAtMs > now)) {
    return true;
  }
  if (state.ids.includes(itemId)) {
    const exp = state.itemExpiries?.[itemId];
    return !exp || exp > now;
  }
  return false;
}

export function saveUnlockedEntry(
  targetType: ActivationCode['targetType'],
  targetId: string,
  expiresAtMs?: number | null
): UnlockedState {
  const current = getUnlockedState();
  const isAll = targetType === 'all_paid' || targetId === 'all';

  let nextAllExp = current.allPaidExpiresAtMs ?? null;
  if (isAll) {
    if (!expiresAtMs) {
      nextAllExp = null; // permanent VIP overrides timed
    } else if (!current.allPaid || (nextAllExp && expiresAtMs > nextAllExp)) {
      nextAllExp = expiresAtMs;
    }
  }

  const nextExpiries: Record<string, number> = { ...(current.itemExpiries || {}) };
  if (!isAll && targetId) {
    if (!expiresAtMs) {
      delete nextExpiries[targetId];
    } else {
      const prev = nextExpiries[targetId];
      if (!prev || expiresAtMs > prev) nextExpiries[targetId] = expiresAtMs;
    }
  }

  const next: UnlockedState = {
    allPaid: current.allPaid || isAll,
    allPaidExpiresAtMs: nextAllExp,
    ids:
      !isAll && targetId && !current.ids.includes(targetId)
        ? [...current.ids, targetId]
        : current.ids,
    itemExpiries: nextExpiries,
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

    if (data.expiresAtMs && data.expiresAtMs <= Date.now()) {
      return {
        ok: false,
        message:
          lang === 'ar'
            ? 'انتهت مدة صلاحية هذا الكود بانتهاء الترم — تواصل مع الإدارة للتجديد.'
            : 'This activation code has expired.',
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

    const effectiveExpiresAtMs =
      data.expiresAtMs && data.expiresAtMs > Date.now()
        ? data.expiresAtMs
        : data.durationDays && data.durationDays > 0
        ? Date.now() + data.durationDays * 86400000
        : null;

    const updatedUnlock = saveUnlockedEntry(data.targetType, data.targetId, effectiveExpiresAtMs);
    void trackAnalyticsEvent({
      eventType: 'code_redeem',
      section: 'activation',
      itemTitle: `${cleanCode} · ${data.targetTitle}`,
      itemId: data.targetId,
      lang,
    });

    const daysLeft = getRemainingDays(effectiveExpiresAtMs);
    const durationNoteAr = daysLeft ? ` (صالح لمدة ${daysLeft} يوم)` : '';
    const durationNoteEn = daysLeft ? ` (Valid for ${daysLeft} days)` : '';

    return {
      ok: true,
      unlockedState: updatedUnlock,
      targetTitle: data.targetTitle,
      message:
        lang === 'ar'
          ? `تم التفعيل بنجاح! مفتوح الآن: ${data.targetTitle}${durationNoteAr}`
          : `Unlocked successfully: ${data.targetTitle}${durationNoteEn}`,
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
