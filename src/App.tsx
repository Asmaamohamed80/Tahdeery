import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUp,
  BookOpen,
  Brain,
  Code2,
  Compass,
  Download,
  FileText,
  Gamepad2,
  Globe,
  Lock,
  Newspaper,
  Play,
  SlidersHorizontal,
  Sparkles,
  Stamp,
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  collection,
  doc,
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
} from './data/starterCatalog';
import {
  GRADES,
  type AcademySettings,
  type AffiliateCourse,
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
  type WorksheetPack,
  type WorksheetPackItem,
} from './types';
import { t } from './i18n';
import { downloadTextOrHtmlFile } from './utils/download';
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
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [cloudLoaded, setCloudLoaded] = useState(false);

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

    const unsubPapers = onSnapshot(
      query(collection(db, 'official_papers'), orderBy('createdAt', 'desc')),
      (snap) => {
        setCloudPapers(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OfficialPaper, 'id'>) }))
        );
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
      query(collection(db, 'worksheet_packs'), orderBy('packNumber', 'asc')),
      (snap) => {
        setCloudPacks(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WorksheetPack, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'worksheet_packs')
    );

    const unsubPackItems = onSnapshot(
      query(collection(db, 'worksheet_items'), orderBy('itemOrder', 'asc')),
      (snap) => {
        setCloudPackItems(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WorksheetPackItem, 'id'>) }))
        );
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

  // Orders, teacher quizzes, attempts & subscriptions listeners (authenticated users only)
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setOrders([]);
      setMyQuizzes([]);
      setQuizAttempts([]);
      setMySubscription(null);
      setAdminSubscriptions([]);
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
    } else {
      setAdminSubscriptions([]);
    }

    return () => {
      unsubOrders();
      unsubQuizzes();
      unsubAttempts();
      unsubMySub();
      if (unsubAdminSubs) unsubAdminSubs();
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
      if (!existingPackIds.has(pack.id)) {
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
      if (!existingSheetIds.has(sheet.id)) {
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

  // Auto-seed starter catalog once when admin first signs in if database hasn't been seeded yet
  useEffect(() => {
    if (cloudLoaded && isAdmin && !settings.seeded && cloudResources.length === 0) {
      handleSeedStarterData().catch((err) => console.error('Auto seed error:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudLoaded, isAdmin, settings.seeded]);

  // Display starter items seamlessly if not seeded yet; once seeded, Firestore is source of truth
  const resources: GradeResource[] = useMemo(() => {
    if (settings.seeded || cloudResources.length > 0) return cloudResources;
    return STARTER_RESOURCES.map((r) => ({ ...r, authorUid: 'starter' }));
  }, [settings.seeded, cloudResources]);

  const stories: StoryItem[] = useMemo(() => {
    if (settings.seeded || cloudStories.length > 0) return cloudStories;
    return STARTER_STORIES.map((s) => ({ ...s, authorUid: 'starter' }));
  }, [settings.seeded, cloudStories]);

  const papers: OfficialPaper[] = useMemo(() => {
    if (settings.seeded || cloudPapers.length > 0) return cloudPapers;
    return STARTER_PAPERS.map((p) => ({ ...p, authorUid: 'starter' }));
  }, [settings.seeded, cloudPapers]);

  const news: NewsItem[] = useMemo(() => {
    if (settings.seeded || cloudNews.length > 0) return cloudNews;
    return STARTER_NEWS.map((n) => ({ ...n, authorUid: 'starter' }));
  }, [settings.seeded, cloudNews]);

  const packs: WorksheetPack[] = useMemo(() => {
    if (cloudPacks.length > 0) return cloudPacks;
    return STARTER_WORKSHEET_PACKS.map((p) => ({ ...p, authorUid: 'starter' }));
  }, [cloudPacks]);

  const packItems: WorksheetPackItem[] = useMemo(() => {
    if (cloudPackItems.length > 0) return cloudPackItems;
    return STARTER_WORKSHEET_ITEMS.map((i) => ({ ...i, authorUid: 'starter' }));
  }, [cloudPackItems]);

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

      {/* Workspace Language & Quick Utility Strip */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            {settings.logoDataUrl && (
              <img
                src={settings.logoDataUrl}
                alt={lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
                referrerPolicy="no-referrer"
                className="h-7 w-auto max-w-[96px] object-contain rounded shrink-0"
              />
            )}
            <span className="font-semibold text-slate-900">
              {lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {lang === 'ar'
                ? 'منصة متخصصة لمعلمي وطلاب اللغة الإنجليزية'
                : 'Dedicated English Teaching & Learning Hub'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-900" />
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setLang('ar')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  lang === 'ar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  lang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Mobile & Tablet Horizontal Quick-Jump Strip */}
          <div className="lg:hidden w-full flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
            {[
              { id: 'english-games', ar: 'ألعاب الإنجليزي مجاناً', en: 'English Games' },
              { id: 'decision-lab', ar: 'صنّاع القرار مجاناً', en: 'Decision Lab' },
              { id: 'iq-tests', ar: 'ذكاء مجاني بالشهادة', en: 'Free IQ' },
              { id: 'coding-game', ar: 'برمجة مجانية بالشهادة', en: 'Free Coding' },
              { id: 'stories', ar: 'القصص', en: 'Stories' },
              { id: 'worksheet-library', ar: 'حزم الورق', en: 'Packs' },
              { id: 'grades', ar: 'الصفوف', en: 'Grades' },
              { id: 'quiz-builder', ar: 'بنك الكويزات', en: 'Quiz Bank' },
              { id: 'teacher-studio', ar: 'تحضير المعلم', en: 'Studio' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToTargetSection(item.id)}
                className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-sky-50 hover:text-sky-900 whitespace-nowrap shrink-0"
              >
                {lang === 'ar' ? item.ar : item.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Split */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight text-balance">
                {labels.heroTitle}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                {labels.heroSubtitle}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#grades"
                  className="px-6 py-3 text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors whitespace-nowrap"
                >
                  {labels.heroPrimaryCta}
                </a>
                <a
                  href="#teacher-studio"
                  className="px-6 py-3 text-sm font-semibold text-slate-900 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  {labels.heroSecondaryCta}
                </a>
              </div>

              {/* Direct Free Highlight Shortcuts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => scrollToTargetSection('english-games')}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-start hover:bg-amber-100/80 transition-colors flex items-center gap-3"
                >
                  <Gamepad2 className="w-5 h-5 text-amber-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-950 truncate">
                      {lang === 'ar'
                        ? 'ألعاب الإنجليزي (مجاني 100%)'
                        : 'Free English Games'}
                    </p>
                    <p className="text-[11px] text-amber-800 truncate">
                      {lang === 'ar'
                        ? '3 مستويات للسن + صوت ومايك + شهادة PDF'
                        : '3 age levels + mic coach + free PDF'}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToTargetSection('decision-lab')}
                  className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-start hover:bg-indigo-100/80 transition-colors flex items-center gap-3"
                >
                  <Compass className="w-5 h-5 text-indigo-800 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-indigo-950 truncate">
                      {lang === 'ar'
                        ? 'مختبر صنّاع القرار والمبدعين (مجاني)'
                        : 'Decision Makers & Creators Lab (Free)'}
                    </p>
                    <p className="text-[11px] text-indigo-800 truncate">
                      {lang === 'ar'
                        ? '3 أعمار · محاكاة قرار + روبوت + مهام برا الشاشة'
                        : '3 age levels · Decisions, Bot Bugs & Safe Builds'}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToTargetSection('iq-tests')}
                  className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-start hover:bg-emerald-100/80 transition-colors flex items-center gap-3"
                >
                  <Brain className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-950 truncate">
                      {lang === 'ar'
                        ? 'اختبارات الذكاء والنفسية (مجاني)'
                        : 'Free IQ & Psych Tests'}
                    </p>
                    <p className="text-[11px] text-emerald-800 truncate">
                      {lang === 'ar'
                        ? 'النتيجة الفورية + شهادة PDF مجاناً'
                        : 'Instant score + free PDF certificate'}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToTargetSection('coding-game')}
                  className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-start hover:bg-sky-100/80 transition-colors flex items-center gap-3"
                >
                  <Code2 className="w-5 h-5 text-sky-900 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-sky-950 truncate">
                      {lang === 'ar'
                        ? 'ألعاب البرمجة للأطفال (مجاني)'
                        : 'Free Kids Coding Games'}
                    </p>
                    <p className="text-[11px] text-sky-800 truncate">
                      {lang === 'ar'
                        ? 'تعلّم بالإنجليزية + شهادة PDF مجاناً'
                        : 'Learn in English + free PDF certificate'}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="h-64 sm:h-80 lg:h-full rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-sky-900 to-slate-800">
                <img
                  src={HERO_BANNER_IMAGE}
                  alt={labels.heroTitle}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 4-Column Metric Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-slate-900 font-mono-num">{GRADES.length}</p>
              <p className="text-xs font-medium text-slate-600 mt-1">{labels.statGrades}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-slate-900 font-mono-num">{resources.length}</p>
              <p className="text-xs font-medium text-slate-600 mt-1">{labels.statPreps}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-slate-900 font-mono-num">{stories.length}</p>
              <p className="text-xs font-medium text-slate-600 mt-1">{labels.statStories}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-700 font-mono-num">
                {settings.aiCertificatePriceEgp} {labels.egp}
              </p>
              <p className="text-xs font-medium text-slate-600 mt-1">{labels.statCerts}</p>
            </div>
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
                  <Sparkles className="w-4 h-4" />
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
                      {!item.isPaid ? (
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
                              })
                            }
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 transition-colors whitespace-nowrap"
                          >
                            <Download className="w-4 h-4" />
                            <span>{labels.downloadBtn}</span>
                          </button>
                          {item.isInteractive && (
                            <button
                              type="button"
                              onClick={() => setActiveQuiz(item)}
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
                              onClick={() => setActiveQuiz(item)}
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
        onOpenAdminPacks={() => {
          setAdminInitialTab('packs');
          setAdminOpen(true);
        }}
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
                        <span className="font-semibold text-amber-700 font-mono-num">
                          {story.priceEgp} {labels.egp}
                        </span>
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
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentIntent({
                            itemType: 'story',
                            itemTitle: lang === 'ar' ? story.titleAr : story.titleEn,
                            amountEgp: story.priceEgp,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 whitespace-nowrap"
                      >
                        <span>
                          {labels.unlockStory} · {story.priceEgp} {labels.egp}
                        </span>
                      </button>
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
          {/* Official School Papers */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-900">
                <FileText className="w-4 h-4" />
                <span>{lang === 'ar' ? 'مستندات ونماذج رسمية' : 'Official Templates'}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{labels.papersTitle}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{labels.papersLead}</p>
            </div>

            {papers.length === 0 ? (
              <p className="text-sm text-slate-500">{labels.emptyItems}</p>
            ) : (
              <div className="space-y-4">
                {papers.map((paper) => (
                  <div
                    key={paper.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500">
                        {lang === 'ar' ? paper.categoryAr : paper.categoryEn} ·{' '}
                        <span className="font-semibold text-emerald-700">{labels.freeLabel}</span>
                      </p>
                      <h3 className="text-base font-bold text-slate-900">
                        {lang === 'ar' ? paper.titleAr : paper.titleEn}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {lang === 'ar' ? paper.descriptionAr : paper.descriptionEn}
                      </p>
                    </div>
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
                        })
                      }
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 whitespace-nowrap shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>{labels.downloadBtn}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
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

      {/* Quick Platform Directory (Helps direct-link visitors explore the rest of the site) */}
      <section className="py-10 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>
                {lang === 'ar'
                  ? 'استكشف باقي أقسام المنصة المجانية والمدفوعة:'
                  : 'Explore More Sections Across the Platform:'}
              </span>
            </h3>
            <p className="text-xs text-slate-600">
              {lang === 'ar'
                ? 'انتقل مباشرة لأي قسم من هنا لتجربة الأدوات المجانية أو تصفح الكتب والمناهج.'
                : 'Jump cleanly to any free learning game, IQ assessment, story library, or teacher tool.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'english-games', ar: 'ألعاب الإنجليزي (مجاني بالشهادة)', en: 'Free English Games' },
              { id: 'decision-lab', ar: 'صنّاع القرار والمبدعين (مجاني)', en: 'Free Decision Lab' },
              { id: 'iq-tests', ar: 'اختبارات الذكاء (مجاني بالشهادة)', en: 'Free IQ & Psych Lab' },
              { id: 'coding-game', ar: 'ألعاب البرمجة (مجاني بالشهادة)', en: 'Free Kids Coding' },
              { id: 'stories', ar: 'القصص الإنجليزية', en: 'Stories' },
              { id: 'worksheet-library', ar: 'حزم أوراق العمل', en: 'Worksheet Packs' },
              { id: 'grades', ar: 'الصفوف والتحضير', en: 'Grades & Preps' },
              { id: 'quiz-builder', ar: 'بنك الأسئلة والكويزات', en: 'Quiz Bank' },
              { id: 'certificates', ar: 'شهادات الذكاء الاصطناعي', en: 'AI Certificates' },
              { id: 'teacher-studio', ar: 'استوديو المعلم', en: 'Teacher Studio' },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToTargetSection(sec.id)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:border-sky-800 hover:text-sky-900 transition-colors whitespace-nowrap"
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
      <footer className="mt-auto bg-slate-950 text-slate-300 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>
            © 2026 {lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="hover:text-white transition-colors"
            >
              {labels.switchLang}
            </button>
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="hover:text-white transition-colors"
            >
              {labels.adminControlBtn}
            </button>
          </div>
        </div>
      </footer>

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
              <button
                type="button"
                onClick={() => {
                  const chosen = excerptStory;
                  setExcerptStory(null);
                  setPaymentIntent({
                    itemType: 'story',
                    itemTitle: lang === 'ar' ? chosen.titleAr : chosen.titleEn,
                    amountEgp: chosen.priceEgp,
                  });
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-900 rounded-lg hover:bg-sky-800"
              >
                {labels.unlockStory} · {excerptStory.priceEgp} {labels.egp}
              </button>
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
          })
        }
      />

      {/* InstaPay -> WhatsApp Payment Modal */}
      <PaymentModal
        intent={paymentIntent}
        settings={settings}
        lang={lang}
        user={user}
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
      />
    </div>
  );
}
