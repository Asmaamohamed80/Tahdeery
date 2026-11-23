// Comprehensive Multi-Age Interactive English Mini-Games Catalog
// Age Groups: '5-7' (Little Explorers), '8-10' (Junior Heroes), '11-14' (Pro Teens)

export type EnglishAgeGroup = '5-7' | '8-10' | '11-14';

export interface EnglishAgeMeta {
  id: EnglishAgeGroup;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
}

export const ENGLISH_AGE_GROUPS: EnglishAgeMeta[] = [
  {
    id: '5-7',
    labelAr: '5 – 7 سنوات (براعم التأسيس)',
    labelEn: 'Ages 5–7 (Little Explorers)',
    descAr: 'كلمات يومية سهلة · جمل قصيرة من 4–6 كلمات · حساب بسيط في المتجر',
    descEn: 'Foundational words · short 4–6 word sentences · simple shop math',
  },
  {
    id: '8-10',
    labelAr: '8 – 10 سنوات (أبطال الابتدائي)',
    labelEn: 'Ages 8–10 (Junior Heroes)',
    descAr: 'قصص متكاملة · ألغاز علوم ومهن · جمل من 6–9 كلمات · طلبات متنوعة',
    descEn: 'Multi-part stories · science & job riddles · 6–9 word sentences · cafe combos',
  },
  {
    id: '11-14',
    labelAr: '11 – 14 سنة (متفوقو الإعدادي)',
    labelEn: 'Ages 11–14 (Pro Teens)',
    descAr: 'فصول قصصية متقدمة · تعبيرات ومفردات قوية · قواعد متقدمة · خدمة عملاء احترافية',
    descEn: 'Rich chapter stories · idioms & academic vocab · complex grammar · pro service',
  },
];

// =========================================================================
// GAME 1: STORY BUILDER (9 Adventures — 3 per Age Group × 5 Slots each)
// =========================================================================

export interface StoryOption {
  en: string;
  ar: string;
}

export interface StoryBlankSlot {
  id: string;
  labelEn: string;
  labelAr: string;
  options: StoryOption[];
}

export interface StoryTemplate {
  id: string;
  ageGroup: EnglishAgeGroup;
  titleEn: string;
  titleAr: string;
  slots: StoryBlankSlot[];
  buildEn: (picked: Record<string, StoryOption>) => string;
  buildAr: (picked: Record<string, StoryOption>) => string;
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  // --- AGES 5-7 (3 rich stories) ---
  {
    id: 'story-57-1',
    ageGroup: '5-7',
    titleEn: 'Sunny Zoo Picnic',
    titleAr: 'نزهة حديقة الحيوان المشمسة',
    slots: [
      {
        id: 'hero',
        labelEn: '1. Hero',
        labelAr: '١. البطل',
        options: [
          { en: 'Little Adam', ar: 'آدم الصغير' },
          { en: 'Happy Lily', ar: 'ليلى السعيدة' },
          { en: 'Kind Omar', ar: 'عمر اللطيف' },
        ],
      },
      {
        id: 'animal',
        labelEn: '2. Friendly Animal',
        labelAr: '٢. الحيوان اللطيف',
        options: [
          { en: 'a baby giraffe', ar: 'زرافة صغيرة' },
          { en: 'a funny yellow duck', ar: 'بطة صفراء مرحة' },
          { en: 'a fluffy white rabbit', ar: 'أرنب أبيض ناعم' },
        ],
      },
      {
        id: 'place',
        labelEn: '3. Favorite Spot',
        labelAr: '٣. المكان المفضل',
        options: [
          { en: 'under the tall green tree', ar: 'تحت الشجرة الخضراء العالية' },
          { en: 'beside the blue lake', ar: 'بجانب البحيرة الزرقاء' },
          { en: 'near the flower garden', ar: 'بالقرب من حديقة الزهور' },
        ],
      },
      {
        id: 'food',
        labelEn: '4. Picnic Snack',
        labelAr: '٤. وجبة النزهة',
        options: [
          { en: 'sweet red apples and milk', ar: 'تفاحاً أحمر حلواً وحليباً' },
          { en: 'warm honey sandwiches', ar: 'ساندويتشات بالعسل الدافئ' },
          { en: 'fresh bananas and cake', ar: 'موزاً طازجاً وكعكاً' },
        ],
      },
      {
        id: 'ending',
        labelEn: '5. Happy Moment',
        labelAr: '٥. اللحظة السعيدة',
        options: [
          { en: 'sang a cheerful ABC song together', ar: 'غنّيا معاً أغنية الحروف المبهجة' },
          { en: 'played hide and seek until sunset', ar: 'لعبا الغميضة حتى الغروب' },
          { en: 'took a big smiling photo together', ar: 'التقطا صورة جميلة بابتسامة كبيرة' },
        ],
      },
    ],
    buildEn: (p) =>
      `Today is a sunny day! ${p.hero.en} went to the zoo and met ${p.animal.en}. They sat ${p.place.en} and shared ${p.food.en}. Before going home, they smiled and ${p.ending.en}!`,
    buildAr: (p) =>
      `اليوم يوم مشمس جميل! ذهب ${p.hero.ar} إلى حديقة الحيوان وقابل ${p.animal.ar}. جلسا ${p.place.ar} وتشاركا ${p.food.ar}. وقبل العودة للمنزل، ابتسما و${p.ending.ar}!`,
  },
  {
    id: 'story-57-2',
    ageGroup: '5-7',
    titleEn: 'My Colorful Toy Train',
    titleAr: 'قطار ألعابي الملون',
    slots: [
      {
        id: 'hero',
        labelEn: '1. Driver',
        labelAr: '١. قائد القطار',
        options: [
          { en: 'Captain Karim', ar: 'الكابتن كريم' },
          { en: 'Princess Jana', ar: 'الأميرة جنى' },
          { en: 'Buddy Teddy', ar: 'الدبدوب تيدي' },
        ],
      },
      {
        id: 'color',
        labelEn: '2. Train Color',
        labelAr: '٢. لون القطار',
        options: [
          { en: 'shiny red and blue', ar: 'أحمر وأزرق لامع' },
          { en: 'bright orange and gold', ar: 'برتقالي وذهبي مشرق' },
          { en: 'purple and green', ar: 'بنفسجي وأخضر' },
        ],
      },
      {
        id: 'passenger',
        labelEn: '3. First Passenger',
        labelAr: '٣. الراكب الأول',
        options: [
          { en: 'a sleepy little kitten', ar: 'قطة صغيرة نعسانة' },
          { en: 'three tiny toy robots', ar: 'ثلاثة روبوتات صغيرة' },
          { en: 'a happy brown puppy', ar: 'جرو بني سعيد' },
        ],
      },
      {
        id: 'sound',
        labelEn: '4. Train Sound',
        labelAr: '٤. صوت القطار',
        options: [
          { en: '"Choo-Choo! All aboard!"', ar: '«تشو تشو! هيا نصعد جميعاً!»' },
          { en: '"Beep-Beep! Fast and safe!"', ar: '«بيب بيب! سريع وآمن!»' },
          { en: '"Ring-Ring! Next stop fun!"', ar: '«ترن ترن! المحطة القادمة مرح!»' },
        ],
      },
      {
        id: 'ending',
        labelEn: '5. Final Stop',
        labelAr: '٥. المحطة الأخيرة',
        options: [
          { en: 'Candy Town full of balloons', ar: 'مدينة الحلوى المليئة بالبالونات' },
          { en: 'the Rainbow Playground', ar: 'ملعب قوس قزح' },
          { en: 'Grandma’s cozy garden', ar: 'حديقة جدتي الدافئة' },
        ],
      },
    ],
    buildEn: (p) =>
      `${p.hero.en} built a ${p.color.en} toy train in the bedroom. First, ${p.passenger.en} hopped inside! The train blew its whistle, ${p.sound.en}, and zoomed straight to ${p.ending.en}. What a wonderful ride!`,
    buildAr: (p) =>
      `ركّب ${p.hero.ar} قطار ألعاب ${p.color.ar} في غرفته. في البداية صعد ${p.passenger.ar} إلى القطار! أطلق القطار صافرته قائلاً ${p.sound.ar}، وانطلق بسرعة إلى ${p.ending.ar}. يا لها من رحلة رائعة!`,
  },
  {
    id: 'story-57-3',
    ageGroup: '5-7',
    titleEn: 'The Magic Rainy Day',
    titleAr: 'يوم المطر السحري',
    slots: [
      {
        id: 'hero',
        labelEn: '1. Hero',
        labelAr: '١. البطل',
        options: [
          { en: 'Brave Zaid', ar: 'زيد الشجاع' },
          { en: 'Sweet Nour', ar: 'نور الجميلة' },
          { en: 'Cute Salma', ar: 'سلمى اللطيفة' },
        ],
      },
      {
        id: 'gear',
        labelEn: '2. Rainy Gear',
        labelAr: '٢. ملابس المطر',
        options: [
          { en: 'yellow rain boots and umbrella', ar: 'حذاء مطر أصفر وشمسية' },
          { en: 'a blue raincoat with stars', ar: 'معطف مطر أزرق بنجوم' },
          { en: 'bright green boots and hat', ar: 'حذاء أخضر وقبعة مطر' },
        ],
      },
      {
        id: 'friend',
        labelEn: '3. New Friend',
        labelAr: '٣. الصديق الجديد',
        options: [
          { en: 'a tiny green frog', ar: 'ضفدع أخضر صغير' },
          { en: 'a colorful butterfly', ar: 'فراشة ملونة' },
          { en: 'a small paper boat', ar: 'قارب ورقي صغير' },
        ],
      },
      {
        id: 'sky',
        labelEn: '4. Sky Surprise',
        labelAr: '٤. مفاجأة السماء',
        options: [
          { en: 'a giant seven-color rainbow', ar: 'قوس قزح عملاق بسبعة ألوان' },
          { en: 'a smiling golden sun', ar: 'شمس ذهبية مبتسمة' },
          { en: 'soft fluffy white clouds', ar: 'سحب بيضاء ناعمة كالقطن' },
        ],
      },
      {
        id: 'ending',
        labelEn: '5. Warm Treat',
        labelAr: '٥. المكافأة الدافئة',
        options: [
          { en: 'drank warm hot chocolate with Mom', ar: 'شرب الكاكاو الساخن مع ماما' },
          { en: 'read a bedtime picture book', ar: 'قرأ قصة مصورة قبل النوم' },
          { en: 'painted seven rainbow stars', ar: 'رسم سبع نجوم بألوان الطيف' },
        ],
      },
    ],
    buildEn: (p) =>
      `Splash, splash! When the rain started falling, ${p.hero.en} put on ${p.gear.en} and stepped outside. Near a puddle, they waved to ${p.friend.en}. Soon, the clouds opened to show ${p.sky.en}! Back inside, ${p.hero.en} happily ${p.ending.en}.`,
    buildAr: (p) =>
      `طرطشة الماء! عندما بدأ المطر يهطل، ارتدى ${p.hero.ar} ${p.gear.ar} وخرج للحديقة. وبجانب بركة الماء لوّح لـ ${p.friend.ar}. وسرعان ما ظهرت في السماء ${p.sky.ar}! وبعد العودة للداخل، ${p.ending.ar} بسعادة!`,
  },

