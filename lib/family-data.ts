export type KidTheme = 'jungle' | 'space' | 'ocean' | 'candy'
export type KidAvatar = 'photo' | 'fox' | 'robot' | 'unicorn'
export type StickerId = 'rocket' | 'dino' | 'rainbow' | 'star' | 'ball' | 'cat'
export type CardColor = 'lime' | 'sky' | 'grape' | 'sunset' | 'forest'
export type GoalIcon = 'bike' | 'gamepad' | 'gift' | 'plane' | 'heart' | 'music'
export type TaskStatus = 'todo' | 'submitted' | 'done'
export type BlockedCategory = 'Gaming' | 'Fast food' | 'App stores' | 'Streaming'

export type Goal = { id: string; name: string; target: number; saved: number; icon: GoalIcon }
export type Task = { id: string; title: string; reward: number; status: TaskStatus; repeat: 'once' | 'weekly' }
export type PlacedSticker = { id: string; sticker: StickerId; slot: number }
export type KidActivity = { id: string; label: string; amount: number; when: string; kind: 'gift' | 'task' | 'allowance' | 'spend' | 'goal' | 'lesson' }

export type KidControls = {
  cardLocked: boolean
  dailyLimit: number
  online: boolean
  atm: boolean
  approveOver: number
  blocked: BlockedCategory[]
  learnBonus: number
  canCustomize: { theme: boolean; avatar: boolean; stickers: boolean }
}

export type Kid = {
  id: string
  name: string
  age: number
  birthday: string
  photo: string
  avatar: KidAvatar
  theme: KidTheme
  balance: number
  cardMask: string
  accountNumber: string
  cardColor: CardColor
  stickers: PlacedSticker[]
  goals: Goal[]
  tasks: Task[]
  allowance: { amount: number; day: string; savePct: number; on: boolean }
  controls: KidControls
  xp: number
  lessonsDone: string[]
  streak: number
  activity: KidActivity[]
}

export const parentProfile = { name: 'Maya', photo: '/images/family/maya.webp' }

export const avatarSrc: Record<Exclude<KidAvatar, 'photo'>, string> = {
  fox: '/images/family/avatar-fox.webp',
  robot: '/images/family/avatar-robot.webp',
  unicorn: '/images/family/avatar-unicorn.webp',
}

export const avatarLabels: Record<KidAvatar, string> = { photo: 'My photo', fox: 'Finn the Fox', robot: 'Bolt the Robot', unicorn: 'Luna the Unicorn' }

export const stickerSrc: Record<StickerId, string> = {
  rocket: '/images/family/sticker-rocket.webp',
  dino: '/images/family/sticker-dino.webp',
  rainbow: '/images/family/sticker-rainbow.webp',
  star: '/images/family/sticker-star.webp',
  ball: '/images/family/sticker-ball.webp',
  cat: '/images/family/sticker-cat.webp',
}

/** Sticker slots on the card, as % positions and rotation, so stickers never cover the card number. */
export const stickerSlots = [
  { top: 8, left: 62, rotate: -12 },
  { top: 36, left: 74, rotate: 10 },
  { top: 6, left: 40, rotate: 8 },
  { top: 52, left: 52, rotate: -6 },
  { top: 30, left: 50, rotate: 14 },
  { top: 4, left: 80, rotate: -4 },
]

export const themes: Record<KidTheme, { label: string; bg: string; panel: string; accent: string; accentText: string; ink: string; soft: string }> = {
  jungle: { label: 'Jungle', bg: 'bg-[#e9f9d2]', panel: 'bg-white', accent: 'bg-[#2fb24c]', accentText: 'text-white', ink: 'text-[#123d1d]', soft: 'bg-[#c6f26b]' },
  space: { label: 'Space', bg: 'bg-[#1d1b4b]', panel: 'bg-[#2c2a6b]', accent: 'bg-[#ffcf3f]', accentText: 'text-[#1d1b4b]', ink: 'text-white', soft: 'bg-[#4b46a8]' },
  ocean: { label: 'Ocean', bg: 'bg-[#dff4ff]', panel: 'bg-white', accent: 'bg-[#0f8fd6]', accentText: 'text-white', ink: 'text-[#0b3550]', soft: 'bg-[#a8e2ff]' },
  candy: { label: 'Candy', bg: 'bg-[#ffe6f2]', panel: 'bg-white', accent: 'bg-[#ec4a96]', accentText: 'text-white', ink: 'text-[#5a1238]', soft: 'bg-[#ffc2de]' },
}

