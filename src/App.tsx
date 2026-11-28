import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Brain,
  CheckCircle2,
  Code2,
  Compass,
  Download,
  FileText,
  Gamepad2,
  Globe,
  GraduationCap,
  KeyRound,
  Lock,
  Newspaper,
  Play,
  SlidersHorizontal,
  Stamp,
  Users,
  X,
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  ADMIN_EMAIL,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  CLASSROOM_PHONICS_IMAGE,
  DEFAULT_SETTINGS,
  HERO_BANNER_IMAGE,
  STARTER_COURSES,
  STARTER_NEWS,
  STARTER_PAPERS,
  STARTER_QUESTION_BANK,
  STARTER_RESOURCES,
  STARTER_STORIES,
  STARTER_WORKSHEET_ITEMS,
  STARTER_WORKSHEET_PACKS,
  STUDENT_AWARD_IMAGE,
  STUDENT_TABLET_IMAGE,
} from './data/starterCatalog';
import {
  GRADES,
  type AcademySettings,
  type ActivationCode,
  type AffiliateCourse,
  type AnalyticsEvent,
  type GradeResource,
  type Lang,
  type NewsItem,
  type OfficialPaper,
  type OrderRecord,
  type PaymentIntent,
  type QuestionBankItem,
  type QuizAttempt,
  type ResourceCategory,
  type StoryItem,
  type TeacherQuiz,
  type TeacherSubscription,
  type VisitorRole,
  type WorksheetPack,
  type WorksheetPackItem,
} from './types';
import { t } from './i18n';
import { downloadTextOrHtmlFile } from './utils/download';
import {
  getRemainingDays,
  getUnlockedState,
  isItemUnlocked,
  redeemActivationCode,
  trackAnalyticsEvent,
  trackSessionVisitOnce,
  type UnlockedState,
} from './utils/analyticsAndUnlock';
import { Header } from './components/Header';
import { PaymentModal } from './components/PaymentModal';
import { InteractiveQuizModal } from './components/InteractiveQuizModal';
import { CertificateStudio } from './components/CertificateStudio';
import { TeacherPrepStudio } from './components/TeacherPrepStudio';
import { SharedPrepViewer } from './components/SharedPrepViewer';
import { WorksheetPacksSection } from './components/WorksheetPacksSection';
import { CoursesAffiliateSection } from './components/CoursesAffiliateSection';
import { TeacherQuizSection } from './components/TeacherQuizSection';
import { PublicQuizViewer } from './components/PublicQuizViewer';
import { IqChallengeSection } from './components/IqChallengeSection';
import { KidsCodingGameSection } from './components/KidsCodingGameSection';
import { EnglishGamesSection } from './components/EnglishGamesSection';
import { DecisionLabSection } from './components/DecisionLabSection';
import { AboutAndContactSection } from './components/AboutAndContactSection';
import { AdminDashboardModal, type AdminTab } from './components/AdminDashboardModal';