  // --- AGES 8-10 (3 rich stories) ---
  {
    id: 'story-810-1',
    ageGroup: '8-10',
    titleEn: 'Mission to Star Planet',
    titleAr: 'رحلة إلى كوكب النجوم',
    slots: [
      {
        id: 'hero',
        labelEn: '1. Astronaut',
        labelAr: '١. رائد الفضاء',
        options: [
          { en: 'Captain Adam', ar: 'الكابتن آدم' },
          { en: 'Commander Salma', ar: 'القائدة سلمى' },
          { en: 'Super Robot Max', ar: 'الروبوت الخارق ماكس' },
        ],
      },
      {
        id: 'companion',
        labelEn: '2. Co-Pilot',
        labelAr: '٢. المرافق',
        options: [
          { en: 'a tiny blue dragon', ar: 'تنين أزرق صغير' },
          { en: 'a clever talking owl', ar: 'بومة ذكية متكلمة' },
          { en: 'a bouncy moon puppy', ar: 'جرو فضائي مرح' },
        ],
      },
      {
        id: 'tool',
        labelEn: '3. Space Gadget',
        labelAr: '٣. الأداة الفضائية',
        options: [
          { en: 'a golden laser telescope', ar: 'تلسكوب ليزر ذهبي' },
          { en: 'a solar flying backpack', ar: 'حقيبة طيران شمسية' },
          { en: 'a glowing star compass', ar: 'بوصلة نجوم مضيئة' },
        ],
      },
      {
        id: 'challenge',
        labelEn: '4. Space Puzzle',
        labelAr: '٤. العقبة في الطريق',
        options: [
          { en: 'crossed a bridge made of floating crystals', ar: 'عبرا جسراً من الكريستال الطائر' },
          { en: 'decoded a secret alien message', ar: 'فكّا شفرة رسالة فضائية سرية' },
          { en: 'steered safely past spinning asteroids', ar: 'تجاوزا بأمان كويكبات دوّارة' },
        ],
      },
      {
        id: 'discovery',
        labelEn: '5. Big Discovery',
        labelAr: '٥. الاكتشاف المذهل',
        options: [
          { en: 'a grand library full of floating English books', ar: 'مكتبة ضخمة مليئة بكتب الإنجليزي الطائرة' },
          { en: 'a singing crystal waterfall', ar: 'شلال كريستال يغني ألحاناً جميلة' },
          { en: 'a hidden garden of rainbow planets', ar: 'حديقة سرية لكواكب ملونة' },
        ],
      },
    ],
    buildEn: (p) =>
      `One bright morning, ${p.hero.en} launched a silver rocket into deep space with ${p.companion.en}. By using ${p.tool.en}, they bravely ${p.challenge.en}. On the far side of the galaxy, they unlocked a shiny dome and discovered ${p.discovery.en}! Everyone back on Earth cheered for their amazing teamwork.`,
    buildAr: (p) =>
      `في صباح مشرق، أطلق ${p.hero.ar} صاروخاً فضياً نحو الفضاء الواسع برفقة ${p.companion.ar}. وباستخدام ${p.tool.ar}، استطاعا بشجاعة أن ${p.challenge.ar}. وفي نهاية المجرة، فتحا قبة لامعة واكتشفا ${p.discovery.ar}! وصفّق لهما الجميع على الأرض لتعاونهما الرائع.`,
  },
  {
    id: 'story-810-2',
    ageGroup: '8-10',
    titleEn: 'The Secret Jungle Treasure',
    titleAr: 'كنز الغابة السري',
    slots: [
      {
        id: 'hero',
        labelEn: '1. Explorer',
        labelAr: '١. المستكشف',
        options: [
          { en: 'Brave Youssef', ar: 'يوسف الشجاع' },
          { en: 'Smart Mariam', ar: 'مريم الذكية' },
          { en: 'Scout Omar', ar: 'الكشاف عمر' },
        ],
      },
      {
        id: 'companion',
        labelEn: '2. Jungle Guide',
        labelAr: '٢. مرشد الغابة',
        options: [
          { en: 'a friendly rainbow parrot', ar: 'ببغاء ملون ودود' },
          { en: 'a playful clever monkey', ar: 'قرد ذكي ومرح' },
          { en: 'a gentle forest deer', ar: 'غزالة غابة لطيفة' },
        ],
      },
      {
        id: 'tool',
        labelEn: '3. Clue Found',
        labelAr: '٣. الدليل الأول',
        options: [
          { en: 'an ancient carved leaf map', ar: 'خريطة قديمة منقوشة على ورق الشجر' },
          { en: 'a silver explorer whistle', ar: 'صافرة استكشاف فضية' },
          { en: 'a glowing wooden lantern', ar: 'فانوس خشبي مضيء' },
        ],
      },
      {
        id: 'action',
        labelEn: '4. Brave Step',
        labelAr: '٤. الخطوة الشجاعة',
        options: [
          { en: 'climbed up the giant banyan treehouse', ar: 'تسلقا بيت الشجرة العملاق' },
          { en: 'paddled carefully across the misty river', ar: 'جدّفا بحذر عبر النهر الضبابي' },
          { en: 'solved three animal riddles at the stone gate', ar: 'حلا ثلاثة ألغاز عند البوابة الحجرية' },
        ],
      },
      {
        id: 'discovery',
        labelEn: '5. Treasure Inside',
        labelAr: '٥. الكنز بالداخل',
        options: [
          { en: 'a golden chest of illustrated adventure stories', ar: 'صندوقاً ذهبياً من قصص المغامرات المصورة' },
          { en: 'an emerald compass that points to new friendships', ar: 'بوصلة زمردية تشير إلى أصدقاء جدد' },
          { en: 'magic seeds that grow bright glowing flowers', ar: 'بذوراً سحرية تنبت أزهاراً مضيئة' },
        ],
      },
    ],
    buildEn: (p) =>
      `${p.hero.en} hiked through the lush green forest beside ${p.companion.en}. When they noticed ${p.tool.en} hiding in the tall grass, they immediately knew an adventure had begun! Together they ${p.action.en} until they reached a sparkling waterfall and uncovered ${p.discovery.en}!`,
    buildAr: (p) =>
      `سار ${p.hero.ar} عبر الغابة الخضراء المورقة بجانب ${p.companion.ar}. وعندما لمحا ${p.tool.ar} بين الأعشاب الطويلة، أدركا فوراً أن المغامرة بدأت! ومعاً ${p.action.ar} حتى وصلا لشلال متلألئ وكشفا عن ${p.discovery.ar}!`,
  },
  {
    id: 'story-810-3',
    ageGroup: '8-10',
    titleEn: 'The Magic Classroom Surprise',
    titleAr: 'مفاجأة الفصل السحري',
    slots: [
      {
        id: 'hero',
        labelEn: '1. Student',
        labelAr: '١. الطالب',
        options: [
          { en: 'Clever Jana', ar: 'جنى المتميزة' },
          { en: 'Curious Kareem', ar: 'كريم الفضولي' },
          { en: 'Kind Farida', ar: 'فريدة اللطيفة' },
        ],
      },
      {
        id: 'companion',
        labelEn: '2. Class Helper',
        labelAr: '٢. المساعد السحري',
        options: [
          { en: 'a flying English dictionary', ar: 'قاموس إنجليزي طائر' },
          { en: 'a cheerful talking globe', ar: 'كرة أرضية متكلمة ومرحة' },
          { en: 'a glowing rainbow chalkboard', ar: 'سبورة مضيئة بألوان الطيف' },
        ],
      },
      {
        id: 'word',
        labelEn: '3. Magic Motto',
        labelAr: '٣. الشعار السحري',
        options: [
          { en: '"Practice Makes Progress!"', ar: '«الممارسة تصنع التقدم!»' },
          { en: '"Speak Boldly & Kindly!"', ar: '«تحدّث بجرأة ولطف!»' },
          { en: '"Curiosity Unlocks Worlds!"', ar: '«الفضول يفتح العوالم!»' },
        ],
      },
      {
        id: 'project',
        labelEn: '4. Team Activity',
        labelAr: '٤. النشاط الجماعي',
        options: [
          { en: 'acted out a funny travel play in English', ar: 'مثّل مسرحية سفر مضحكة بالإنجليزية' },
          { en: 'designed an illustrated vocabulary wall', ar: 'صمم لوحة مفردات مصورة للفصل' },
          { en: 'hosted a live quiz show for classmates', ar: 'قدّم مسابقة أسئلة حية لزملائه' },
        ],
      },
      {
        id: 'discovery',
        labelEn: '5. Proud Reward',
        labelAr: '٥. التكريم المستحق',
        options: [
          { en: 'earned the Golden Speaker Medal from the teacher', ar: 'نال ميدالية المتحدث الذهبي من المعلم' },
          { en: 'inspired shy students to raise their hands', ar: 'شجع الطلاب الخجولين على المشاركة' },
          { en: 'received a standing ovation from the whole class', ar: 'حصل على تصفيق حار من الفصل كله' },
        ],
      },
    ],
    buildEn: (p) =>
      `During English hour, ${p.hero.en} teamed up with ${p.companion.en} to prepare something unforgettable. First, the whole room chanted ${p.word.en} together. Then ${p.hero.en} confidently ${p.project.en} and proudly ${p.discovery.en}!`,
    buildAr: (p) =>
      `خلال حصة اللغة الإنجليزية، تعاون ${p.hero.ar} مع ${p.companion.ar} لتحضير مفاجأة لا تُنسى. أولاً، ردد الجميع شعار ${p.word.ar}. ثم ${p.project.ar} بكل ثقة و${p.discovery.ar} بكل فخر!`,
  },

