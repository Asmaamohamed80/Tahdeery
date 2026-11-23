export type DecisionAgeGroup = '6-8' | '9-11' | '12-14';

export interface DecisionAgeMeta {
  id: DecisionAgeGroup;
  labelAr: string;
  labelEn: string;
  shortAr: string;
  shortEn: string;
  focusAr: string;
  focusEn: string;
}

export const DECISION_AGE_GROUPS: DecisionAgeMeta[] = [
  {
    id: '6-8',
    labelAr: 'المستوى الأول (6 – 8 سنوات)',
    labelEn: 'Level 1 (Ages 6–8)',
    shortAr: '6–8 سنوات',
    shortEn: 'Ages 6–8',
    focusAr: 'خيال ولعب بسيط',
    focusEn: 'Imagination & Playful Discovery',
  },
  {
    id: '9-11',
    labelAr: 'المستوى الثاني (9 – 11 سنة)',
    labelEn: 'Level 2 (Ages 9–11)',
    shortAr: '9–11 سنة',
    shortEn: 'Ages 9–11',
    focusAr: 'منطق وحل مشكلات يومية',
    focusEn: 'Logic & Daily Problem Solving',
  },
  {
    id: '12-14',
    labelAr: 'المستوى الثالث (12 – 14 سنة)',
    labelEn: 'Level 3 (Ages 12–14)',
    shortAr: '12–14 سنة',
    shortEn: 'Ages 12–14',
    focusAr: 'قيادة وريادة أعمال مبسطة',
    focusEn: 'Leadership & Mini Entrepreneurship',
  },
];

export interface DecisionChoice {
  key: 'a' | 'b' | 'c';
  labelAr: string;
  labelEn: string;
  outcomeAr: string;
  outcomeEn: string;
  isSmartest: boolean;
}

export interface DecisionScenario {
  id: string;
  ageGroup: DecisionAgeGroup;
  titleAr: string;
  titleEn: string;
  situationAr: string;
  situationEn: string;
  choices: DecisionChoice[];
  skillAr: string;
  skillEn: string;
}

export interface RobotBugChallenge {
  id: string;
  ageGroup: DecisionAgeGroup;
  titleAr: string;
  titleEn: string;
  stepsAr: [string, string, string];
  stepsEn: [string, string, string];
  promptAr: string;
  promptEn: string;
  bugOptionsAr: string[];
  bugOptionsEn: string[];
  correctBugIndex: number;
  revealBugAr: string;
  revealBugEn: string;
  smartFixesAr: string[];
  smartFixesEn: string[];
  skillAr: string;
  skillEn: string;
}

export interface OffScreenMission {
  id: string;
  ageGroup: DecisionAgeGroup;
  titleAr: string;
  titleEn: string;
  toolsAr: string[];
  toolsEn: string[];
  safetyRuleAr: string;
  safetyRuleEn: string;
  stepsAr: string[];
  stepsEn: string[];
  reflectionPromptsAr: string[];
  reflectionPromptsEn: string[];
  badgeTitleAr: string;
  badgeTitleEn: string;
  skillAr: string;
  skillEn: string;
}