export const cardColors: Record<CardColor, { label: string; cls: string; text: string }> = {
  lime: { label: 'Lime', cls: 'bg-[#c6f26b]', text: 'text-[#0b2617]' },
  sky: { label: 'Sky', cls: 'bg-[#7cd3ff]', text: 'text-[#0b3550]' },
  grape: { label: 'Grape', cls: 'bg-[#7b5cff]', text: 'text-white' },
  sunset: { label: 'Sunset', cls: 'bg-[#ff8a3d]', text: 'text-[#3d1500]' },
  forest: { label: 'Forest', cls: 'bg-[#0b2617]', text: 'text-[#eaf5e6]' },
}

export const goalIcons: GoalIcon[] = ['bike', 'gamepad', 'gift', 'plane', 'heart', 'music']

export const allBlocked: BlockedCategory[] = ['Gaming', 'Fast food', 'App stores', 'Streaming']

export type Lesson = {
  id: string
  title: string
  blurb: string
  xp: number
  badge: string
  minAge: number
  question: string
  options: string[]
  answer: number
  why: string
}

export const lessons: Lesson[] = [
  {
    id: 'needs',
    title: 'Needs vs. wants',
    blurb: 'Is it something you need, or something you want?',
    xp: 20,
    badge: 'Smart Chooser',
    minAge: 5,
    question: 'Which one is a NEED?',
    options: ['A new video game', 'Lunch for school', 'A third hoodie'],
    answer: 1,
    why: 'Food keeps you going. Games are fun, but they’re a want.',
  },
  {
    id: 'save',
    title: 'Why we save',
    blurb: 'Little by little, a little becomes a lot.',
    xp: 20,
    badge: 'Super Saver',
    minAge: 5,
    question: 'You save $2 every week. How much after 5 weeks?',
    options: ['$7', '$10', '$12'],
    answer: 1,
    why: '$2 × 5 weeks = $10. That’s the magic of saving regularly!',
  },
  {
    id: 'interest',
    title: 'Money that grows',
    blurb: 'Banks pay you a little extra for saving. That’s interest!',
    xp: 30,
    badge: 'Money Grower',
    minAge: 7,
    question: 'What is interest?',
    options: ['A fee you pay to the bank', 'Extra money the bank pays you for saving', 'A type of coin'],
    answer: 1,
    why: 'When your money sits in savings, the bank pays you for keeping it there.',
  },
  {
    id: 'card',
    title: 'Cards are real money',
    blurb: 'Tapping a card spends money just like cash.',
    xp: 30,
    badge: 'Card Pro',
    minAge: 8,
    question: 'You tap your card for a $4 snack. What happens?',
    options: ['Nothing, cards are free', '$4 leaves your account', 'You get $4'],
    answer: 1,
    why: 'Every tap takes real money from your account. Always check the price first.',
  },
  {
    id: 'scams',
    title: 'Spot the scam',
    blurb: 'Learn the tricks people use to take your money online.',
    xp: 40,
    badge: 'Scam Spotter',
    minAge: 9,
    question: 'A game chat says “Send your card number for free coins!” You…',
    options: ['Send it fast', 'Tell a grown-up and ignore it', 'Ask a friend to send theirs'],
    answer: 1,
    why: 'Never share your card number. Real games don’t ask for it in chat.',
  },
  {
    id: 'budget',
    title: 'Make a mini budget',
    blurb: 'Give every dollar a job: spend, save or share.',
    xp: 40,
    badge: 'Budget Boss',
    minAge: 9,
    question: 'You get $10. A good split is…',
    options: ['$10 spend, $0 save', '$5 spend, $4 save, $1 share', '$0 spend, $0 save'],
    answer: 1,
    why: 'Splitting means you get treats now AND reach your goals later.',
  },
]

