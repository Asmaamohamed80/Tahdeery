export type CodingDirection = 0 | 1 | 2 | 3; // 0: UP, 1: RIGHT, 2: DOWN, 3: LEFT

export type AtomicCommand = 'move' | 'left' | 'right' | 'jump';

export interface LoopCommandBlock {
  id: string;
  kind: 'loop';
  times: 2 | 3 | 4;
  pattern: AtomicCommand[]; // 1 to 4 commands repeated `times`
  presetLabelAr: string;
  presetLabelEn: string;
}

export interface SimpleCommandBlock {
  id: string;
  kind: 'simple';
  cmd: AtomicCommand;
}

export type ProgramBlock = SimpleCommandBlock | LoopCommandBlock;

export interface CodingLevel {
  id: number;
  titleAr: string;
  titleEn: string;
  conceptAr: string;
  conceptEn: string;
  goalSummaryAr: string;
  goalSummaryEn: string;
  gridSize: number;
  start: { row: number; col: number; dir: CodingDirection };
  goal: { row: number; col: number };
  rocks: Array<[number, number]>;
  stars: Array<[number, number]>;
  parBlocks: number;
  allowJump: boolean;
  allowLoop: boolean;
  starterHintAr: string;
  starterHintEn: string;
}

export const CODING_LEVELS: CodingLevel[] = [
  {
    id: 1,
    titleAr: 'المستوى 1: خطواتك الأولى (Sequences)',
    titleEn: 'Level 1: First Steps (Sequences)',
    conceptAr: 'التسلسل البرمجي: ترتيب الأوامر خطوة بخطوة',
    conceptEn: 'Sequencing: ordering commands step-by-step',
    goalSummaryAr: 'وجّه الروبوت ليو ليلتقط النجمة ثم يصل إلى العلم الأخضر.',
    goalSummaryEn: 'Guide Robot Leo to collect the star and reach the green flag.',
    gridSize: 5,
    start: { row: 4, col: 0, dir: 1 },
    goal: { row: 2, col: 3 },
    rocks: [
      [3, 1],
      [2, 1],
      [4, 3],
    ],
    stars: [[4, 2]],
    parBlocks: 7,
    allowJump: false,
    allowLoop: false,
    starterHintAr: 'تقدّم خطوتين للأمام لالتقاط النجمة، ثم لف يساراً واصعد خطوتين، ثم لف يميناً.',
    starterHintEn: 'Move 2 steps to grab the star, turn left, move 2 steps up, then turn right and move.',
  },
  {
    id: 2,
    titleAr: 'المستوى 2: صيّاد النجوم (Turns & Pathing)',
    titleEn: 'Level 2: Star Collector (Turns & Pathing)',
    conceptAr: 'التوجيه المكاني: التحكّم في الانعطاف يميناً ويساراً',
    conceptEn: 'Navigation: combining forward moves with turns',
    goalSummaryAr: 'اجمع النجمتين قبل الوصول إلى خط النهاية دون الاصطدام بالصخور.',
    goalSummaryEn: 'Collect both stars before reaching the flag without hitting rocks.',
    gridSize: 5,
    start: { row: 0, col: 0, dir: 1 },
    goal: { row: 3, col: 3 },
    rocks: [
      [1, 1],
      [1, 2],
      [2, 0],
      [3, 1],
    ],
    stars: [
      [0, 3],
      [2, 3],
    ],
    parBlocks: 7,
    allowJump: false,
    allowLoop: true,
    starterHintAr: 'سرْ 3 خطوات يميناً، ثم لف لليمين لتتجه للأسفل وسرْ 3 خطوات.',
    starterHintEn: 'Move 3 steps right (or use Repeat ×3!), turn right to face down, then move 3 steps.',
  },
  {
    id: 3,
    titleAr: 'المستوى 3: اقفز فوق الصخرة! (Special Action)',
    titleEn: 'Level 3: Jump the Obstacle!',
    conceptAr: 'الدوال الخاصة: استخدام أمر القفز (Jump) لتخطي الحواجز',
    conceptEn: 'Actions: using Jump() to leap cleanly over a rock',
    goalSummaryAr: 'استخدم زر «اقفز (Jump)» لتخطي الصخور والوصول للعلم.',
    goalSummaryEn: 'Use the Jump block to leap over rocks cleanly to the goal.',
    gridSize: 5,
    start: { row: 4, col: 0, dir: 0 },
    goal: { row: 0, col: 2 },
    rocks: [
      [2, 0],
      [1, 1],
      [0, 1],
      [3, 2],
    ],
    stars: [[1, 0]],
    parBlocks: 5,
    allowJump: true,
    allowLoop: false,
    starterHintAr: 'تقدّم خطوة، ثم اقفز فوق الصخرة، ثم تقدّم خطوة، لف يميناً واقفز للعلم!',
    starterHintEn: 'Move once, Jump over the rock, Move once, Turn Right, and Jump to the flag!',
  },
  {
    id: 4,
    titleAr: 'المستوى 4: قوة الحلقات التكرارية (Loops)',
    titleEn: 'Level 4: Power of Loops (Repeat)',
    conceptAr: 'الحلقات التكرارية (Loops): اختصار الكود الطويل بأمر Repeat',
    conceptEn: 'Loops: replacing repeated steps with a clean Repeat block',
    goalSummaryAr: 'استخدم «حلقة التكرار ×4» لعبور الصف الطويل وجمع كل النجوم!',
    goalSummaryEn: 'Use Repeat ×4 blocks to sweep the path and collect all 3 stars!',
    gridSize: 5,
    start: { row: 4, col: 0, dir: 0 },
    goal: { row: 0, col: 4 },
    rocks: [
      [3, 1],
      [2, 1],
      [1, 1],
      [3, 3],
      [2, 3],
    ],
    stars: [
      [2, 0],
      [0, 0],
      [0, 2],
    ],
    parBlocks: 4,
    allowJump: true,
    allowLoop: true,
    starterHintAr: 'جرّب: تكرار (تقدّم ×4) ← لف يمين ← تكرار (تقدّم ×4)! 3 كتل فقط!',
    starterHintEn: 'Try: Repeat ×4 (Move) -> Turn Right -> Repeat ×4 (Move)!',
  },
  {
    id: 5,
    titleAr: 'المستوى 5: سُلّم المبرمج الذكي (Pattern Loops)',
    titleEn: 'Level 5: The Smart Staircase (Pattern Loops)',
    conceptAr: 'اكتشاف الأنماط المتكررة وتجميعها في حلقة واحدة',
    conceptEn: 'Pattern recognition: repeating a multi-step staircase routine',
    goalSummaryAr: 'اصعد السلم المليء بالنجوم حتى العلم باستخدام نمط «درجة السلم».',
    goalSummaryEn: 'Climb the rocky staircase to the flag using repeating steps.',
    gridSize: 5,
    start: { row: 4, col: 0, dir: 0 },
    goal: { row: 1, col: 3 },
    rocks: [
      [4, 1],
      [3, 2],
      [2, 3],
      [2, 0],
      [1, 1],
    ],
    stars: [
      [3, 1],
      [2, 2],
    ],
    parBlocks: 4,
    allowJump: true,
    allowLoop: true,
    starterHintAr: 'استخدم حلقة «صعود درجة سلم ×3» من قائمة التكرار أو اكتب الخطوات يدوياً!',
    starterHintEn: 'Use the "Staircase Step ×3" loop block or build each turn manually!',
  },
  {
    id: 6,
    titleAr: 'المستوى 6: تحدي المبرمج العبقري (Grand Maze)',
    titleEn: 'Level 6: Grand Coder Maze Challenge',
    conceptAr: 'التحدي الشامل: دمج التسلسل والقفز والدوران والحلقات معاً',
    conceptEn: 'Master Challenge: combining Sequences, Jump, Turns & Loops',
    goalSummaryAr: 'اجمع كل النجوم الثلاث داخل المتاهة وأوصل ليو إلى البوابة النهائية!',
    goalSummaryEn: 'Collect all 3 stars across the maze and reach the top-left portal!',
    gridSize: 5,
    start: { row: 4, col: 4, dir: 3 },
    goal: { row: 0, col: 0 },
    rocks: [
      [4, 2],
      [3, 0],
      [3, 1],
      [3, 3],
      [1, 1],
      [1, 2],
      [1, 3],
      [0, 2],
    ],
    stars: [
      [4, 0],
      [2, 2],
      [0, 4],
    ],
    parBlocks: 14,
    allowJump: true,
    allowLoop: true,
    starterHintAr: 'تحرك واقفز للنجمة الأولى، ثم اقفز للأعلى، اعبر الوسط للنجمة الثانية والثالثة، ثم اقفز نحو (0,0)!',
    starterHintEn: 'Move & Jump to Star 1, Turn Right & Jump up, cross the middle for Stars 2 & 3, then Jump home!',
  },
];