export default function App() {
  const [lang, setLang] = useState<Lang>('ar');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [settings, setSettings] = useState<AcademySettings>(DEFAULT_SETTINGS);
  const [cloudResources, setCloudResources] = useState<GradeResource[]>([]);
  const [cloudStories, setCloudStories] = useState<StoryItem[]>([]);
  const [cloudPapers, setCloudPapers] = useState<OfficialPaper[]>([]);
  const [cloudNews, setCloudNews] = useState<NewsItem[]>([]);
  const [cloudPacks, setCloudPacks] = useState<WorksheetPack[]>([]);
  const [cloudPackItems, setCloudPackItems] = useState<WorksheetPackItem[]>([]);
  const [cloudCourses, setCloudCourses] = useState<AffiliateCourse[]>([]);
  const [cloudQuestionBank, setCloudQuestionBank] = useState<QuestionBankItem[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<TeacherQuiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [mySubscription, setMySubscription] = useState<TeacherSubscription | null>(null);
  const [adminSubscriptions, setAdminSubscriptions] = useState<TeacherSubscription[]>([]);
  const [activationCodes, setActivationCodes] = useState<ActivationCode[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [cloudPapersLoaded, setCloudPapersLoaded] = useState(false);
  const [cloudPacksLoaded, setCloudPacksLoaded] = useState(false);
  const [deletedStarterIds, setDeletedStarterIds] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem('lc_deleted_starter_ids_v1');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });
  const syncedMissingCatalogRef = useRef(false);

  const deletedStarterSet = useMemo(() => new Set(deletedStarterIds), [deletedStarterIds]);

  const markStarterItemDeleted = (id: string) => {
    setDeletedStarterIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        window.localStorage.setItem('lc_deleted_starter_ids_v1', JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  // Visitor role guidance (non-destructive: highlights recommended tools without hiding any sections)
  const [visitorRole, setVisitorRole] = useState<VisitorRole>(() => {
    try {
      const saved = window.localStorage.getItem('lc_visitor_role_v1');
      if (saved === 'teacher' || saved === 'student' || saved === 'parent' || saved === 'all') {
        return saved;
      }
    } catch {
      // Ignore storage read error
    }
    return 'all';
  });
  const [unlockedState, setUnlockedState] = useState<UnlockedState>(() => getUnlockedState());
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeModalInput, setCodeModalInput] = useState('');
  const [codeModalBusy, setCodeModalBusy] = useState(false);
  const [codeModalFeedback, setCodeModalFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Filters & interactive modals
  const [stageFilter, setStageFilter] = useState<'all' | 'primary' | 'prep' | 'secondary'>('all');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('prim4');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ResourceCategory>('all');
  const [activeBankUnitFilter, setActiveBankUnitFilter] = useState<string>('all');
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<GradeResource | null>(null);
  const [excerptStory, setExcerptStory] = useState<StoryItem | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('resources');
  const [sharedPrepId, setSharedPrepId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('prep');
  });
  const [sharedQuizId, setSharedQuizId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('quiz');
  });

  const labels = t(lang);
  const isAdmin = Boolean(user && user.emailVerified && user.email === ADMIN_EMAIL);

  const scrollToTargetSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  // Support direct social-post links like ?go=stories, ?go=iq-tests, ?go=coding-game, or #hash
  useEffect(() => {
    if (sharedPrepId || sharedQuizId) return;
    const params = new URLSearchParams(window.location.search);
    const targetId =
      params.get('go') || params.get('section') || window.location.hash.replace(/^#/, '');
    if (!targetId) return;

    const timer = setTimeout(() => {
      scrollToTargetSection(targetId);
    }, 180);
    return () => clearTimeout(timer);
  }, [cloudLoaded, sharedPrepId, sharedQuizId]);

  useEffect(() => {
    const handleHash = () => {
      const targetId = window.location.hash.replace(/^#/, '');
      if (targetId) scrollToTargetSection(targetId);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Keep HTML dir & lang synchronized
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Track unique-session page visit once on mount (anonymous, zero PII)
  useEffect(() => {
    trackSessionVisitOnce(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectRole = (role: VisitorRole) => {
    setVisitorRole(role);
    try {
      window.localStorage.setItem('lc_visitor_role_v1', role);
    } catch {
      // Ignore storage error
    }
  };

  const handleRedeemStandaloneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeModalInput.trim()) return;
    setCodeModalBusy(true);
    setCodeModalFeedback(null);
    const res = await redeemActivationCode(codeModalInput, lang);
    setCodeModalBusy(false);
    setCodeModalFeedback({ ok: res.ok, text: res.message });
    if (res.ok && res.unlockedState) {
      setUnlockedState(res.unlockedState);
      setCodeModalInput('');
    }
  };

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // Public catalog & settings listeners
  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'global'),
      (snap) => {
        if (snap.exists()) {
          setSettings(snap.data() as AcademySettings);
        }
        setCloudLoaded(true);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'settings/global')
    );

    const unsubResources = onSnapshot(
      query(collection(db, 'grades_resources'), orderBy('createdAt', 'desc')),
      (snap) => {
        setCloudResources(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GradeResource, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'grades_resources')
    );

    const unsubStories = onSnapshot(
      query(collection(db, 'stories'), orderBy('createdAt', 'desc')),
      (snap) => {
        setCloudStories(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StoryItem, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'stories')
    );

    const toMillis = (ts: unknown): number => {
      if (
        ts &&
        typeof ts === 'object' &&
        'toMillis' in ts &&
        typeof (ts as { toMillis: () => number }).toMillis === 'function'
      ) {
        return (ts as { toMillis: () => number }).toMillis();
      }
      return 0;
    };

    const unsubPapers = onSnapshot(
      collection(db, 'official_papers'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OfficialPaper, 'id'>) }));
        list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setCloudPapers(list);
        setCloudPapersLoaded(true);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'official_papers')
    );

    const unsubNews = onSnapshot(
      query(collection(db, 'news'), orderBy('createdAt', 'desc')),
      (snap) => {
        setCloudNews(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NewsItem, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'news')
    );

    const unsubPacks = onSnapshot(
      collection(db, 'worksheet_packs'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WorksheetPack, 'id'>) }));
        list.sort((a, b) => (a.packNumber || 0) - (b.packNumber || 0));
        setCloudPacks(list);
        setCloudPacksLoaded(true);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'worksheet_packs')
    );

    const unsubPackItems = onSnapshot(
      collection(db, 'worksheet_items'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<WorksheetPackItem, 'id'>),
        }));
        list.sort((a, b) => (a.itemOrder || 0) - (b.itemOrder || 0));
        setCloudPackItems(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'worksheet_items')
    );

    const unsubCourses = onSnapshot(
      query(collection(db, 'affiliate_courses'), orderBy('createdAt', 'desc')),
      (snap) => {
        setCloudCourses(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AffiliateCourse, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'affiliate_courses')
    );

    const unsubBank = onSnapshot(
      query(collection(db, 'question_bank'), orderBy('createdAt', 'desc')),
      (snap) => {
        setCloudQuestionBank(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<QuestionBankItem, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'question_bank')
    );

    return () => {
      unsubSettings();
      unsubResources();
      unsubStories();
      unsubPapers();
      unsubNews();
      unsubPacks();
      unsubPackItems();
      unsubCourses();
      unsubBank();
    };
  }, []);

  // Orders, teacher quizzes, attempts, subscriptions, codes & analytics listeners
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setOrders([]);
      setMyQuizzes([]);
      setQuizAttempts([]);
      setMySubscription(null);
      setAdminSubscriptions([]);
      setActivationCodes([]);
      setAnalyticsEvents([]);
      return;
    }

    const toMillis = (ts: unknown): number => {
      if (ts && typeof ts === 'object' && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
        return (ts as { toMillis: () => number }).toMillis();
      }
      return 0;
    };

    const ordersQuery = isAdmin
      ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'orders'),
          where('ownerUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OrderRecord, 'id'>) })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const quizzesQuery = isAdmin
      ? collection(db, 'teacher_quizzes')
      : query(collection(db, 'teacher_quizzes'), where('ownerUid', '==', user.uid));

    const unsubQuizzes = onSnapshot(
      quizzesQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TeacherQuiz, 'id'>) }));
        list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setMyQuizzes(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'teacher_quizzes')
    );

    const attemptsQuery = isAdmin
      ? collection(db, 'quiz_attempts')
      : query(collection(db, 'quiz_attempts'), where('quizOwnerUid', '==', user.uid));

    const unsubAttempts = onSnapshot(
      attemptsQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<QuizAttempt, 'id'>) }));
        list.sort((a, b) => toMillis(b.submittedAt) - toMillis(a.submittedAt));
        setQuizAttempts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'quiz_attempts')
    );

    const unsubMySub = onSnapshot(
      doc(db, 'teacher_subscriptions', user.uid),
      (snap) => {
        if (snap.exists()) {
          setMySubscription({ id: snap.id, ...(snap.data() as Omit<TeacherSubscription, 'id'>) });
        } else {
          setMySubscription(null);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `teacher_subscriptions/${user.uid}`)
    );

    let unsubAdminSubs: (() => void) | undefined;
    let unsubCodes: (() => void) | undefined;
    let unsubAnalytics: (() => void) | undefined;
    if (isAdmin) {
      unsubAdminSubs = onSnapshot(
        collection(db, 'teacher_subscriptions'),
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<TeacherSubscription, 'id'>),
          }));
          list.sort((a, b) => toMillis(b.activatedAt) - toMillis(a.activatedAt));
          setAdminSubscriptions(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'teacher_subscriptions')
      );

      unsubCodes = onSnapshot(
        query(collection(db, 'activation_codes'), orderBy('createdAt', 'desc')),
        (snap) => {
          setActivationCodes(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivationCode, 'id'>) }))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'activation_codes')
      );

      unsubAnalytics = onSnapshot(
        query(collection(db, 'analytics_events'), orderBy('createdAt', 'desc'), limit(300)),
        (snap) => {
          setAnalyticsEvents(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AnalyticsEvent, 'id'>) }))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'analytics_events')
      );
    } else {
      setAdminSubscriptions([]);
      setActivationCodes([]);
      setAnalyticsEvents([]);
    }

    return () => {
      unsubOrders();
      unsubQuizzes();
      unsubAttempts();
      unsubMySub();
      if (unsubAdminSubs) unsubAdminSubs();
      if (unsubCodes) unsubCodes();
      if (unsubAnalytics) unsubAnalytics();
    };
  }, [authReady, user, isAdmin]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAdminOpen(false);
  };

  const handleSwitchAccount = async () => {
    try {
      await signOut(auth);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Switch account failed:', error);
    }
  };

  const handleSeedStarterData = async () => {
    if (!user || !isAdmin) return;
    const batch = writeBatch(db);
    STARTER_RESOURCES.forEach((item) => {
      const { id, ...rest } = item;
      batch.set(doc(db, 'grades_resources', id), {
        ...rest,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
    });
    STARTER_STORIES.forEach((item) => {
      const { id, ...rest } = item;
      batch.set(doc(db, 'stories', id), {
        ...rest,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
    });
    STARTER_PAPERS.forEach((item) => {
      const { id, ...rest } = item;
      batch.set(doc(db, 'official_papers', id), {
        ...rest,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
    });
    STARTER_NEWS.forEach((item) => {
      const { id, ...rest } = item;
      batch.set(doc(db, 'news', id), {
        ...rest,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
    });
    STARTER_WORKSHEET_PACKS.forEach((pack) => {
      const { id, ...rest } = pack;
      batch.set(doc(db, 'worksheet_packs', id), {
        ...rest,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
    });
    STARTER_WORKSHEET_ITEMS.forEach((sheet) => {
      const { id, ...rest } = sheet;
      batch.set(doc(db, 'worksheet_items', id), {
        ...rest,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
    });
    STARTER_COURSES.forEach((course) => {
      const { id, ...rest } = course;
      batch.set(doc(db, 'affiliate_courses', id), {
        ...rest,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
    });
    STARTER_QUESTION_BANK.forEach((qItem) => {
      const { id, ...rest } = qItem;
      batch.set(doc(db, 'question_bank', id), {
        ...rest,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
    });
    batch.set(doc(db, 'settings', 'global'), {
      ...DEFAULT_SETTINGS,
      seeded: true,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  };

  const handleSeedMissingWorksheetsAndActivities = async () => {
    if (!user || !isAdmin) return;
    const existingIds = new Set(cloudResources.map((r) => r.id));
    const missing = STARTER_RESOURCES.filter(
      (item) =>
        (item.category === 'worksheet' || (item.category === 'activity' && !item.isInteractive)) &&
        !existingIds.has(item.id)
    );
    if (missing.length === 0) return;
    const batch = writeBatch(db);
    missing.forEach((item) => {
      const { id, ...rest } = item;
      batch.set(doc(db, 'grades_resources', id), {
        ...rest,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
  };

  const handleSeedStarterPacks = async () => {
    if (!user || !isAdmin) return;
    const existingPackIds = new Set(cloudPacks.map((p) => p.id));
    const existingSheetIds = new Set(cloudPackItems.map((s) => s.id));
    const batch = writeBatch(db);
    let ops = 0;

    STARTER_WORKSHEET_PACKS.forEach((pack) => {
      if (!existingPackIds.has(pack.id) && !deletedStarterSet.has(pack.id)) {
        const { id, ...rest } = pack;
        batch.set(doc(db, 'worksheet_packs', id), {
          ...rest,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
        });
        ops++;
      }
    });

    STARTER_WORKSHEET_ITEMS.forEach((sheet) => {
      if (
        !existingSheetIds.has(sheet.id) &&
        !deletedStarterSet.has(sheet.id) &&
        !deletedStarterSet.has(sheet.packId)
      ) {
        const { id, ...rest } = sheet;
        batch.set(doc(db, 'worksheet_items', id), {
          ...rest,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
        });
        ops++;
      }
    });

    if (ops > 0) {
      await batch.commit();
    }
  };

  const handleSeedCoursesAndBank = async () => {
    if (!user || !isAdmin) return;
    const existingCourseIds = new Set(cloudCourses.map((c) => c.id));
    const existingBankIds = new Set(cloudQuestionBank.map((q) => q.id));
    const batch = writeBatch(db);
    let ops = 0;

    STARTER_COURSES.forEach((course) => {
      if (!existingCourseIds.has(course.id)) {
        const { id, ...rest } = course;
        batch.set(doc(db, 'affiliate_courses', id), {
          ...rest,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
        });
        ops++;
      }
    });

    STARTER_QUESTION_BANK.forEach((qItem) => {
      if (!existingBankIds.has(qItem.id)) {
        const { id, ...rest } = qItem;
        batch.set(doc(db, 'question_bank', id), {
          ...rest,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
        });
        ops++;
      }
    });

    if (ops > 0) {
      await batch.commit();
    }
  };

  const handleSeedMissingPapers = async () => {
    if (!user || !isAdmin) return;
    const existingPaperIds = new Set(cloudPapers.map((p) => p.id));
    const batch = writeBatch(db);
    let ops = 0;

    STARTER_PAPERS.forEach((paper) => {
      if (!existingPaperIds.has(paper.id) && !deletedStarterSet.has(paper.id)) {
        const { id, ...rest } = paper;
        batch.set(doc(db, 'official_papers', id), {
          ...rest,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
        });
        ops++;
      }
    });

    if (ops > 0) {
      await batch.commit();
    }
  };

  // Auto-seed starter catalog once when admin first signs in if database hasn't been seeded yet
  useEffect(() => {
    if (cloudLoaded && isAdmin && !settings.seeded && cloudResources.length === 0) {
      handleSeedStarterData().catch((err) => console.error('Auto seed error:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudLoaded, isAdmin, settings.seeded]);

  // Reliably sync any newly added starter books/papers & foundation packs to Firestore once loaded
  useEffect(() => {
    if (
      !cloudLoaded ||
      !cloudPapersLoaded ||
      !cloudPacksLoaded ||
      !isAdmin ||
      !settings.seeded ||
      syncedMissingCatalogRef.current
    ) {
      return;
    }
    syncedMissingCatalogRef.current = true;
    Promise.all([handleSeedMissingPapers(), handleSeedStarterPacks()]).catch((err) =>
      console.error('Auto sync catalog error:', err)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudLoaded, cloudPapersLoaded, cloudPacksLoaded, isAdmin, settings.seeded]);

  // Display starter items seamlessly; always merge unsynced starter items so Homepage & Admin stay 100% identical
  const resources: GradeResource[] = useMemo(() => {
    if (settings.seeded || cloudResources.length > 0) return cloudResources;
    return STARTER_RESOURCES.map((r) => ({ ...r, authorUid: 'starter' }));
  }, [settings.seeded, cloudResources]);

  const stories: StoryItem[] = useMemo(() => {
    if (settings.seeded || cloudStories.length > 0) return cloudStories;
    return STARTER_STORIES.map((s) => ({ ...s, authorUid: 'starter' }));
  }, [settings.seeded, cloudStories]);

  const papers: OfficialPaper[] = useMemo(() => {
    const cloudIds = new Set(cloudPapers.map((p) => p.id));
    const missingStarterPapers = STARTER_PAPERS.filter(
      (p) => !cloudIds.has(p.id) && !deletedStarterSet.has(p.id)
    ).map((p) => ({ ...p, authorUid: 'starter' }));
    return [...cloudPapers, ...missingStarterPapers];
  }, [cloudPapers, deletedStarterSet]);

  const news: NewsItem[] = useMemo(() => {
    if (settings.seeded || cloudNews.length > 0) return cloudNews;
    return STARTER_NEWS.map((n) => ({ ...n, authorUid: 'starter' }));
  }, [settings.seeded, cloudNews]);

  const packs: WorksheetPack[] = useMemo(() => {
    const cloudIds = new Set(cloudPacks.map((p) => p.id));
    const missingStarterPacks = STARTER_WORKSHEET_PACKS.filter(
      (p) => !cloudIds.has(p.id) && !deletedStarterSet.has(p.id)
    ).map((p) => ({ ...p, authorUid: 'starter' }));
    return [...cloudPacks, ...missingStarterPacks].sort(
      (a, b) => (a.packNumber || 0) - (b.packNumber || 0)
    );
  }, [cloudPacks, deletedStarterSet]);

  const packItems: WorksheetPackItem[] = useMemo(() => {
    const cloudIds = new Set(cloudPackItems.map((i) => i.id));
    const missingStarterItems = STARTER_WORKSHEET_ITEMS.filter(
      (i) =>
        !cloudIds.has(i.id) &&
        !deletedStarterSet.has(i.id) &&
        !deletedStarterSet.has(i.packId)
    ).map((i) => ({ ...i, authorUid: 'starter' }));
    return [...cloudPackItems, ...missingStarterItems].sort(
      (a, b) => (a.itemOrder || 0) - (b.itemOrder || 0)
    );
  }, [cloudPackItems, deletedStarterSet]);

  const courses: AffiliateCourse[] = useMemo(() => {
    if (cloudCourses.length > 0) return cloudCourses;
    return STARTER_COURSES.map((c) => ({ ...c, authorUid: 'starter' }));
  }, [cloudCourses]);

  const questionBank: QuestionBankItem[] = useMemo(() => {
    if (cloudQuestionBank.length > 0) return cloudQuestionBank;
    return STARTER_QUESTION_BANK.map((q) => ({ ...q, authorUid: 'starter' }));
  }, [cloudQuestionBank]);

  const visibleGrades = useMemo(() => {
    if (stageFilter === 'all') return GRADES;
    return GRADES.filter((g) => g.stage === stageFilter);
  }, [stageFilter]);

  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      if (selectedGradeId !== 'all' && item.gradeId !== selectedGradeId) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      return true;
    });
  }, [resources, selectedGradeId, categoryFilter]);

  const handleStageSelect = (stage: 'all' | 'primary' | 'prep' | 'secondary') => {
    setStageFilter(stage);
    const matching = stage === 'all' ? GRADES : GRADES.filter((g) => g.stage === stage);
    if (matching.length > 0 && !matching.some((g) => g.id === selectedGradeId)) {
      setSelectedGradeId(matching[0].id);
      setActiveBankUnitFilter('all');
    }
  };

  const activeGradeBankQuestions = useMemo(() => {
    if (selectedGradeId === 'all') return questionBank;
    return questionBank.filter((q) => q.gradeId === selectedGradeId);
  }, [questionBank, selectedGradeId]);

  const activeGradeBankUnits = useMemo(() => {
    const units = new Set<string>();
    activeGradeBankQuestions.forEach((q) => {
      if (q.unitLabel && q.unitLabel.trim()) units.add(q.unitLabel.trim());
    });
    return Array.from(units);
  }, [activeGradeBankQuestions]);

  const filteredGradeBankQuestions = useMemo(() => {
    if (activeBankUnitFilter === 'all') return activeGradeBankQuestions;
    return activeGradeBankQuestions.filter(
      (q) => (q.unitLabel || '').trim() === activeBankUnitFilter
    );
  }, [activeGradeBankQuestions, activeBankUnitFilter]);

  const openInteractiveResource = (item: GradeResource) => {
    void trackAnalyticsEvent({
      eventType: 'interactive_start',
      section: 'grades',
      itemTitle: lang === 'ar' ? item.titleAr : item.titleEn,
      itemId: item.id,
      lang,
    });
    setActiveQuiz(item);
  };

  const launchGradeBankQuiz = () => {
    if (filteredGradeBankQuestions.length === 0) return;
    const gradeMeta = GRADES.find((g) => g.id === selectedGradeId);
    const unitSuffix =
      activeBankUnitFilter !== 'all' ? ` · ${activeBankUnitFilter}` : '';
    const titleAr = gradeMeta
      ? `تدريب تفاعلي: ${gradeMeta.nameAr}${unitSuffix}`
      : `تدريب تفاعلي شامل لكل الصفوف${unitSuffix}`;
    const titleEn = gradeMeta
      ? `Interactive Practice: ${gradeMeta.nameEn}${unitSuffix}`
      : `Interactive Practice: All Grades${unitSuffix}`;

    void trackAnalyticsEvent({
      eventType: 'interactive_start',
      section: 'grades_bank',
      itemTitle: lang === 'ar' ? titleAr : titleEn,
      itemId: selectedGradeId,
      lang,
    });

    setActiveQuiz({
      id: `bank_quiz_${selectedGradeId}_${activeBankUnitFilter}`,
      gradeId: selectedGradeId === 'all' ? 'prim4' : selectedGradeId,
      category: 'activity',
      titleAr,
      titleEn,
      descriptionAr: 'أسئلة تفاعلية مباشرة من بنك أسئلة الصف مع التصحيح الفوري والنطق.',
      descriptionEn: 'Live interactive questions from the Grade Question Bank with instant grading & audio.',
      isInteractive: true,
      isPaid: false,
      priceEgp: 0,
      allowWhiteLabel: false,
      contentText: JSON.stringify(
        filteredGradeBankQuestions.map((q) => ({
          question: q.prompt,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          unitLabel: q.unitLabel,
        }))
      ),
      authorUid: 'system',
    });
  };

  if (sharedQuizId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Header
          lang={lang}
          user={user}
          isAdmin={isAdmin}
          onOpenAdmin={() => setAdminOpen(true)}
          onSignIn={handleSignIn}
        />
        <PublicQuizViewer
          quizId={sharedQuizId}
          lang={lang}
          settings={settings}
          onBackHome={() => {
            window.history.replaceState({}, '', '/');
            setSharedQuizId(null);
          }}
        />
      </div>
    );
  }

  if (sharedPrepId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Header
          lang={lang}
          user={user}
          isAdmin={isAdmin}
          onOpenAdmin={() => setAdminOpen(true)}
          onSignIn={handleSignIn}
        />
        <SharedPrepViewer
          prepId={sharedPrepId}
          lang={lang}
          settings={settings}
          onBackHome={() => {
            window.history.replaceState({}, '', '/');
            setSharedPrepId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header
        lang={lang}
        user={user}
        isAdmin={isAdmin}
        onOpenAdmin={() => setAdminOpen(true)}
        onSignIn={handleSignIn}
      />

      {/* Workspace Language & Editorial Bar */}
      <div className="bg-slate-50/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            {settings.logoDataUrl && (
              <img
                src={settings.logoDataUrl}
                alt={lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
                referrerPolicy="no-referrer"
                className="h-6 w-auto max-w-[88px] object-contain rounded shrink-0"
              />
            )}
            <span className="font-semibold text-slate-900">
              {lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
            </span>
            <span className="hidden sm:inline text-slate-300" aria-hidden="true">|</span>
            <span className="hidden sm:inline text-slate-500">
              {lang === 'ar'
                ? 'بيئة تعليمية متخصصة لمناهج اللغة الإنجليزية من التأسيس حتى الثانوي'
                : 'Curriculum-aligned English learning & classroom prep portal'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setCodeModalFeedback(null);
                setCodeModalOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                unlockedState.allPaid || unlockedState.ids.length > 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-sky-800 hover:text-sky-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تفعيل بكود' : 'Redeem Code'}</span>
              {(unlockedState.allPaid || unlockedState.ids.length > 0) && (
                <span className="text-[11px] text-emerald-700 font-mono-num">
                  ·{' '}
                  {unlockedState.allPaid
                    ? (() => {
                        const remDays = getRemainingDays(unlockedState.allPaidExpiresAtMs);
                        if (remDays !== null) {
                          return lang === 'ar' ? `شامل (${remDays} يوم)` : `VIP (${remDays}d)`;
                        }
                        return lang === 'ar' ? 'شامل' : 'VIP';
                      })()
                    : unlockedState.ids.length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <div className="inline-flex items-center p-0.5 bg-white rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setLang('ar')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    lang === 'ar' ? 'bg-sky-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  العربية
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    lang === 'en' ? 'bg-sky-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          {/* Non-Destructive Visitor Role Switcher (Highlights Top Tools Without Hiding Anything) */}
          <div className="w-full pt-2 mt-0.5 border-t border-slate-200/80 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Users className="w-3.5 h-3.5 text-sky-900 shrink-0" />
                <span className="font-semibold text-slate-800">
                  {lang === 'ar' ? 'توجيه سريع حسب دورك:' : 'Quick Role Spotlight:'}
                </span>
                <span className="hidden md:inline text-slate-500">
                  {lang === 'ar'
                    ? 'اختاري دورك للوصول لأهم أدواتك أولاً مع بقاء كل الأقسام مفتوحة'
                    : 'Highlights your top tools while keeping every section visible'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
                {(
                  [
                    ['all', lang === 'ar' ? 'عرض الكل' : 'All Sections'],
                    ['teacher', lang === 'ar' ? 'أنا معلم' : 'Teacher'],
                    ['parent', lang === 'ar' ? 'أنا ولي أمر' : 'Parent'],
                    ['student', lang === 'ar' ? 'أنا طالب' : 'Student'],
                  ] as const
                ).map(([roleKey, roleLabel]) => (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => handleSelectRole(roleKey)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      visitorRole === roleKey
                        ? 'bg-sky-900 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {roleLabel}
                  </button>
                ))}
              </div>
            </div>

            {visitorRole !== 'all' && (
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-sky-900">
                    {visitorRole === 'teacher'
                      ? lang === 'ar'
                        ? 'أقسام مقترحة للمعلم — مع بقاء كل باقي الأقسام متاحة بالأسفل'
                        : 'Recommended for Teachers — all other sections remain open below'
                      : visitorRole === 'parent'
                      ? lang === 'ar'
                        ? 'أقسام مقترحة لولي الأمر — مع بقاء كل باقي الأقسام متاحة بالأسفل'
                        : 'Recommended for Parents — all other sections remain open below'
                      : lang === 'ar'
                      ? 'أقسام مقترحة للطالب — مع بقاء كل باقي الأقسام متاحة بالأسفل'
                      : 'Recommended for Students — all other sections remain open below'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ar'
                      ? 'تقدرين التبديل بين المعلم وولي الأمر أو عرض الكل في أي وقت بضغطة واحدة.'
                      : 'Switch between Teacher, Parent, Student, or View All anytime in one click.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(visitorRole === 'teacher'
                    ? [
                        { id: 'teacher-studio', ar: '1. استوديو التحضير والفيسبوك', en: '1. Teacher Prep Studio' },
                        { id: 'quiz-builder', ar: '2. بنك الأسئلة والكويزات', en: '2. Quiz Bank & Builder' },
                        { id: 'grades', ar: '3. الصفوف والأوراق الرسمية', en: '3. Grades & Preps' },
                      ]
                    : visitorRole === 'parent'
                    ? [
                        { id: 'worksheet-library', ar: '1. حزم التأسيس المرقّمة', en: '1. Foundation Packs' },
                        { id: 'stories', ar: '2. القصص الإنجليزية المصوّرة', en: '2. Illustrated Stories' },
                        { id: 'certificates', ar: '3. شهادات تشجيع الأبناء', en: '3. Recognition Certificates' },
                      ]
                    : [
                        { id: 'grades', ar: '1. تدريب صفك التفاعلي', en: '1. Grade Practice Quizzes' },
                        { id: 'english-games', ar: '2. ألعاب الإنجليزي والنطق', en: '2. English & Phonics Games' },
                        { id: 'iq-tests', ar: '3. تحديات الذكاء والبرمجة', en: '3. IQ & Coding Games' },
                      ]
                  ).map((shortcut) => (
                    <button
                      key={shortcut.id}
                      type="button"
                      onClick={() => scrollToTargetSection(shortcut.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 whitespace-nowrap shrink-0"
                    >
                      <span>{lang === 'ar' ? shortcut.ar : shortcut.en}</span>
                      {lang === 'ar' ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectRole('all')}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
                  >
                    {lang === 'ar' ? 'إغلاق التوجيه' : 'Clear'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick-Jump Strip Across All Sections (Desktop + Mobile) */}
          <div className="w-full flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-200/70">
            {[
              { id: 'grades', ar: 'الصفوف', en: 'Grades' },
              { id: 'worksheet-library', ar: 'حزم التأسيس والأوراق', en: 'Foundation Packs' },
              { id: 'papers-news', ar: 'الكتب وأوراق المعلم', en: 'Books & Papers' },
              { id: 'stories', ar: 'القصص', en: 'Stories' },
              { id: 'quiz-builder', ar: 'بنك الكويزات', en: 'Quiz Bank' },
              { id: 'english-games', ar: 'ألعاب الإنجليزي', en: 'English Games' },
              { id: 'iq-tests', ar: 'الذكاء', en: 'IQ Lab' },
              { id: 'coding-game', ar: 'البرمجة', en: 'Coding' },
              { id: 'decision-lab', ar: 'صنّاع القرار', en: 'Decision Lab' },
              { id: 'teacher-studio', ar: 'تحضير المعلم', en: 'Studio' },
              { id: 'courses', ar: 'الكورسات', en: 'Courses' },
              { id: 'about', ar: 'عن الأكاديمية', en: 'About' },
              { id: 'contact', ar: 'تواصل معنا', en: 'Contact' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToTargetSection(item.id)}
                className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-sky-800 hover:text-sky-900 whitespace-nowrap shrink-0"
              >
                {lang === 'ar' ? item.ar : item.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Term Offer Announcement Strip (Editable from Admin Settings, Auto-Locks After Duration) */}
      {settings.termPromoEnabled !== false && (
        <div className="bg-amber-50/85 border-b border-amber-200/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
            <div className="space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-amber-950">
                <span className="font-mono-num px-2 py-0.5 bg-amber-600 text-white rounded">
                  {settings.quizTermPriceEgp ?? 120} {labels.egp} ·{' '}
                  {settings.termPromoDurationDays ?? 120} {lang === 'ar' ? 'يوم' : 'Days'}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {(lang === 'ar' ? settings.termPromoTitleAr : settings.termPromoTitleEn) ||
                    (lang === 'ar'
                      ? 'عرض الترم الكامل — افتحي بنك الأسئلة والاختبارات التفاعلية'
                      : 'Full Term Pass — Unlock Question Bank & Live Quizzes')}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {(lang === 'ar' ? settings.termPromoSubtitleAr : settings.termPromoSubtitleEn) ||
                  (lang === 'ar'
                    ? 'اشتراك مرة واحدة طوال الترم يفتح كل اختبارات الطلاب وتصحيحهم التلقائي ثم يقفل تلقائياً بنهاية المدة.'
                    : 'One term payment unlocks unlimited live student quizzes and auto-locks automatically when the term ends.')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const termPrice = settings.quizTermPriceEgp ?? 120;
                  const termDays = settings.termPromoDurationDays ?? 120;
                  if (!user || !user.emailVerified) {
                    void handleSignIn();
                    return;
                  }
                  setPaymentIntent({
                    itemType: 'quiz_term',
                    itemTitle:
                      lang === 'ar'
                        ? `باقة الترم الكاملة (${termDays} يوم) — بنك الأسئلة والكويزات`
                        : `Full Term Pass (${termDays} Days) — Quiz Bank & Analytics`,
                    amountEgp: termPrice,
                    extraNote: `Teacher Email: ${user.email || ''} | Teacher UID: ${user.uid} | Duration: ${termDays} days`,
                  });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-900 rounded-lg hover:bg-sky-800 whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {!user || !user.emailVerified
                    ? lang === 'ar'
                      ? `سجّل دخول واشترك بالترم (${settings.quizTermPriceEgp ?? 120} ${labels.egp})`
                      : `Sign In & Subscribe (${settings.quizTermPriceEgp ?? 120} ${labels.egp})`
                    : lang === 'ar'
                    ? `اشترك بالترم الآن · ${settings.quizTermPriceEgp ?? 120} ${labels.egp}`
                    : `Subscribe Term Pass · ${settings.quizTermPriceEgp ?? 120} ${labels.egp}`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCodeModalFeedback(null);
                  setCodeModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-950 bg-white border border-amber-300 rounded-lg hover:bg-amber-100/70 whitespace-nowrap"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تفعيل بكود زمني' : 'Activate Timed Code'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Split */}
      <section className="py-10 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-7">
              <div className="space-y-4">
                <p className="text-xs font-bold tracking-wide text-sky-900 uppercase">
                  {lang === 'ar'
                    ? 'للمدارس والمعلمين وأولياء الأمور في مصر'
                    : 'Built for Teachers, Classrooms & Students'}
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-[1.15] text-balance">
                  {labels.heroTitle}
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                  {labels.heroSubtitle}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#grades"
                    className="px-6 py-3 text-sm font-semibold text-white bg-sky-900 rounded-xl shadow-[0_3px_0_0_rgba(12,74,110,0.45)] hover:bg-sky-800 active:translate-y-px transition-all whitespace-nowrap"
                  >
                    {labels.heroPrimaryCta}
                  </a>
                  <a
                    href="#teacher-studio"
                    className="px-6 py-3 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl shadow-[0_2px_0_0_rgba(148,163,184,0.35)] hover:bg-slate-50 active:translate-y-px transition-all whitespace-nowrap"
                  >
                    {labels.heroSecondaryCta}
                  </a>
                </div>
              </div>

              {/* Editorial Hairline Learning Tracks Index (Clean non-boxed rhythm) */}
              <div className="border border-slate-200 rounded-xl bg-slate-50/40 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>
                    {lang === 'ar' ? 'مسارات التعلّم المجانية بالمنصة' : 'Free Interactive Student Tracks'}
                  </span>
                  <span className="text-sky-900">
                    {lang === 'ar' ? 'شهادات PDF فورية' : 'Includes PDF Certificates'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-200">
                  <button
                    type="button"
                    onClick={() => scrollToTargetSection('english-games')}
                    className="p-3.5 text-start hover:bg-white transition-colors flex items-center justify-between gap-3 sm:border-b sm:border-e border-slate-200 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Gamepad2 className="w-4 h-4 text-amber-700 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-sky-900">
                          {lang === 'ar' ? 'ألعاب الإنجليزي والنطق' : 'English & Phonics Games'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {lang === 'ar' ? '3 فئات عمرية · استماع ومايك' : 'Ages 5–14 · Voice coach'}
                        </p>
                      </div>
                    </div>
                    {lang === 'ar' ? (
                      <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-900 shrink-0" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-900 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToTargetSection('decision-lab')}
                    className="p-3.5 text-start hover:bg-white transition-colors flex items-center justify-between gap-3 sm:border-b border-slate-200 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Compass className="w-4 h-4 text-sky-900 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-sky-900">
                          {lang === 'ar' ? 'مختبر صنّاع القرار والمبدعين' : 'Decision & Creator Lab'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {lang === 'ar' ? 'محاكاة مواقف + مهام برا الشاشة' : 'Scenarios & hands-on tasks'}
                        </p>
                      </div>
                    </div>
                    {lang === 'ar' ? (
                      <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-900 shrink-0" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-900 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToTargetSection('iq-tests')}
                    className="p-3.5 text-start hover:bg-white transition-colors flex items-center justify-between gap-3 sm:border-e border-slate-200 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Brain className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-sky-900">
                          {lang === 'ar' ? 'اختبارات الذكاء والنفسية' : 'IQ & Memory Assessments'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {lang === 'ar' ? 'تقييم فوري وتحدي ذاكرة' : 'Instant cognitive report'}
                        </p>
                      </div>
                    </div>
                    {lang === 'ar' ? (
                      <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-900 shrink-0" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-900 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToTargetSection('coding-game')}
                    className="p-3.5 text-start hover:bg-white transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Code2 className="w-4 h-4 text-slate-800 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-sky-900">
                          {lang === 'ar' ? 'مغامرة البرمجة للأطفال' : 'Kids English Coding Quest'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {lang === 'ar' ? 'تعلّم المنطق والأوامر بالإنجليزي' : 'Interactive logic puzzles'}
                        </p>
                      </div>
                    </div>
                    {lang === 'ar' ? (
                      <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-900 shrink-0" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-900 shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col">
              <figure className="h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <div className="aspect-[4/3] lg:flex-1 bg-gradient-to-br from-sky-900 to-slate-800 overflow-hidden">
                  <img
                    src={HERO_BANNER_IMAGE}
                    alt={
                      lang === 'ar'
                        ? 'تلاميذ مصريون يشاركون بحماس في حصة اللغة الإنجليزية داخل الفصل الدراسي'
                        : 'Egyptian students actively participating in an English classroom lesson'
                    }
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <figcaption className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-600">
                  <span className="font-medium text-slate-800">
                    {lang === 'ar'
                      ? 'تطبيق عملي داخل الفصول: تأسيس، ابتدائي، وإعدادي'
                      : 'Real classroom engagement across Primary & Prep grades'}
                  </span>
                  <span className="font-mono-num text-[11px] text-slate-500 shrink-0">
                    {GRADES.length} {labels.statGrades}
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>

          {/* Architectural Hairline Stat Ledger */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x rtl:lg:divide-x-reverse divide-slate-200 border border-slate-200 rounded-xl bg-slate-50/70">
            <div className="px-5 py-4">
              <p className="text-2xl font-bold text-slate-900 font-mono-num">{GRADES.length}</p>
              <p className="text-xs font-medium text-slate-600 mt-1">{labels.statGrades}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-2xl font-bold text-slate-900 font-mono-num">{resources.length}</p>
              <p className="text-xs font-medium text-slate-600 mt-1">{labels.statPreps}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-2xl font-bold text-slate-900 font-mono-num">{stories.length}</p>
              <p className="text-xs font-medium text-slate-600 mt-1">{labels.statStories}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-2xl font-bold text-amber-700 font-mono-num">
                {settings.aiCertificatePriceEgp} {labels.egp}
              </p>
              <p className="text-xs font-medium text-slate-600 mt-1">{labels.statCerts}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Students in Classrooms Gallery */}
      <section id="classroom-gallery" className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-bold tracking-wide text-sky-900 uppercase">
                {lang === 'ar' ? 'من داخل فصولنا' : 'Inside Our Classrooms'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
                {lang === 'ar'
                  ? 'تلاميذ حقيقيون يتعلّمون الإنجليزية خطوة بخطوة'
                  : 'Real Students Practicing English Step by Step'}
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              {lang === 'ar'
                ? 'من حصص الصوتيات للأطفال وحتى اختبارات التابلت وشهادات التفوق المدرسية، كل أداة في المنصة مصممة لواقع الفصل المصري.'
                : 'From phonics flashcards for early learners to digital tablet quizzes and printed recognition awards.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-slate-200 overflow-hidden">
                <img
                  src={CLASSROOM_PHONICS_IMAGE}
                  alt={
                    lang === 'ar'
                      ? 'أطفال المرحلة الابتدائية يرتبون بطاقات الصوتيات الإنجليزية مع المعلمة'
                      : 'Primary students sorting English phonics flashcards with their teacher'
                  }
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-amber-700">
                    {lang === 'ar' ? 'تأسيس وروضة · 5–8 سنوات' : 'Early Phonics · Ages 5–8'}
                  </p>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ar' ? 'بطاقات الصوتيات وبناء الكلمات' : 'Hands-on Phonics & Word Building'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {lang === 'ar'
                      ? 'أنشطة جماعية وحزم أوراق عمل مرقّمة لتثبيت الحروف والأصوات داخل الفصل والمنزل.'
                      : 'Printable packs and guided sound-matching activities for small groups and home study.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToTargetSection('worksheet-library')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900 hover:underline underline-offset-4 self-start"
                >
                  <span>{lang === 'ar' ? 'تصفح حزم التأسيس' : 'Browse Foundation Packs'}</span>
                  {lang === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </article>

            <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-slate-200 overflow-hidden">
                <img
                  src={STUDENT_TABLET_IMAGE}
                  alt={
                    lang === 'ar'
                      ? 'طالب في المرحلة الإعدادية يحل اختبار إنجليزي تفاعلي على التابلت'
                      : 'Middle school student practicing an interactive English quiz on a tablet'
                  }
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-sky-900">
                    {lang === 'ar' ? 'كل الصفوف الدراسية · بنك الأسئلة' : 'All Grade Levels · Interactive Quizzes'}
                  </p>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ar' ? 'تدريب إلكتروني فوري بالتابلت والهاتف' : 'Self-Grading Tablet Practice'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {lang === 'ar'
                      ? 'أسئلة قواعد ومفردات مرتبطة بوحدات المنهج مع نطق صوتي وتصحيح تلقائي للدرجات.'
                      : 'Curriculum-aligned grammar and vocabulary drills with audio playback and instant scoring.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToTargetSection('grades')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900 hover:underline underline-offset-4 self-start"
                >
                  <span>{lang === 'ar' ? 'جرّب أسئلة صفك الآن' : 'Practice Grade Quizzes'}</span>
                  {lang === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </article>

            <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-slate-200 overflow-hidden">
                <img
                  src={STUDENT_AWARD_IMAGE}
                  alt={
                    lang === 'ar'
                      ? 'تلميذة متفوقة تحمل شهادة تقدير باللغة الإنجليزية بجانب معلمتها'
                      : 'Proud student holding her printed English excellence certificate beside her teacher'
                  }
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-700">
                    {lang === 'ar' ? 'تكريم الطلاب · شهادات فورية' : 'Student Recognition · Printable Awards'}
                  </p>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ar' ? 'شهادات تفوق تشجع كل متعلّم' : 'Personalized Certificates That Inspire'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {lang === 'ar'
                      ? 'شهادات مجانية عند إتمام الألعاب والاختبارات، أو استوديو تصميم احترافي بصورة الطالب للطباعة.'
                      : 'Earn instant free certificates in games or craft a custom photo certificate ready to print.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToTargetSection('certificates')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900 hover:underline underline-offset-4 self-start"
                >
                  <span>{lang === 'ar' ? 'افتح استوديو الشهادات' : 'Open Certificate Studio'}</span>
                  {lang === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Section 1: Grades, Electronic Preps, Exams & Activities */}
      <section id="grades" className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-3xl space-y-2.5">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
                {labels.gradesTitle}
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">{labels.gradesLead}</p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 whitespace-nowrap shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إضافة / حذف من الأدمن' : 'Manage in Admin'}</span>
              </button>
            )}
          </div>

          {/* Stage Selector + Grade Selector + Category Tabs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {(
                  [
                    ['all', labels.stageAll],
                    ['primary', labels.stagePrimary],
                    ['prep', labels.stagePrep],
                    ['secondary', labels.stageSecondary],
                  ] as const
                ).map(([stageKey, stageLabel]) => (
                  <button
                    key={stageKey}
                    type="button"
                    onClick={() => handleStageSelect(stageKey)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      stageFilter === stageKey
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {stageLabel}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {(
                  [
                    ['all', labels.catAll],
                    ['prep', labels.catPrep],
                    ['exam', labels.catExam],
                    ['worksheet', labels.catWorksheet],
                    ['activity', labels.catActivity],
                  ] as const
                ).map(([catKey, catLabel]) => (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategoryFilter(catKey)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      categoryFilter === catKey
                        ? 'bg-sky-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {catLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedGradeId('all');
                  setActiveBankUnitFilter('all');
                }}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                  selectedGradeId === 'all'
                    ? 'border-sky-900 bg-sky-50 text-sky-950'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {lang === 'ar' ? 'كل الصفوف' : 'All Grades'}
              </button>
              {visibleGrades.map((grade) => (
                <button
                  key={grade.id}
                  type="button"
                  onClick={() => {
                    setSelectedGradeId(grade.id);
                    setActiveBankUnitFilter('all');
                  }}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                    selectedGradeId === grade.id
                      ? 'border-sky-900 bg-sky-50 text-sky-950'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {lang === 'ar' ? grade.shortAr : grade.shortEn}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Interactive Question Bank Practice Launcher for Selected Grade */}
          <div className="bg-white border border-sky-200 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900">
                  <GraduationCap className="w-4 h-4" />
                  <span>
                    {lang === 'ar'
                      ? 'الأسئلة التفاعلية المرتبطة بمنهج الصف (مجاناً)'
                      : 'Interactive Curriculum Question Bank (Free Practice)'}
                  </span>
                </span>
                <span className="text-xs font-semibold text-emerald-700 font-mono-num">
                  · {filteredGradeBankQuestions.length}{' '}
                  {lang === 'ar' ? 'سؤال تفاعلي جاهز' : 'ready MCQs'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {activeGradeBankQuestions.length > 0
                  ? lang === 'ar'
                    ? 'أي سؤال تفاعلي ترفعه الأكاديمية في بنك أسئلة هذا الصف يظهر هنا فوراً للطلاب للتدريب أونلاين بالصوت والتصحيح التلقائي.'
                    : 'All MCQs saved in the Question Bank for this grade appear here automatically for instant online student practice with audio.'
                  : lang === 'ar'
                  ? 'لم تُضف أسئلة في بنك هذا الصف بعد — فور إضافتها من لوحة التحكم ستظهر هنا تلقائياً كأسئلة تفاعلية للطلاب.'
                  : 'No questions added to this grade bank yet — once added in Admin, they appear here automatically as interactive questions.'}
              </p>

              {activeGradeBankUnits.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveBankUnitFilter('all')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                      activeBankUnitFilter === 'all'
                        ? 'bg-sky-900 text-white border-sky-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'ar' ? 'كل الوحدات' : 'All Units'}
                  </button>
                  {activeGradeBankUnits.map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setActiveBankUnitFilter(unit)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                        activeBankUnitFilter === unit
                          ? 'bg-sky-900 text-white border-sky-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {filteredGradeBankQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={launchGradeBankQuiz}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors whitespace-nowrap"
                >
                  <Play className="w-4 h-4" />
                  <span>
                    {lang === 'ar'
                      ? `ابدأ التدريب التفاعلي (${filteredGradeBankQuestions.length} سؤال)`
                      : `Start Interactive Practice (${filteredGradeBankQuestions.length} MCQs)`}
                  </span>
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setAdminInitialTab('quizbank');
                    setAdminOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors whitespace-nowrap"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'إضافة / إدارة أسئلة البنك' : 'Manage Bank'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Resource Cards */}
          {filteredResources.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm">
              {labels.emptyItems}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((item) => {
                const gradeMeta = GRADES.find((g) => g.id === item.gradeId);
                const categoryText =
                  item.category === 'prep'
                    ? labels.catPrep
                    : item.category === 'exam'
                    ? labels.catExam
                    : item.category === 'worksheet'
                    ? labels.catWorksheet
                    : labels.catActivity;

                return (
                  <article
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-2.5">
                      {/* Clean unboxed typographic metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-sky-900">
                          {lang === 'ar' ? gradeMeta?.shortAr : gradeMeta?.shortEn}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{categoryText}</span>
                        {item.isInteractive ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{labels.interactiveLabel}</span>
                          </>
                        ) : (item.category === 'activity' || item.category === 'worksheet') ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{labels.nonInteractiveLabel}</span>
                          </>
                        ) : null}
                        <span aria-hidden="true">·</span>
                        <span className={item.isPaid ? 'font-semibold text-amber-700 font-mono-num' : 'font-semibold text-emerald-700'}>
                          {item.isPaid ? `${item.priceEgp} ${labels.egp}` : labels.freeLabel}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {lang === 'ar' ? item.titleAr : item.titleEn}
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        {lang === 'ar' ? item.descriptionAr : item.descriptionEn}
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-slate-100">
                      {!item.isPaid || isItemUnlocked(unlockedState, item.id) ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              downloadTextOrHtmlFile({
                                fileName: item.fileName || `${item.id}.html`,
                                title: lang === 'ar' ? item.titleAr : item.titleEn,
                                subtitle: `${lang === 'ar' ? gradeMeta?.nameAr : gradeMeta?.nameEn} · ${categoryText}`,
                                bodyText: item.contentText,
                                fileDataUrl: item.fileDataUrl,
                                externalUrl: item.externalUrl,
                                brandHeader: lang === 'ar' ? settings.academyNameAr : settings.academyNameEn,
                                logoDataUrl: settings.logoDataUrl,
                                analyticsSection: 'grades',
                                analyticsItemId: item.id,
                                analyticsLang: lang,
                              })
                            }
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 transition-colors whitespace-nowrap"
                          >
                            {item.isPaid ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            <span>
                              {item.isPaid
                                ? lang === 'ar'
                                  ? 'مفعّل بكود — تحميل الآن'
                                  : 'Unlocked — Download'
                                : labels.downloadBtn}
                            </span>
                          </button>
                          {item.isInteractive && (
                            <button
                              type="button"
                              onClick={() => openInteractiveResource(item)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 whitespace-nowrap"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>{labels.previewInteractiveBtn}</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {item.isInteractive && (
                            <button
                              type="button"
                              onClick={() => openInteractiveResource(item)}
                              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors whitespace-nowrap"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>{labels.previewInteractiveBtn}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setPaymentIntent({
                                itemType:
                                  item.category === 'exam'
                                    ? 'exam'
                                    : item.category === 'worksheet'
                                    ? 'worksheet'
                                    : 'activity',
                                itemTitle: lang === 'ar' ? item.titleAr : item.titleEn,
                                amountEgp: item.priceEgp,
                                targetType: 'resource',
                                targetId: item.id,
                              })
                            }
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors whitespace-nowrap"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {labels.buyInstapayBtn} · {item.priceEgp} {labels.egp}
                            </span>
                          </button>
                        </div>
                      )}

                      {item.allowWhiteLabel && (
                        <button
                          type="button"
                          onClick={() =>
                            setPaymentIntent({
                              itemType: 'whitelabel',
                              itemTitle: `${lang === 'ar' ? 'نسخة مخصصة بدون لوجو:' : 'White-Label Custom Edition:'} ${
                                lang === 'ar' ? item.titleAr : item.titleEn
                              }`,
                              amountEgp: settings.whiteLabelPriceEgp,
                              allowCustomBranding: true,
                            })
                          }
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors whitespace-nowrap"
                        >
                          <Stamp className="w-3.5 h-3.5 text-amber-700" />
                          <span>
                            {labels.customBrandBtn} · {settings.whiteLabelPriceEgp} {labels.egp}
                          </span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Section 1B: Numbered Worksheet & Foundation Activity Library */}
      <WorksheetPacksSection
        lang={lang}
        packs={packs}
        items={packItems}
        settings={settings}
        isAdmin={isAdmin}
        unlockedState={unlockedState}
        onOpenAdminPacks={() => {
          setAdminInitialTab('packs');
          setAdminOpen(true);
        }}
        onJumpToPapers={() => scrollToTargetSection('papers-news')}
        onRequestPayment={(intent) => setPaymentIntent(intent)}
      />

      {/* Section 2: Illustrated English Stories (Paid via InstaPay -> WhatsApp) */}
      <section id="stories" className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-3xl space-y-2.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              {labels.storiesTitle}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">{labels.storiesLead}</p>
          </div>

          {stories.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm">
              {labels.emptyItems}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {stories.map((story) => (
                <article
                  key={story.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-12"
                >
                  <div className="sm:col-span-5 aspect-[4/3] sm:aspect-auto bg-gradient-to-br from-sky-900 to-amber-700">
                    <img
                      src={story.coverUrl}
                      alt={lang === 'ar' ? story.titleAr : story.titleEn}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="sm:col-span-7 p-6 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      {settings.logoDataUrl && (
                        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                          <img
                            src={settings.logoDataUrl}
                            alt={lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
                            referrerPolicy="no-referrer"
                            className="h-5 w-auto max-w-[72px] object-contain rounded shrink-0"
                          />
                          <span className="text-[11px] font-semibold text-slate-600 truncate">
                            {lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{story.levelLabel}</span>
                        <span aria-hidden="true">·</span>
                        {!story.isPaid || story.priceEgp <= 0 ? (
                          <span className="font-semibold text-emerald-700">{labels.freeLabel}</span>
                        ) : (
                          <span className="font-semibold text-amber-700 font-mono-num">
                            {story.priceEgp} {labels.egp}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {lang === 'ar' ? story.titleAr : story.titleEn}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {lang === 'ar' ? story.summaryAr : story.summaryEn}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setExcerptStory(story)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 whitespace-nowrap"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{labels.readExcerpt}</span>
                      </button>
                      {!story.isPaid || story.priceEgp <= 0 || isItemUnlocked(unlockedState, story.id) ? (
                        <button
                          type="button"
                          onClick={() =>
                            downloadTextOrHtmlFile({
                              fileName: story.fileName || `${story.id}.html`,
                              title: lang === 'ar' ? story.titleAr : story.titleEn,
                              subtitle: story.levelLabel,
                              bodyText: story.previewExcerpt,
                              fileDataUrl: story.fileDataUrl,
                              externalUrl: story.externalUrl,
                              brandHeader: lang === 'ar' ? settings.academyNameAr : settings.academyNameEn,
                              logoDataUrl: settings.logoDataUrl,
                              analyticsSection: 'stories',
                              analyticsItemId: story.id,
                              analyticsLang: lang,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 whitespace-nowrap"
                        >
                          {!story.isPaid || story.priceEgp <= 0 ? (
                            <Download className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {!story.isPaid || story.priceEgp <= 0
                              ? lang === 'ar'
                                ? 'تحميل القصة مجاناً'
                                : 'Download Free Story'
                              : lang === 'ar'
                              ? 'مفعّلة — تحميل القصة'
                              : 'Unlocked — Download Story'}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setPaymentIntent({
                              itemType: 'story',
                              itemTitle: lang === 'ar' ? story.titleAr : story.titleEn,
                              amountEgp: story.priceEgp,
                              targetType: 'story',
                              targetId: story.id,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 whitespace-nowrap"
                        >
                          <span>
                            {labels.unlockStory} · {story.priceEgp} {labels.egp}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Contextual Explore Strip for Direct Social Post Visitors */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700">
              {lang === 'ar'
                ? 'استكشف أيضاً أقساماً مجانية ومدفوعة أخرى في المنصة:'
                : 'Also explore free & interactive sections across the platform:'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => scrollToTargetSection('english-games')}
                className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 whitespace-nowrap"
              >
                {lang === 'ar' ? 'ألعاب الإنجليزي (مجاناً بالشهادة)' : 'Free English Games'}
              </button>
              <button
                type="button"
                onClick={() => scrollToTargetSection('decision-lab')}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 whitespace-nowrap"
              >
                {lang === 'ar' ? 'صنّاع القرار والمبدعين (مجاناً)' : 'Free Decision Lab'}
              </button>
              <button
                type="button"
                onClick={() => scrollToTargetSection('iq-tests')}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 whitespace-nowrap"
              >
                {lang === 'ar' ? 'اختبارات الذكاء (مجاناً بالشهادة)' : 'Free IQ Lab'}
              </button>
              <button
                type="button"
                onClick={() => scrollToTargetSection('coding-game')}
                className="px-3 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 whitespace-nowrap"
              >
                {lang === 'ar' ? 'ألعاب البرمجة (مجاناً بالشهادة)' : 'Free Coding Games'}
              </button>
              <button
                type="button"
                onClick={() => scrollToTargetSection('worksheet-library')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap"
              >
                {lang === 'ar' ? 'حزم أوراق العمل' : 'Worksheet Packs'}
              </button>
              <button
                type="button"
                onClick={() => scrollToTargetSection('grades')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap"
              >
                {lang === 'ar' ? 'الصفوف والتحضير' : 'All Grades'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: AI Appreciation Certificates */}
      <CertificateStudio
        lang={lang}
        settings={settings}
        onOrderCertificate={(intent) => setPaymentIntent(intent)}
      />

      {/* Section 4: Question Bank & Term-Subscribed Teacher Quiz Studio */}
      <TeacherQuizSection
        lang={lang}
        user={user}
        isAdmin={isAdmin}
        settings={settings}
        questionBank={questionBank}
        myQuizzes={myQuizzes}
        attempts={quizAttempts}
        subscription={mySubscription}
        onRequireSignIn={handleSignIn}
        onRequestPayment={(intent) => setPaymentIntent(intent)}
        onPreviewStudentDemo={() => setSharedQuizId('demo_preview')}
      />

      {/* Section 5: Free Affiliate Courses for Teachers */}
      <CoursesAffiliateSection
        lang={lang}
        courses={courses}
        isAdmin={isAdmin}
        onOpenAdminCourses={() => {
          setAdminInitialTab('courses');
          setAdminOpen(true);
        }}
      />

      {/* Section 5B: Free IQ & Cognitive Challenges (Kids & Adults) */}
      <IqChallengeSection lang={lang} settings={settings} />

      {/* Section 5C: Interactive Kids Coding Adventure Game (CodeQuest) */}
      <KidsCodingGameSection lang={lang} settings={settings} />

      {/* Section 5D: 4 Interactive English Learning Mini-Games (Free + Badges + PDF Certificate) */}
      <EnglishGamesSection lang={lang} settings={settings} />

      {/* Section 5E: Decision Makers & Creators Lab (Free + 3 Age Tiers + Safe Off-Screen Missions + PDF) */}
      <DecisionLabSection lang={lang} settings={settings} />

      {/* Section 6: Teacher Lesson Prep Studio + Facebook Sharing */}
      <TeacherPrepStudio lang={lang} user={user} settings={settings} onRequireSignIn={handleSignIn} />

      {/* Section 7: Official Papers & Simple News */}
      <section id="papers-news" className="py-16 sm:py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Official School Papers & Books */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-900">
                  <FileText className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'كتب وأوراق ونماذج المعلم' : 'Books & Teacher Papers'}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{labels.papersTitle}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{labels.papersLead}</p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setAdminInitialTab('papers');
                    setAdminOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 whitespace-nowrap"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'إدارة الأوراق والكتب' : 'Manage Books & Papers'}</span>
                </button>
              )}
            </div>

            {papers.length === 0 ? (
              <p className="text-sm text-slate-500">{labels.emptyItems}</p>
            ) : (
              <div className="space-y-4">
                {papers.map((paper) => {
                  const unlocked = isItemUnlocked(unlockedState, paper.id);
                  const canDownload = !paper.isPaid || paper.priceEgp <= 0 || unlocked;
                  const isBookSlot = Boolean(
                    paper.coverUrl ||
                      paper.id === 'paper_senior_teacher_book' ||
                      paper.id === 'paper_quran_dotted_booklet' ||
                      paper.categoryAr?.includes('كتب') ||
                      paper.categoryAr?.includes('كتيب')
                  );

                  return (
                    <div
                      key={paper.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        {paper.coverUrl ? (
                          <img
                            src={paper.coverUrl}
                            alt={lang === 'ar' ? paper.titleAr : paper.titleEn}
                            referrerPolicy="no-referrer"
                            className="w-20 sm:w-24 aspect-[3/4] rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                          />
                        ) : isBookSlot ? (
                          isAdmin ? (
                            <button
                              type="button"
                              onClick={() => {
                                setAdminInitialTab('papers');
                                setAdminOpen(true);
                              }}
                              className="w-20 sm:w-24 aspect-[3/4] rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 flex flex-col items-center justify-center p-2 text-center gap-1 shrink-0 transition-colors"
                            >
                              <BookOpen className="w-5 h-5 text-slate-400" />
                              <span className="text-[11px] font-semibold text-slate-600 leading-tight">
                                {lang === 'ar' ? 'أضيفي الغلاف' : 'Add Cover'}
                              </span>
                            </button>
                          ) : (
                            <div className="w-20 sm:w-24 aspect-[3/4] rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-2 text-center gap-1 shrink-0">
                              <BookOpen className="w-5 h-5 text-slate-400" />
                              <span className="text-[11px] font-medium text-slate-500 leading-tight">
                                {lang === 'ar' ? 'غلاف الكتاب' : 'Book Cover'}
                              </span>
                            </div>
                          )
                        ) : null}

                        <div className="space-y-1 min-w-0">
                          <p className="text-xs font-medium text-slate-500">
                            {lang === 'ar' ? paper.categoryAr : paper.categoryEn} ·{' '}
                            {paper.isPaid && paper.priceEgp > 0 ? (
                              <span className="font-semibold text-amber-700 font-mono-num">
                                {paper.priceEgp} {labels.egp}
                              </span>
                            ) : (
                              <span className="font-semibold text-emerald-700">{labels.freeLabel}</span>
                            )}
                          </p>
                          <h3 className="text-base font-bold text-slate-900">
                            {lang === 'ar' ? paper.titleAr : paper.titleEn}
                          </h3>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {lang === 'ar' ? paper.descriptionAr : paper.descriptionEn}
                          </p>
                        </div>
                      </div>

                      {canDownload ? (
                        <button
                          type="button"
                          onClick={() =>
                            downloadTextOrHtmlFile({
                              fileName: paper.fileName || `${paper.id}.html`,
                              title: lang === 'ar' ? paper.titleAr : paper.titleEn,
                              subtitle: lang === 'ar' ? paper.categoryAr : paper.categoryEn,
                              bodyText: paper.contentText,
                              fileDataUrl: paper.fileDataUrl,
                              externalUrl: paper.externalUrl,
                              brandHeader: lang === 'ar' ? settings.academyNameAr : settings.academyNameEn,
                              logoDataUrl: settings.logoDataUrl,
                              analyticsSection: 'papers',
                              analyticsItemId: paper.id,
                              analyticsLang: lang,
                            })
                          }
                          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white rounded-xl whitespace-nowrap shrink-0 transition-colors ${
                            paper.isPaid && paper.priceEgp > 0
                              ? 'bg-emerald-700 hover:bg-emerald-600'
                              : 'bg-sky-900 hover:bg-sky-800'
                          }`}
                        >
                          {paper.isPaid && paper.priceEgp > 0 ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          <span>
                            {paper.isPaid && paper.priceEgp > 0
                              ? lang === 'ar'
                                ? 'مفعّل — تحميل الآن'
                                : 'Unlocked — Download'
                              : labels.downloadBtn}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setPaymentIntent({
                              itemType: 'paper',
                              itemTitle: lang === 'ar' ? paper.titleAr : paper.titleEn,
                              amountEgp: paper.priceEgp,
                              targetType: 'paper',
                              targetId: paper.id,
                            })
                          }
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 whitespace-nowrap shrink-0 transition-colors"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            {labels.buyInstapayBtn} · {paper.priceEgp} {labels.egp}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-bold text-slate-900">
                  {lang === 'ar'
                    ? `هل تبحثين عن مجموعات التأسيس المرقّمة (${packs.length} مجموعات)؟`
                    : `Looking for numbered foundation worksheet packs (${packs.length} packs)?`}
                </p>
                <p className="text-xs text-slate-600">
                  {lang === 'ar'
                    ? 'تأسيس الحروف العربية والإنجليزية والأرقام وتحسين الخط موجودة في قسم مكتبة الحزم المرقّمة بالأعلى.'
                    : 'Arabic/English tracing, numbers, and handwriting packs are in the Worksheet Packs library above.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => scrollToTargetSection('worksheet-library')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-900 bg-white border border-sky-200 rounded-xl hover:bg-sky-50 whitespace-nowrap shrink-0"
              >
                <span>{lang === 'ar' ? 'انتقلي إلى حزم التأسيس' : 'Go to Foundation Packs'}</span>
                {lang === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Simple News Feed */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-900">
                <Newspaper className="w-4 h-4" />
                <span>{lang === 'ar' ? 'أخبار المنصة' : 'Updates'}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{labels.newsTitle}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{labels.newsLead}</p>
            </div>

            {news.length === 0 ? (
              <p className="text-sm text-slate-500">{labels.emptyItems}</p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl bg-white overflow-hidden">
                {news.map((item) => (
                  <article key={item.id} className="p-5 space-y-2">
                    <p className="text-xs font-semibold text-sky-900">
                      {lang === 'ar' ? item.tagAr : item.tagEn}
                    </p>
                    <h3 className="text-base font-bold text-slate-900">
                      {lang === 'ar' ? item.titleAr : item.titleEn}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {lang === 'ar' ? item.bodyAr : item.bodyEn}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Us, Affiliate Transparency & Contact Us */}
      <AboutAndContactSection lang={lang} settings={settings} />

      {/* Editorial Platform Index */}
      <section className="py-10 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-900" />
              <span>
                {lang === 'ar'
                  ? 'دليل أقسام المنصة السريع:'
                  : 'Platform Section Directory:'}
              </span>
            </h3>
            <p className="text-xs text-slate-600">
              {lang === 'ar'
                ? 'انتقل مباشرة إلى أي قسم تعليمي أو تدريبي في الأكاديمية.'
                : 'Jump directly to any curriculum resource, interactive lab, or teacher studio.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {[
              { id: 'classroom-gallery', ar: 'من داخل فصولنا', en: 'Classrooms' },
              { id: 'grades', ar: 'الصفوف والتحضير', en: 'Grades & Preps' },
              { id: 'worksheet-library', ar: 'حزم أوراق العمل', en: 'Worksheet Packs' },
              { id: 'quiz-builder', ar: 'بنك الأسئلة والكويزات', en: 'Quiz Bank' },
              { id: 'courses', ar: 'الكورسات', en: 'Courses' },
              { id: 'english-games', ar: 'ألعاب الإنجليزي', en: 'English Games' },
              { id: 'decision-lab', ar: 'صنّاع القرار والمبدعين', en: 'Decision Lab' },
              { id: 'iq-tests', ar: 'اختبارات الذكاء', en: 'IQ & Psych Lab' },
              { id: 'coding-game', ar: 'برمجة للأطفال', en: 'Kids Coding' },
              { id: 'stories', ar: 'القصص الإنجليزية', en: 'Stories' },
              { id: 'certificates', ar: 'استوديو الشهادات', en: 'Certificates' },
              { id: 'teacher-studio', ar: 'استوديو المعلم', en: 'Teacher Studio' },
              { id: 'about', ar: 'عن الأكاديمية', en: 'About Us' },
              { id: 'contact', ar: 'تواصل معنا', en: 'Contact Us' },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToTargetSection(sec.id)}
                className="text-xs font-semibold text-slate-700 hover:text-sky-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap"
              >
                {lang === 'ar' ? sec.ar : sec.en}
              </button>
            ))}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-sky-900 rounded-lg hover:bg-sky-800 whitespace-nowrap"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'الرئيسية' : 'Top'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 text-slate-300 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-semibold text-white">
                © 2026 {lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
              </p>
              <p className="text-slate-400">
                {lang === 'ar'
                  ? 'بوابة تعليمية للغة الإنجليزية · تواصل الشراكات: lailafarag210@gmail.com'
                  : 'Bilingual ESL Education Portal · Inquiries & Partnerships: lailafarag210@gmail.com'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a
                href="#about"
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                {lang === 'ar' ? 'عن الأكاديمية' : 'About Us'}
              </a>
              <a
                href="#contact"
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                {lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </a>
              <a
                href="#courses"
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                {lang === 'ar' ? 'الكورسات' : 'Courses'}
              </a>
              <a
                href="#affiliate-disclosure"
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                {lang === 'ar' ? 'إفصاح الشراكات' : 'Affiliate Disclosure'}
              </a>
              <button
                type="button"
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                {labels.switchLang}
              </button>
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                {labels.adminControlBtn}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-4 leading-relaxed">
            {lang === 'ar'
              ? 'إفصاح الشفافية: بعض الروابط الخارجية في قسم الكورسات التعليمية قد تكون روابط تسويق بالعمولة (Affiliate Links عبر شبكات مثل Impact وغيرها)، مما يساعد على دعم استمرارية الأدوات والموارد المجانية للمعلمين والطلاب دون أي تكلفة إضافية عليك.'
              : 'Affiliate Disclosure: Select external partner links in our Courses section may be affiliate links (including Impact partner programs). If you enroll via those links, LinguaCraft Academy may earn a commission at no additional cost to you.'}
          </p>
        </div>
      </footer>

      {/* Standalone Activation Code Redemption Modal */}
      {codeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                  <KeyRound className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تفعيل المحتوى بكود' : 'Redeem Activation Code'}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'ar' ? 'أدخل كود التفعيل المرسل لك عبر واتساب' : 'Enter your WhatsApp Activation Code'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCodeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRedeemStandaloneCode} className="space-y-3">
              <input
                type="text"
                dir="ltr"
                value={codeModalInput}
                onChange={(e) => setCodeModalInput(e.target.value.toUpperCase())}
                placeholder="LC-XXXX-XXXX"
                className="w-full px-4 py-3 text-sm font-mono font-bold tracking-wider uppercase border border-slate-300 rounded-xl focus:outline-none focus:border-sky-800"
              />
              <button
                type="submit"
                disabled={codeModalBusy || !codeModalInput.trim()}
                className="w-full py-2.5 text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 disabled:opacity-60 transition-colors"
              >
                {codeModalBusy
                  ? lang === 'ar'
                    ? 'جاري التحقق من الكود...'
                    : 'Verifying code...'
                  : lang === 'ar'
                  ? 'تفعيل وفتح الملف الآن'
                  : 'Activate & Unlock Now'}
              </button>
            </form>

            {codeModalFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  codeModalFeedback.ok
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {codeModalFeedback.text}
              </div>
            )}

            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'ar'
                ? 'بمجرد التفعيل يُفتح الملف أو الحزمة أو القصة مباشرة على جهازك بدون الحاجة لتسجيل دخول.'
                : 'Once activated, the resource, pack, or story unlocks immediately on this browser.'}
            </p>
          </div>
        </div>
      )}

      {/* Story Excerpt Modal */}
      {excerptStory && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="space-y-1.5">
              {settings.logoDataUrl && (
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <img
                    src={settings.logoDataUrl}
                    alt={lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
                    referrerPolicy="no-referrer"
                    className="h-6 w-auto max-w-[84px] object-contain rounded shrink-0"
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    {lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
                  </span>
                </div>
              )}
              <p className="text-xs font-semibold text-sky-900">{excerptStory.levelLabel}</p>
              <h3 className="text-xl font-bold text-slate-900">
                {lang === 'ar' ? excerptStory.titleAr : excerptStory.titleEn}
              </h3>
            </div>
            <p
              dir="ltr"
              className="text-sm sm:text-base text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-5"
            >
              {excerptStory.previewExcerpt}
            </p>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setExcerptStory(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                {labels.closeBtn}
              </button>
              {!excerptStory.isPaid || excerptStory.priceEgp <= 0 || isItemUnlocked(unlockedState, excerptStory.id) ? (
                <button
                  type="button"
                  onClick={() => {
                    const chosen = excerptStory;
                    setExcerptStory(null);
                    downloadTextOrHtmlFile({
                      fileName: chosen.fileName || `${chosen.id}.html`,
                      title: lang === 'ar' ? chosen.titleAr : chosen.titleEn,
                      subtitle: chosen.levelLabel,
                      bodyText: chosen.previewExcerpt,
                      fileDataUrl: chosen.fileDataUrl,
                      externalUrl: chosen.externalUrl,
                      brandHeader: lang === 'ar' ? settings.academyNameAr : settings.academyNameEn,
                      logoDataUrl: settings.logoDataUrl,
                      analyticsSection: 'stories',
                      analyticsItemId: chosen.id,
                      analyticsLang: lang,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-600"
                >
                  {!excerptStory.isPaid || excerptStory.priceEgp <= 0 ? (
                    <Download className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {!excerptStory.isPaid || excerptStory.priceEgp <= 0
                      ? lang === 'ar'
                        ? 'تحميل القصة مجاناً'
                        : 'Download Free Story'
                      : lang === 'ar'
                      ? 'مفعّلة — تحميل القصة'
                      : 'Unlocked — Download Story'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const chosen = excerptStory;
                    setExcerptStory(null);
                    setPaymentIntent({
                      itemType: 'story',
                      itemTitle: lang === 'ar' ? chosen.titleAr : chosen.titleEn,
                      amountEgp: chosen.priceEgp,
                      targetType: 'story',
                      targetId: chosen.id,
                    });
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-900 rounded-lg hover:bg-sky-800"
                >
                  {labels.unlockStory} · {excerptStory.priceEgp} {labels.egp}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Quiz Sandbox Modal */}
      <InteractiveQuizModal
        key={activeQuiz?.id || 'closed'}
        resource={activeQuiz}
        lang={lang}
        academyName={lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
        logoDataUrl={settings.logoDataUrl}
        questionBank={questionBank}
        onClose={() => setActiveQuiz(null)}
        onBuyFull={(res) =>
          setPaymentIntent({
            itemType: 'activity',
            itemTitle: lang === 'ar' ? res.titleAr : res.titleEn,
            amountEgp: res.priceEgp,
            targetType: 'resource',
            targetId: res.id,
          })
        }
      />

      {/* InstaPay -> WhatsApp Payment Modal */}
      <PaymentModal
        intent={paymentIntent}
        settings={settings}
        lang={lang}
        user={user}
        onUnlockedSuccess={(nextState) => setUnlockedState(nextState)}
        onClose={() => setPaymentIntent(null)}
      />

      {/* Admin Control Panel */}
      <AdminDashboardModal
        open={adminOpen}
        initialTab={adminInitialTab}
        lang={lang}
        user={user}
        isAdmin={isAdmin}
        settings={settings}
        resources={resources}
        packs={packs}
        packItems={packItems}
        courses={courses}
        questionBank={questionBank}
        subscriptions={adminSubscriptions}
        activationCodes={activationCodes}
        analyticsEvents={analyticsEvents}
        hasCloudPacks={cloudPacks.length > 0}
        hasCloudCourses={cloudCourses.length > 0}
        hasCloudQuestionBank={cloudQuestionBank.length > 0}
        stories={stories}
        papers={papers}
        news={news}
        orders={orders}
        onClose={() => {
          setAdminOpen(false);
          setAdminInitialTab('resources');
        }}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onSwitchAccount={handleSwitchAccount}
        onSeedStarterData={handleSeedStarterData}
        onSeedMissingWorksheetsAndActivities={handleSeedMissingWorksheetsAndActivities}
        onSeedStarterPacks={handleSeedStarterPacks}
        onSeedCoursesAndBank={handleSeedCoursesAndBank}
        onSeedMissingPapers={handleSeedMissingPapers}
        onStarterItemDeleted={markStarterItemDeleted}
      />
    </div>
  );
}