  // --- AGES 11-14 (3 rich chapter stories) ---
  {
    id: 'story-1114-1',
    ageGroup: '11-14',
    titleEn: 'Mystery of the Timekeeper’s Clock',
    titleAr: 'لغز ساعة حارس الزمن',
    slots: [
      {
        id: 'hero',
        labelEn: '1. Protagonist',
        labelAr: '١. البطل الرئيسي',
        options: [
          { en: 'Investigative Nadia', ar: 'نادية المحققة الذكية' },
          { en: 'Tech-Whiz Tariq', ar: 'طارق عبقري التقنية' },
          { en: 'Historian Layla', ar: 'ليلى عاشقة التاريخ' },
        ],
      },
      {
        id: 'setting',
        labelEn: '2. Atmospheric Setting',
        labelAr: '٢. موقع الأحداث',
        options: [
          { en: 'the old clocktower overlooking Cairo', ar: 'برج الساعة القديم المطل على القاهرة' },
          { en: 'a forgotten coastal lighthouse at dusk', ar: 'منارة ساحلية منسية عند الغسق' },
          { en: 'the basement archives of the City Museum', ar: 'أرشيف الطابق السفلي لمتحف المدينة' },
        ],
      },
      {
        id: 'clue',
        labelEn: '3. Cryptic Clue',
        labelAr: '٣. الدليل الغامض',
        options: [
          { en: 'an engraved brass gear marked "Never Waste Yesterday"', ar: 'ترس نحاسي منقوش عليه عبارة غامضة' },
          { en: 'a handwritten journal written in mirror ink', ar: 'مفكرة مكتوبة بخط اليد بحبر معكوس' },
          { en: 'three synchronized pocket watches stopping at 11:11', ar: 'ثلاث ساعات جيب توقفت عند ١١:١١' },
        ],
      },
      {
        id: 'twist',
        labelEn: '4. Plot Twist',
        labelAr: '٤. نقطة التحول',
        options: [
          { en: 'aligned the sunlight beam with a prism lens', ar: 'وجّه شعاع الشمس عبر عدسة منشورية' },
          { en: 'translated the Latin proverb etched on the dial', ar: 'ترجم الحكمة القديمة المنقوشة على القرص' },
          { en: 'realized the secret message was an acrostic poem', ar: 'اكتشف أن الرسالة السرية كانت قصيدة مشفرة' },
        ],
      },
      {
        id: 'resolution',
        labelEn: '5. Chapter Finale',
        labelAr: '٥. خاتمة الفصل',
        options: [
          { en: 'restored the heritage clock just as the festival began', ar: 'أعاد تشغيل الساعة الأثرية لحظة انطلاق المهرجان' },
          { en: 'preserved a lost collection of scientist letters for students', ar: 'أنقذ مجموعة نادرة من رسائل العلماء للطلاب' },
          { en: 'proved that patience and curiosity always unlock the truth', ar: 'أثبت أن الصبر والفضول يكشفان الحقيقة دائماً' },
        ],
      },
    ],
    buildEn: (p) =>
      `As evening shadows stretched across ${p.setting.en}, ${p.hero.en} refused to give up on the neighborhood mystery. Holding ${p.clue.en}, every detail seemed disconnected until a sudden spark of insight changed everything! After carefully thinking under pressure, ${p.hero.en} ${p.twist.en}. Seconds later, golden gears clicked smoothly into place and ${p.resolution.en}.`,
    buildAr: (p) =>
      `بينما امتدت ظلال المساء فوق ${p.setting.ar}، رفض ${p.hero.ar} الاستسلام أمام لغز الحي القديم. وبإمساكه بـ ${p.clue.ar}، بدت التفاصيل متفرقة حتى غيّرت لحظة إلهام مفاجئة كل شيء! وبعد تفكير عميق تحت الضغط، ${p.twist.ar}. وبعد ثوانٍ، التقطت التروس الذهبية مسارها بانسيابية و${p.resolution.ar}.`,
  },
  {
    id: 'story-1114-2',
    ageGroup: '11-14',
    titleEn: 'The Eco-Inventors Challenge',
    titleAr: 'تحدي المخترعين لحماية البيئة',
    slots: [
      {
        id: 'hero',
        labelEn: '1. Team Captain',
        labelAr: '١. قائد الفريق',
        options: [
          { en: 'Environmentalist Huda', ar: 'هدى صديقة البيئة' },
          { en: 'Engineer Ziad', ar: 'المهندس زياد' },
          { en: 'Innovator Malak', ar: 'المبتكرة ملك' },
        ],
      },
      {
        id: 'invention',
        labelEn: '2. Smart Prototype',
        labelAr: '٢. الاختراع الذكي',
        options: [
          { en: 'a solar-powered plastic sorting robot', ar: 'روبوت فرز بلاستيك يعمل بالطاقة الشمسية' },
          { en: 'a smart mist system that cuts water waste by 60%', ar: 'نظام ري ضبابي يوفر ٦٠٪ من المياه' },
          { en: 'biodegradable notebooks made from fallen palm leaves', ar: 'دفاتر صديقة للبيئة من سعف النخيل' },
        ],
      },
      {
        id: 'obstacle',
        labelEn: '3. Competition Setback',
        labelAr: '٣. التحدي المفاجئ',
        options: [
          { en: 'their main battery sensor overheated five minutes before judging', ar: 'توقف حساس البطارية الرئيسي قبل التحكيم بخمس دقائق' },
          { en: 'a gust of wind scattered their presentation diagrams', ar: 'بعثرت رياح قوية مخططات العرض التقديمي' },
          { en: 'the projector failed right before their English pitch', ar: 'تعطل جهاز العرض قبل تقديم الكلمة بالإنجليزية مباشرة' },
        ],
      },
      {
        id: 'comeback',
        labelEn: '4. Smart Comeback',
        labelAr: '٤. الحل العبقري',
        options: [
          { en: 'rewired a backup solar panel and delivered the speech from memory', ar: 'وصل لوحاً شمسياً احتياطياً وقدّم العرض ارتجالياً بثقة' },
          { en: 'turned the chalkboard into a live demonstration diagram', ar: 'حوّل السبورة إلى رسم تفاعلي حي أمام لجنة التحكيم' },
          { en: 'calmly explained the science behind every component in clear English', ar: 'شرح الفكرة العلمية لكل جزء بإنجليزية واضحة ومتماسكة' },
        ],
      },
      {
        id: 'impact',
        labelEn: '5. Real-World Impact',
        labelAr: '٥. الأثر الواقعي',
        options: [
          { en: 'won First Place and earned funding to pilot it in local schools', ar: 'فاز بالمركز الأول وحصل على تمويل لتطبيقه بالمدارس' },
          { en: 'inspired forty teenagers to start a Green Innovation Club', ar: 'ألهم أربعين طالباً لتأسيس نادي الابتكار الأخضر' },
          { en: 'received an honorary Young Sustainability Ambassador award', ar: 'حصل على لقب سفير الاستدامة الصغير' },
        ],
      },
    ],
    buildEn: (p) =>
      `For months, ${p.hero.en} and two classmates spent every weekend building ${p.invention.en} for the National Youth Fair. Just when everything looked ready, ${p.obstacle.en}! Instead of panicking, the team took a deep breath: ${p.hero.en} ${p.comeback.en}. The judges were deeply impressed by their resilience—and by sunset, they ${p.impact.en}.`,
    buildAr: (p) =>
      `لعدة أشهر، قضى ${p.hero.ar} وزملاؤه عطلاتهم في بناء ${p.invention.ar} لمعرض الشباب الوطني. وعندما بدا كل شيء جاهزاً، حدث غير المتوقع: ${p.obstacle.ar}! وبدلاً من التوتر، أخذ الفريق نفساً عميقاً، و${p.comeback.ar}. انبهر الحكام بصلابتهم، ومع غروب الشمس ${p.impact.ar}.`,
  },
  {
    id: 'story-1114-3',
    ageGroup: '11-14',
    titleEn: 'Voices Across Continents',
    titleAr: 'أصوات عابرة للقارات',
    slots: [
      {
        id: 'hero',
        labelEn: '1. Young Speaker',
        labelAr: '١. المتحدث الشاب',
        options: [
          { en: 'Debate Champion Salma', ar: 'سلمى بطلة المناظرات' },
          { en: 'Storyteller Seif', ar: 'سيف راوي القصص' },
          { en: 'Journalist Habiba', ar: 'حبيبة الصحفية الشابة' },
        ],
      },
      {
        id: 'event',
        labelEn: '2. Global Event',
        labelAr: '٢. الحدث العالمي',
        options: [
          { en: 'the International Student Podcast Summit', ar: 'قمة البودكاست الدولية للطلاب' },
          { en: 'a live virtual cultural exchange with Tokyo and London', ar: 'تبادل ثقافي مباشر مع طوكيو ولندن' },
          { en: 'the Mediterranean Youth Storytelling Forum', ar: 'منتدى شباب المتوسط لكتابة القصة' },
        ],
      },
      {
        id: 'theme',
        labelEn: '3. Speech Topic',
        labelAr: '٣. موضوع الكلمة',
        options: [
          { en: 'how ancient libraries shaped modern science', ar: 'كيف شكّلت المكتبات القديمة العلوم الحديثة' },
          { en: 'why learning a second language builds empathy across cultures', ar: 'لماذا يبني تعلم لغة ثانية جسور التفاهم بين الثقافات' },
          { en: 'creative ways teenagers can protect local heritage sites', ar: 'طرق مبتكرة لحماية الشباب للآثار المحلية' },
        ],
      },
      {
        id: 'technique',
        labelEn: '4. Speaking Style',
        labelAr: '٤. أسلوب الإلقاء',
        options: [
          { en: 'opened with a vivid proverb and spoke with steady eye contact', ar: 'بدأ بحكمة معبّرة وتحدّث بتواصل بصري واثق' },
          { en: 'wove humor and real interviews into a crisp three-minute talk', ar: 'مزج الفكاهة بالمقابلات الواقعية في عرض مركز' },
          { en: 'used rich descriptive vocabulary that painted pictures in listeners’ minds', ar: 'استخدم مفردات وصفية غنية رسمت صوراً في أذهان المستمعين' },
        ],
      },
      {
        id: 'outcome',
        labelEn: '5. Lasting Result',
        labelAr: '٥. النتيجة المُلهمة',
        options: [
          { en: 'built lifelong international friendships and launched a school podcast', ar: 'كوّن صداقات دولية دائمة وأطلق إذاعة بودكاست مدرسية' },
          { en: 'was invited to publish the speech in the Global Teen Digest', ar: 'دُعي لنشر خطابه في مجلة الشباب العالمية' },
          { en: 'discovered that fluency is not perfection—it is courage to connect', ar: 'أدرك أن الطلاقة ليست الكمال بل الشجاعة للتواصل' },
        ],
      },
    ],
    buildEn: (p) =>
      `Moments before joining ${p.event.en}, ${p.hero.en} rehearsed one final line in English: "Every voice carries a story worth hearing." Presenting on ${p.theme.en}, our speaker ${p.technique.en}. Listeners from five countries asked thoughtful questions, and ${p.hero.en} ${p.outcome.en}.`,
    buildAr: (p) =>
      `قبل لحظات من الانضمام إلى ${p.event.ar}، تدرّب ${p.hero.ar} على جملة أخيرة بالإنجليزية: «لكل صوت قصة تستحق أن تُسمع». وأثناء حديثه عن ${p.theme.ar}، ${p.technique.ar}. تفاعل المستمعون من خمس دول بأسئلة عميقة، و${p.outcome.ar}.`,
  },
];

// =========================================================================
// GAME 2: WORD & CLUE DETECTIVE (24 Mystery Cases — 8 per Age Group)
// =========================================================================

export interface DetectiveCase {
  id: string;
  ageGroup: EnglishAgeGroup;
  categoryEn: string;
  categoryAr: string;
  cluesEn: [string, string, string];
  extraHintAr: string;
  options: Array<{ word: string; ar: string; phonetic: string }>;
  correctIndex: number;
}

