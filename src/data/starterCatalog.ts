import type {
  AcademySettings,
  GradeResource,
  NewsItem,
  OfficialPaper,
  StoryItem,
} from '../types';

export const DEFAULT_SETTINGS: AcademySettings = {
  academyNameEn: 'LinguaCraft English Academy',
  academyNameAr: 'أكاديمية لينجوا كرافت للغة الإنجليزية',
  instapayHandle: 'linguacraft@instapay',
  instapayUrl: 'https://ipn.eg/S/linguacraft/instapay',
  whatsappNumber: '201000000000',
  whiteLabelPriceEgp: 75,
  aiCertificatePriceEgp: 50,
  seeded: false,
};

export const HERO_BANNER_IMAGE = '/src/assets/images/hero_english_academy_1794935738831.jpg';
export const CERTIFICATE_SEAL_IMAGE = '/src/assets/images/certificate_royal_seal_1794935739611.jpg';
export const STORY_COVER_1 = '/src/assets/images/story_magical_library_1794935738366.jpg';
export const STORY_COVER_2 = '/src/assets/images/story_adventure_island_1794935739624.jpg';

export const STARTER_RESOURCES: Omit<GradeResource, 'authorUid' | 'createdAt'>[] = [
  {
    id: 'res_prim4_prep_1',
    gradeId: 'prim4',
    category: 'prep',
    titleEn: 'Primary 4 · Unit 1 Electronic Lesson Prep (I Feel Good)',
    titleAr: 'الصف الرابع · تحضير إلكتروني للوحدة الأولى',
    descriptionEn: 'Complete structured lesson plan covering objectives, warm-up, food & healthy habits vocabulary, and formative checks.',
    descriptionAr: 'تحضير إلكتروني متكامل يشمل الأهداف، التهيئة، المفردات، خطوات الشرح، والتقويم المرحلي.',
    isInteractive: false,
    isPaid: false,
    priceEgp: 0,
    allowWhiteLabel: true,
    fileName: 'Primary4_Unit1_Electronic_Prep.html',
    contentText: `UNIT 1: I FEEL GOOD — ELECTRONIC LESSON PREPARATION
Grade: Primary 4 | Subject: English Language

1. Learning Objectives:
- Identify healthy foods and drinks in English.
- Ask and answer about favorite meals using Present Simple.
- Pronounce short & long vowel pairs accurately.

2. Warm-Up (5 mins):
Show realia / flashcards of Egyptian fruits (mangoes, bananas, watermelon) and elicit names.

3. Target Vocabulary:
bananas, grapes, mangoes, milk, rice, sugarcane, watermelon, farmers.

4. Procedures:
- Presentation: Play audio dialogue and model key sentences ("Egyptian farmers raise chickens and grow rice").
- Guided Practice: Pair-work matching food items with local crops.
- Production: Students write 3 sentences about what we grow in Egypt.

5. Assessment & Homework:
Exit slip: Write 2 healthy food items you ate today.`,
  },
  {
    id: 'res_prim4_exam_1',
    gradeId: 'prim4',
    category: 'exam',
    titleEn: 'Primary 4 · October Monthly English Assessment',
    titleAr: 'الصف الرابع · امتحان شهر أكتوبر لغة إنجليزية',
    descriptionEn: 'Printable 30-mark monthly exam with reading comprehension, reorder, punctuation, and guided paragraph.',
    descriptionAr: 'نموذج امتحان شهري من ٣٠ درجة يشمل القطعة، الترتيب، علامات الترقيم، والفقرة الإنشائية.',
    isInteractive: false,
    isPaid: false,
    priceEgp: 0,
    allowWhiteLabel: true,
    fileName: 'Primary4_October_Exam.html',
    contentText: `MONTHLY ASSESSMENT — PRIMARY 4 ENGLISH (30 Marks)

Q1. Choose the correct answer:
1. Farmers in Egypt (grow / raise / drink) rice and tomatoes.
2. Mangoes are my favorite (fruit / vegetable / drink).
3. We use our (stomach / lungs / heart) to breathe air.

Q2. Reorder the words to make correct sentences:
1. food / makes / Egypt / special / farmers.
2. I / eat / healthy / like / to / food.

Q3. Write a paragraph of 18 words about "Healthy Food".`,
  },
  {
    id: 'res_prim4_act_interactive',
    gradeId: 'prim4',
    category: 'activity',
    titleEn: 'Primary 4 · Interactive Grammar & Phonics Challenge',
    titleAr: 'الصف الرابع · نشاط تفاعلي للقواعد والصوتيات',
    descriptionEn: 'Self-grading interactive digital activity pack with instant audio-ready feedback for smart boards and tablets.',
    descriptionAr: 'حزمة أنشطة تفاعلية ذاتية التصحيح للسبورة الذكية والأجهزة اللوحية مع تقييم فوري للطلاب.',
    isInteractive: true,
    isPaid: true,
    priceEgp: 45,
    allowWhiteLabel: false,
    fileName: 'Primary4_Interactive_Challenge.html',
    contentText: JSON.stringify([
      {
        question: 'Egyptian farmers ______ chickens to get fresh eggs.',
        options: ['raise', 'grow', 'bake', 'drink'],
        correctIndex: 0,
        explanation: 'We use "raise" with animals like chickens and cows, and "grow" with plants.',
      },
      {
        question: 'The ______ pumps blood around our body.',
        options: ['lung', 'heart', 'stomach', 'mouth'],
        correctIndex: 1,
        explanation: 'The heart is the organ that pumps blood throughout the body.',
      },
      {
        question: 'Which word has the same long /aɪ/ sound as "rice"?',
        options: ['milk', 'fish', 'kite', 'sit'],
        correctIndex: 2,
        explanation: '"Kite" and "rice" share the long /aɪ/ vowel sound.',
      },
    ]),
  },
  {
    id: 'res_prep1_prep_1',
    gradeId: 'prep1',
    category: 'prep',
    titleEn: 'Prep 1 · Present Simple & Daily Routines Prep',
    titleAr: 'الصف الأول الإعدادي · تحضير زمن المضارع البسيط',
    descriptionEn: 'Ready-to-print electronic lesson prep with differentiation strategies and active learning tasks.',
    descriptionAr: 'تحضير إلكتروني جاهز للطباعة يتضمن استراتيجيات التعلم النشط ومهارات التحدث.',
    isInteractive: false,
    isPaid: false,
    priceEgp: 0,
    allowWhiteLabel: true,
    fileName: 'Prep1_Present_Simple_Prep.html',
    contentText: `PREPARATORY 1 — ELECTRONIC LESSON PREPARATION
Topic: My Family & Daily Routines (Present Simple)

Learning Outcomes:
- Form affirmative, negative, and question forms in the Present Simple.
- Use adverbs of frequency (always, usually, often, sometimes, never) naturally.

Warm-up: Think-Pair-Share about morning routines before school.
Procedures:
1. Elicit verb + -s/-es rules for third-person singular (he/she/it).
2. Controlled drill with frequency scale (100% -> 0%).
3. Communicative interview: "How often do you read English stories?"`,
  },
  {
    id: 'res_prep3_exam_1',
    gradeId: 'prep3',
    category: 'exam',
    titleEn: 'Prep 3 · Mid-Term Revision Booklet & Model Exam',
    titleAr: 'الصف الثالث الإعدادي · مذكرة مراجعة ونموذج امتحان',
    descriptionEn: 'Comprehensive dialogue, situational, and essay practice tailored for Prep 3 certificate exams.',
    descriptionAr: 'مذكرة مراجعة شاملة على المحادثة والمواقف والبرجراف لطلاب الشهادة الإعدادية.',
    isInteractive: false,
    isPaid: false,
    priceEgp: 0,
    allowWhiteLabel: true,
    fileName: 'Prep3_Midterm_Revision.html',
    contentText: `PREPARATORY 3 — MID-TERM REVISION EXAM

1. Finish the following dialogue:
Salma is asking Nada about her visit to the Science Museum.
Salma: Where did you go yesterday?
Nada: I went to the Science Museum.
Salma: (1) ....................................................?
Nada: I went with my school class.

2. Read and complete the text with words from the list:
(station - passengers - comfortable - arrives)
Every morning, hundreds of ______ wait at the railway ______.`,
  },
  {
    id: 'res_sec1_act_1',
    gradeId: 'sec1',
    category: 'activity',
    titleEn: 'Secondary 1 · Interactive Translation & Essay Lab',
    titleAr: 'الأول الثانوي · نشاط تفاعلي للترجمة والمقال',
    descriptionEn: 'Interactive academic vocabulary, translation drills, and paragraph structure challenge for high schoolers.',
    descriptionAr: 'تدريبات تفاعلية على الترجمة وبناء المقال الأكاديمي للمرحلة الثانوية.',
    isInteractive: true,
    isPaid: true,
    priceEgp: 60,
    allowWhiteLabel: true,
    fileName: 'Sec1_Interactive_Translation_Lab.html',
    contentText: JSON.stringify([
      {
        question: 'Choose the most accurate English translation for: "تسعى الدولة إلى تطوير التعليم التكنولوجي لمواكبة العصر."',
        options: [
          'The state seeks to develop technological education to keep pace with the modern era.',
          'The state wants building schools for computers.',
          'Technology education is making the era fast.',
          'The country stops teaching old books today.',
        ],
        correctIndex: 0,
        explanation: '"Keep pace with" accurately renders "مواكبة" in formal academic English.',
      },
      {
        question: 'Which transition word introduces a contrasting academic point?',
        options: ['Furthermore', 'Consequently', 'Nevertheless', 'Similarly'],
        correctIndex: 2,
        explanation: '"Nevertheless" signals contrast, whereas the others add or show cause/similarity.',
      },
    ]),
  },
];