// --- GAME 2: LogicLab (If / Else Conditionals, Operators & Bug Hunter) ---

export type LogicConditionKey =
  | 'isApple'
  | 'isGem'
  | 'isBattery'
  | 'isHazard'
  | 'isEven'
  | 'else';

export type LogicActionKey =
  | 'packBox'
  | 'vaultGem'
  | 'chargeBot'
  | 'ejectTrash'
  | 'activateShield';

export interface LogicRuleBlock {
  id: string;
  condition: LogicConditionKey;
  action: LogicActionKey;
}

export interface ConveyorParcel {
  id: string;
  kind: 'apple' | 'gem' | 'battery' | 'hazard' | 'trash' | 'number';
  labelEn: string;
  numValue?: number;
  expectedAction: LogicActionKey;
}

export interface LogicLabMission {
  id: number;
  isBugHunter?: boolean;
  titleAr: string;
  titleEn: string;
  conceptAr: string;
  conceptEn: string;
  goalAr: string;
  goalEn: string;
  allowedConditions: LogicConditionKey[];
  allowedActions: LogicActionKey[];
  starterRules: LogicRuleBlock[];
  items: ConveyorParcel[];
  hintAr: string;
  hintEn: string;
}

export const CONDITION_LABELS: Record<LogicConditionKey, string> = {
  isApple: 'item === "apple"',
  isGem: 'item === "gem"',
  isBattery: 'item === "battery"',
  isHazard: 'item === "hazard"',
  isEven: 'number % 2 === 0',
  else: 'else',
};