export const DECISION_SCENARIOS: DecisionScenario[] = [
  // Ages 6-8
  {
    id: 'dec-6-8-1',
    ageGroup: '6-8',
    titleAr: 'جسر النمل الجائع',
    titleEn: 'The Hungry Ants Bridge',
    situationAr:
      'مجموعة نمل صغيرة واقفة أمام بركة ماء. على الجانب الآخر قطعة تفاح لذيذة. بجانبك: ورقة شجر خفيفة، وحصى صغيرة صلبة. ماذا تفعل؟',
    situationEn:
      'A tiny group of ants wants to cross a puddle to reach an apple slice. Beside you are a light leaf and small sturdy pebbles. What do you choose?',
    choices: [
      {
        key: 'a',
        labelAr: 'أرمي الورقة في الماء لتصبح قارباً للنمل.',
        labelEn: 'Drop the paper leaf into the water to act as a boat.',
        outcomeAr: 'تبلّلت الورقة بالماء وانقلبت مع أول موجة، فعاد النمل للخلف بسرعة!',
        outcomeEn: 'The thin leaf soaked up water and flipped on the first ripple, sending the ants scurrying back!',
        isSmartest: false,
      },
      {
        key: 'b',
        labelAr: 'أصفّ الحصى الصغيرة بجانب بعضها لتصنع طريقاً ثابتاً.',
        labelEn: 'Line up the sturdy pebbles side by side as stepping stones.',
        outcomeAr: 'صنعتَ جسراً جافاً وثابتاً! عبر النمل بأمان إلى التفاحة وهو يلوّح لك سعيداً.',
        outcomeEn: 'You built a solid dry stepping-stone path! The ants marched safely across to the apple.',
        isSmartest: true,
      },
      {
        key: 'c',
        labelAr: 'آخذ التفاحة وأخبئها في جيبي حتى لا يتعب النمل.',
        labelEn: 'Put the apple in your pocket so the ants do not get tired.',
        outcomeAr: 'وقف النمل حائراً يبحث عن غدائه الذي اختفى فجأة من المكان!',
        outcomeEn: 'The ants stood confused looking around for their lunch that suddenly vanished!',
        isSmartest: false,
      },
    ],
    skillAr: 'توقّع النتيجة قبل التصرف واختيار المادة المناسبة للحل.',
    skillEn: 'Predicting cause & effect and choosing the right material.',
  },
  {
    id: 'dec-6-8-2',
    ageGroup: '6-8',
    titleAr: 'الصوت الغريب في الخيمة',
    titleEn: 'The Mystery Sound in the Tent',
    situationAr:
      'بنيتَ مع أخيك خيمة من الوسائد والملاءات في الغرفة. فجأة سمعتما صوت "خربشة" خفيفاً خلف الوسادة!',
    situationEn:
      'You and your sibling built a cozy pillow-and-sheet tent. Suddenly you hear a soft rustling sound behind a cushion!',
    choices: [
      {
        key: 'a',
        labelAr: 'نرمي كتاباً ثقيلاً نحو الصوت لإخافته.',
        labelEn: 'Toss a heavy book toward the sound to scare it away.',
        outcomeAr: 'ارتطم الكتاب بسقف الملاءة، فانهارت الخيمة كلها فوقكما وضحكتما من الموقف!',
        outcomeEn: 'The book knocked down the sheet roof and the whole pillow tent collapsed on top of you!',
        isSmartest: false,
      },
      {
        key: 'b',
        labelAr: 'نفتح طرف الستارة بهدوء ليدخل ضوء الشمس ونرى السبب.',
        labelEn: 'Open the curtain edge calmly to let daylight in and inspect.',
        outcomeAr: 'اكتشفتما أن الصوت كان مجرد ورقة رسم تتحرك مع نسيم الشباك!',
        outcomeEn: 'You discovered the sound was just a drawing sheet fluttering in the window breeze!',
        isSmartest: true,
      },
      {
        key: 'c',
        labelAr: 'نجري خارج الغرفة ولا نعود للخيمة أبداً.',
        labelEn: 'Run out of the room and never check the tent again.',
        outcomeAr: 'خسرتما متعة اللعب في الخيمة وظل اللغز بدون حل.',
        outcomeEn: 'You missed out on tent playtime and the harmless mystery stayed unsolved.',
        isSmartest: false,
      },
    ],
    skillAr: 'التحقق الهادئ وجمع المعلومات قبل التسرّع.',
    skillEn: 'Calm investigation before reacting.',
  },

  // Ages 9-11
  {
    id: 'dec-9-11-1',
    ageGroup: '9-11',
    titleAr: 'فخ الـ 20 دقيقة قبل وصول الضيوف',
    titleEn: 'The 20-Minute Guest Countdown',
    situationAr:
      'وعدتَ عائلتك بتجهيز ضيافة بسيطة للضيوف، لكن بقي 20 دقيقة فقط على وصولهم، وأخوك الصغير بعثر ألعابه في كل الصالة.',
    situationEn:
      'You promised your family to prepare a quick snack tray, but guests arrive in 20 minutes and your little brother scattered toys across the living room.',
    choices: [
      {
        key: 'a',
        labelAr: 'أبدأ بوصفة حلوى تحتاج 7 خطوات وأؤجل ترتيب الصالة للنهاية.',
        labelEn: 'Start a 7-step dessert recipe and leave the toys for later.',
        outcomeAr: 'رنّ جرس الباب والوصفة لم تجهز بعد، والألعاب ما زالت تملأ الأرض!',
        outcomeEn: 'The doorbell rang while the recipe was unfinished and toys were still everywhere!',
        isSmartest: false,
      },
      {
        key: 'b',
        labelAr: 'أتحدى أخي في "سباق 5 دقائق" لجمع الألعاب في سلتها، وأرتّب أنا طبق الفاكهة والبسكويت.',
        labelEn: 'Turn tidying into a 5-minute toy-basket race for your brother while you arrange fruit & biscuits.',
        outcomeAr: 'في 12 دقيقة أصبحت الصالة مرتبة وطبق الضيافة جاهزاً بدون أي توتر!',
        outcomeEn: 'In 12 minutes the room was spotless and the snack tray looked inviting with zero stress!',
        isSmartest: true,
      },
      {
        key: 'c',
        labelAr: 'أجلس غاضباً وأعلن أن الوقت مستحيل يكفي.',
        labelEn: 'Sit down frustrated and decide there is not enough time.',
        outcomeAr: 'انتهت الدقائق العشرون دون إنجاز أي خطوة واحدة.',
        outcomeEn: 'All 20 minutes slipped away with nothing ready when the doorbell rang.',
        isSmartest: false,
      },
    ],
    skillAr: 'ترتيب الأولويات والتفويض الذكي في الوقت الضيق.',
    skillEn: 'Prioritizing & playful delegation under time pressure.',
  },
  {
    id: 'dec-9-11-2',
    ageGroup: '9-11',
    titleAr: 'خلاف الغلاف داخل الفريق',
    titleEn: 'The Magazine Cover Showdown',
    situationAr:
      'تصمّم مع 3 أصدقاء مجلة ورقية للفصل. فجأة تشاجر اثنان من الفريق لأن كلاً منهما يصرّ على رسم الغلاف وحده.',
    situationEn:
      'You and 3 classmates are making a paper magazine. Two teammates start arguing because both insist on drawing the front cover alone.',
    choices: [
      {
        key: 'a',
        labelAr: 'أختار صديقي الأقرب وأمنعهما من النقاش.',
        labelEn: 'Pick your closest friend and end the discussion.',
        outcomeAr: 'زعل الصديق الآخر وتوقّف عن كتابة قصته، فبقيت صفحات المجلة ناقصة!',
        outcomeEn: 'The other teammate felt left out and stopped writing their article, leaving blank pages!',
        isSmartest: false,
      },
      {
        key: 'b',
        labelAr: 'أقترح أن يرسم الأول "غلاف الواجهة" والثاني "الغلاف الخلفي وتصميم الشخصيات".',
        labelEn: 'Propose one draws the Front Cover while the other designs the Back Cover & Mascot.',
        outcomeAr: 'عاد الحماس فوراً، وخرجت المجلة بلمستين فنيتين متكاملتين في نصف الوقت!',
        outcomeEn: 'Both jumped in excitedly and the magazine finished twice as fast with two awesome artworks!',
        isSmartest: true,
      },
      {
        key: 'c',
        labelAr: 'أسحب الورقة وأرسم الغلاف بنفسي بدلاً منهما.',
        labelEn: 'Take the paper and draw the cover yourself.',
        outcomeAr: 'تأخرتَ عن باقي مهامك وشعر الفريق أن العمل لم يعد جماعياً.',
        outcomeEn: 'You fell behind on your own tasks and teammates lost ownership of the project.',
        isSmartest: false,
      },
    ],
    skillAr: 'حل النزاعات بقاعدة «الكل رابح».',
    skillEn: 'Win-win conflict resolution & team alignment.',
  },

  // Ages 12-14
  {
    id: 'dec-12-14-1',
    ageGroup: '12-14',
    titleAr: 'أزمة مبيعات معرض المدرسة',
    titleEn: 'The School Fair Sales Slump',
    situationAr:
      'أطلقتَ مشروعاً صغيراً لبيع فواصل كتب مرسومة يدوياً بسعر بسيط. بعد ساعة بعتَ 4 فواصل فقط، بينما الكشك المجاور باع 20 منتجاً!',
    situationEn:
      'You launched a mini stand selling hand-drawn bookmarks at the school fair. After 1 hour you sold only 4, while the next booth sold 20!',
    choices: [
      {
        key: 'a',
        labelAr: 'أخفّض السعر إلى النصف فوراً مهما كانت التكلفة.',
        labelEn: 'Slash prices in half immediately regardless of cost.',
        outcomeAr: 'نفدت الفواصل لكنك لم تغطِّ حتى ثمن الورق والألوان!',
        outcomeEn: 'You sold out quickly, yet lost money and could not cover paper & marker costs!',
        isSmartest: false,
      },
      {
        key: 'b',
        labelAr: 'أراقب الكشك المجاور 5 دقائق، فأرفع الفواصل على حامل كرتوني وأضيف ميزة "نكتب اسمك مجاناً على الفاصل".',
        labelEn: 'Observe for 5 minutes: prop bookmarks upright so students see them and add "Free Custom Name Calligraphy".',
        outcomeAr: 'وقف 12 طالباً في طابور صغير خلال 15 دقيقة حباً في تخصيص الفاصل بأسمائهم!',
        outcomeEn: '12 students lined up in 15 minutes because they loved personalizing bookmarks with their names!',
        isSmartest: true,
      },
      {
        key: 'c',
        labelAr: 'أجمع أغراضي مبكراً وأقرر أنني لا أصلح للمشاريع.',
        labelEn: 'Pack up early and quit because sales started slow.',
        outcomeAr: 'خسرتَ تجربة فهم سلوك الزبائن وتطوير الفكرة.',
        outcomeEn: 'You missed a golden chance to observe customers and iterate your offer.',
        isSmartest: false,
      },
    ],
    skillAr: 'الملاحظة السوقية وإضافة «قيمة مميزة» بدل حرق السعر.',
    skillEn: 'Customer observation & adding perceived value instead of cutting price.',
  },
  {
    id: 'dec-12-14-2',
    ageGroup: '12-14',
    titleAr: 'فخ الإشاعة في جروب الفصل',
    titleEn: 'The Class Chat Rumor Trap',
    situationAr:
      'زميلك كتب في جروب الفصل: "عاجل: اختبار الغد تأجّل!" بدون أي صورة رسمية، وبدأ نصف الفصل يغلق الكتب ويحتفل.',
    situationEn:
      'A classmate posted in the group chat: "URGENT: Tomorrow’s exam is postponed!" without any official screenshot. Half the class closed their books.',
    choices: [
      {
        key: 'a',
        labelAr: 'أغلق كتابي فوراً مثلهم لأن الأغلبية صدّقت الخبر.',
        labelEn: 'Stop studying immediately since everyone else is celebrating.',
        outcomeAr: 'في الصباح اكتشفتَ أن الاختبار في موعده تماماً ودخلت القاعة غير مستعد!',
        outcomeEn: 'Next morning the exam happened right on schedule and you walked in unprepared!',
        isSmartest: false,
      },
      {
        key: 'b',
        labelAr: 'أسأل بهدوء في الجروب: "هل معنا إعلان المدرسة الرسمي أو رسالة المعلم قبل أن نتوقف عن المذاكرة؟"',
        labelEn: 'Post calmly: "Do we have an official school notice or teacher message before we stop revising?"',
        outcomeAr: 'اعترف الزميل بعد دقيقتين أنها كانت "مزحة"، فأنقذت نفسك ومعظم الفصل من فخ الإشاعة!',
        outcomeEn: 'Two minutes later the classmate admitted it was a prank—saving you and the whole class!',
        isSmartest: true,
      },
      {
        key: 'c',
        labelAr: 'أنقل الخبر لجروب آخر ليستفيد الجميع.',
        labelEn: 'Forward the unverified news to another group chat.',
        outcomeAr: 'أربكتَ عشرات الطلاب وتحمّلتَ مسؤولية نشر معلومة غير مؤكدة.',
        outcomeEn: 'You confused dozens more students by spreading an unverified rumor.',
        isSmartest: false,
      },
    ],
    skillAr: 'التحقق من المصادر والقيادة الواعية ضد تأثير القطيع.',
    skillEn: 'Source verification & independent leadership.',
  },
];