export const STARTER_STORIES: Omit<StoryItem, 'authorUid' | 'createdAt'>[] = [
  {
    id: 'story_golden_balloon',
    titleEn: 'The Golden Balloon Over Willow Valley',
    titleAr: 'المنطاد الذهبي فوق وادي الصفصاف',
    levelLabel: 'Primary 3 – 5 · A1 Reader',
    summaryEn: 'An illustrated English phonics and vocabulary adventure following two curious siblings who discover a floating library.',
    summaryAr: 'قصة إنجليزية مصورة تنمي مهارات القراءة والمفردات لطلاب المرحلة الابتدائية بأسلوب مشوق.',
    previewExcerpt:
      'Chapter 1: On a crisp Tuesday morning, Maya opened the heavy leather book on her desk. A soft golden glow rose from the paper, carrying a tiny striped balloon right past the window...',
    coverUrl: STORY_COVER_1,
    isPaid: true,
    priceEgp: 65,
    fileName: 'Golden_Balloon_Storybook.pdf',
  },
  {
    id: 'story_lighthouse_voyage',
    titleEn: 'The Lighthouse Keeper’s Secret Map',
    titleAr: 'خريطة حارس المنارة السرية',
    levelLabel: 'Primary 6 – Prep 2 · A2 Reader',
    summaryEn: 'Includes 6 illustrated chapters, comprehension questions, glossary flashcards, and past-tense reading drills.',
    summaryAr: 'تضم ٦ فصول مصورة مع أسئلة فهم وقاموس مصغر للمفردات وتدريبات القراءة.',
    previewExcerpt:
      'Chapter 1: As the dawn sun touched the red-and-white lighthouse, Oliver untied the wooden sailboat. Hidden inside the lantern room was a folded map marked with three English riddles...',
    coverUrl: STORY_COVER_2,
    isPaid: true,
    priceEgp: 80,
    fileName: 'Lighthouse_Secret_Map_Story.pdf',
  },
];