export const DETECTIVE_CASES: DetectiveCase[] = [
  // --- AGES 5-7 (8 Cases) ---
  {
    id: 'det-57-1',
    ageGroup: '5-7',
    categoryEn: 'Animals',
    categoryAr: 'حيوانات لطيفة',
    cluesEn: [
      'Clue 1: I say "Meow" when I am happy.',
      'Clue 2: I love drinking milk and chasing yarn.',
      'Clue 3: I have soft fur and whiskers.',
    ],
    extraHintAr: 'حيوان أليف يقول مياو ويحب اللعب بالخيط.',
    options: [
      { word: 'Cat', ar: 'قطة', phonetic: '/kæt/' },
      { word: 'Fish', ar: 'سمكة', phonetic: '/fɪʃ/' },
      { word: 'Frog', ar: 'ضفدع', phonetic: '/frɒɡ/' },
      { word: 'Bear', ar: 'دب', phonetic: '/beər/' },
    ],
    correctIndex: 0,
  },
  {
    id: 'det-57-2',
    ageGroup: '5-7',
    categoryEn: 'Sweet Fruit',
    categoryAr: 'فواكه لذيذة',
    cluesEn: [
      'Clue 1: I am yellow and shaped like a smile.',
      'Clue 2: Monkeys love peeling and eating me!',
      'Clue 3: You peel off my yellow skin before eating.',
    ],
    extraHintAr: 'فاكهة صفراء يحبها القرد ونقشرها قبل الأكل.',
    options: [
      { word: 'Apple', ar: 'تفاحة', phonetic: '/ˈæp.əl/' },
      { word: 'Banana', ar: 'موزة', phonetic: '/bəˈnɑː.nə/' },
      { word: 'Grape', ar: 'عنب', phonetic: '/ɡreɪp/' },
      { word: 'Lemon', ar: 'ليمون', phonetic: '/ˈlem.ən/' },
    ],
    correctIndex: 1,
  },
  {
    id: 'det-57-3',
    ageGroup: '5-7',
    categoryEn: 'Sky & Weather',
    categoryAr: 'السماء والطقس',
    cluesEn: [
      'Clue 1: I am bright yellow in the daytime sky.',
      'Clue 2: I give warm light to trees and flowers.',
      'Clue 3: I go down behind the hills at night.',
    ],
    extraHintAr: 'تشرق نهاراً وتدفئ الأرض.',
    options: [
      { word: 'Rain', ar: 'مطر', phonetic: '/reɪn/' },
      { word: 'Snow', ar: 'ثلج', phonetic: '/snəʊ/' },
      { word: 'Sun', ar: 'الشمس', phonetic: '/sʌn/' },
      { word: 'Wind', ar: 'رياح', phonetic: '/wɪnd/' },
    ],
    correctIndex: 2,
  },
  {
    id: 'det-57-4',
    ageGroup: '5-7',
    categoryEn: 'My Classroom',
    categoryAr: 'أدوات الفصل',
    cluesEn: [
      'Clue 1: I have many paper pages inside me.',
      'Clue 2: You open me to read fun stories.',
      'Clue 3: Teachers and students carry me to school.',
    ],
    extraHintAr: 'نفتحه لنقرأ القصص والدروس.',
    options: [
      { word: 'Chair', ar: 'كرسي', phonetic: '/tʃeər/' },
      { word: 'Ball', ar: 'كرة', phonetic: '/bɔːl/' },
      { word: 'Shoe', ar: 'حذاء', phonetic: '/ʃuː/' },
      { word: 'Book', ar: 'كتاب', phonetic: '/bʊk/' },
    ],
    correctIndex: 3,
  },
  {
    id: 'det-57-5',
    ageGroup: '5-7',
    categoryEn: 'Toys & Play',
    categoryAr: 'ألعاب الأطفال',
    cluesEn: [
      'Clue 1: I am round and bounce high on the ground.',
      'Clue 2: You kick me with your foot in football.',
      'Clue 3: Kids toss and catch me at the park.',
    ],
    extraHintAr: 'دائرية الشكل ونلعب بها في الملعب والحديقة.',
    options: [
      { word: 'Ball', ar: 'كرة', phonetic: '/bɔːl/' },
      { word: 'Spoon', ar: 'ملعقة', phonetic: '/spuːn/' },
      { word: 'Hat', ar: 'قبعة', phonetic: '/hæt/' },
      { word: 'Door', ar: 'باب', phonetic: '/dɔːr/' },
    ],
    correctIndex: 0,
  },
  {
    id: 'det-57-6',
    ageGroup: '5-7',
    categoryEn: 'Transportation',
    categoryAr: 'المواصلات',
    cluesEn: [
      'Clue 1: I have four wheels and carry kids to school.',
      'Clue 2: I am often bright yellow and big.',
      'Clue 3: A friendly driver opens my door at the stop.',
    ],
    extraHintAr: 'حافلة كبيرة توصل الطلاب للمدرسة.',
    options: [
      { word: 'Boat', ar: 'قارب', phonetic: '/bəʊt/' },
      { word: 'Bus', ar: 'أتوبيس', phonetic: '/bʌs/' },
      { word: 'Kite', ar: 'طائرة ورقية', phonetic: '/kaɪt/' },
      { word: 'Bed', ar: 'سرير', phonetic: '/bed/' },
    ],
    correctIndex: 1,
  },
  {
    id: 'det-57-7',
    ageGroup: '5-7',
    categoryEn: 'Ocean Life',
    categoryAr: 'عالم البحر',
    cluesEn: [
      'Clue 1: I live under the blue water and swim fast.',
      'Clue 2: I have shiny scales and fins, not legs.',
      'Clue 3: Little Nemo in the cartoon is one of me!',
    ],
    extraHintAr: 'تسبح في الماء ولها زعانف.',
    options: [
      { word: 'Lion', ar: 'أسد', phonetic: '/ˈlaɪ.ən/' },
      { word: 'Bird', ar: 'طائر', phonetic: '/bɜːd/' },
      { word: 'Fish', ar: 'سمكة', phonetic: '/fɪʃ/' },
      { word: 'Sheep', ar: 'خروف', phonetic: '/ʃiːp/' },
    ],
    correctIndex: 2,
  },
  {
    id: 'det-57-8',
    ageGroup: '5-7',
    categoryEn: 'Home Rooms',
    categoryAr: 'أشياء في المنزل',
    cluesEn: [
      'Clue 1: I have four legs and a soft mattress.',
      'Clue 2: You lie down on me with your blanket at night.',
      'Clue 3: Sweet dreams happen right here!',
    ],
    extraHintAr: 'ننام عليه ليلاً مع الغطاء والوسادة.',
    options: [
      { word: 'Cup', ar: 'كوب', phonetic: '/kʌp/' },
      { word: 'Tree', ar: 'شجرة', phonetic: '/triː/' },
      { word: 'Pen', ar: 'قلم جاف', phonetic: '/pen/' },
      { word: 'Bed', ar: 'سرير', phonetic: '/bed/' },
    ],
    correctIndex: 3,
  },

  // --- AGES 8-10 (8 Cases) ---
  {
    id: 'det-810-1',
    ageGroup: '8-10',
    categoryEn: 'Animals Mystery',
    categoryAr: 'لغز الحيوانات',
    cluesEn: [
      'Clue 1: I live in hot sandy deserts.',
      'Clue 2: I can travel for days without drinking water.',
      'Clue 3: People call me the "Ship of the Desert".',
    ],
    extraHintAr: 'يعيش في الصحراء ويُلقّب بسفينة الصحراء.',
    options: [
      { word: 'Camel', ar: 'جمل', phonetic: '/ˈkæm.əl/' },
      { word: 'Penguin', ar: 'بطريق', phonetic: '/ˈpeŋ.ɡwɪn/' },
      { word: 'Dolphin', ar: 'دولفين', phonetic: '/ˈdɒl.fɪn/' },
      { word: 'Eagle', ar: 'نسر', phonetic: '/ˈiː.ɡəl/' },
    ],
    correctIndex: 0,
  },
  {
    id: 'det-810-2',
    ageGroup: '8-10',
    categoryEn: 'Everyday Objects',
    categoryAr: 'لغز الأشياء اليومية',
    cluesEn: [
      'Clue 1: You open me only when rain falls from the sky.',
      'Clue 2: I have a curved handle and stay above your head.',
      'Clue 3: I keep your clothes dry in winter!',
    ],
    extraHintAr: 'نفتحها فوق رؤوسنا لتحمينا من المطر.',
    options: [
      { word: 'Pillow', ar: 'وسادة', phonetic: '/ˈpɪl.əʊ/' },
      { word: 'Umbrella', ar: 'مظلة / شمسية', phonetic: '/ʌmˈbrel.ə/' },
      { word: 'Keyboard', ar: 'لوحة مفاتيح', phonetic: '/ˈkiː.bɔːd/' },
      { word: 'Backpack', ar: 'حقيبة ظهر', phonetic: '/ˈbæk.pæk/' },
    ],
    correctIndex: 1,
  },
  {
    id: 'det-810-3',
    ageGroup: '8-10',
    categoryEn: 'Community Jobs',
    categoryAr: 'لغز المهن',
    cluesEn: [
      'Clue 1: I wear a white coat and work in a hospital.',
      'Clue 2: I listen to your heartbeat with a stethoscope.',
      'Clue 3: I help sick children feel healthy again.',
    ],
    extraHintAr: 'يفحص المرضى ويصف لهم العلاج.',
    options: [
      { word: 'Baker', ar: 'خبّاز', phonetic: '/ˈbeɪ.kər/' },
      { word: 'Pilot', ar: 'طيّار', phonetic: '/ˈpaɪ.lət/' },
      { word: 'Doctor', ar: 'طبيب', phonetic: '/ˈdɒk.tər/' },
      { word: 'Carpenter', ar: 'نجّار', phonetic: '/ˈkɑː.pən.tər/' },
    ],
    correctIndex: 2,
  },
  {
    id: 'det-810-4',
    ageGroup: '8-10',
    categoryEn: 'Nature & Space',
    categoryAr: 'لغز الطبيعة والفضاء',
    cluesEn: [
      'Clue 1: I shine brightly only when the sky gets dark.',
      'Clue 2: Astronauts landed on my dusty rocky surface.',
      'Clue 3: Sometimes I look like a crescent, and sometimes a full circle.',
    ],
    extraHintAr: 'يضيء ليلاً ويتغير شكله بين هلال وبدر.',
    options: [
      { word: 'Volcano', ar: 'بركان', phonetic: '/vɒlˈkeɪ.nəʊ/' },
      { word: 'Waterfall', ar: 'شلال', phonetic: '/ˈwɔː.tə.fɔːl/' },
      { word: 'Cloud', ar: 'سحابة', phonetic: '/klaʊd/' },
      { word: 'Moon', ar: 'القمر', phonetic: '/muːn/' },
    ],
    correctIndex: 3,
  },
  {
    id: 'det-810-5',
    ageGroup: '8-10',
    categoryEn: 'School Tools',
    categoryAr: 'أدوات الدراسة',
    cluesEn: [
      'Clue 1: You hold me in your hand to measure straight lines.',
      'Clue 2: My edge shows centimeters and numbers.',
      'Clue 3: I help you draw neat squares in math class.',
    ],
    extraHintAr: 'أداة هندسية لقياس الطول بالسنتيمتر.',
    options: [
      { word: 'Ruler', ar: 'مسطرة', phonetic: '/ˈruː.lər/' },
      { word: 'Scissors', ar: 'مقص', phonetic: '/ˈsɪz.əz/' },
      { word: 'Crayon', ar: 'قلم تلوين', phonetic: '/ˈkreɪ.ɒn/' },
      { word: 'Clock', ar: 'ساعة حائط', phonetic: '/klɒk/' },
    ],
    correctIndex: 0,
  },
  {
    id: 'det-810-6',
    ageGroup: '8-10',
    categoryEn: 'Healthy Food',
    categoryAr: 'الطعام الصحي',
    cluesEn: [
      'Clue 1: I am an orange vegetable that grows under the soil.',
      'Clue 2: Rabbits love munching on my crunchy root!',
      'Clue 3: Eating me helps keep your eyesight sharp.',
    ],
    extraHintAr: 'خضار برتقالي يقوي النظر ويحبه الأرنب.',
    options: [
      { word: 'Strawberry', ar: 'فراولة', phonetic: '/ˈstrɔː.bər.i/' },
      { word: 'Carrot', ar: 'جزرة', phonetic: '/ˈkær.ət/' },
      { word: 'Pineapple', ar: 'أناناس', phonetic: '/ˈpaɪn.æp.əl/' },
      { word: 'Sandwich', ar: 'ساندويتش', phonetic: '/ˈsæn.wɪdʒ/' },
    ],
    correctIndex: 1,
  },
  {
    id: 'det-810-7',
    ageGroup: '8-10',
    categoryEn: 'Directions & Travel',
    categoryAr: 'أدوات الاستكشاف',
    cluesEn: [
      'Clue 1: Explorers carry me when hiking across forests or seas.',
      'Clue 2: Inside my glass case, a magnetic needle always spins.',
      'Clue 3: I always show you North, South, East, and West.',
    ],
    extraHintAr: 'أداة تحدد الاتجاهات الأربعة بإبرة مغناطيسية.',
    options: [
      { word: 'Telescope', ar: 'تلسكوب', phonetic: '/ˈtel.ɪ.skəʊp/' },
      { word: 'Suitcase', ar: 'حقيبة سفر', phonetic: '/ˈsuːt.keɪs/' },
      { word: 'Compass', ar: 'بوصلة', phonetic: '/ˈkʌm.pəs/' },
      { word: 'Camera', ar: 'كاميرا', phonetic: '/ˈkæm.rə/' },
    ],
    correctIndex: 2,
  },
  {
    id: 'det-810-8',
    ageGroup: '8-10',
    categoryEn: 'Brave Helpers',
    categoryAr: 'أبطال المجتمع',
    cluesEn: [
      'Clue 1: I ride a loud red truck with flashing lights.',
      'Clue 2: I wear a heat-proof helmet and carry a water hose.',
      'Clue 3: I rush to put out dangerous flames and save people.',
    ],
    extraHintAr: 'يركب سيارة إطفاء حمراء ويخمد الحرائق.',
    options: [
      { word: 'Astronaut', ar: 'رائد فضاء', phonetic: '/ˈæs.trə.nɔːt/' },
      { word: 'Journalist', ar: 'صحفي', phonetic: '/ˈdʒɜː.nə.lɪst/' },
      { word: 'Dentist', ar: 'طبيب أسنان', phonetic: '/ˈden.tɪst/' },
      { word: 'Firefighter', ar: 'رجل إطفاء', phonetic: '/ˈfaɪə.faɪ.tər/' },
    ],
    correctIndex: 3,
  },

  // --- AGES 11-14 (8 Advanced Vocabulary & Science Cases) ---
  {
    id: 'det-1114-1',
    ageGroup: '11-14',
    categoryEn: 'Science Lab',
    categoryAr: 'مختبر العلوم',
    cluesEn: [
      'Clue 1: Biologists use my glass lenses inside laboratories.',
      'Clue 2: I magnify tiny objects that the human eye cannot see.',
      'Clue 3: Without me, discovering bacteria and plant cells would be impossible.',
    ],
    extraHintAr: 'جهاز يكبّر الخلايا والكائنات الدقيقة مئات المرات.',
    options: [
      { word: 'Microscope', ar: 'مجهر / ميكروسكوب', phonetic: '/ˈmaɪ.krə.skəʊp/' },
      { word: 'Thermometer', ar: 'ترمومتر', phonetic: '/θəˈmɒm.ɪ.tər/' },
      { word: 'Periscope', ar: 'منظار غواصة', phonetic: '/ˈper.ɪ.skəʊp/' },
      { word: 'Barometer', ar: 'بارومتر', phonetic: '/bəˈrɒm.ɪ.tər/' },
    ],
    correctIndex: 0,
  },
  {
    id: 'det-1114-2',
    ageGroup: '11-14',
    categoryEn: 'Earth & Ecology',
    categoryAr: 'علوم الأرض والبيئة',
    cluesEn: [
      'Clue 1: My name describes energy from sunlight, wind, or rivers.',
      'Clue 2: Unlike coal or oil, I never run out cleanly over time.',
      'Clue 3: Governments invest in me to fight climate change.',
    ],
    extraHintAr: 'تصف مصادر الطاقة المتجددة كالشمس والرياح.',
    options: [
      { word: 'Artificial', ar: 'اصطناعي', phonetic: '/ˌɑː.tɪˈfɪʃ.əl/' },
      { word: 'Renewable', ar: 'متجدد', phonetic: '/rɪˈnjuː.ə.bəl/' },
      { word: 'Invisible', ar: 'غير مرئي', phonetic: '/ɪnˈvɪz.ə.bəl/' },
      { word: 'Fragile', ar: 'هش', phonetic: '/ˈfrædʒ.aɪl/' },
    ],
    correctIndex: 1,
  },
  {
    id: 'det-1114-3',
    ageGroup: '11-14',
    categoryEn: 'Astronomy',
    categoryAr: 'علم الفلك',
    cluesEn: [
      'Clue 1: I am an invisible pulling force across the universe.',
      'Clue 2: I keep the Moon circling around Earth instead of drifting away.',
      'Clue 3: When you jump upward, I gently bring your feet back down.',
    ],
    extraHintAr: 'القوة التي تُبقي الكواكب في مداراتها وتجذبنا للأرض.',
    options: [
      { word: 'Electricity', ar: 'الكهرباء', phonetic: '/ˌel.ɪkˈtrɪs.ə.ti/' },
      { word: 'Velocity', ar: 'السرعة المتجهة', phonetic: '/vəˈlɒs.ə.ti/' },
      { word: 'Gravity', ar: 'الجاذبية', phonetic: '/ˈɡræv.ə.ti/' },
      { word: 'Friction', ar: 'الاحتكاك', phonetic: '/ˈfrɪk.ʃən/' },
    ],
    correctIndex: 2,
  },
  {
    id: 'det-1114-4',
    ageGroup: '11-14',
    categoryEn: 'Language Arts',
    categoryAr: 'فنون اللغة',
    cluesEn: [
      'Clue 1: Writers use me to compare two things WITHOUT using "like" or "as".',
      'Clue 2: Saying "Time is a thief" is a famous example of me.',
      'Clue 3: I add poetic imagination to essays and stories.',
    ],
    extraHintAr: 'تعبير بلاغي يشبّه شيئاً بآخر دون أداة تشبيه (الاستعارة).',
    options: [
      { word: 'Dictionary', ar: 'قاموس', phonetic: '/ˈdɪk.ʃən.ər.i/' },
      { word: 'Paragraph', ar: 'فقرة', phonetic: '/ˈpær.ə.ɡrɑːf/' },
      { word: 'Pronoun', ar: 'ضمير', phonetic: '/ˈprəʊ.naʊn/' },
      { word: 'Metaphor', ar: 'استعارة بلاغية', phonetic: '/ˈmet.ə.fɔːr/' },
    ],
    correctIndex: 3,
  },
  {
    id: 'det-1114-5',
    ageGroup: '11-14',
    categoryEn: 'Geography & Maps',
    categoryAr: 'جغرافيا العالم',
    cluesEn: [
      'Clue 1: I am a huge piece of land surrounded by water on ONLY three sides.',
      'Clue 2: Sinai and Italy are both famous examples of me.',
      'Clue 3: Unlike an island, one side stays connected to the mainland.',
    ],
    extraHintAr: 'أرض تحيط بها المياه من ثلاث جهات فقط (مثل سيناء).',
    options: [
      { word: 'Peninsula', ar: 'شبه جزيرة', phonetic: '/pəˈnɪn.sjʊ.lə/' },
      { word: 'Archipelago', ar: 'أرخبيل جزر', phonetic: '/ˌɑː.kɪˈpel.ə.ɡəʊ/' },
      { word: 'Canyon', ar: 'أخدود', phonetic: '/ˈkæn.jən/' },
      { word: 'Glacier', ar: 'نهر جليدي', phonetic: '/ˈɡleɪ.si.ər/' },
    ],
    correctIndex: 0,
  },
  {
    id: 'det-1114-6',
    ageGroup: '11-14',
    categoryEn: 'History & Culture',
    categoryAr: 'التاريخ والآثار',
    cluesEn: [
      'Clue 1: I dig carefully through ancient soil to uncover lost cities.',
      'Clue 2: Pottery, statues, and coins tell me how past civilizations lived.',
      'Clue 3: Howard Carter became world famous in my field in Egypt.',
    ],
    extraHintAr: 'عالم يبحث في الآثار القديمة ويكشف أسرار الحضارات.',
    options: [
      { word: 'Meteorologist', ar: 'خبير أرصاد', phonetic: '/ˌmiː.ti.əˈrɒl.ə.dʒɪst/' },
      { word: 'Archaeologist', ar: 'عالم آثار', phonetic: '/ˌɑː.kiˈɒl.ə.dʒɪst/' },
      { word: 'Architect', ar: 'مهندس معماري', phonetic: '/ˈɑː.kɪ.tekt/' },
      { word: 'Pharmacist', ar: 'صيدلي', phonetic: '/ˈfɑː.mə.sɪst/' },
    ],
    correctIndex: 1,
  },
  {
    id: 'det-1114-7',
    ageGroup: '11-14',
    categoryEn: 'Character Traits',
    categoryAr: 'صفات النجاح',
    cluesEn: [
      'Clue 1: This noun describes bouncing back quickly after facing setbacks.',
      'Clue 2: Athletes and inventors rely on it when practice feels tough.',
      'Clue 3: Synonyms include toughness, adaptability, and inner strength.',
    ],
    extraHintAr: 'القدرة على النهوض والتعافي سريعاً بعد الصعوبات (المرونة النفسية).',
    options: [
      { word: 'Hesitation', ar: 'تردد', phonetic: '/ˌhez.ɪˈteɪ.ʃən/' },
      { word: 'Exaggeration', ar: 'مبالغة', phonetic: '/ɪɡˌzædʒ.əˈreɪ.ʃən/' },
      { word: 'Resilience', ar: 'المرونة والمثابرة', phonetic: '/rɪˈzɪl.i.əns/' },
      { word: 'Compliment', ar: 'مجاملة', phonetic: '/ˈkɒm.plɪ.mənt/' },
    ],
    correctIndex: 2,
  },
  {
    id: 'det-1114-8',
    ageGroup: '11-14',
    categoryEn: 'Technology & Logic',
    categoryAr: 'التكنولوجيا والبرمجة',
    cluesEn: [
      'Clue 1: Programmers write me as a step-by-step recipe to solve a problem.',
      'Clue 2: Search engines and navigation apps depend on me every second.',
      'Clue 3: My name comes from the famous scholar Al-Khwarizmi.',
    ],
    extraHintAr: 'مجموعة خطوات منطقية مرتبة لحل مشكلة برمجية (مشتقة من اسم الخوارزمي).',
    options: [
      { word: 'Spreadsheet', ar: 'جدول بيانات', phonetic: '/ˈspred.ʃiːt/' },
      { word: 'Resolution', ar: 'دقة العرض', phonetic: '/ˌrez.əˈluː.ʃən/' },
      { word: 'Bandwidth', ar: 'سعة الاتصال', phonetic: '/ˈbænd.wɪtθ/' },
      { word: 'Algorithm', ar: 'خوارزمية', phonetic: '/ˈæl.ɡə.rɪ.ðəm/' },
    ],
    correctIndex: 3,
  },
];