export const ROBOT_BUGS: RobotBugChallenge[] = [
  // Ages 6-8
  {
    id: 'bot-6-8-1',
    ageGroup: '6-8',
    titleAr: 'خطة الروبوت «زيكو» لحفظ الآيس كريم في الرحلة',
    titleEn: "Robot Ziko's Picnic Ice Cream Plan",
    stepsAr: [
      'نضع الآيس كريم في علبة بلاستيك.',
      'نلفّ العلبة ببطانية صوف سميكة.',
      'نترك العلبة تحت الشمس على العشب حتى نلعب الكرة!',
    ],
    stepsEn: [
      'Put the ice cream inside a plastic box.',
      'Wrap the box with a thick wool blanket.',
      'Leave the box right under the hot sun on the grass while playing!',
    ],
    promptAr: 'زيكو يظن أن خطته عبقرية! أي خطوة فيها الغلطة المضحكة؟ وماذا تقترح بدلاً منها؟',
    promptEn: 'Ziko thinks his plan is brilliant! Which step has the silly mistake, and what works better?',
    bugOptionsAr: [
      'الخطوة 1: وضع الآيس كريم في علبة بلاستيك',
      'الخطوة 2: لفّ العلبة ببطانية',
      'الخطوة 3: ترك العلبة تحت الشمس المباشرة',
    ],
    bugOptionsEn: [
      'Step 1: Using a plastic box',
      'Step 2: Wrapping with a blanket',
      'Step 3: Leaving the box directly under the sun',
    ],
    correctBugIndex: 2,
    revealBugAr: 'الغلطة في الخطوة 3: الشمس سترفع حرارة العلبة ويذوب الآيس كريم بسرعة (والبطانية تحبس السخونة إذا تركناها في الشمس!).',
    revealBugEn: 'Bug in Step 3: Direct sunlight heats up the box and melts the ice cream fast!',
    smartFixesAr: [
      'نضع العلبة في الظل بعيداً عن الشمس.',
      'نضعها داخل الحقيبة بجوار زجاجة ماء مثلجة أو نأكلها قبل اللعب.',
    ],
    smartFixesEn: [
      'Keep the container in deep shade away from sunlight.',
      'Place it inside a bag next to a chilled water bottle—or eat it before playing!',
    ],
    skillAr: 'اكتشاف تأثير الشمس والحرارة على المواد.',
    skillEn: 'Understanding sunlight, heat, and cooling logic.',
  },
  {
    id: 'bot-6-8-2',
    ageGroup: '6-8',
    titleAr: 'خطة الروبوت «زيكو» لتغليف هدية عيد ميلاد',
    titleEn: "Robot Ziko's Birthday Gift Wrap",
    stepsAr: [
      'نضع اللعبة داخل صندوق كرتون.',
      'نلفّ الصندوق بـ 10 طبقات كاملة من الشريط اللاصق القوي من كل جهة.',
      'نكتب عليها "افتحها في ثانية" بدون أي كارت تهنئة!',
    ],
    stepsEn: [
      'Put the toy inside a cardboard box.',
      'Wrap 10 tight layers of heavy tape around every side.',
      'Write "Open in 1 second!" with zero greeting card!',
    ],
    promptAr: 'لماذا سينزعج صديقك لو استلم هذه الهدية؟ وما البديل الأسهل؟',
    promptEn: 'Why might your friend struggle with this gift? Find Ziko’s mistake!',
    bugOptionsAr: [
      'الخطوة 1: وضع اللعبة في صندوق كرتون',
      'الخطوة 2 و 3: 10 طبقات لاصق تمنع الفتح مع نسيان كلمة التهنئة',
      'فكرة تقديم هدية في عيد الميلاد',
    ],
    bugOptionsEn: [
      'Step 1: Using a cardboard box',
      'Steps 2 & 3: 10 tape layers make it impossible to open + missing card',
      'Giving a birthday gift to a friend',
    ],
    correctBugIndex: 1,
    revealBugAr: '10 طبقات لاصق ستجعل فتح الهدية متعباً ومحبطاً لصديقك، كما أن الكارت المرسوم باليد يُفرحه أكثر!',
    revealBugEn: '10 layers of tape make opening the present frustrating instead of joyful, and a kind card means a lot!',
    smartFixesAr: [
      'نكتفي بقطعة لاصق صغيرة واحدة أو شريط قماشي يُفتح بسهولة.',
      'نرسم كارت تهنئة بسيطاً نكتب عليه اسمنا لصديقنا.',
    ],
    smartFixesEn: [
      'Use just one small piece of tape or a ribbon tie that opens gently.',
      'Add a handmade card with a warm birthday wish.',
    ],
    skillAr: 'التفكير في مشاعر وتجربة المستخدم الآخر (التعاطف العملي).',
    skillEn: 'User empathy in everyday design.',
  },

  // Ages 9-11
  {
    id: 'bot-9-11-1',
    ageGroup: '9-11',
    titleAr: 'خطة الروبوت «زيكو» لترتيب مكتب المذاكرة',
    titleEn: "Robot Ziko's 3-Minute Desk Organizer",
    stepsAr: [
      'اجمع كل الكتب والأوراق والأقلام واخلطها معاً في صندوق واحد عميق.',
      'ضع كوب ماء مفتوحاً على حافة المكتب فوق الدفاتر مباشرة.',
      'علّق جدول الحصص خلف باب الغرفة لكي لا يراه أحد.',
    ],
    stepsEn: [
      'Mix all books, loose papers, and pens together inside one deep bin.',
      'Place an open cup of water on the edge of the desk right beside open notebooks.',
      'Hang your study timetable behind the closed bedroom door.',
    ],
    promptAr: 'في خطة زيكو أخطاء عملية ستعطل مذاكرتك! حدّد السبب الرئيسي لفشلها واكتب تعديلك الأذكى.',
    promptEn: 'This plan looks neat for 1 minute, then causes daily headaches! Spot the core flaw:',
    bugOptionsAr: [
      'ترتيب المكتب فكرة غير مهمة للمذاكرة',
      'الجمع العشوائي يضيع وقت البحث + كوب الماء يبلّل الدفاتر + الجدول مخفي',
      'استخدام دفتر للكتابة بدلاً من الورق',
    ],
    bugOptionsEn: [
      'Tidying a desk is not needed for studying',
      'Mixing everything wastes search time + open water risks spills + hidden timetable',
      'Using notebooks instead of loose pages',
    ],
    correctBugIndex: 1,
    revealBugAr: 'الخلط في صندوق واحد يصعّب العثور على الأدوات، وكوب الماء المفتوح قد ينسكب على الدفاتر، والجدول يجب أن يكون أمام عينيك!',
    revealBugEn: 'Random mixing hides items, open cups risk spills on books, and your timetable must stay visible!',
    smartFixesAr: [
      'افصل الكتب في جانب والأقلام في كوب/علبة مخصصة.',
      'استبدل الكوب المفتوح بزجاجة مغلقة بعيدة عن الدفاتر.',
      'ثبّت جدول الحصص أمام المكتب مباشرة.',
    ],
    smartFixesEn: [
      'Sort books in one stack and pens in a small holder.',
      'Keep a closed water bottle away from open notebooks.',
      'Pin the timetable directly in front of your study seat.',
    ],
    skillAr: 'التنظيم الوظيفي والوقاية من المخاطر اليومية.',
    skillEn: 'Functional organization & preventive thinking.',
  },
  {
    id: 'bot-9-11-2',
    ageGroup: '9-11',
    titleAr: 'خطة الروبوت لسباق السلحفاة الورقية بالنفخ',
    titleEn: "Robot Ziko's Paper Turtle Wind Race",
    stepsAr: [
      'نصنع سلحفاة خفيفة من ورقة مطوية.',
      'نضعها على سجادة صوف خشنة مملوءة بالوسائد لتكون الحلبة.',
      'تقف على بُعد مترين وتنفخ بقوة لكي تتحرك أسرع!',
    ],
    stepsEn: [
      'Fold a light paper turtle.',
      'Place it on a thick wool rug crowded with pillows as the racetrack.',
      'Stand 2 meters away and blow hard to make it zoom!',
    ],
    promptAr: 'لو نفذت الخطة لن تتحرك السلحفاة سنتيمتراً واحداً! أين الغلطة العلمية؟',
    promptEn: 'The paper turtle will barely budge! Spot the physics mistake:',
    bugOptionsAr: [
      'الورق خفيف جداً ولا يتحرك بالهواء',
      'الاحتكاك على السجادة الخشنة + تشتّت الهواء من مسافة مترين',
      'تسمية اللعبة سلحفاة بدلاً من سيارة',
    ],
    bugOptionsEn: [
      'Light paper cannot be pushed by air',
      'High friction from the wool rug + wind scatters over 2 meters',
      'Calling the folded paper a turtle',
    ],
    correctBugIndex: 1,
    revealBugAr: 'السجادة الخشنة تمنع انزلاق الورق (احتكاك عالٍ)، والنفخ من مسافة مترين يشتّت تيار الهواء قبل أن يصل للسلحفاة.',
    revealBugEn: 'Thick rugs create high friction, and blowing from 2 meters away spreads the air stream too thin!',
    smartFixesAr: [
      'نقل السباق لطاولة ملساء أو أرضية ناعمة.',
      'تقريب نقطة النفخ أو استخدام أنبوب ورقي لتوجيه الهواء بدقة.',
    ],
    smartFixesEn: [
      'Move the race onto a smooth tabletop or bare floor.',
      'Blow closer behind the turtle or aim through a rolled paper tube.',
    ],
    skillAr: 'فهم الاحتكاك وتوجيه القوة بدقة.',
    skillEn: 'Reducing friction & focusing force.',
  },

  // Ages 12-14
  {
    id: 'bot-12-14-1',
    ageGroup: '12-14',
    titleAr: 'خطة الروبوت لإطلاق «نادي تبادل الكتب» في المدرسة',
    titleEn: "Robot Ziko's School Book-Swap Club",
    stepsAr: [
      'يُمنع أي طالب من الاستعارة في أول أسبوع إلا إذا تبرّع بـ 5 كتب جديدة تماماً.',
      'نضع الكتب في صندوق مفتوح بالفناء دون تسجيل أسماء المستعيرين.',
      'وقت الاستعارة 30 ثانية فقط أثناء رنين جرس الانصراف.',
    ],
    stepsEn: [
      'Require students to donate 5 brand-new books before borrowing any book.',
      'Leave books in an open yard box with zero sign-out tracking.',
      'Limit borrowing to 30 seconds right at the final dismissal bell.',
    ],
    promptAr: 'هذه الخطة ستجعل النادي يتوقف من أول يوم! ما الخطأ الاستراتيجي الأساسي؟',
    promptEn: 'Why would this club shut down on Day 1? Pick the root design failure:',
    bugOptionsAr: [
      'الطلاب لا يحبون القراءة في المدرسة',
      'حاجز دخول مبالغ فيه (5 كتب جديدة) + غياب التتبع + وقت مزدحم جداً',
      'وضع الكتب داخل صندوق بدلاً من رف حديدي',
    ],
    bugOptionsEn: [
      'Students dislike reading',
      'High barrier (5 new books) + no tracking + chaotic 30-sec bell timing',
      'Using a box instead of a metal shelf',
    ],
    correctBugIndex: 1,
    revealBugAr: 'اشتراط 5 كتب جديدة يطرد المشاركين، وعدم تسجيل الأسماء يضيّع الكتب خلال يومين، و30 ثانية وقت الخروج تخلق فوضى!',
    revealBugEn: 'Asking for 5 new books blocks beginners, zero tracking loses inventory, and 30 seconds at dismissal creates chaos!',
    smartFixesAr: [
      'تطبيق قاعدة عادلة: «أحضر كتاباً نظيفاً لتستعير كتاباً».',
      'دفتر بسيط لتسجيل الاسم والتاريخ.',
      'فتح النادي 10 دقائق هادئة في الفسحة.',
    ],
    smartFixesEn: [
      'Use a fair "Bring 1 clean book, borrow 1 book" rule.',
      'Keep a simple paper checkout log (Name + Date).',
      'Open during a calm 10-minute recess window.',
    ],
    skillAr: 'تصميم الأنظمة العادلة والمستدامة.',
    skillEn: 'Designing low-friction, sustainable community systems.',
  },
  {
    id: 'bot-12-14-2',
    ageGroup: '12-14',
    titleAr: 'خطة الروبوت لإدارة مشروع جماعي مستعجل',
    titleEn: "Robot Ziko's Urgent Team Project Plan",
    stepsAr: [
      'لا تقسّموا المهام، اعملوا جميعاً عشوائياً في كل شيء معاً.',
      'أجّلوا مراجعة العمل بالكامل لآخر 10 دقائق قبل التسليم.',
      'لو تأخر زميل في مهمته، احذفوا اسمه من الغلاف سراً بدون إخباره.',
    ],
    stepsEn: [
      'Skip dividing roles—everyone just jumps into everything randomly.',
      'Wait until the final 10 minutes before submission to review anything.',
      'If a teammate runs late, quietly delete their name without telling them.',
    ],
    promptAr: 'حدّد الثغرة القيادية والأخلاقية في خطة زيكو ثم اقترح نظام إدارة أفضل.',
    promptEn: 'Identify both the workflow flaw and leadership ethics bug in Ziko’s plan:',
    bugOptionsAr: [
      'العمل في مجموعات أفضل من العمل الفردي',
      'غياب الأدوار يسبب فوضى + التأجيل يمنع التصحيح + الحذف السري يدمر الثقة',
      'كتابة أسماء أعضاء الفريق على الغلاف',
    ],
    bugOptionsEn: [
      'Team projects take too long',
      'No role clarity + last-minute panic review + secretive blame hurts trust',
      'Listing teammate names on the cover',
    ],
    correctBugIndex: 1,
    revealBugAr: 'عدم تقسيم الأدوار يكرر نفس الشغل ويترك فراغات، والمراجعة آخر 10 دقائق تمنع الإصلاح، والتصرف السري ضد زميل غير عادل.',
    revealBugEn: 'No role clarity causes gaps, 10-minute reviews leave no fix time, and secret exclusion destroys team trust.',
    smartFixesAr: [
      'توزيع المهام بوضوح (بحث / كتابة / تنسيق) مع موعد تسليم داخلي.',
      'مراجعة تجريبية قبل التسليم بـ 24 ساعة.',
      'تواصل صريح لمساعدة العضو المتعثر في إنهاء جزئه.',
    ],
    smartFixesEn: [
      'Assign clear roles (Research / Writing / Design) with check-in milestones.',
      'Run a full dry review 24 hours before submission.',
      'Communicate openly to help any stuck teammate finish their part.',
    ],
    skillAr: 'القيادة العادلة وتنظيم المشاريع.',
    skillEn: 'Accountable leadership & project coordination.',
  },
];

