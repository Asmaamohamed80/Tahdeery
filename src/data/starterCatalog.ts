import type {
  AcademySettings,
  AffiliateCourse,
  GradeResource,
  NewsItem,
  OfficialPaper,
  QuestionBankItem,
  StoryItem,
  TeacherQuiz,
  WorksheetPack,
  WorksheetPackItem,
} from '../types';

export const DEFAULT_SETTINGS: AcademySettings = {
  academyNameEn: 'LinguaCraft English Academy',
  academyNameAr: 'أكاديمية لينجوا كرافت للغة الإنجليزية',
  instapayHandle: 'linguacraft@instapay',
  instapayUrl: 'https://ipn.eg/S/linguacraft/instapay',
  whatsappNumber: '201000000000',
  whiteLabelPriceEgp: 75,
  aiCertificatePriceEgp: 50,
  quizTermPriceEgp: 120,
  termPromoEnabled: true,
  termPromoTitleAr: 'اشتراك الترم الكامل — منصة الكويزات وبنك الأسئلة للمعلمين',
  termPromoTitleEn: 'Full Term Pass — Teacher Quiz Studio & Question Bank',
  termPromoSubtitleAr: 'افتح اختبارات بلا حدود + تصحيح تلقائي + تقارير درجات الطلاب لمدة ترم كامل، ويتوقف تلقائياً بانتهاء المدة.',
  termPromoSubtitleEn: 'Unlimited online student quizzes & instant analytics for a full term — auto-expires cleanly at term end.',
  termPromoDurationDays: 120,
  seeded: false,
};