// =========================================================================
// GAME 3: SENTENCE SCRAMBLE RACE (24 Puzzles — 8 per Age Group)
// =========================================================================

export interface SentencePuzzle {
  id: string;
  ageGroup: EnglishAgeGroup;
  levelLabelEn: string;
  meaningAr: string;
  grammarTipEn: string;
  words: string[]; // Correct order
}

export const SENTENCE_PUZZLES: SentencePuzzle[] = [
  // --- AGES 5-7 (8 Sentences: 4-6 simple words) ---
  {
    id: 's57-1',
    ageGroup: '5-7',
    levelLabelEn: 'Feelings',
    meaningAr: 'أنا سعيد جداً اليوم.',
    grammarTipEn: 'I + am + adjective (very happy) + time.',
    words: ['I', 'am', 'very', 'happy', 'today.'],
  },
  {
    id: 's57-2',
    ageGroup: '5-7',
    levelLabelEn: 'Pets',
    meaningAr: 'القطة الصغيرة تشرب الحليب.',
    grammarTipEn: 'The + noun + verb (drinks) + object.',
    words: ['The', 'little', 'cat', 'drinks', 'milk.'],
  },
  {
    id: 's57-3',
    ageGroup: '5-7',
    levelLabelEn: 'Family Love',
    meaningAr: 'أمي تطبخ طعاماً لذيذاً.',
    grammarTipEn: 'My mom + cooks + adjective + food.',
    words: ['My', 'mom', 'cooks', 'yummy', 'food.'],
  },
  {
    id: 's57-4',
    ageGroup: '5-7',
    levelLabelEn: 'Playtime',
    meaningAr: 'نحن نلعب بالكرة الحمراء.',
    grammarTipEn: 'We + play with + adjective + noun.',
    words: ['We', 'play', 'with', 'a', 'red', 'ball.'],
  },
  {
    id: 's57-5',
    ageGroup: '5-7',
    levelLabelEn: 'Weather',
    meaningAr: 'السماء زرقاء ومشمسة.',
    grammarTipEn: 'Subject (The sky) + is + adjectives.',
    words: ['The', 'sky', 'is', 'blue', 'and', 'sunny.'],
  },
  {
    id: 's57-6',
    ageGroup: '5-7',
    levelLabelEn: 'Ability',
    meaningAr: 'العصفور يستطيع أن يطير عالياً.',
    grammarTipEn: 'can + base verb (fly).',
    words: ['A', 'bird', 'can', 'fly', 'high.'],
  },
  {
    id: 's57-7',
    ageGroup: '5-7',
    levelLabelEn: 'School Bag',
    meaningAr: 'أحمل كتاباً وقلم رصاص.',
    grammarTipEn: 'I have + a + noun + and + a + noun.',
    words: ['I', 'have', 'a', 'book', 'and', 'pencil.'],
  },
  {
    id: 's57-8',
    ageGroup: '5-7',
    levelLabelEn: 'Good Manners',
    meaningAr: 'أنت صديق لطيف جداً.',
    grammarTipEn: 'You + are + a + kind + friend.',
    words: ['You', 'are', 'a', 'very', 'kind', 'friend.'],
  },

  // --- AGES 8-10 (8 Sentences: 6-9 words) ---
  {
    id: 's810-1',
    ageGroup: '8-10',
    levelLabelEn: 'Daily Routine',
    meaningAr: 'أذهب إلى المدرسة بالأتوبيس كل صباح.',
    grammarTipEn: 'Subject (I) + Verb (go) + Place + Time.',
    words: ['I', 'go', 'to', 'school', 'by', 'bus', 'every', 'morning.'],
  },
  {
    id: 's810-2',
    ageGroup: '8-10',
    levelLabelEn: 'Helping Family',
    meaningAr: 'أختي تساعد أمي في المطبخ.',
    grammarTipEn: 'Singular subject (My sister) + verb with -s (helps).',
    words: ['My', 'sister', 'helps', 'Mom', 'in', 'the', 'kitchen.'],
  },
  {
    id: 's810-3',
    ageGroup: '8-10',
    levelLabelEn: 'Reading Habit',
    meaningAr: 'نحن نحب قراءة القصص الإنجليزية المشوقة.',
    grammarTipEn: 'love + verb-ing (reading) + adjectives + noun.',
    words: ['We', 'love', 'reading', 'exciting', 'English', 'stories.'],
  },
  {
    id: 's810-4',
    ageGroup: '8-10',
    levelLabelEn: 'Healthy Advice',
    meaningAr: 'يجب أن تشرب الماء النظيف كل يوم.',
    grammarTipEn: 'Modal (You should) + base verb (drink).',
    words: ['You', 'should', 'drink', 'clean', 'water', 'every', 'day.'],
  },
  {
    id: 's810-5',
    ageGroup: '8-10',
    levelLabelEn: 'Question Form',
    meaningAr: 'كم عدد الكتب الموجودة على المكتب؟',
    grammarTipEn: 'How many + plural noun (books) + are there...?',
    words: ['How', 'many', 'books', 'are', 'there', 'on', 'the', 'desk?'],
  },
  {
    id: 's810-6',
    ageGroup: '8-10',
    levelLabelEn: 'Future Dream',
    meaningAr: 'أريد أن أصبح مبرمجاً ذكياً ومبدعاً.',
    grammarTipEn: 'I want to + be + a + adjectives + noun.',
    words: ['I', 'want', 'to', 'be', 'a', 'smart', 'coder.'],
  },
  {
    id: 's810-7',
    ageGroup: '8-10',
    levelLabelEn: 'Past Weekend',
    meaningAr: 'زرنا الأهرامات العظيمة يوم الجمعة الماضي.',
    grammarTipEn: 'Past simple: Subject + visited + object + last Friday.',
    words: ['We', 'visited', 'the', 'great', 'Pyramids', 'last', 'Friday.'],
  },
  {
    id: 's810-8',
    ageGroup: '8-10',
    levelLabelEn: 'Planet Care',
    meaningAr: 'يجب علينا زراعة الأشجار لحماية كوكبنا.',
    grammarTipEn: 'We must + base verb (plant) + to + verb.',
    words: ['We', 'must', 'plant', 'trees', 'to', 'protect', 'our', 'planet.'],
  },

  // --- AGES 11-14 (8 Advanced Grammar Sentences: 8-11 words) ---
  {
    id: 's1114-1',
    ageGroup: '11-14',
    levelLabelEn: 'First Conditional',
    meaningAr: 'إذا تدرّبت يومياً، فستتحدث الإنجليزية بطلاقة وثقة.',
    grammarTipEn: 'If + present simple, Subject + will + base verb.',
    words: ['If', 'you', 'practice', 'daily,', 'you', 'will', 'speak', 'English', 'fluently.'],
  },
  {
    id: 's1114-2',
    ageGroup: '11-14',
    levelLabelEn: 'Relative Clause',
    meaningAr: 'الطالب الذي يقرأ كثيراً يكتسب مفردات رائعة.',
    grammarTipEn: 'Relative pronoun "who" connects noun with action.',
    words: ['The', 'student', 'who', 'reads', 'often', 'learns', 'amazing', 'new', 'words.'],
  },
  {
    id: 's1114-3',
    ageGroup: '11-14',
    levelLabelEn: 'Present Perfect',
    meaningAr: 'لقد انتهينا للتو من بناء مشروعنا العلمي المبتكر.',
    grammarTipEn: 'have + just + past participle (finished).',
    words: ['We', 'have', 'just', 'finished', 'building', 'our', 'creative', 'science', 'project.'],
  },
  {
    id: 's1114-4',
    ageGroup: '11-14',
    levelLabelEn: 'Passive Voice',
    meaningAr: 'كُتب هذا الكتاب الشيق بواسطة مؤلفة مصرية شابة.',
    grammarTipEn: 'Passive: Subject + was + past participle + by...',
    words: ['This', 'exciting', 'book', 'was', 'written', 'by', 'a', 'young', 'author.'],
  },
  {
    id: 's1114-5',
    ageGroup: '11-14',
    levelLabelEn: 'Contrast Connector',
    meaningAr: 'رغم أن اللغز كان صعباً، لم يستسلم الفريق أبداً.',
    grammarTipEn: 'Although + clause 1, clause 2.',
    words: ['Although', 'the', 'puzzle', 'was', 'hard,', 'the', 'team', 'never', 'gave', 'up.'],
  },
  {
    id: 's1114-6',
    ageGroup: '11-14',
    levelLabelEn: 'Comparative Mastery',
    meaningAr: 'الطاقة الشمسية أنظف بكثير من الوقود الأحفوري التقليدي.',
    grammarTipEn: 'much + comparative adjective (-er) + than...',
    words: ['Solar', 'energy', 'is', 'much', 'cleaner', 'than', 'burning', 'fossil', 'fuels.'],
  },
  {
    id: 's1114-7',
    ageGroup: '11-14',
    levelLabelEn: 'Polite Indirect Question',
    meaningAr: 'هل يمكنك إخباري أين يقع المتحف المصري الكبير؟',
    grammarTipEn: 'Could you tell me + where + Subject + Verb (statement order)?',
    words: ['Could', 'you', 'tell', 'me', 'where', 'the', 'Grand', 'Museum', 'is?'],
  },
  {
    id: 's1114-8',
    ageGroup: '11-14',
    levelLabelEn: 'Second Conditional',
    meaningAr: 'لو سافرت حول العالم، لتعلمت خمس لغات جديدة.',
    grammarTipEn: 'If + past simple, Subject + would + base verb.',
    words: ['If', 'I', 'traveled', 'abroad,', 'I', 'would', 'learn', 'five', 'new', 'languages.'],
  },
];

