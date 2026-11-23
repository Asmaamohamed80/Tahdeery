export interface PsychTraitDefinition {
  id: string;
  labelAr: string;
  labelEn: string;
  summaryAr: string;
  summaryEn: string;
  tipsAr: string[];
  tipsEn: string[];
  accentColor: string;
}

export interface PsychOption {
  textAr: string;
  textEn: string;
  traitId: string;
  points?: number; // default 2, for resilience/scale questions
}

export interface PsychQuestion {
  id: string;
  promptAr: string;
  promptEn: string;
  options: [PsychOption, PsychOption, PsychOption, PsychOption];
}

export interface PsychAssessment {
  id: 'learning_style' | 'multiple_intelligences' | 'confidence_resilience' | 'educator_style';
  audienceAr: string;
  audienceEn: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  traits: Record<string, PsychTraitDefinition>;
  questions: PsychQuestion[];
}

export const PSYCH_ASSESSMENTS: PsychAssessment[] = [
  {
    id: 'learning_style',
    audienceAr: 'للأطفال والطلاب',
    audienceEn: 'For Kids & Students',
    titleAr: 'اختبار نمط التعلم المفضل (بصري / سمعي / حركي / قرائي)',
    titleEn: 'Learning Style Profiler (Visual / Auditory / Kinesthetic / Read-Write)',
    subtitleAr: 'يكتشف الطريقة الأسرع التي يستوعب بها طفلك أو طالبك دروس اللغة الإنجليزية والمذاكرة.',
    subtitleEn: 'Discovers the fastest way your child or student absorbs English lessons and studies.',
    traits: {
      visual: {
        id: 'visual',
        labelAr: 'المتعلّم البصري (Visual)',
        labelEn: 'Visual Learner',
        summaryAr: 'يتعلم بسرعة فائقة عبر الصور، البطاقات الملونة، الخرائط الذهنية، والفيديوهات.',
        summaryEn: 'Learns fastest through colorful flashcards, mind maps, diagrams, and videos.',
        tipsAr: [
          'استخدم فلاش كاردز مصورة وأقلام تلوين للتمييز بين القواعد.',
          'ارسم قصصاً مصورة بسيطة للكلمات الإنجليزية الجديدة.',
          'اجعل مكان المذاكرة مرتباً وخالياً من المشتتات البصرية.',
        ],
        tipsEn: [
          'Use illustrated flashcards and color-coded grammar charts.',
          'Sketch mini storyboards for new English vocabulary.',
          'Keep the study desk tidy to minimize visual distractions.',
        ],
        accentColor: '#0c4a6e',
      },
      auditory: {
        id: 'auditory',
        labelAr: 'المتعلّم السمعي (Auditory)',
        labelEn: 'Auditory Learner',
        summaryAr: 'يُبدع عبر الاستماع للنطق، الأناشيد الإنجليزية، النقاش، وترديد الكلمات بصوت عالٍ.',
        summaryEn: 'Thrives on pronunciation audio, songs, storytelling, and reading aloud.',
        tipsAr: [
          'اعتمد على أناشيد الفونكس (Phonics Songs) والاستماع للقصص الصوتية.',
          'اطلب منه شرح الدرس بصوت مسموع وكأنه يشرح لزميله.',
          'استخدم الإيقاع والقافية في حفظ الكلمات الجديدة.',
        ],
        tipsEn: [
          'Use phonics songs and read-aloud storybooks daily.',
          'Have the student explain the lesson aloud as if teaching a friend.',
          'Turn tricky spellings into catchy rhymes or rhythms.',
        ],
        accentColor: '#047857',
      },
      kinesthetic: {
        id: 'kinesthetic',
        labelAr: 'المتعلّم الحركي التفاعلي (Kinesthetic)',
        labelEn: 'Kinesthetic Learner',
        summaryAr: 'يفهم بالتجربة العملية، التمثيل، الألعاب الصفية، ولمس الأشياء والحركة.',
        summaryEn: 'Learns best by doing, role-playing, hands-on games, and physical movement.',
        tipsAr: [
          'حوّل الكلمات والأفعال لتمثيل وحركة (Act it out) داخل الفصل أو البيت.',
          'استخدم أوراق التتبع والقص واللصق وحل الأنشطة التفاعلية.',
          'قسّم المذاكرة لفترات قصيرة (15 دقيقة) مع استراحة حركة خفيفة.',
        ],
        tipsEn: [
          'Turn action verbs and dialogues into short role-play skits.',
          'Use cut-and-paste worksheets, letter tiles, and interactive games.',
          'Break study time into lively 15-minute sprints with movement breaks.',
        ],
        accentColor: '#b45309',
      },
      readwrite: {
        id: 'readwrite',
        labelAr: 'المتعلّم القرائي الكِتابي (Read & Write)',
        labelEn: 'Read / Write Learner',
        summaryAr: 'يفضّل القراءة الهادئة، كتابة القوائم والملخصات، وتدوين الملاحظات المنظمة.',
        summaryEn: 'Excels through quiet reading, neat lists, summaries, and written practice.',
        tipsAr: [
          'خصص كراسة أنيقة لتلخيص القواعد في نقاط وجداول.',
          'شجعه على قراءة القصص المتدرجة وكتابة جمل من تأليفه.',
          'استخدم أوراق العمل المرقمة والاختبارات الكتابية للمراجعة.',
        ],
        tipsEn: [
          'Keep a dedicated notebook for grammar summaries and vocabulary lists.',
          'Encourage graded reading stories followed by short written sentences.',
          'Use structured printable worksheets for confident review.',
        ],
        accentColor: '#be123c',
      },
    },
    questions: [
      {
        id: 'ls1',
        promptAr: 'عندما يحفظ الطالب كلمة إنجليزية جديدة لأول مرة، ما أسرع طريقة تثبت بها؟',
        promptEn: 'When learning a brand-new English word, what makes it stick fastest?',
        options: [
          { textAr: 'رؤية صورة مرسومة مع الكلمة ولون مميز', textEn: 'Seeing a picture and bright color with it', traitId: 'visual' },
          { textAr: 'سماع نطقها وترديدها بصوت مسموع أو في أغنية', textEn: 'Hearing it pronounced and repeating it aloud', traitId: 'auditory' },
          { textAr: 'تمثيل معناها بحركة أو لعب لعبة عنها', textEn: 'Acting out its meaning or playing a game', traitId: 'kinesthetic' },
          { textAr: 'كتابتها في الدفتر عدة مرات داخل جملة', textEn: 'Writing it down neatly in a sentence', traitId: 'readwrite' },
        ],
      },
      {
        id: 'ls2',
        promptAr: 'في وقت الفراغ أو الراحة، ماذا يفضل الطفل غالباً؟',
        promptEn: 'During free time, which activity does the learner naturally enjoy most?',
        options: [
          { textAr: 'الرسم والتلوين ومشاهدة الرسوم والقصص المصورة', textEn: 'Drawing, coloring, and picture comics', traitId: 'visual' },
          { textAr: 'الاستماع للحكايات والأناشيد والتحدث مع الآخرين', textEn: 'Listening to stories, songs, and chatting', traitId: 'auditory' },
          { textAr: 'الجري، الفك والتركيب، والألعاب اليدوية والحركية', textEn: 'Building blocks, crafts, and active games', traitId: 'kinesthetic' },
          { textAr: 'قراءة الكتب أو كتابة القصص وحل الألغاز الورقية', textEn: 'Reading books or solving written puzzles', traitId: 'readwrite' },
        ],
      },
      {
        id: 'ls3',
        promptAr: 'إذا ضاع عنوان مكان جديد وتريد إيجاده، كيف تفضّل شرح الطريق لك؟',
        promptEn: 'If looking for a new place, how do you prefer getting directions?',
        options: [
          { textAr: 'خريطة مرسومة أو علامات بصرية على الطريق', textEn: 'A visual map or landmarks to look for', traitId: 'visual' },
          { textAr: 'شخص يشرح لي الخطوات بالكلام الواضح', textEn: 'Someone explaining the turns verbally', traitId: 'auditory' },
          { textAr: 'أن أسير في الطريق وأتعلم العلامات بنفسي', textEn: 'Walking/driving the route myself to learn it', traitId: 'kinesthetic' },
          { textAr: 'خطوات مكتوبة ومرتبة نقطة بنقطة', textEn: 'Written step-by-step instructions', traitId: 'readwrite' },
        ],
      },
      {
        id: 'ls4',
        promptAr: 'ما أكثر شيء يشتت انتباه الطالب أثناء المذاكرة؟',
        promptEn: 'What tends to distract the learner most while studying?',
        options: [
          { textAr: 'الفوضى والأشياء الكثيرة المبعثرة أمام عينه', textEn: 'Visual clutter and messy surroundings', traitId: 'visual' },
          { textAr: 'الأصوات العالية والضوضاء المحيطة به', textEn: 'Background chatter or loud noises', traitId: 'auditory' },
          { textAr: 'الجلوس طويلاً على الكرسي بدون أي حركة', textEn: 'Sitting completely still for too long', traitId: 'kinesthetic' },
          { textAr: 'عدم وجود خطة واضحة أو كراسة مكتوبة للمتابعة', textEn: 'Lack of clear written notes or checklist', traitId: 'readwrite' },
        ],
      },
      {
        id: 'ls5',
        promptAr: 'عند مراجعة درس قبل الامتحان، ما الأسلوب المفضل؟',
        promptEn: 'When reviewing right before an exam, what feels most effective?',
        options: [
          { textAr: 'رسم خرائط ذهنية ومخططات بألوان مختلفة', textEn: 'Sketching colorful mind maps and charts', traitId: 'visual' },
          { textAr: 'المناقشة مع صديق أو قراءة الأسئلة بصوت عالٍ', textEn: 'Discussing aloud with a parent or friend', traitId: 'auditory' },
          { textAr: 'حل كويزات تفاعلية والتنقل بين الأنشطة', textEn: 'Trying interactive quizzes and hands-on tasks', traitId: 'kinesthetic' },
          { textAr: 'كتابة ملخصات وإعادة قراءة الملاحظات المكتوبة', textEn: 'Writing summary sheets and re-reading notes', traitId: 'readwrite' },
        ],
      },
      {
        id: 'ls6',
        promptAr: 'عند شراء لعبة أو جهاز جديد يحتاج تركيب، ماذا تفعل أولاً؟',
        promptEn: 'When assembling a brand-new toy or gadget, what do you do first?',
        options: [
          { textAr: 'أنظر للصور والرسوم التوضيحية في الكتيب', textEn: 'Look closely at the diagrams and photos', traitId: 'visual' },
          { textAr: 'أسأل شخصاً جربه ليشرح لي الفكرة', textEn: 'Ask someone to explain how it works', traitId: 'auditory' },
          { textAr: 'أبدأ في التجربة وتركيب القطع بيدي فوراً', textEn: 'Jump straight in and test the pieces by hand', traitId: 'kinesthetic' },
          { textAr: 'أقرأ تعليمات التشغيل المكتوبة بالترتيب', textEn: 'Read the written manual steps carefully', traitId: 'readwrite' },
        ],
      },
    ],
  },
  {
    id: 'multiple_intelligences',
    audienceAr: 'للأطفال والناشئين',
    audienceEn: 'For Kids & Teens',
    titleAr: 'اختبار الذكاءات المتعددة واكتشاف الموهبة (نظرية جاردنر)',
    titleEn: 'Multiple Intelligences & Talent Discovery',
    subtitleAr: 'يكشف نوع الذكاء الأبرز لدى الطالب (لغوي، منطقي، فني، اجتماعي) لتوجيهه وتنمية موهبته.',
    subtitleEn: 'Reveals dominant strengths across Linguistic, Logical, Visual-Artistic, and Social intelligences.',
    traits: {
      linguistic: {
        id: 'linguistic',
        labelAr: 'الذكاء اللغوي والتعبيري',
        labelEn: 'Linguistic Intelligence',
        summaryAr: 'يمتلك ثروة كلمات قوية، يحب القصص والحوار، ولديه موهبة طبيعية في اللغات.',
        summaryEn: 'Expressive with words, loves stories, debates, and picks up languages naturally.',
        tipsAr: [
          'شجعه على كتابة قصص قصيرة بالإنجليزية أو تسجيل بودكاست صغير.',
          'القصص الإنجليزية المتدرجة ستكون من أحب الهوايات له.',
        ],
        tipsEn: [
          'Encourage short story writing or mini voice-recordings in English.',
          'Graded English storybooks are an ideal match for this talent.',
        ],
        accentColor: '#0c4a6e',
      },
      logical: {
        id: 'logical',
        labelAr: 'الذكاء المنطقي والتحليلي',
        labelEn: 'Logical-Mathematical Intelligence',
        summaryAr: 'عقلية منظمة تحب الأرقام والألغاز واكتشاف القواعد والسبب والنتيجة.',
        summaryEn: 'Analytical thinker who enjoys puzzles, numbers, systems, and uncovering patterns.',
        tipsAr: [
          'استمتع بألغاز الذكاء والبرمجة المبسطة وتحديات القواعد المنطقية.',
          'اطلب منه استنتاج قاعدة الجرامر بنفسه من خلال الأمثلة.',
        ],
        tipsEn: [
          'Explore brain puzzles, beginner coding, and grammar deduction games.',
          'Let them deduce language rules from examples rather than memorizing.',
        ],
        accentColor: '#047857',
      },
      artistic: {
        id: 'artistic',
        labelAr: 'الذكاء البصري والإبداعي',
        labelEn: 'Visual-Spatial Intelligence',
        summaryAr: 'خيال واسع يلاحظ التفاصيل والجمال والألوان والتصميم ويجيد التمثيل البصري.',
        summaryEn: 'Imaginative creator with a sharp eye for design, color, space, and mental imagery.',
        tipsAr: [
          'اربط تعلم الإنجليزية بتصميم ملصقات وبوسترات ورسوم إبداعية.',
          'شارك في أنشطة الرسم والأوريغامي وصنع المجسمات التعليمية.',
        ],
        tipsEn: [
          'Blend English practice with poster making, comics, and creative sketching.',
          'Encourage 3D crafts, building, and visual design projects.',
        ],
        accentColor: '#b45309',
      },
      social: {
        id: 'social',
        labelAr: 'الذكاء الاجتماعي والقيادي',
        labelEn: 'Interpersonal Intelligence',
        summaryAr: 'يفهم مشاعر الآخرين بسرعة، يجيد العمل الجماعي، ويحب القيادة ومساعدة زملائه.',
        summaryEn: 'Empathetic communicator who shines in teamwork, leadership, and helping peers.',
        tipsAr: [
          'يتطور سريعاً في مجموعات المحادثة الثنائية والأدوار القيادية بالفصل.',
          'امنحه مسؤولية قيادة نشاط صفي أو مساعدة زميل أصغر.',
        ],
        tipsEn: [
          'Thrives in pair speaking activities and group classroom leadership roles.',
          'Give opportunities to mentor younger learners or host group games.',
        ],
        accentColor: '#be123c',
      },
    },
    questions: [
      {
        id: 'mi1',
        promptAr: 'في الأنشطة المدرسية، ما الدور الذي يسعد الطالب باختياره دائماً؟',
        promptEn: 'In school projects, which role makes the student happiest?',
        options: [
          { textAr: 'كتابة الموضوع أو تقديم العرض أمام الفصل', textEn: 'Writing the script or presenting aloud', traitId: 'linguistic' },
          { textAr: 'تنظيم الجدول، الحسابات، وحل المشكلة المنطقية', textEn: 'Organizing data and solving the logic puzzle', traitId: 'logical' },
          { textAr: 'تصميم البوستر والرسم وتنسيق الألوان', textEn: 'Designing the poster, artwork, and layout', traitId: 'artistic' },
          { textAr: 'توزيع المهام على الفريق وتشجيع الزملاء', textEn: 'Coordinating teammates and leading collaboration', traitId: 'social' },
        ],
      },
      {
        id: 'mi2',
        promptAr: 'ما نوع الألعاب الذي يجذب انتباهه لساعات دون ملل؟',
        promptEn: 'Which type of game holds their attention the longest?',
        options: [
          { textAr: 'ألعاب الكلمات، الفوازير، وتكوين الجمل', textEn: 'Word games, Scrabble, and riddles', traitId: 'linguistic' },
          { textAr: 'الشطرنج، السودوكو، وألغاز الأرقام والذكاء', textEn: 'Chess, Sudoku, and logic brainteasers', traitId: 'logical' },
          { textAr: 'ألعاب البناء ثلاثي الأبعاد والتلوين والتصميم', textEn: '3D building, drawing, and design games', traitId: 'artistic' },
          { textAr: 'الألعاب الجماعية التي تضم أصدقاء ومنافسة تعاونية', textEn: 'Team games with friends and lively interaction', traitId: 'social' },
        ],
      },
      {
        id: 'mi3',
        promptAr: 'كيف يعبّر عن فكرة جديدة تحمّس لها؟',
        promptEn: 'How do they usually express an exciting new idea?',
        options: [
          { textAr: 'يرويها في قصة شيقة ومليئة بالتفاصيل', textEn: 'Tells it as a vivid story full of words', traitId: 'linguistic' },
          { textAr: 'يرتبها في خطوات منطقية (أولاً.. ثانياً.. ثالثاً)', textEn: 'Breaks it down step-by-step (1, 2, 3)', traitId: 'logical' },
          { textAr: 'يرسم شكلاً تخطيطياً سريعاً يوضح الشكل النهائي', textEn: 'Sketches a quick picture to show how it looks', traitId: 'artistic' },
          { textAr: 'يجمع من حوله ويتحاور معهم ليأخذ رأيهم', textEn: 'Gathers others to brainstorm and share excitement', traitId: 'social' },
        ],
      },
      {
        id: 'mi4',
        promptAr: 'عند قراءة كتاب أو مشاهدة فيلم، ما أول ما يعلق في ذهنه؟',
        promptEn: 'After reading a story or watching a movie, what stands out most?',
        options: [
          { textAr: 'العبارات الجميلة والحوار بين الشخصيات', textEn: 'Memorable quotes and clever dialogue', traitId: 'linguistic' },
          { textAr: 'هل كانت الأحداث منطقية أم بها ثغرة؟', textEn: 'Whether the plot made logical sense', traitId: 'logical' },
          { textAr: 'الألوان والمشاهد وتصاميم الأماكن', textEn: 'The colors, scenery, and visual atmosphere', traitId: 'artistic' },
          { textAr: 'مشاعر الشخصيات وعلاقتهم ببعض', textEn: 'How the characters felt and treated each other', traitId: 'social' },
        ],
      },
      {
        id: 'mi5',
        promptAr: 'ما المادة أو الركن الأقرب لقلبه في المدرسة؟',
        promptEn: 'Which school corner or subject feels closest to their heart?',
        options: [
          { textAr: 'اللغات، القراءة، والإذاعة المدرسية', textEn: 'Languages, reading, and school radio', traitId: 'linguistic' },
          { textAr: 'الرياضيات، العلوم، والتجارب المنطقية', textEn: 'Math, science experiments, and puzzles', traitId: 'logical' },
          { textAr: 'التربية الفنية، الديكور، والتصميم', textEn: 'Art class, crafts, and visual design', traitId: 'artistic' },
          { textAr: 'الأنشطة الجماعية والرحلات والتطوع', textEn: 'Group clubs, teamwork, and organizing events', traitId: 'social' },
        ],
      },
    ],
  },
  {
    id: 'confidence_resilience',
    audienceAr: 'للناشئين والكبار',
    audienceEn: 'For Teens & Adults',
    titleAr: 'اختبار الثقة بالنفس والمرونة النفسية والهدوء',
    titleEn: 'Self-Confidence & Emotional Resilience Check',
    subtitleAr: 'تقييم تربوي إيجابي يقيس مستوى الثقة، التعامل مع ضغط الامتحانات أو العمل، والمرونة النفسية.',
    subtitleEn: 'A supportive educational check measuring confidence, calm under exam/work pressure, and bounce-back mindset.',
    traits: {
      confidence: {
        id: 'confidence',
        labelAr: 'شخصية واثقة ومبادِرة (High Resilience)',
        labelEn: 'Confident & Resilient Mindset',
        summaryAr: 'تتعامل مع التحديات بمرونة عالية، وتؤمن بقدرتك على التعلم من أي خطأ والنهوض سريعاً.',
        summaryEn: 'Handles challenges calmly, learns from setbacks without harsh self-criticism, and takes initiative.',
        tipsAr: [
          'استمر في تدوين إنجازاتك الصغيرة أسبوعياً.',
          'تحدَّ نفسك بمهارة جديدة كل شهر وشارك خبرتك مع غيرك.',
        ],
        tipsEn: [
          'Keep celebrating weekly small wins and steady habits.',
          'Stretch your comfort zone with a fresh skill each month.',
        ],
        accentColor: '#047857',
      },
      growth: {
        id: 'growth',
        labelAr: 'شخصية متنامية وطموحة (Growing Calm)',
        labelEn: 'Developing Balance & Growth',
        summaryAr: 'لديك اساس طيب وطموح واضح، لكن القلق أحياناً من رأي الآخرين أو ضغط الوقت قد يبطئ خطوتك.',
        summaryEn: 'You have solid potential and care deeply about quality, though occasional perfectionism or pressure creeps in.',
        tipsAr: [
          'استبدل جملة «أخاف أخطئ» بـ «الخطأ خطوة في طريق الإتقان».',
          'مارس تقسيم المهام الكبيرة لخطوات بسيطة مدتها 20 دقيقة.',
        ],
        tipsEn: [
          'Replace fear of mistakes with curiosity about what the step teaches you.',
          'Break big goals into calm, 20-minute bite-sized actions.',
        ],
        accentColor: '#0c4a6e',
      },
      gentle: {
        id: 'gentle',
        labelAr: 'قلب حساس يحتاج لدعم وتشجيع (Needs Gentle Support)',
        labelEn: 'Thoughtful & Sensitive — Needs Gentle Encouragement',
        summaryAr: 'تشعر بالتوتر بسهولة في المواقف الجديدة وتحتاج لطمأنة هادئة وبيئة مشجعة تعزز ثقتك بنفسك.',
        summaryEn: 'Feels pressure quickly in new situations and blossoms best with warm encouragement and steady routines.',
        tipsAr: [
          'ابدأ كل صباح بالتنفس الهادئ 3 دقائق وتذكير نفسك بنجاح سابق.',
          'تجنب مقارنة نفسك بالآخرين؛ قارن نفسك اليوم بأمس فقط.',
          'ملاحظة: هذا التقييم تربوي استرشادي وليس تشخيصاً طبياً.',
        ],
        tipsEn: [
          'Start each morning with 3 minutes of calm breathing and one past win.',
          'Compare yourself only to yesterday—never to everyone else.',
          'Note: This is a supportive educational check, not a medical diagnosis.',
        ],
        accentColor: '#b45309',
      },
    },
    questions: [
      {
        id: 'cr1',
        promptAr: 'عندما ترتكب خطأً أمام الآخرين أو في امتحان، ما أول رد فعل داخلي لك؟',
        promptEn: 'When you make a mistake in public or on a test, what is your first inner reaction?',
        options: [
          { textAr: 'أتقبله بهدوء وأعتبره فرصة لأتعلم الصواب', textEn: 'Accept it calmly and note what to improve', traitId: 'confidence' },
          { textAr: 'أتضايق قليلاً ثم أحاول تصحيحه لاحقاً', textEn: 'Feel uneasy briefly, then work to fix it', traitId: 'growth' },
          { textAr: 'أفكر في الخطأ طويلاً وأخاف من تكرار المحاولة', textEn: 'Overthink it and hesitate to try again', traitId: 'gentle' },
          { textAr: 'أبحث فوراً عن حل عملي وأمضي قدماً', textEn: 'Find a quick fix and keep moving forward', traitId: 'confidence' },
        ],
      },
      {
        id: 'cr2',
        promptAr: 'كيف تشعر قبل دخول اختبار مهم أو تقديم عرض أمام مجموعة؟',
        promptEn: 'How do you usually feel before an important exam or presentation?',
        options: [
          { textAr: 'حماس إيجابي وتركيز هادئ على ما استعددت له', textEn: 'Positive focus and trust in my preparation', traitId: 'confidence' },
          { textAr: 'بعض التوتر في البداية ثم أهدأ بعد دقائق', textEn: 'Initial butterflies that fade after a few minutes', traitId: 'growth' },
          { textAr: 'قلق شديد يجعلني أشك أنني نسيت كل شيء', textEn: 'Strong nervousness that makes my mind feel blank', traitId: 'gentle' },
          { textAr: 'أراجع خطة هادئة قبل البدء لتأمين خطواتي', textEn: 'Do a quick calm checklist to steady myself', traitId: 'growth' },
        ],
      },
      {
        id: 'cr3',
        promptAr: 'عندما يوجّه لك شخص ما نقداً أو ملاحظة لتعديل عملك:',
        promptEn: 'When someone gives constructive feedback on your work:',
        options: [
          { textAr: 'أشكره وآخذ المفيد من الملاحظة لتطوير نفسي', textEn: 'Thank them and use the helpful points to grow', traitId: 'confidence' },
          { textAr: 'أفكر في كلامه بهدوء لأرى إن كان محقاً', textEn: 'Reflect calmly to see what applies', traitId: 'growth' },
          { textAr: 'أشعر بالإحباط وأشعر أن جهدي لم يُقدَّر', textEn: 'Feel discouraged and worry my effort was not good enough', traitId: 'gentle' },
          { textAr: 'أسأل عن مثال عملي لأطبق التعديل بدقة', textEn: 'Ask for a concrete example so I can apply it well', traitId: 'confidence' },
        ],
      },
      {
        id: 'cr4',
        promptAr: 'عندما تُعرض عليك فرصة جديدة لم تجربها من قبل:',
        promptEn: 'When offered a fresh opportunity you have never tried before:',
        options: [
          { textAr: 'أتحمس للتجربة وأثق أنني سأتقنها مع الوقت', textEn: 'Feel excited and trust I will learn as I go', traitId: 'confidence' },
          { textAr: 'أتردد قليلاً ثم أوافق بعد جمع المعلومات', textEn: 'Pause to research carefully, then decide to join', traitId: 'growth' },
          { textAr: 'أعتذر غالباً خوفاً من الفشل أمام الناس', textEn: 'Tend to decline out of fear of failing', traitId: 'gentle' },
          { textAr: 'أستشير شخصاً أثق به وأخطو الخطوة الأولى', textEn: 'Check with a trusted mentor and take the first step', traitId: 'growth' },
        ],
      },
      {
        id: 'cr5',
        promptAr: 'كيف تصف حديثك الداخلي مع نفسك في الأيام الصعبة؟',
        promptEn: 'How would you describe your self-talk on stressful days?',
        options: [
          { textAr: 'مشجع ولطيف: «كل خطوة تقرّبني، وسأحاول بهدوء»', textEn: 'Encouraging and kind: "One calm step at a time"', traitId: 'confidence' },
          { textAr: 'متوازن أحياناً بين الحماس والقلق من التقصير', textEn: 'Mixed between hope and worrying about details', traitId: 'growth' },
          { textAr: 'قاسٍ بعض الشيء وألوم نفسي كثيراً', textEn: 'Pretty hard on myself when things go slowly', traitId: 'gentle' },
          { textAr: 'أكتب ما يقلقني في ورقة لأرتب أفكاري', textEn: 'Write worries down to clear my head', traitId: 'growth' },
        ],
      },
    ],
  },
  {
    id: 'educator_style',
    audienceAr: 'للمعلمين وأولياء الأمور',
    audienceEn: 'For Teachers & Parents',
    titleAr: 'اختبار بصمة المعلم والمربي التربوية',
    titleEn: 'Educator & Parent Leadership Style Profile',
    subtitleAr: 'اكتشف أسلوبك الأبرز في إدارة الصف أو توجيه الأبناء: المُلهِم، المنظم، الداعم، أم المدرب التفاعلي.',
    subtitleEn: 'Discover your natural teaching & mentoring signature: Creative Mentor, Structured Planner, Empathetic Guide, or Active Coach.',
    traits: {
      mentor: {
        id: 'mentor',
        labelAr: 'المُلهِم الإبداعي (Creative Mentor)',
        labelEn: 'Creative Mentor',
        summaryAr: 'تشعل شغف الطلاب بالقصص والأفكار المبتكرة والذكاء الاصطناعي وتحول الحصة لمتعة حقيقية.',
        summaryEn: 'Ignites curiosity through storytelling, creative visuals, and inspiring real-world connections.',
        tipsAr: [
          'استخدم قسم القصص والشهادات الذكية لمضاعفة حماس طلابك.',
          'أضف هدفاً زمنياً واضحاً في نهاية كل نشاط إبداعي لتثبيت المعلومة.',
        ],
        tipsEn: [
          'Pair creative stories and AI certificates with short closing recaps.',
          'Keep quick timelines handy so creative sessions always finish strong.',
        ],
        accentColor: '#b45309',
      },
      planner: {
        id: 'planner',
        labelAr: 'المُنظِّم المنهجي (Structured Planner)',
        labelEn: 'Structured Planner',
        summaryAr: 'قوتك في الترتيب، التحضير الدقيق، الوضوح، وتدرج الخطوات بحيث لا يضيع أي طالب.',
        summaryEn: 'Thrives on crystal-clear routines, step-by-step pacing, and well-crafted lesson preparations.',
        tipsAr: [
          'استوديو التحضير وبنك الأسئلة المرقّم أداتان مثاليتان لأسلوبك المنظم.',
          'اترك مساحة 5 دقائق مفاجئة للضحك أو لعبة سريعة لكسر الروتين.',
        ],
        tipsEn: [
          'Numbered worksheet packs and the prep studio fit your workflow like a glove.',
          'Mix in a 5-minute surprise game to energize structured classes.',
        ],
        accentColor: '#0c4a6e',
      },
      empathetic: {
        id: 'empathetic',
        labelAr: 'الداعم العاطفي (Empathetic Guide)',
        labelEn: 'Empathetic Guide',
        summaryAr: 'تلاحظ مشاعر كل طفل وتمنح الأمان النفسي والتشجيع، فيحبك الطلاب ويثقون بك بسرعة.',
        summaryEn: 'Reads student emotions effortlessly and builds a safe, encouraging space where shy learners bloom.',
        tipsAr: [
          'احتفظ بأوراق التقدير والشهادات لتكريم المجهود والتحسن وليس الدرجات فقط.',
          'ضع قواعد صفية واضحة بلطف لتوازن بين الحنان والالتزام.',
        ],
        tipsEn: [
          'Celebrate effort and progress regularly with encouraging notes.',
          'Pair warmth with firm, simple classroom routines.',
        ],
        accentColor: '#be123c',
      },
      coach: {
        id: 'coach',
        labelAr: 'المدرب التفاعلي (Interactive Coach)',
        labelEn: 'Interactive Coach',
        summaryAr: 'تركز على التطبيق الفوري، الكويزات التنافسية، والألعاب الجماعية التي ترفع سرعة البديهة.',
        summaryEn: 'Focuses on active practice, lively quizzes, teamwork challenges, and instant feedback.',
        tipsAr: [
          'استخدم كويزات الطلاب الفورية ومختبر الذكاء كإحماء يومي أول 5 دقائق.',
          'تأكد من منح وقت كافٍ للتأمل والكتابة للطلاب الهادئين أيضاً.',
        ],
        tipsEn: [
          'Run quick live quizzes and IQ warm-ups at the start of sessions.',
          'Give quiet thinkers a few extra seconds before calling answers.',
        ],
        accentColor: '#047857',
      },
    },
    questions: [
      {
        id: 'ed1',
        promptAr: 'قبل دخول الحصة أو بدء المذاكرة مع الأبناء، ما أهم شيء تجهزه أولاً؟',
        promptEn: 'Before starting a lesson or study session, what do you prepare first?',
        options: [
          { textAr: 'قصة شيقة أو فكرة مبتكرة تشد انتباههم من أول دقيقة', textEn: 'An intriguing story or creative hook', traitId: 'mentor' },
          { textAr: 'تحضير مكتوب وخطة منظمة بالخطوات والأهداف', textEn: 'A clear written plan with timed steps', traitId: 'planner' },
          { textAr: 'الاطمئنان على حالتهم النفسية وكسر التوتر بابتسامة', textEn: 'Checking in warmly to build comfort', traitId: 'empathetic' },
          { textAr: 'نشاط سريع أو كويز تفاعلي يحرك الحماس فوراً', textEn: 'A lively warm-up game or quick quiz', traitId: 'coach' },
        ],
      },
      {
        id: 'ed2',
        promptAr: 'عندما يخطئ طالب خجول في الإجابة، كيف تتصرف غالباً؟',
        promptEn: 'When a shy student answers incorrectly, what is your natural response?',
        options: [
          { textAr: 'أربطها بمثال طريف أو قصة تفتح له الفهم بدون إحراج', textEn: 'Connect it to a fun example to spark clarity', traitId: 'mentor' },
          { textAr: 'أرجع بهدوء للقاعدة الأساسية خطوة بخطوة', textEn: 'Walk back through the clear rule step by step', traitId: 'planner' },
          { textAr: 'أمدح شجاعته في المحاولة أولاً ثم أساعده بلطف', textEn: 'Praise their courage first, then guide gently', traitId: 'empathetic' },
          { textAr: 'أعطيه تلميحاً سريعاً ليكتشف الإجابة بنفسه خلال ثوانٍ', textEn: 'Give a brisk clue so they win the answer fast', traitId: 'coach' },
        ],
      },
      {
        id: 'ed3',
        promptAr: 'ما الجملة التي تسمعها كثيراً من طلابك أو أولادك؟',
        promptEn: 'Which compliment do you hear most often from students or parents?',
        options: [
          { textAr: '«حصتك ممتعة ومليئة بالأفكار الجديدة»', textEn: '"Your lessons are so creative and inspiring!"', traitId: 'mentor' },
          { textAr: '«شرحك منظم جداً ومش بننسى ولا نقطة»', textEn: '"Everything is crystal-clear and well organized."', traitId: 'planner' },
          { textAr: '«بنحس معاك بالأمان والتشجيع دايماً»', textEn: '"You always listen and encourage everyone."', traitId: 'empathetic' },
          { textAr: '«الوقت بيجري في الأنشطة والألعاب والتحديات»', textEn: '"Time flies with all the games and challenges!"', traitId: 'coach' },
        ],
      },
      {
        id: 'ed4',
        promptAr: 'لو أتيح لك تطوير أداة واحدة إضافية في تدريسك الآن، ماذا ستختار؟',
        promptEn: 'If you could add one superpower tool to your teaching today, what would it be?',
        options: [
          { textAr: 'مصمم قصص وشهادات إبداعية بالذكاء الاصطناعي', textEn: 'AI storytelling and creative certificate studio', traitId: 'mentor' },
          { textAr: 'بنك تحضيرات وأوراق عمل مرقمة ومنظمة', textEn: 'Organized numbered worksheet and prep library', traitId: 'planner' },
          { textAr: 'متابعة فردية لنمو ثقة كل طالب على حدة', textEn: 'Personalized encouragement tracker per learner', traitId: 'empathetic' },
          { textAr: 'منصة كويزات تفاعلية وتحليلات فورية للدرجات', textEn: 'Live interactive quiz arena with instant analytics', traitId: 'coach' },
        ],
      },
    ],
  },
];