export const HERO_BANNER_IMAGE = '/src/assets/images/classroom_hero_students_1795788392619.jpg';
export const CLASSROOM_PHONICS_IMAGE = '/src/assets/images/kids_phonics_table_1795788393497.jpg';
export const STUDENT_TABLET_IMAGE = '/src/assets/images/student_tablet_reading_1795788393787.jpg';
export const STUDENT_AWARD_IMAGE = '/src/assets/images/student_award_certificate_1795788393716.jpg';
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
    id: 'res_prim4_worksheet_1',
    gradeId: 'prim4',
    category: 'worksheet',
    titleEn: 'Primary 4 · Unit 1 Vocabulary & Spelling Practice Worksheet',
    titleAr: 'الصف الرابع · ورقة عمل تدريبية للمفردات والإملاء',
    descriptionEn: 'Ready-to-print A4 student worksheet with word-bank matching, fill-in-the-blanks, and sentence tracing.',
    descriptionAr: 'ورقة عمل جاهزة للطباعة (A4) تشمل التوصيل، إكمال الجمل، وتدريبات الإملاء والخط لطلاب الصف الرابع.',
    isInteractive: false,
    isPaid: false,
    priceEgp: 0,
    allowWhiteLabel: true,
    fileName: 'Primary4_Unit1_Worksheet.html',
    contentText: `PRIMARY 4 ENGLISH — PRINTABLE WORKSHEET (UNIT 1)
Name: ___________________________   Class: _________   Date: ___/___/2026

Part A: Match the word to its category:
1. mangoes / watermelon        (   )  a. Healthy Drinks
2. milk / fresh juice          (   )  b. Egyptian Crops
3. rice / sugarcane            (   )  c. Local Fruits

Part B: Fill in the blanks using (grow - raise - healthy - special):
1. Farmers in Damietta __________ cows and goats.
2. Drinking water and eating fruit keeps us __________.
3. Egyptian farmers __________ rice and tomatoes.
4. Grandma cooked a __________ meal for our family.

Part C: Write 3 neat sentences about your favorite healthy breakfast.`,
  },
  {
    id: 'res_prim4_act_printable',
    gradeId: 'prim4',
    category: 'activity',
    titleEn: 'Primary 4 · Classroom Pair-Work Food Market Activity (Printable)',
    titleAr: 'الصف الرابع · نشاط صفي عادي للطباعة (سوق الطعام الصحي)',
    descriptionEn: 'Non-interactive cut-out roleplay cards & pair-work speaking grid for classroom English conversation practice.',
    descriptionAr: 'نشاط صفي ورقي غير تفاعلي جاهز للطباعة يتضمن بطاقات حوار ثنائي وتدريب المحادثة داخل الفصل.',
    isInteractive: false,
    isPaid: false,
    priceEgp: 0,
    allowWhiteLabel: true,
    fileName: 'Primary4_Classroom_Market_Activity.html',
    contentText: `PRIMARY 4 CLASSROOM ACTIVITY — HEALTHY FOOD MARKET (NON-INTERACTIVE PRINTABLE)
Activity Type: Pair-Work Speaking & Cut-Out Cards (15 Minutes)

Teacher Setup:
Print and cut the roleplay cards below. Pair students into "Shopkeeper" and "Customer".

Card 1 (Customer): "Hello! Do you have fresh mangoes and milk?"
Card 2 (Shopkeeper): "Yes, I do! Here are fresh mangoes from Ismailia."
Card 3 (Follow-up Survey): Ask 3 classmates:
- What fruit do you like? ______________________
- What healthy drink do you prefer? ____________`,
  },
  {
    id: 'res_prep1_worksheet_1',
    gradeId: 'prep1',
    category: 'worksheet',
    titleEn: 'Prep 1 · Present Simple & Frequency Adverbs Worksheet',
    titleAr: 'الأول الإعدادي · ورقة عمل المضارع البسيط وظروف التكرار',
    descriptionEn: 'Two-page printable grammar worksheet covering 3rd-person -s/-es rules, negative forms, and error correction.',
    descriptionAr: 'ورقة عمل نحوية جاهزة للطباعة تشمل تصحيح الخطأ وتكوين السؤال والنفي في المضارع البسيط.',
    isInteractive: false,
    isPaid: false,
    priceEgp: 0,
    allowWhiteLabel: true,
    fileName: 'Prep1_Present_Simple_Worksheet.html',
    contentText: `PREPARATORY 1 — PRINTABLE GRAMMAR WORKSHEET
Student Name: _________________________   Date: ___/___/2026

Exercise 1: Correct the underlined words:
1. Huda always (watch) __________ educational videos in the evening.
2. They (doesn't) __________ go to school on Fridays.
3. How often (do) __________ Omar visit his grandparents?

Exercise 2: Rewrite using the word in brackets:
1. She walks to school every day. (never) -> _______________________________
2. We play football after school. (Does...?) -> ____________________________`,
  },
  {
    id: 'res_prep1_act_printable',
    gradeId: 'prep1',
    category: 'activity',
    titleEn: 'Prep 1 · Find Someone Who Classroom Speaking Grid (Printable)',
    titleAr: 'الأول الإعدادي · نشاط صفي ورقي للمحادثة اليومية',
    descriptionEn: 'Printable classroom icebreaker and speaking bingo sheet practicing daily habits without screens.',
    descriptionAr: 'نشاط صفي عادي غير تفاعلي للتدريب على التحدث بالإنجليزية داخل الفصل باستخدام ورقة استبيان جماعي.',
    isInteractive: false,
    isPaid: false,
    priceEgp: 0,
    allowWhiteLabel: true,
    fileName: 'Prep1_Speaking_Grid_Activity.html',
    contentText: `PREP 1 NON-INTERACTIVE CLASSROOM ACTIVITY — "FIND SOMEONE WHO..."
Instructions: Walk around the classroom and ask your classmates in English! Write their name in each box.

1. Find someone who always wakes up before 6:30 AM.        Name: ____________
2. Find someone who reads English stories twice a week.   Name: ____________
3. Find someone who never drinks soda.                    Name: ____________
4. Find someone who helps prepare dinner at home.         Name: ____________`,
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
    id: 'paper_senior_teacher_book',
    titleEn: 'Senior Teacher Book',
    titleAr: 'كتاب Senior Teacher',
    categoryEn: 'Teacher Books',
    categoryAr: 'كتب ومراجع المعلم',
    descriptionEn:
      'Comprehensive Senior Teacher reference book for classroom instruction and lesson mastery (upload custom cover & file from Admin).',
    descriptionAr:
      'كتاب Senior Teacher الشامل للمعلم — يمكنك رفع صورة الغلاف وملف الكتاب من لوحة الأدمن وتحديد مجاني أو مدفوع.',
    coverUrl: '',
    fileName: 'Senior_Teacher_Book.html',
    isPaid: false,
    priceEgp: 0,
    contentText: `SENIOR TEACHER BOOK — REFERENCE EDITION
Prepared for English Teachers & Classroom Instruction.
Note: Upload your full PDF or Google Drive link and custom book cover from the Admin Panel (Papers & Books tab -> Edit).`,
  },
  {
    id: 'paper_quran_dotted_booklet',
    titleEn: 'Short Quran Surahs Dotted Tracing Booklet for Kids',
    titleAr: 'كتيب سور القرآن القصيرة بالتنقيط للأطفال الصغيرين',
    categoryEn: 'Kids Tracing Booklets',
    categoryAr: 'كتيبات التأسيس والقرآن',
    descriptionEn:
      'Dotted-line handwriting & tracing booklet of short Quran surahs designed for young children learning to write neatly.',
    descriptionAr:
      'كتيب لسور القرآن القصيرة مكتوبة بالتنقيط لتدريب الأطفال الصغار على القراءة والكتابة بخط واضح ومرتب.',
    coverUrl: '',
    fileName: 'Short_Quran_Surahs_Dotted_Booklet.html',
    isPaid: false,
    priceEgp: 0,
    contentText: `كتيب سور القرآن القصيرة بالتنقيط للأطفال الصغيرين
اسم الطفل: ________________________   التاريخ: ___ / ___ / 2026

(١) سورة الإخلاص — تتبّع النقاط واكتب بخط جميل:
قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ
....................................................................................
....................................................................................

(٢) سورة الفلق — تتبّع النقاط واكتب:
قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ
....................................................................................
....................................................................................

(٣) سورة الناس — تتبّع النقاط واكتب:
قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ
....................................................................................`,
  },
  {
    id: 'paper_remedial_weak_students',
    titleEn: 'Remedial Improvement Plan for Struggling Students',
    titleAr: 'ورقة خطة التحسين للطلاب الضعاف',
    categoryEn: 'Remedial Plans',
    categoryAr: 'خطط التحسين والمتابعة',
    descriptionEn:
      'Structured diagnostic and 4-week remedial progress sheet to help struggling learners catch up in reading, writing, and spelling.',
    descriptionAr:
      'استمارة متابعة وعلاج متكاملة لتشخيص نقاط الضعف لدى الطلاب الضعاف وخطة تحسين أسبوعية قابلة للطباعة.',
    fileName: 'Remedial_Improvement_Plan_Sheet.html',
    isPaid: false,
    priceEgp: 0,
    contentText: `ورقة خطة التحسين والمتابعة للطلاب الضعاف — REMEDIAL IMPROVEMENT PLAN
اسم الطالب: ________________________   الفصل/المجموعة: ______________
المعلم: ____________________________   الشهر: _______________________

أولاً — تشخيص نقاط الضعف:
[ ] تمييز الحروف والأصوات   [ ] القراءة والدمج   [ ] الإملاء والكتابة   [ ] القواعد الأساسية

ثانياً — سجل المتابعة الأسبوعي للتحسن:
الأسبوع الأول: الهدف العلاجي: ______________________  التقييم (مقبول / جيد / تحسّن): ________
الأسبوع الثاني: الهدف العلاجي: ____________________  التقييم (مقبول / جيد / تحسّن): ________
الأسبوع الثالث: الهدف العلاجي: ____________________  التقييم (مقبول / جيد / تحسّن): ________
الأسبوع الرابع: الهدف العلاجي: ____________________  التقييم النهائي وتوصية المعلم: ________

توقيع المعلم: ___________________   توقيع ولي الأمر: ___________________`,
  },
  {
    id: 'paper_student_names_roster',
    titleEn: 'Student Names Roster & Daily Attendance Sheet',
    titleAr: 'ورقة سجل أسماء التلاميذ والحضور',
    categoryEn: 'Class Rosters',
    categoryAr: 'سجلات الأسماء والحضور',
    descriptionEn:
      'Clean printable student names roster with phone numbers, daily attendance columns, and teacher notes.',
    descriptionAr:
      'كشف منظم لأسماء التلاميذ وأرقام تواصل أولياء الأمور وخانات الحضور والغياب الأسبوعية.',
    fileName: 'Student_Names_Roster_Sheet.html',
    isPaid: false,
    priceEgp: 0,
    contentText: `ورقة سجل أسماء التلاميذ والحضور — STUDENT ROSTER & ATTENDANCE
الفصل / المجموعة: ______________________   المعلم: ______________________

م  | اسم التلميذ بالكامل          | هاتف ولي الأمر   | س | ح | ن | ث | ر | خ | ملاحظات
01 | ____________________________ | ________________ |   |   |   |   |   |   | ____________
02 | ____________________________ | ________________ |   |   |   |   |   |   | ____________
03 | ____________________________ | ________________ |   |   |   |   |   |   | ____________
04 | ____________________________ | ________________ |   |   |   |   |   |   | ____________
05 | ____________________________ | ________________ |   |   |   |   |   |   | ____________
06 | ____________________________ | ________________ |   |   |   |   |   |   | ____________
07 | ____________________________ | ________________ |   |   |   |   |   |   | ____________
08 | ____________________________ | ________________ |   |   |   |   |   |   | ____________`,
  },
  {
    id: 'paper_attendance_grades',
    titleEn: 'Student Assessment & Grades Record Sheet',
    titleAr: 'ورقة تقييم ودرجات التلاميذ',
    categoryEn: 'Assessment & Grades',
    categoryAr: 'تقييم ودرجات',
    descriptionEn:
      'Clean printable weekly & monthly score sheet structured for reading, writing, dictation, participation, and total grade.',
    descriptionAr:
      'نموذج منظم لرصد درجات التقييم الأسبوعي والشهري (قراءة، كتابة، إملاء، مشاركة، المجموع الكلي).',
    fileName: 'Student_Assessment_Grades_Sheet.html',
    isPaid: false,
    priceEgp: 0,
    contentText: `ورقة تقييم ودرجات التلاميذ — STUDENT ASSESSMENT & GRADES RECORD
المعلم: _________________________   الفصل / المجموعة: _______________   الشهر: ___________

م | اسم التلميذ | القراءة (10) | الكتابة والخط (10) | الإملاء (10) | المشاركة والواجب (10) | المجموع (40) | التقدير`,
  },
  {
    id: 'paper_pacing_calendar',
    titleEn: 'Curriculum Pacing & Supervisor Follow-up Log',
    titleAr: 'خطة توزيع المنهج وسجل المتابعة',
    categoryEn: 'Curriculum Planning',
    categoryAr: 'خطط المنهج',
    descriptionEn: 'Official pacing template mapping weeks, units, targets, and supervisor remarks.',
    descriptionAr: 'استمارة رسمية لتوزيع الوحدات على أسابيع الفصل الدراسي وملاحظات المتابعة.',
    fileName: 'Official_Curriculum_Pacing_Log.html',
    isPaid: false,
    priceEgp: 0,
    contentText: `CURRICULUM PACING & INSPECTION LOG
Term: First / Second | Teacher: _________________________

Week | Unit & Lessons | Key Objectives & Vocabulary | Teaching Aids | Supervisor Signature`,
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

export const STARTER_WORKSHEET_PACKS: Omit<WorksheetPack, 'authorUid' | 'createdAt'>[] = [
  {
    id: 'pack_01_arabic_letters',
    packNumber: 1,
    levelId: 'age_3_5',
    track: 'arabic_letters',
    titleEn: 'Arabic Alphabet Tracing & Coloring (Alif to Yaa)',
    titleAr: 'تأسيس الحروف العربية من الألف إلى الياء (تلوين وتتبع)',
    descriptionEn: 'Starter printable folder for young children (3–5 years) with dotted tracing lines, letter recognition, and coloring pictures.',
    descriptionAr: 'حزمة تأسيس شاملة للأطفال الصغار (٣–٥ سنوات) تضم أوراق تتبع منقوطة وتلوين وتمييز الحروف العربية.',
    isPaid: false,
    priceEgp: 0,
    allowWhiteLabel: true,
  },
  {
    id: 'pack_02_english_letters',
    packNumber: 2,
    levelId: 'age_3_5',
    track: 'english_letters',
    titleEn: 'English Alphabet A–Z Phonics & Tracing Pack',
    titleAr: 'حروف اللغة الإنجليزية A–Z والصوتيات التأسيسية',
    descriptionEn: 'Uppercase & lowercase tracing sheets, initial sound matching, and cut-out letter flashcards for early learners.',
    descriptionAr: 'أوراق تتبع الحروف الكبيرة والصغيرة مع مطابقة الأصوات الأولى وأنشطة التوصيل والتلوين.',
    isPaid: false,
    priceEgp: 0,
    allowWhiteLabel: true,
  },
  {
    id: 'pack_03_numbers_counting',
    packNumber: 3,
    levelId: 'age_5_7',
    track: 'numbers',
    titleEn: 'Arabic & English Numbers 1–20 Counting Pack',
    titleAr: 'الأرقام العربية والإنجليزية من 1 إلى 20 (عد وكتابة)',
    descriptionEn: 'Visual counting activities, number formation guides, and simple picture addition sheets for ages 5–7.',
    descriptionAr: 'مجموعة أوراق لعد العناصر وكتابة الأرقام وتدريبات الجمع البسيط بالصور لمرحلة التمهيدي.',
    isPaid: false,
    priceEgp: 0,
    allowWhiteLabel: true,
  },
  {
    id: 'pack_04_writing_activities',
    packNumber: 4,
    levelId: 'primary',
    track: 'writing_skills',
    titleEn: 'Master Handwriting, Phonics & Classroom Activities Bundle',
    titleAr: 'الحزمة الكاملة لأوراق عمل تحسين الخط والأنشطة الصفية',
    descriptionEn: '20+ printable pages for neat English & Arabic handwriting, sentence building, and classroom games (includes 1 free sample sheet).',
    descriptionAr: 'مجموعة متكاملة لتحسين الخط وبناء الجملة وأنشطة صفية ورقية جاهزة للطباعة (تضم ورقة معاينة مجانية).',
    isPaid: true,
    priceEgp: 55,
    allowWhiteLabel: true,
  },
];

export const STARTER_WORKSHEET_ITEMS: Omit<WorksheetPackItem, 'authorUid' | 'createdAt'>[] = [
  {
    id: 'sheet_01_alif_baa',
    packId: 'pack_01_arabic_letters',
    itemOrder: 1,
    titleEn: 'Sheet 1: Letter Alif & Baa (أ - ب) Dotted Tracing',
    titleAr: 'ورقة 1: حرف الألف والباء (أ - ب) تتبع وتلوين',
    kind: 'worksheet',
    isFreeSample: true,
    fileName: 'Arabic_Alif_Baa_Sheet1.html',
    contentText: `ورقة عمل رقم 1 — تأسيس الحروف العربية (أ - ب)
الاسم: ________________________   التاريخ: ___ / ___ / 2026

1) تتبع النقاط واكتب الحرف بخط جميل:
أ   أ   أ   أ   أ   |   أرنب 🐇
ب   ب   ب   ب   ب   |   بطة 🦆

2) لوّن الصورة التي تبدأ بحرف (ب): [ بطة ]  [ تفاحة ]  [ باب ]`,
  },
  {
    id: 'sheet_01_taa_thaa',
    packId: 'pack_01_arabic_letters',
    itemOrder: 2,
    titleEn: 'Sheet 2: Letters Taa & Thaa (ت - ث) Recognition',
    titleAr: 'ورقة 2: حروف التاء والثاء وتمييز النقاط',
    kind: 'worksheet',
    isFreeSample: true,
    fileName: 'Arabic_Taa_Thaa_Sheet2.html',
    contentText: `ورقة عمل رقم 2 — التاء والثاء (ت - ث)
1) ضع دائرة حول حرف (ت) ومربعاً حول حرف (ث):
ب  -  ت  -  ث  -  أ  -  ت  -  ث

2) تتبع واكتب:
ت   ت   ت   ت   |   ث   ث   ث   ث`,
  },
  {
    id: 'sheet_01_matching_act',
    packId: 'pack_01_arabic_letters',
    itemOrder: 3,
    titleEn: 'Activity 3: Cut-and-Match Arabic Letter Cards',
    titleAr: 'نشاط 3: بطاقات قص ولصق لتوصيل الحرف بالصورة',
    kind: 'activity',
    isFreeSample: true,
    fileName: 'Arabic_Letters_Matching_Activity.html',
    contentText: `نشاط صفي غير تفاعلي — بطاقات الحروف (أ - ب - ت - ث)
اطبع الورقة وقص المربعات ليصل الطفل كل حرف بالكلمة المناسبة:
[ أ ]  <--->  أسد
[ ب ]  <--->  بيت
[ ت ]  <--->  تمر
[ ث ]  <--->  ثعلب`,
  },
  {
    id: 'sheet_02_abc_tracing',
    packId: 'pack_02_english_letters',
    itemOrder: 1,
    titleEn: 'Sheet 1: Letters A a · B b · C c Tracing',
    titleAr: 'ورقة 1: تتبع الحروف الإنجليزية A a · B b · C c',
    kind: 'worksheet',
    isFreeSample: true,
    fileName: 'English_ABC_Tracing_Sheet1.html',
    contentText: `FOUNDATION ENGLISH WORKSHEET — PACK 02 (SHEET 1)
Name: __________________________

Trace & Copy:
A  a  A  a  A  a  |  Apple
B  b  B  b  B  b  |  Ball
C  c  C  c  C  c  |  Cat

Circle the starting letter:  [ A / B / C ] for Apple`,
  },
  {
    id: 'sheet_02_phonics_match',
    packId: 'pack_02_english_letters',
    itemOrder: 2,
    titleEn: 'Activity 2: Initial Sound Coloring & Matching',
    titleAr: 'نشاط 2: تلوين وتوصيل الصوت الأول للحروف الإنجليزية',
    kind: 'activity',
    isFreeSample: true,
    fileName: 'English_Phonics_Match_Activity2.html',
    contentText: `PRINTABLE CLASSROOM ACTIVITY — INITIAL SOUNDS
Color the picture and draw a line to its beginning letter:
1. Ant      --->  ( B / A / D )
2. Dog      --->  ( D / C / A )
3. Fish     --->  ( E / F / B )`,
  },
  {
    id: 'sheet_03_numbers_1_10',
    packId: 'pack_03_numbers_counting',
    itemOrder: 1,
    titleEn: 'Sheet 1: Count & Write Numbers 1 to 10 (AR / EN)',
    titleAr: 'ورقة 1: عد واكتب الأرقام من 1 إلى 10 (عربي / إنجليزي)',
    kind: 'worksheet',
    isFreeSample: true,
    fileName: 'Numbers_1_to_10_Worksheet.html',
    contentText: `NUMBERS PRACTICE WORKSHEET (1 – 10)
1 (One / ١) · 2 (Two / ٢) · 3 (Three / ٣) · 4 (Four / ٤) · 5 (Five / ٥)

Count the stars and write the number:
★ ★ ★  = ______
★ ★ ★ ★ ★ ★  = ______`,
  },
  {
    id: 'sheet_03_counting_game',
    packId: 'pack_03_numbers_counting',
    itemOrder: 2,
    titleEn: 'Activity 2: Classroom Number Hop & Card Game',
    titleAr: 'نشاط 2: بطاقات القفز والعد التأسيسي في الفصل',
    kind: 'activity',
    isFreeSample: true,
    fileName: 'Numbers_Classroom_Activity.html',
    contentText: `NON-INTERACTIVE CLASSROOM NUMBER GAME
Print numbers 1–20 on A4 cards, place on floor mats, and ask students to jump to the number called out by the teacher.`,
  },
  {
    id: 'sheet_04_sample_writing',
    packId: 'pack_04_writing_activities',
    itemOrder: 1,
    titleEn: 'Free Sample Sheet: Guided Sentence Alignment',
    titleAr: 'نموذج معاينة مجاني: ورقة تنظيم الخط وبناء الجملة',
    kind: 'worksheet',
    isFreeSample: true,
    fileName: 'Pack04_Free_Sample_Handwriting.html',
    contentText: `FREE PREVIEW SAMPLE — PACK 04 HANDWRITING & SENTENCE PRACTICE
Trace and copy neatly between the four lines:
"I read English stories every day."`,
  },
  {
    id: 'sheet_04_full_workbook',
    packId: 'pack_04_writing_activities',
    itemOrder: 2,
    titleEn: 'Full Pack Sheets: 20 Classroom Writing & Activity Templates',
    titleAr: 'ملفات الحزمة الكاملة: 20 ورقة تحسين خط وأنشطة صفية',
    kind: 'worksheet',
    isFreeSample: false,
    fileName: 'Pack04_Full_Handwriting_Bundle.html',
    contentText: `FULL PACK 04 — Unlocked after InstaPay & WhatsApp confirmation.`,
  },
];

export const STARTER_COURSES: Omit<AffiliateCourse, 'authorUid' | 'createdAt'>[] = [
  {
    id: 'course_phonics_mastery',
    titleEn: 'Complete Phonics & Early Reading Instruction for ESL Teachers',
    titleAr: 'الدبلومة الشاملة لتدريس الصوتيات (Phonics) وتأسيس القراءة بالإنجليزية',
    provider: 'Udemy',
    track: 'phonics',
    durationLabel: '6.5 Hours · Video',
    descriptionEn:
      'Step-by-step classroom routines for teaching short vowels, digraphs, blending, and decoding games for ages 4–10.',
    descriptionAr:
      'شرح عملي لخطوات تدريس الصوتيات والدمج القرائي والألعاب الصفية للأطفال من عمر ٤ إلى ١٠ سنوات.',
    affiliateUrl: 'https://www.udemy.com/topic/phonics/',
  },
  {
    id: 'course_tesol_methodology',
    titleEn: '120-Hour TESOL / TEFL Modern English Teaching Strategies',
    titleAr: 'استراتيجيات تدريس اللغة الإنجليزية الحديثة وإدارة الفصل التفاعلي (TESOL)',
    provider: 'Coursera',
    track: 'methodology',
    durationLabel: 'Self-Paced · Certificate',
    descriptionEn:
      'Master lesson staging, communicative grammar drills, classroom management, and formative assessment for primary through high school.',
    descriptionAr:
      'إتقان بناء خطة الدرس وإدارة الفصل التفاعلي وتدريس القواعد والمحادثة للمرحلة الابتدائية والإعدادية والثانوية.',
    affiliateUrl: 'https://www.coursera.org/specializations/tesol',
  },
  {
    id: 'course_ai_for_teachers',
    titleEn: 'AI Tools for English Teachers: Worksheets, Quizzes & Lesson Plans',
    titleAr: 'توظيف أدوات الذكاء الاصطناعي لمعلمي الإنجليزي (أوراق عمل واختبارات)',
    provider: 'Udemy',
    track: 'ai_teaching',
    durationLabel: '4 Hours · Practical',
    descriptionEn:
      'Save hours every week by drafting graded reading passages, differentiated quizzes, and visual vocabulary cards efficiently.',
    descriptionAr:
      'وفر ساعات التحضير الأسبوعية عبر تصميم قطع قراءة متدرجة واختبارات متنوعة وبطاقات مفردات باحترافية.',
    affiliateUrl: 'https://www.udemy.com/topic/artificial-intelligence/',
  },
  {
    id: 'course_online_teaching_career',
    titleEn: 'Building a Thriving Online English Tutoring Brand & Curriculum',
    titleAr: 'مهارات التدريس الأونلاين وبناء علامتك التعليمية للمعلمين',
    provider: 'Coursera',
    track: 'career',
    durationLabel: '5 Weeks · Career Track',
    descriptionEn:
      'Learn how to structure online group sessions, design engaging digital homework, and grow parent trust and retention.',
    descriptionAr:
      'تعلم تخطيط الحصص الأونلاين التفاعلية وتصميم الواجبات الرقمية وبناء سمعة مهنية قوية مع أولياء الأمور.',
    affiliateUrl: 'https://www.coursera.org/courses?query=teaching%20english%20online',
  },
];

export const STARTER_QUESTION_BANK: Omit<QuestionBankItem, 'authorUid' | 'createdAt'>[] = [
  {
    id: 'qb_prim4_1',
    gradeId: 'prim4',
    unitLabel: 'Unit 1 · Healthy Food',
    prompt: 'Egyptian farmers ______ rice and tomatoes in the Delta.',
    options: ['grow', 'raise', 'drink', 'paint'],
    correctIndex: 0,
    explanation: 'Use "grow" for crops/plants and "raise" for animals.',
  },
  {
    id: 'qb_prim4_2',
    gradeId: 'prim4',
    unitLabel: 'Unit 1 · Body Systems',
    prompt: 'We use our ______ to breathe fresh air.',
    options: ['stomach', 'lungs', 'heart', 'teeth'],
    correctIndex: 1,
    explanation: 'The lungs take in oxygen when we breathe.',
  },
  {
    id: 'qb_prim4_3',
    gradeId: 'prim4',
    unitLabel: 'Unit 2 · Desert Animals',
    prompt: 'A fennec fox is ______ than a steppe eagle.',
    options: ['small', 'smaller', 'smallest', 'the small'],
    correctIndex: 1,
    explanation: 'Comparative adjectives with "than" take "-er".',
  },
  {
    id: 'qb_prim5_1',
    gradeId: 'prim5',
    unitLabel: 'Unit 1 · Food & Plants',
    prompt: 'Would you like ______ fresh mango juice?',
    options: ['any', 'some', 'a', 'many'],
    correctIndex: 1,
    explanation: 'We use "some" in polite offers and requests.',
  },
  {
    id: 'qb_prim5_2',
    gradeId: 'prim5',
    unitLabel: 'Unit 2 · Sports',
    prompt: 'Hedaya Malak is good at ______ taekwondo.',
    options: ['play', 'plays', 'playing', 'played'],
    correctIndex: 2,
    explanation: '"Good at" is followed by a noun or verb + -ing.',
  },
  {
    id: 'qb_prep1_1',
    gradeId: 'prep1',
    unitLabel: 'Unit 1 · Daily Routines',
    prompt: 'Huda ______ to the school library twice a week.',
    options: ['go', 'goes', 'going', 'is go'],
    correctIndex: 1,
    explanation: 'Third-person singular subjects take verb + -es in Present Simple.',
  },
  {
    id: 'qb_prep1_2',
    gradeId: 'prep1',
    unitLabel: 'Unit 2 · School Life',
    prompt: 'How ______ do you practice English reading? — Almost every day.',
    options: ['many', 'much', 'often', 'long'],
    correctIndex: 2,
    explanation: '"How often" asks about frequency.',
  },
  {
    id: 'qb_prep3_1',
    gradeId: 'prep3',
    unitLabel: 'Unit 1 · Around Town',
    prompt: 'The museum is ______ the library and the train station.',
    options: ['between', 'next', 'opposite to', 'in front'],
    correctIndex: 0,
    explanation: '"Between A and B" shows something in the middle of two places.',
  },
  {
    id: 'qb_prep3_2',
    gradeId: 'prep3',
    unitLabel: 'Unit 1 · Passive / Notices',
    prompt: 'The first train to Aswan ______ at 7:15 AM every morning.',
    options: ['leave', 'leaves', 'is leaving', 'leaving'],
    correctIndex: 1,
    explanation: 'Timetables and fixed schedules use the Present Simple.',
  },
  {
    id: 'qb_sec1_1',
    gradeId: 'sec1',
    unitLabel: 'Unit 1 · Eco-Tourism',
    prompt: 'Eco-tourism helps protect the natural ______ while supporting local guides.',
    options: ['environment', 'pollution', 'danger', 'waste'],
    correctIndex: 0,
    explanation: 'Sustainable tourism aims to conserve the natural environment.',
  },
];

export const DEMO_STUDENT_QUIZ: TeacherQuiz = {
  id: 'demo_preview',
  title: 'نموذج اختبار تجريبي — Primary 4 English Check',
  gradeLabel: 'الصف الرابع الابتدائي · Primary 4',
  teacherName: 'أكاديمية لينجوا كرافت',
  isTrial: true,
  isPublished: true,
  timeLimitMinutes: 10,
  ownerUid: 'starter',
  questions: [
    {
      id: 'demo_q1',
      prompt: 'Egyptian farmers ______ chickens to get fresh eggs.',
      options: ['raise', 'grow', 'drink', 'write'],
      correctIndex: 0,
      explanation: 'We use "raise" for animals and "grow" for crops.',
    },
    {
      id: 'demo_q2',
      prompt: 'Which word has the same long /aɪ/ sound as "rice"?',
      options: ['milk', 'kite', 'fish', 'sit'],
      correctIndex: 1,
      explanation: '"Kite" and "rice" share the long /aɪ/ vowel sound.',
    },
    {
      id: 'demo_q3',
      prompt: 'A desert fox is ______ than a camel.',
      options: ['small', 'smaller', 'smallest', 'more small'],
      correctIndex: 1,
      explanation: 'Short adjectives add -er before "than".',
    },
  ],
};