export const OFFSCREEN_MISSIONS: OffScreenMission[] = [
  // Ages 6-8
  {
    id: 'off-6-8-1',
    ageGroup: '6-8',
    titleAr: 'جسر الورقة العجيبة!',
    titleEn: 'The Magic Paper Bridge!',
    toolsAr: ['ورقتا رسم أو طباعة عاديتان', 'كوبان بلاستيك فارغان', '10 أغطية زجاجات ماء (أو ملاعق بلاستيك)'],
    toolsEn: ['2 plain sheets of paper', '2 empty plastic cups', '10 plastic bottle caps (or plastic spoons)'],
    safetyRuleAr: 'أمان 100%: نطوي الورق باليد فقط — بدون مقص، بدون نار، وبدون أي كهرباء.',
    safetyRuleEn: '100% Safe: Hand-folding paper only—no scissors, no heat, no electricity.',
    stepsAr: [
      'ضع الكوبين مقلوبين على الطاولة وبينهما مسافة كف يد.',
      'ضع الورقة الأولى مفرودة فوقهما وضع غطاءً في المنتصف... ستلاحظ أنها تنحني وتسقط!',
      'الآن استخدم ذكاءك: اطوِ الورقة الثانية باليد على شكل «مروحة متعرجة / زجزاج» وضعها فوق الكوبين وجرّب كم غطاءً تحمل!',
    ],
    stepsEn: [
      'Place 2 empty cups upside-down one hand-width apart.',
      'Lay the flat sheet across them and place a cap in the center—watch it sag!',
      'Now fold the second sheet into an accordion zigzag with your hands, lay it across, and count how many caps it holds!',
    ],
    reflectionPromptsAr: [
      'كم غطاءً حمل جسرُك المطوي قبل أن يميل؟',
      'ماذا تغيّر عندما طويتَ الورقة على شكل زجزاج؟',
    ],
    reflectionPromptsEn: [
      'How many caps did your folded bridge hold?',
      'What changed when you folded the paper into zigzags?',
    ],
    badgeTitleAr: 'مهندس الجسور الصغير',
    badgeTitleEn: 'Junior Bridge Engineer',
    skillAr: 'قوة الأشكال الهندسية (الطيّ يزيد الصلابة).',
    skillEn: 'Structural strength through accordion folding.',
  },
  {
    id: 'off-6-8-2',
    ageGroup: '6-8',
    titleAr: 'مهندس البولينج والمنحدر السريع',
    titleEn: 'Bowling Ramp Engineer',
    toolsAr: ['6 زجاجات ماء بلاستيكية فارغة', 'جورب (شراب) نظيف ملفوف ككرة', 'كتاب بغلاف قوي + وسادة'],
    toolsEn: ['6 empty plastic water bottles', '1 clean rolled-up sock ball', '1 hardcover book + 1 pillow'],
    safetyRuleAr: 'أمان 100%: نلعب على أرضية خالية من الأشياء القابلة للكسر ولا نركض داخل الغرفة.',
    safetyRuleEn: '100% Safe: Play in a clear floor space away from breakables.',
    stepsAr: [
      'رتّب الزجاجات الفارغة على شكل مثلث.',
      'ضع الكتاب مائلاً فوق وسادة ليصنع «منحدراً».',
      'دحرج كرة الجورب من أعلى المنحدر، ثم أضف وسادة ثانية لتجعل المنحدر أعلى وراقب الفرق!',
    ],
    stepsEn: [
      'Line up the 6 empty plastic bottles in a triangle.',
      'Lean the hardcover book against a pillow to create a ramp.',
      'Roll your sock ball down the ramp, then stack a second pillow to raise the ramp and test the difference!',
    ],
    reflectionPromptsAr: [
      'أي ارتفاع أسقط زجاجات أكثر: المنخفض أم المرتفع؟',
      'لماذا تعتقد أن الارتفاع غيّر سرعة الكرة؟',
    ],
    reflectionPromptsEn: [
      'Which ramp height knocked down more bottles?',
      'Why do you think changing the height changed the ball’s speed?',
    ],
    badgeTitleAr: 'مكتشف الحركة والسرعة',
    badgeTitleEn: 'Motion Explorer',
    skillAr: 'التجربة العملية والمقارنة (الزاوية والسرعة).',
    skillEn: 'Experimental comparison of slope & speed.',
  },

  // Ages 9-11
  {
    id: 'off-9-11-1',
    ageGroup: '9-11',
    titleAr: 'سباق حفظ البرودة الطبيعي',
    titleEn: 'Zero-Power Ice Saver Race',
    toolsAr: ['3 أكواب بلاستيك أو ورق', '3 مكعبات ثلج متساوية الحجم', 'مناديل ورقية أو قماش جاف + ورق ألومنيوم (فويل)'],
    toolsEn: ['3 plastic or paper cups', '3 equal-sized ice cubes', 'Paper towels or dry cloth + aluminum foil'],
    safetyRuleAr: 'أمان 100%: ماء بارد ومكعبات ثلج فقط — ممنوع أي سوائل ساخنة أو أجهزة كهربائية.',
    safetyRuleEn: '100% Safe: Plain ice cubes only—no hot liquids and no electrical appliances.',
    stepsAr: [
      'ضع مكعب ثلج واحد في كل كوب.',
      'اترك الكوب الأول مكشوفاً للمقارنة، ولفّ الكوب الثاني بالقماش أو المناديل، ولفّ الثالث بورق الألومنيوم.',
      'بعد 15 دقيقة، افتح الأكواب وقارن حجم كل مكعب ثلج!',
    ],
    stepsEn: [
      'Put one identical ice cube in each cup.',
      'Leave Cup 1 uncovered as your test control; wrap Cup 2 in cloth/towels and Cup 3 in aluminum foil.',
      'Wait 15 minutes, uncover them, and compare which ice cube stayed biggest!',
    ],
    reflectionPromptsAr: [
      'أي غلاف حافظ على مكعب الثلج لفترة أطول؟',
      'لو كررتَ التجربة غداً، كيف ستدمج مادتين معاً لعزل أقوى؟',
    ],
    reflectionPromptsEn: [
      'Which wrap kept the ice cube largest after 15 minutes?',
      'How would you combine two materials tomorrow for even better insulation?',
    ],
    badgeTitleAr: 'مبتكر العزل الحراري',
    badgeTitleEn: 'Thermal Design Thinker',
    skillAr: 'التجريب العلمي باستخدام مجموعة ضابطة (Control Test).',
    skillEn: 'Scientific testing with a control sample.',
  },
  {
    id: 'off-9-11-2',
    ageGroup: '9-11',
    titleAr: 'منظم مكتب بـ «صفر شريط لاصق»',
    titleEn: 'Zero-Glue Desk Organizer',
    toolsAr: ['3 علب كرتونية صغيرة نظيفة (مثل علب مناديل أو معجون)', 'مشابك غسيل (خشب أو بلاستيك)', 'أربطة مطاطية (أستيك)'],
    toolsEn: ['3 clean small cardboard boxes', 'Clothespins (wood or plastic)', 'Rubber bands'],
    safetyRuleAr: 'أمان 100%: لا نستخدم مقصاً أو أدوات حادة — التجميع كله بالمشابك والأربطة المطاطية فقط.',
    safetyRuleEn: '100% Safe: No scissors or blades—connect boxes strictly with clothespins & rubber bands.',
    stepsAr: [
      'ثبّت العلب الثلاث معاً في تشكيل متماسك باستخدام المشابك والأربطة لتصبح منظماً للأقلام والمساطر.',
      'اختبر التصميم: ضع فيه 5 أقلام واسحب قلماً بيد واحدة. هل ثبت أم مال؟',
      'طوّر قاعدة التثبيت إذا مال أثناء السحب.',
    ],
    stepsEn: [
      'Lock 3 boxes together using only rubber bands and clothespins to build a desk organizer.',
      'Load it with 5 pens and pull one pen out with one hand—does it stay upright?',
      'Adjust the clips or base layout if it tips!',
    ],
    reflectionPromptsAr: [
      'لماذا اخترتَ ترتيب العلب بهذا الشكل بالذات؟',
      'كيف جعلتَ القاعدة أثبت دون استخدام صمغ؟',
    ],
    reflectionPromptsEn: [
      'Why did you choose that specific arrangement of boxes?',
      'How did you improve balance without glue or tape?',
    ],
    badgeTitleAr: 'مصمم الأدوات الذكي',
    badgeTitleEn: 'Clever Product Builder',
    skillAr: 'التفكير الهندسي وإعادة الاستخدام المبتكر.',
    skillEn: 'Mechanical joining & functional prototyping.',
  },

  // Ages 12-14
  {
    id: 'off-12-14-1',
    ageGroup: '12-14',
    titleAr: 'النموذج الأوّلي (Prototype) لحامل موبايل هندسي',
    titleEn: 'Cardboard Triangle Phone Stand Prototype',
    toolsAr: ['قطعة كرتون متوسطة أو علبة حبوب إفطار فارغة', 'مشابك ورق أو غسيل + أربطة مطاطية', 'ورقة وقلم للتخطيط'],
    toolsEn: ['Medium cardboard piece or empty cereal box', 'Paperclips / clothespins + rubber bands', 'Paper & pencil for sketching'],
    safetyRuleAr: 'أمان 100%: بالطيّ والتشبيك فقط دون أدوات حادة، وجرّب الهاتف وهو غير متصل بأي شاحن أو كهرباء.',
    safetyRuleEn: '100% Safe: Fold & clip only—no sharp blades, and test with an unplugged phone.',
    stepsAr: [
      'ارسم على الورق مخططاً سريعاً يحل مشكلتين: ألا ينزلق الهاتف للأمام، وألا ينقلب الحامل للخلف.',
      'اطوِ الكرتون على شكل دعامة مثلثة وثبّتها بالمشابك والأربطة.',
      'جرّب وضع الهاتف واضغط برفق على الشاشة لتتأكد من ثبات الزاوية.',
    ],
    stepsEn: [
      'Sketch a quick design solving 2 constraints: prevent forward slipping & prevent backward tipping.',
      'Fold the cardboard into a triangular support and lock joints with clips or bands.',
      'Test the stand with your unplugged phone and gently tap the screen to test stability.',
    ],
    reflectionPromptsAr: [
      'ما أول نقطة ضعف ظهرت في النسخة الأولى وكيف عالجتها؟',
      'اكتب جملة تسويقية واحدة تقنع زميلك بتجربة تصميمك!',
    ],
    reflectionPromptsEn: [
      'What weakness appeared in Version 1 and how did Version 2 fix it?',
      'Write one pitch sentence explaining why someone would use your stand!',
    ],
    badgeTitleAr: 'مهندس النماذج الأولية',
    badgeTitleEn: 'Prototype Architect',
    skillAr: 'التصميم الهندسي المتكرر (Iterate v1 → v2).',
    skillEn: 'Iterative prototyping & stability engineering.',
  },
  {
    id: 'off-12-14-2',
    ageGroup: '12-14',
    titleAr: 'تحويل «غرض مُهمل» إلى منتج يحل مشكلة منزلية',
    titleEn: 'Upcycled Mini-Startup Challenge',
    toolsAr: ['خامة نظيفة كانت ستُرمى (علبة حذاء / برطمان بلاستيك فارغ / ورق مسودات)', 'أربطة مطاطية أو مشابك', 'ورقة لتصميم اسم المنتج'],
    toolsEn: ['1 clean recyclable item (shoebox, plastic jar, or scrap paper)', 'Rubber bands or clips', '1 sheet for brand name & notes'],
    safetyRuleAr: 'أمان 100%: خامات نظيفة غير زجاجية وغير حادة وبعيداً تماماً عن أي أسلاك أو أجهزة كهربائية.',
    safetyRuleEn: '100% Safe: Clean, non-glass, non-sharp household items far from wires or electronics.',
    stepsAr: [
      'تجوّل 5 دقائق في البيت وابحث عن مشكلة صغيرة متكررة (ضياع المفاتيح، تشابك ربطات الشعر، أو بعثرة الفواتير).',
      'ابتكر من الخامة المجانية أداة عملية تحل المشكلة، واختر لها اسماً تجارياً مميزاً.',
      'اعرضها على أحد أفراد عائلتك كـ «أول عميل» واسمع ملاحظته الصريحة لتطويرها.',
    ],
    stepsEn: [
      'Observe home routines for 5 minutes to spot a tiny recurring pain point (lost keys, messy receipts, etc.).',
      'Build a practical organizer/tool from your free item and give it a catchy product name.',
      'Show it to a family member as your "First Customer" and collect 1 honest improvement tip.',
    ],
    reflectionPromptsAr: [
      'ما اسم منتجك وما المشكلة التي حلّها؟',
      'ما أهم ملاحظة قالها «العميل الأول» لتطوير التصميم؟',
    ],
    reflectionPromptsEn: [
      'What is your product name and which problem did it solve?',
      'What feedback did your "First Customer" give to make it better?',
    ],
    badgeTitleAr: 'رائد الأعمال المبتكر',
    badgeTitleEn: 'Eco-Startup Founder',
    skillAr: 'تحويل المشكلات اليومية إلى حلول ذات قيمة حقيقية.',
    skillEn: 'Customer discovery & sustainable innovation.',
  },
];