export const STARTER_PAPERS: Omit<OfficialPaper, 'authorUid' | 'createdAt'>[] = [
  {
    id: 'paper_attendance_grades',
    titleEn: 'Official Teacher Gradebook & Formative Assessment Sheet',
    titleAr: 'سجل درجات وتقييمات اللغة الإنجليزية الرسمي',
    categoryEn: 'Assessment Record',
    categoryAr: 'سجلات التقييم',
    descriptionEn: 'Clean printable weekly & monthly score sheet structured for classroom English evaluation (listening, reading, writing, participation).',
    descriptionAr: 'نموذج منظم لرصد درجات التقييم الأسبوعي والشهري (استماع، قراءة، كتابة، مشاركة).',
    fileName: 'Official_English_Gradebook_Sheet.html',
    isPaid: false,
    priceEgp: 0,
    contentText: `OFFICIAL ENGLISH LANGUAGE ASSESSMENT RECORD
School: __________________________   Academic Year: 2026 / 2027
Teacher: _________________________   Grade / Class: _______________

Columns: No. | Student Name | Listening (10) | Reading (10) | Writing (10) | Behavior & Homework (10) | Total (40) | Notes`,
  },
  {
    id: 'paper_pacing_calendar',
    titleEn: 'Term Curriculum Pacing & Supervisor Inspection Log',
    titleAr: 'خطة توزيع المنهج وسجل متابعة التوجيه',
    categoryEn: 'Curriculum Planning',
    categoryAr: 'خطط المنهج',
    descriptionEn: 'Official pacing template mapping weeks, units, grammar targets, and supervisor remarks.',
    descriptionAr: 'استمارة رسمية لتوزيع الوحدات على أسابيع الفصل الدراسي وملاحظات التوجيه الفني.',
    fileName: 'Official_Curriculum_Pacing_Log.html',
    isPaid: false,
    priceEgp: 0,
    contentText: `TERM CURRICULUM PACING & INSPECTION LOG
Subject: English Language | Term: First / Second

Week | Unit & Lessons | Target Grammar & Vocabulary | Teaching Aids | Supervisor Signature`,
  },
];