// =========================================================================
// GAME 4: INTERACTIVE CAFE & SHOP ROLEPLAY (10 Items + 18 Customers)
// =========================================================================

export interface ShopProduct {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  category: 'cafe' | 'shop';
}

export const ROLEPLAY_MENU: ShopProduct[] = [
  { id: 'orange_juice', nameEn: 'Orange Juice', nameAr: 'عصير برتقال', price: 2, category: 'cafe' },
  { id: 'cupcake', nameEn: 'Choco Cupcake', nameAr: 'كب كيك شوكولاتة', price: 3, category: 'cafe' },
  { id: 'apple_pie', nameEn: 'Apple Pie', nameAr: 'فطيرة تفاح', price: 4, category: 'cafe' },
  { id: 'cheese_sandwich', nameEn: 'Cheese Sandwich', nameAr: 'ساندويتش جبن', price: 5, category: 'cafe' },
  { id: 'milkshake', nameEn: 'Strawberry Shake', nameAr: 'ميلك شيك فراولة', price: 5, category: 'cafe' },
  { id: 'pizza_slice', nameEn: 'Pizza Slice', nameAr: 'قطعة بيتزا', price: 6, category: 'cafe' },
  { id: 'pencil_set', nameEn: 'Color Pencils', nameAr: 'علبة ألوان', price: 4, category: 'shop' },
  { id: 'storybook', nameEn: 'Storybook', nameAr: 'كتاب قصص', price: 6, category: 'shop' },
  { id: 'toy_robot', nameEn: 'Toy Robot', nameAr: 'روبوت لعبة', price: 8, category: 'shop' },
  { id: 'science_kit', nameEn: 'Science Kit', nameAr: 'حقيبة تجارب علمية', price: 10, category: 'shop' },
];