export const levels = [
  { name: 'Coin Cub', min: 0 },
  { name: 'Penny Pro', min: 60 },
  { name: 'Savings Star', min: 120 },
  { name: 'Money Master', min: 180 },
]

export function levelFor(xp: number) {
  const idx = levels.reduce((acc, l, i) => (xp >= l.min ? i : acc), 0)
  const next = levels[idx + 1]
  return { level: levels[idx], index: idx, next, progress: next ? (xp - levels[idx].min) / (next.min - levels[idx].min) : 1 }
}

export type GiftOccasion = 'birthday' | 'grades' | 'holiday' | 'milestone' | 'just-because'

export const giftOccasions: { id: GiftOccasion; label: string; message: string; tone: string }[] = [
  { id: 'birthday', label: 'Birthday', message: 'Happy birthday! Love you to the moon.', tone: 'bg-[#ffcf3f]' },
  { id: 'grades', label: 'Great grades', message: 'So proud of your report card!', tone: 'bg-[#7cd3ff]' },
  { id: 'holiday', label: 'Holiday', message: 'Happy holidays, sweetheart!', tone: 'bg-[#ff8a3d]' },
  { id: 'milestone', label: 'Big milestone', message: 'You did it! Lost your first tooth / learned to ride / scored the goal!', tone: 'bg-[#c6f26b]' },
  { id: 'just-because', label: 'Just because', message: 'A little something because you’re awesome.', tone: 'bg-[#ffc2de]' },
]

export function defaultControls(age: number): KidControls {
  const young = age < 9
  return {
    cardLocked: false,
    dailyLimit: young ? 15 : 30,
    online: !young,
    atm: false,
    approveOver: young ? 10 : 25,
    blocked: young ? ['Gaming', 'App stores', 'Streaming'] : ['Gaming'],
    learnBonus: 1,
    canCustomize: { theme: true, avatar: true, stickers: true },
  }
}

export const initialKids: Kid[] = [
  {
    id: 'leo',
    name: 'Leo',
    age: 10,
    birthday: 'Nov 18',
    photo: '/images/family/leo.webp',
    avatar: 'fox',
    theme: 'jungle',
    balance: 46.5,
    cardMask: '3108',
    accountNumber: '4398 2210 3108',
    cardColor: 'lime',
    stickers: [
      { id: 's1', sticker: 'dino', slot: 0 },
      { id: 's2', sticker: 'ball', slot: 1 },
    ],
    goals: [
      { id: 'g1', name: 'New bike', target: 180, saved: 112, icon: 'bike' },
      { id: 'g2', name: 'Mom’s birthday gift', target: 25, saved: 9, icon: 'gift' },
    ],
    tasks: [
      { id: 't1', title: 'Feed Mochi the cat', reward: 1, status: 'submitted', repeat: 'weekly' },
      { id: 't2', title: 'Unload the dishwasher', reward: 2, status: 'todo', repeat: 'weekly' },
      { id: 't3', title: 'Read for 20 minutes', reward: 1.5, status: 'todo', repeat: 'weekly' },
      { id: 't4', title: 'Clean your room', reward: 3, status: 'done', repeat: 'weekly' },
    ],
    allowance: { amount: 10, day: 'Friday', savePct: 30, on: true },
    controls: defaultControls(10),
    xp: 70,
    lessonsDone: ['needs', 'save', 'interest'],
    streak: 4,
    activity: [
      { id: 'a1', label: 'Clean your room', amount: 3, when: 'Yesterday', kind: 'task' },
      { id: 'a2', label: 'Scoops Ice Cream', amount: -4.25, when: 'Sat', kind: 'spend' },
      { id: 'a3', label: 'Weekly allowance', amount: 10, when: 'Fri', kind: 'allowance' },
      { id: 'a4', label: 'Gift from Grandma Lin', amount: 20, when: 'Oct 28', kind: 'gift' },
    ],
  },
]

export const newKidPhotos = ['/images/family/ava.webp']