export const ACTION_LABELS: Record<LogicActionKey, string> = {
  packBox: 'packBox()',
  vaultGem: 'storeInVault()',
  chargeBot: 'chargeBattery()',
  ejectTrash: 'recycleTrash()',
  activateShield: 'activateShield()',
};

export const LOGIC_LAB_MISSIONS: LogicLabMission[] = [
  {
    id: 1,
    titleAr: 'المهمة 1: أول جملة شرط (If / Else)',
    titleEn: 'Mission 1: First If / Else Gate',
    conceptAr: 'الشروط المنطقية: توجيه خط الإنتاج حسب نوع العنصر',
    conceptEn: 'Conditionals: routing conveyor items with if / else',
    goalAr: 'ضع قاعدة لتعبئة التفاح (packBox) وتدوير المخلفات (recycleTrash) لباقي العناصر.',
    goalEn: 'Pack every apple with packBox(), and send anything else to recycleTrash().',
    allowedConditions: ['isApple', 'else'],
    allowedActions: ['packBox', 'ejectTrash'],
    starterRules: [
      { id: 'r1-1', condition: 'isApple', action: 'packBox' },
    ],
    items: [
      { id: 'i1', kind: 'apple', labelEn: 'apple', expectedAction: 'packBox' },
      { id: 'i2', kind: 'trash', labelEn: 'trash', expectedAction: 'ejectTrash' },
      { id: 'i3', kind: 'apple', labelEn: 'apple', expectedAction: 'packBox' },
      { id: 'i4', kind: 'trash', labelEn: 'trash', expectedAction: 'ejectTrash' },
      { id: 'i5', kind: 'apple', labelEn: 'apple', expectedAction: 'packBox' },
    ],
    hintAr: 'المشروع ناقص فرع else! أضف قاعدة else وعيّن لها recycleTrash().',
    hintEn: 'Only the else branch is missing! Add an "else" rule set to recycleTrash().',
  },
  {
    id: 2,
    titleAr: 'المهمة 2: تعدد الشروط (Else If)',
    titleEn: 'Mission 2: Multi-Branch (Else If)',
    conceptAr: 'الاختيار المتعدد: التفرقة بين 3 أنواع مختلفة على خط السير',
    conceptEn: 'Chained Branches: handling Gems, Batteries & Trash',
    goalAr: 'خزّن الجواهر (storeInVault)، اشحن البطاريات (chargeBattery)، ودوّر المخلفات (recycleTrash).',
    goalEn: 'Route gems to storeInVault(), batteries to chargeBattery(), else recycleTrash().',
    allowedConditions: ['isGem', 'isBattery', 'else'],
    allowedActions: ['vaultGem', 'chargeBot', 'ejectTrash'],
    starterRules: [],
    items: [
      { id: 'm2-1', kind: 'gem', labelEn: 'gem', expectedAction: 'vaultGem' },
      { id: 'm2-2', kind: 'battery', labelEn: 'battery', expectedAction: 'chargeBot' },
      { id: 'm2-3', kind: 'trash', labelEn: 'trash', expectedAction: 'ejectTrash' },
      { id: 'm2-4', kind: 'gem', labelEn: 'gem', expectedAction: 'vaultGem' },
      { id: 'm2-5', kind: 'battery', labelEn: 'battery', expectedAction: 'chargeBot' },
      { id: 'm2-6', kind: 'trash', labelEn: 'trash', expectedAction: 'ejectTrash' },
    ],
    hintAr: 'رتّب 3 قواعد: if (gem) ← else if (battery) ← else (recycleTrash).',
    hintEn: 'Stack 3 rules: if (gem) -> storeInVault(), else if (battery) -> chargeBattery(), else -> recycleTrash().',
  },
  {
    id: 3,
    isBugHunter: true,
    titleAr: 'المهمة 3: صائد الأخطاء! (Bug Hunter)',
    titleEn: 'Mission 3: Bug Hunter! Fix the Code',
    conceptAr: 'اكتشاف الأخطاء (Debugging): تصحيح كود مصنع معطّل قبل وقوع كارثة!',
    conceptEn: 'Debugging: spot & repair the wrong actions in a broken script',
    goalAr: 'الكود الحالي به خطآن! شغّل السير لتكتشف الكارثة ثم صحّح القواعد المعطّلة.',
    goalEn: 'This script has 2 bugs! Run it to spot the alerts, then fix the wrong actions.',
    allowedConditions: ['isHazard', 'isBattery', 'isGem', 'else'],
    allowedActions: ['activateShield', 'chargeBot', 'vaultGem', 'packBox'],
    starterRules: [
      { id: 'b1', condition: 'isHazard', action: 'packBox' },
      { id: 'b2', condition: 'isBattery', action: 'vaultGem' },
      { id: 'b3', condition: 'isGem', action: 'vaultGem' },
      { id: 'b4', condition: 'else', action: 'packBox' },
    ],
    items: [
      { id: 'm3-1', kind: 'apple', labelEn: 'apple', expectedAction: 'packBox' },
      { id: 'm3-2', kind: 'hazard', labelEn: 'hazard', expectedAction: 'activateShield' },
      { id: 'm3-3', kind: 'battery', labelEn: 'battery', expectedAction: 'chargeBot' },
      { id: 'm3-4', kind: 'gem', labelEn: 'gem', expectedAction: 'vaultGem' },
      { id: 'm3-5', kind: 'hazard', labelEn: 'hazard', expectedAction: 'activateShield' },
    ],
    hintAr: 'انتبه: الخطر (hazard) يجب أن يفعّل activateShield()، والبطارية تذهب إلى chargeBattery()!',
    hintEn: 'Fix rule #1 (hazard -> activateShield()) and rule #2 (battery -> chargeBattery()).',
  },
  {
    id: 4,
    titleAr: 'المهمة 4: أرقام البرمجة (Modulo % 2)',
    titleEn: 'Mission 4: Math & Even/Odd Numbers',
    conceptAr: 'العمليات الحسابية في الكود: التمييز بين الزوجي والفردي بـ (% 2 === 0)',
    conceptEn: 'Modulo Operator: separating Even vs Odd numbered crates',
    goalAr: 'أرسل الأرقام الزوجية (number % 2 === 0) إلى storeInVault() والأرقام الفردية إلى packBox().',
    goalEn: 'Send even numbers (number % 2 === 0) to storeInVault(), and odd numbers to packBox().',
    allowedConditions: ['isEven', 'else'],
    allowedActions: ['vaultGem', 'packBox'],
    starterRules: [],
    items: [
      { id: 'm4-1', kind: 'number', labelEn: '4', numValue: 4, expectedAction: 'vaultGem' },
      { id: 'm4-2', kind: 'number', labelEn: '7', numValue: 7, expectedAction: 'packBox' },
      { id: 'm4-3', kind: 'number', labelEn: '12', numValue: 12, expectedAction: 'vaultGem' },
      { id: 'm4-4', kind: 'number', labelEn: '9', numValue: 9, expectedAction: 'packBox' },
      { id: 'm4-5', kind: 'number', labelEn: '20', numValue: 20, expectedAction: 'vaultGem' },
      { id: 'm4-6', kind: 'number', labelEn: '3', numValue: 3, expectedAction: 'packBox' },
    ],
    hintAr: 'الأرقام 4 و12 و20 زوجية (باقي قسمتها على 2 يساوي 0).',
    hintEn: '4, 12, and 20 have remainder 0 when divided by 2 -> storeInVault(), else -> packBox().',
  },
  {
    id: 5,
    titleAr: 'المهمة 5: تحدي المصنع الآلي الكامل',
    titleEn: 'Mission 5: Master Automation Rush',
    conceptAr: 'الترتيب والأولوية البرمجية: إدارة كل أنواع الشحنات بأمان تام',
    conceptEn: 'Priority Logic: routing Hazards, Gems, Batteries, Apples & Trash',
    goalAr: 'قم ببناء نظام حماية وتوجيه كامل لـ 7 شحنات متنوعة بدون أي خطأ!',
    goalEn: 'Build a complete 5-branch sorting algorithm for all 7 mixed cargo parcels!',
    allowedConditions: ['isHazard', 'isGem', 'isBattery', 'isApple', 'else'],
    allowedActions: ['activateShield', 'vaultGem', 'chargeBot', 'packBox', 'ejectTrash'],
    starterRules: [],
    items: [
      { id: 'm5-1', kind: 'gem', labelEn: 'gem', expectedAction: 'vaultGem' },
      { id: 'm5-2', kind: 'hazard', labelEn: 'hazard', expectedAction: 'activateShield' },
      { id: 'm5-3', kind: 'battery', labelEn: 'battery', expectedAction: 'chargeBot' },
      { id: 'm5-4', kind: 'apple', labelEn: 'apple', expectedAction: 'packBox' },
      { id: 'm5-5', kind: 'trash', labelEn: 'trash', expectedAction: 'ejectTrash' },
      { id: 'm5-6', kind: 'hazard', labelEn: 'hazard', expectedAction: 'activateShield' },
      { id: 'm5-7', kind: 'gem', labelEn: 'gem', expectedAction: 'vaultGem' },
    ],
    hintAr: 'ضع else في آخر القائمة دائماً لكي لا يلتهم بقية الشروط قبل فحصها!',
    hintEn: 'Always keep "else" at the bottom so specific checks (hazard, gem, battery, apple) run first!',
  },
];