export interface RoleplayCustomerOrder {
  id: string;
  ageGroup: EnglishAgeGroup;
  customerName: string;
  customerRoleAr: string;
  speechEn: string;
  speechAr: string;
  requiredCounts: Record<string, number>;
  expectedTotal: number;
  replyChoices: Array<{ textEn: string; politeAndAccurate: boolean; feedbackAr: string }>;
}

export const ROLEPLAY_CUSTOMERS: RoleplayCustomerOrder[] = [
  // --- AGES 5-7 (6 Customers) ---
  {
    id: 'c57-1',
    ageGroup: '5-7',
    customerName: 'Mona',
    customerRoleAr: 'منى (طلب سهل في الكافيه)',
    speechEn: '"Hello! Can I have ONE Orange Juice, please?"',
    speechAr: '«أهلاً! ممكن عصير برتقال واحد من فضلك؟»',
    requiredCounts: { orange_juice: 1 },
    expectedTotal: 2,
    replyChoices: [
      {
        textEn: 'Yes! Here is your juice. That is 2 dollars, thank you!',
        politeAndAccurate: true,
        feedbackAr: 'ممتاز! رد لطيف وسعر العصير صحيح (2 دولار)!',
      },
      {
        textEn: 'Give me 9 dollars fast!',
        politeAndAccurate: false,
        feedbackAr: 'انتبه: السعر 2 دولار فقط والرد يجب أن يكون مهذباً.',
      },
      {
        textEn: 'No juice for you today.',
        politeAndAccurate: false,
        feedbackAr: 'الترحيب اللطيف والابتسامة هما سر نجاح البائع الشاطر!',
      },
    ],
  },
  {
    id: 'c57-2',
    ageGroup: '5-7',
    customerName: 'Ali',
    customerRoleAr: 'علي (يحب الكيك والعصير)',
    speechEn: '"Hi! I want ONE Choco Cupcake and ONE Orange Juice, please."',
    speechAr: '«مرحباً! أريد كب كيك واحد وعصير برتقال واحد من فضلك.»',
    requiredCounts: { cupcake: 1, orange_juice: 1 },
    expectedTotal: 5,
    replyChoices: [
      {
        textEn: 'Here you go! That is 8 dollars.',
        politeAndAccurate: false,
        feedbackAr: 'راجع الجمع: كب كيك (3) + عصير (2) = 5 دولارات.',
      },
      {
        textEn: 'Sure, friend! Here is your order. That will be 5 dollars, please.',
        politeAndAccurate: true,
        feedbackAr: 'بطل! 3 + 2 = 5 دولارات ورد رائع بالإنجليزية!',
      },
      {
        textEn: 'Only 1 dollar please!',
        politeAndAccurate: false,
        feedbackAr: 'الحساب ناقص: 3 + 2 يساوي 5 دولارات.',
      },
    ],
  },
  {
    id: 'c57-3',
    ageGroup: '5-7',
    customerName: 'Lina',
    customerRoleAr: 'لينا (تحب التلوين)',
    speechEn: '"Good morning! Can I buy ONE Color Pencils box, please?"',
    speechAr: '«صباح الخير! هل يمكنني شراء علبة ألوان واحدة؟»',
    requiredCounts: { pencil_set: 1 },
    expectedTotal: 4,
    replyChoices: [
      {
        textEn: 'Good morning! Enjoy drawing! That is 4 dollars, thank you.',
        politeAndAccurate: true,
        feedbackAr: 'رد جميل جداً! علبة الألوان سعرها 4 دولارات.',
      },
      {
        textEn: 'Take it for 7 dollars!',
        politeAndAccurate: false,
        feedbackAr: 'السعر على الرف 4 دولارات وليس 7.',
      },
      {
        textEn: 'Go away, store is closed!',
        politeAndAccurate: false,
        feedbackAr: 'أهلاً بالزبائن دائماً بكلام إنجليزي مهذب!',
      },
    ],
  },
  {
    id: 'c57-4',
    ageGroup: '5-7',
    customerName: 'Toby',
    customerRoleAr: 'توبي (يحب اللعب)',
    speechEn: '"Yay! Can I get ONE Toy Robot, please?"',
    speechAr: '«يا سلام! هل يمكنني الحصول على روبوت لعبة واحد من فضلك؟»',
    requiredCounts: { toy_robot: 1 },
    expectedTotal: 8,
    replyChoices: [
      {
        textEn: 'Here is your robot! Have fun! That is 8 dollars.',
        politeAndAccurate: true,
        feedbackAr: 'رائع! الروبوت بـ 8 دولارات والرد مشجع جداً.',
      },
      {
        textEn: 'That is 2 dollars only.',
        politeAndAccurate: false,
        feedbackAr: 'تحقق من بطاقة السعر: الروبوت بـ 8 دولارات.',
      },
      {
        textEn: 'I lost the robot!',
        politeAndAccurate: false,
        feedbackAr: 'الروبوت موجود أمامك في متجر الألعاب!',
      },
    ],
  },
  {
    id: 'c57-5',
    ageGroup: '5-7',
    customerName: 'Sara',
    customerRoleAr: 'سارة (وجبة خفيفة)',
    speechEn: '"Please give me TWO Orange Juices for me and my sister."',
    speechAr: '«من فضلك أعطني عصيري برتقال (2) لي ولأختي.»',
    requiredCounts: { orange_juice: 2 },
    expectedTotal: 4,
    replyChoices: [
      {
        textEn: 'Two juices equal 6 dollars!',
        politeAndAccurate: false,
        feedbackAr: 'العصير الواحد بـ 2، إذن 2 + 2 = 4 دولارات.',
      },
      {
        textEn: 'With pleasure! Two fresh juices are 4 dollars, thank you!',
        politeAndAccurate: true,
        feedbackAr: 'شاطر جداً! 2 × 2 = 4 دولارات ورد مهذب.',
      },
      {
        textEn: 'Take just one juice!',
        politeAndAccurate: false,
        feedbackAr: 'الزبونة طلبت عصيرين (2) لها ولأختها.',
      },
    ],
  },
  {
    id: 'c57-6',
    ageGroup: '5-7',
    customerName: 'Yassin',
    customerRoleAr: 'ياسين (قصة قبل النوم)',
    speechEn: '"Hello! I would like ONE Storybook and ONE Orange Juice."',
    speechAr: '«أهلاً! أريد كتاب قصص واحد وعصير برتقال واحد.»',
    requiredCounts: { storybook: 1, orange_juice: 1 },
    expectedTotal: 8,
    replyChoices: [
      {
        textEn: 'Certainly! Happy reading! Your total is 8 dollars.',
        politeAndAccurate: true,
        feedbackAr: 'ممتاز! الكتاب (6) + العصير (2) = 8 دولارات.',
      },
      {
        textEn: 'Your total is 10 dollars!',
        politeAndAccurate: false,
        feedbackAr: 'انتبه: 6 + 2 = 8 دولارات وليس 10.',
      },
      {
        textEn: 'Books are not for kids!',
        politeAndAccurate: false,
        feedbackAr: 'بالعكس، القراءة للأطفال متعة كبيرة!',
      },
    ],
  },

  // --- AGES 8-10 (6 Customers) ---
  {
    id: 'c810-1',
    ageGroup: '8-10',
    customerName: 'Mia',
    customerRoleAr: 'ميا (غداء سريع)',
    speechEn: '"Good morning! Can I please have ONE Cheese Sandwich and ONE Orange Juice?"',
    speechAr: '«صباح الخير! هل يمكنني الحصول على ساندويتش جبن واحد وعصير برتقال واحد؟»',
    requiredCounts: { cheese_sandwich: 1, orange_juice: 1 },
    expectedTotal: 7,
    replyChoices: [
      {
        textEn: 'Sure! Here you go. That will be 7 dollars, thank you!',
        politeAndAccurate: true,
        feedbackAr: 'رد مهذب وممتاز والحساب صحيح (5 + 2 = 7 دولارات)!',
      },
      {
        textEn: 'Take it quickly! Give me 12 dollars now.',
        politeAndAccurate: false,
        feedbackAr: 'الرد غير مهذب والمبلغ غير صحيح (5 + 2 = 7 وليس 12).',
      },
      {
        textEn: 'Here is your order. That is 5 dollars, goodbye.',
        politeAndAccurate: false,
        feedbackAr: 'حساب العصير ناقص! ساندويتش (5) + عصير (2) = 7 دولارات.',
      },
    ],
  },
  {
    id: 'c810-2',
    ageGroup: '8-10',
    customerName: 'Leo',
    customerRoleAr: 'ليو (يحب الفطائر والشيك)',
    speechEn: '"Hello! I would like TWO Apple Pies and ONE Strawberry Shake, please."',
    speechAr: '«أهلاً! أريد فطيرتي تفاح (2) وميلك شيك فراولة واحد (1) من فضلك.»',
    requiredCounts: { apple_pie: 2, milkshake: 1 },
    expectedTotal: 13,
    replyChoices: [
      {
        textEn: 'Of course! Your total is 9 dollars. Have a nice day!',
        politeAndAccurate: false,
        feedbackAr: 'تحقق من الحساب: فطيرتا تفاح (4+4=8) + ميلك شيك (5) = 13 دولاراً!',
      },
      {
        textEn: 'With pleasure! Here are your items. That is 13 dollars, please.',
        politeAndAccurate: true,
        feedbackAr: 'ممتاز! لغة إنجليزية راقية وحساب دقيق (4+4+5 = 13).',
      },
      {
        textEn: 'Wait outside! No apple pies today.',
        politeAndAccurate: false,
        feedbackAr: 'الأسلوب غير لائق، الفطائر متوفرة في القائمة أمامك!',
      },
    ],
  },
  {
    id: 'c810-3',
    ageGroup: '8-10',
    customerName: 'Nour',
    customerRoleAr: 'نور (هدية ومشروب)',
    speechEn: '"Excuse me! Could I buy ONE Storybook and TWO Choco Cupcakes, please?"',
    speechAr: '«لو سمحت! أود شراء كتاب قصص واحد و2 كب كيك شوكولاتة.»',
    requiredCounts: { storybook: 1, cupcake: 2 },
    expectedTotal: 12,
    replyChoices: [
      {
        textEn: 'Certainly! Enjoy reading and your treats. That comes to 12 dollars!',
        politeAndAccurate: true,
        feedbackAr: 'رائع! جملة احترافية وحساب صحيح (6 + 3 + 3 = 12 دولاراً).',
      },
      {
        textEn: 'Yes, pay 9 dollars for everything!',
        politeAndAccurate: false,
        feedbackAr: 'السعر خاطئ: الكتاب (6) + 2 كب كيك (6) = 12 دولاراً.',
      },
      {
        textEn: 'I do not want to sell anything today.',
        politeAndAccurate: false,
        feedbackAr: 'تذكّر استخدام عبارات الترحيب والخدمة اللطيفة بالإنجليزية.',
      },
    ],
  },
  {
    id: 'c810-4',
    ageGroup: '8-10',
    customerName: 'Karim',
    customerRoleAr: 'كريم (حفلة عيد ميلاد)',
    speechEn: '"Hi friend! Can I get ONE Toy Robot and ONE Pizza Slice for my party?"',
    speechAr: '«أهلاً! هل يمكنني شراء روبوت لعبة واحد وقطعة بيتزا واحدة لحفلتي؟»',
    requiredCounts: { toy_robot: 1, pizza_slice: 1 },
    expectedTotal: 14,
    replyChoices: [
      {
        textEn: 'Happy party! Your total is 14 dollars. You are welcome!',
        politeAndAccurate: true,
        feedbackAr: 'بطل! تهنئة لطيفة باللغة الإنجليزية وحساب صحيح (8 + 6 = 14).',
      },
      {
        textEn: 'Here is the robot, give me 11 dollars.',
        politeAndAccurate: false,
        feedbackAr: 'انتبه: 8 + 6 يساوي 14 دولاراً وليس 11.',
      },
      {
        textEn: 'Only 5 dollars today!',
        politeAndAccurate: false,
        feedbackAr: 'السعر الحقيقي أعلى: الروبوت (8) + البيتزا (6) = 14 دولاراً.',
      },
    ],
  },
  {
    id: 'c810-5',
    ageGroup: '8-10',
    customerName: 'Salma',
    customerRoleAr: 'سلمى (نادي العلوم)',
    speechEn: '"Good afternoon! May I purchase ONE Science Kit and ONE Color Pencils set?"',
    speechAr: '«مساء الخير! هل يمكنني شراء حقيبة تجارب علمية واحدة وعلبة ألوان واحدة؟»',
    requiredCounts: { science_kit: 1, pencil_set: 1 },
    expectedTotal: 14,
    replyChoices: [
      {
        textEn: 'Good afternoon! Great pick for a scientist! That is 14 dollars.',
        politeAndAccurate: true,
        feedbackAr: 'إجابة ممتازة! 10 + 4 = 14 دولاراً!',
      },
      {
        textEn: 'That will be 16 dollars please.',
        politeAndAccurate: false,
        feedbackAr: 'حقيبة العلوم (10) + الألوان (4) = 14 وليس 16.',
      },
      {
        textEn: 'Science is boring, pick candy instead.',
        politeAndAccurate: false,
        feedbackAr: 'شجّع دائماً اختيارات الزبائن باحترام ولطف!',
      },
    ],
  },
  {
    id: 'c810-6',
    ageGroup: '8-10',
    customerName: 'Omar',
    customerRoleAr: 'عمر (طلب عائلي)',
    speechEn: '"Hello! My brothers want TWO Pizza Slices and THREE Orange Juices, please."',
    speechAr: '«أهلاً! إخوتي يريدون قطعتي بيتزا (2) و3 عصير برتقال من فضلك.»',
    requiredCounts: { pizza_slice: 2, orange_juice: 3 },
    expectedTotal: 18,
    replyChoices: [
      {
        textEn: 'Right away! Two pizzas and three juices come to 18 dollars. Enjoy!',
        politeAndAccurate: true,
        feedbackAr: 'حساب عبقري! (6×2 = 12) + (2×3 = 6) = 18 دولاراً!',
      },
      {
        textEn: 'Your total is 15 dollars, hurry up!',
        politeAndAccurate: false,
        feedbackAr: 'انتبه للضرب: 2 بيتزا بـ 12 + 3 عصائر بـ 6 = 18 دولاراً.',
      },
      {
        textEn: 'We do not count above ten here.',
        politeAndAccurate: false,
        feedbackAr: 'البائع الذكي يحسب بدقة ويبتسم للزبون!',
      },
    ],
  },

  // --- AGES 11-14 (6 Pro Multi-Item Hospitality Customers) ---
  {
    id: 'c1114-1',
    ageGroup: '11-14',
    customerName: 'Dr. Hany',
    customerRoleAr: 'د. هاني (اجتماع سريع)',
    speechEn: '"Good morning! I am hosting a quick reading club: THREE Cheese Sandwiches and TWO Orange Juices, please."',
    speechAr: '«صباح الخير! لدينا نادي قراءة سريع: 3 ساندويتش جبن و2 عصير برتقال من فضلك.»',
    requiredCounts: { cheese_sandwich: 3, orange_juice: 2 },
    expectedTotal: 19,
    replyChoices: [
      {
        textEn: 'Welcome to our cafe, Dr. Hany! Everything is freshly packed. Your total comes to 19 dollars.',
        politeAndAccurate: true,
        feedbackAr: 'احترافية كاملة! (3×5 = 15) + (2×2 = 4) = 19 دولاراً.',
      },
      {
        textEn: 'Your bill is 17 dollars, leave it on the counter.',
        politeAndAccurate: false,
        feedbackAr: 'الحساب ناقص: 15 + 4 = 19 دولاراً وليس 17.',
      },
      {
        textEn: 'Make your own sandwiches, please.',
        politeAndAccurate: false,
        feedbackAr: 'الضيافة الجيدة تتطلب خدمة مهذبة وسريعة!',
      },
    ],
  },
  {
    id: 'c1114-2',
    ageGroup: '11-14',
    customerName: 'Coach Farida',
    customerRoleAr: 'كابتن فريدة (مكافأة الفريق)',
    speechEn: '"Hello! My debate team won today! Give us TWO Pizza Slices, TWO Strawberry Shakes, and ONE Apple Pie."',
    speechAr: '«أهلاً! فريقي فاز اليوم! أعطنا 2 بيتزا و2 ميلك شيك فراولة و1 فطيرة تفاح.»',
    requiredCounts: { pizza_slice: 2, milkshake: 2, apple_pie: 1 },
    expectedTotal: 26,
    replyChoices: [
      {
        textEn: 'Congratulations to your debate team! All five items are ready—your total is 26 dollars.',
        politeAndAccurate: true,
        feedbackAr: 'تهنئة راقية وحساب ذهني سريع: (12) + (10) + (4) = 26 دولاراً!',
      },
      {
        textEn: 'Congratulations! Pay 22 dollars total.',
        politeAndAccurate: false,
        feedbackAr: 'فطيرة التفاح غير محسوبة! 12 + 10 + 4 = 26 دولاراً.',
      },
      {
        textEn: 'That is too many items, pick just one.',
        politeAndAccurate: false,
        feedbackAr: 'تقدر بسهولة تجهيز الطلبات الخمسة في الصينية!',
      },
    ],
  },
  {
    id: 'c1114-3',
    ageGroup: '11-14',
    customerName: 'Ms. Heba',
    customerRoleAr: 'أ. هبة (تجهيز مكتبة الفصل)',
    speechEn: '"Excuse me, could I order TWO Storybooks, ONE Science Kit, and TWO Color Pencils?"',
    speechAr: '«لو سمحت، هل يمكنني طلب كتابي قصص (2)، حقيبة تجارب علمية (1)، وعلبتي ألوان (2)؟»',
    requiredCounts: { storybook: 2, science_kit: 1, pencil_set: 2 },
    expectedTotal: 30,
    replyChoices: [
      {
        textEn: 'Certainly, Ms. Heba! Your classroom supplies come to 30 dollars. Thank you for inspiring students!',
        politeAndAccurate: true,
        feedbackAr: 'حساب مثالي! (2×6=12) + (10) + (2×4=8) = 30 دولاراً!',
      },
      {
        textEn: 'Here are the gifts, pay 26 dollars please.',
        politeAndAccurate: false,
        feedbackAr: 'تأكّد من الجمع: 12 + 10 + 8 = 30 دولاراً.',
      },
      {
        textEn: 'Why are teachers buying science kits?',
        politeAndAccurate: false,
        feedbackAr: 'استخدم دائماً لغة إنجليزية لائقة ومحترفة مع المعلمين والزبائن.',
      },
    ],
  },
  {
    id: 'c1114-4',
    ageGroup: '11-14',
    customerName: 'Ziad & Twins',
    customerRoleAr: 'زياد وإخوته التوأم',
    speechEn: '"Hi! We would love THREE Choco Cupcakes, TWO Apple Pies, and ONE Toy Robot, please!"',
    speechAr: '«أهلاً! نريد 3 كب كيك شوكولاتة و2 فطيرة تفاح وروبوت لعبة واحد من فضلك!»',
    requiredCounts: { cupcake: 3, apple_pie: 2, toy_robot: 1 },
    expectedTotal: 25,
    replyChoices: [
      {
        textEn: 'Coming right up! Your snacks and toy robot total 25 dollars. Have a wonderful afternoon!',
        politeAndAccurate: true,
        feedbackAr: 'مبدع! (3×3=9) + (2×4=8) + 8 = 25 دولاراً!',
      },
      {
        textEn: 'Everything is 21 dollars today.',
        politeAndAccurate: false,
        feedbackAr: 'تذكّر: 9 + 8 + 8 = 25 دولاراً وليس 21.',
      },
      {
        textEn: 'Take your boxes without thanking me.',
        politeAndAccurate: false,
        feedbackAr: 'اللباقة والإيجابية أساس المحادثة الإنجليزية!',
      },
    ],
  },
  {
    id: 'c1114-5',
    ageGroup: '11-14',
    customerName: 'Nadia the Coder',
    customerRoleAr: 'نادية (مسابقة الهاكاثون)',
    speechEn: '"Hello! Before coding begins, could I get ONE Science Kit, ONE Strawberry Shake, and TWO Cheese Sandwiches?"',
    speechAr: '«أهلاً! قبل مسابقة البرمجة، هل أستطيع أخذ حقيبة علوم و1 ميلك شيك و2 ساندويتش جبن؟»',
    requiredCounts: { science_kit: 1, milkshake: 1, cheese_sandwich: 2 },
    expectedTotal: 25,
    replyChoices: [
      {
        textEn: 'Best of luck at the hackathon! Everything is packed cleanly—that will be 25 dollars.',
        politeAndAccurate: true,
        feedbackAr: 'رائع! حقيبة (10) + شيك (5) + ساندويتشين (10) = 25 دولاراً!',
      },
      {
        textEn: 'Your total is 20 dollars only.',
        politeAndAccurate: false,
        feedbackAr: 'الساندويتشات عددها 2 (2×5=10): إذن 10 + 5 + 10 = 25 دولاراً.',
      },
      {
        textEn: 'Coders should skip lunch!',
        politeAndAccurate: false,
        feedbackAr: 'الطعام الصحي والابتسامة يمنحان طاقة للبرمجة!',
      },
    ],
  },
  {
    id: 'c1114-6',
    ageGroup: '11-14',
    customerName: 'Grand Celebration',
    customerRoleAr: 'طلب الحفل الختامي الكبير',
    speechEn: '"Good evening! For our closing party: ONE Toy Robot, ONE Storybook, TWO Pizza Slices, and THREE Apple Pies!"',
    speechAr: '«مساء الخير! لحفل الختام: 1 روبوت لعبة، 1 كتاب قصص، 2 قطعة بيتزا، و3 فطائر تفاح!»',
    requiredCounts: { toy_robot: 1, storybook: 1, pizza_slice: 2, apple_pie: 3 },
    expectedTotal: 38,
    replyChoices: [
      {
        textEn: 'What a grand celebration! Everything is verified—your complete total is 38 dollars. Enjoy the party!',
        politeAndAccurate: true,
        feedbackAr: 'أستاذ حساب وإنجليزي! 8 + 6 + 12 + 12 = 38 دولاراً!',
      },
      {
        textEn: 'Your bill is 34 dollars, see you later.',
        politeAndAccurate: false,
        feedbackAr: 'أعد الجمع بدقة: 8 + 6 + (2×6=12) + (3×4=12) = 38 دولاراً!',
      },
      {
        textEn: 'Please calculate the bill yourself!',
        politeAndAccurate: false,
        feedbackAr: 'خدمة العملاء الممتازة تشمل الحساب الدقيق والترحيب الدافئ.',
      },
    ],
  },
];