export const STARTER_NEWS: Omit<NewsItem, 'authorUid' | 'createdAt'>[] = [
  {
    id: 'news_launch_2026',
    titleEn: 'New Term Electronic Lesson Preps & AI Certificates Now Live',
    titleAr: 'إطلاق تحضيرات الفصل الدراسي الجديد وشهادات التقدير بالذكاء الاصطناعي',
    bodyEn: 'All Primary, Preparatory, and Secondary electronic lesson preps are updated for the new term. Teachers can now also draft custom lesson plans and publish them directly to Facebook with one link.',
    bodyAr: 'تم تحديث جميع التحضيرات الإلكترونية للمراحل الابتدائية والإعدادية والثانوية. كما يمكن للمعلمين الآن إعداد تحضير خاص ونشره مباشرة عبر فيسبوك برابط مستقل.',
    tagEn: 'Curriculum Update',
    tagAr: 'تحديث المنهج',
  },
  {
    id: 'news_whitelabel_exams',
    titleEn: 'Custom White-Label Exams & Booklets for Teachers & Centers',
    titleAr: 'خدمة تجهيز الامتحانات والمذكرات باسمك أو اسم السنتر بدون لوجو',
    bodyEn: 'You can now request any exam or revision booklet customized with your personal teacher name or educational center branding via InstaPay and WhatsApp.',
    bodyAr: 'يمكنك الآن طلب أي امتحان أو مذكرة من مكتبة المنصة مطبوعة باسمك أو اسم السنتر الخاص بك بدون شعار الموقع عبر إنستاباي والواتساب.',
    tagEn: 'Teacher Services',
    tagAr: 'خدمات المعلمين',
  },
];
