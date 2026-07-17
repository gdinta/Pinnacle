import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, RefreshCw, TrendingUp, TrendingDown, Star, Zap, Trophy, Heart, Coins,
  LayoutDashboard, PieChart, Target, ShoppingBag, BookOpen, Play, X, Lock, Check,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── DECISIONS ────────────────────────────────────────────────────────────────
// Same core data + math as before, with story fields added:
// year, chapter, locationName, storyIntro, resultGood/Okay/Bad, lesson.
const DECISIONS = [
  {
    id: "401k",
    scene: "office",
    year: 1,
    chapter: "First Paycheck",
    locationName: "The Office",
    title: "401(k) Match Offer!",
    npc: "Your HR Manager",
    npcEmoji: "👩‍💼",
    description: "Your employer will match 100% of contributions up to 5% of your salary — free money on the table. What do you do?",
    storyIntro: "Your first real job comes with a decision that could shape your entire financial future.",
    resultGood: "You captured the full employer match — free money working for you for decades.",
    resultOkay: "You got part of the match. A decent start, but there's value still on the table.",
    resultBad: "You left the match on the table — money your employer would have given you for free.",
    lesson: "Employer matches are a guaranteed return — always worth capturing before anything else.",
    options: [
      { name: "Contribute 5% — get full match", icon: "💰", xp: 80, impact: { investments: 0.1, health: 10, retirementAge: -3 }, mood: "excited" },
      { name: "Contribute 10% — go big!", icon: "🚀", xp: 100, impact: { investments: 0.18, health: 8, retirementAge: -5 }, mood: "excited" },
      { name: "Skip it — cash is tight", icon: "😬", xp: 10, impact: { investments: 0, health: -8, retirementAge: 4 }, mood: "sad" },
      { name: "Contribute just 1%", icon: "😐", xp: 20, impact: { investments: 0.03, health: -3, retirementAge: 2 }, mood: "sad" },
    ],
  },
  {
    id: "bonus",
    scene: "bank",
    year: 2,
    chapter: "The Windfall",
    locationName: "The Bank",
    title: "$12,000 Bonus Arrived!",
    npc: "Your Financial Advisor",
    npcEmoji: "🧑‍💻",
    description: "Unexpected windfall! After taxes you'll net ~$8,000. You have debt and goals. How do you deploy this cash?",
    storyIntro: "An unexpected bonus lands in your account. What you do with it says a lot about your priorities.",
    resultGood: "You used the windfall to strengthen your finances for the long run.",
    resultOkay: "You balanced enjoying the money now with building for later.",
    resultBad: "The bonus is gone, and your finances look about the same as before it arrived.",
    lesson: "Windfalls are rare chances to make outsized progress — treat them differently than regular income.",
    options: [
      { name: "Wipe out high-interest debt", icon: "🗡️", xp: 90, impact: { debt: -8000, health: 15, retirementAge: -2 }, mood: "happy" },
      { name: "Invest in index funds", icon: "📈", xp: 95, impact: { investments: 8000, health: 10, retirementAge: -3 }, mood: "excited" },
      { name: "Split: half debt, half invest", icon: "⚖️", xp: 85, impact: { debt: -4000, investments: 4000, health: 12, retirementAge: -2 }, mood: "happy" },
      { name: "Upgrade lifestyle 🎉", icon: "🛍️", xp: 5, impact: { health: -10, retirementAge: 3 }, mood: "sad" },
    ],
  },
  {
    id: "job",
    scene: "city",
    year: 3,
    chapter: "Career Crossroads",
    locationName: "Downtown Office",
    title: "Dream Job Offer!",
    npc: "The Recruiter",
    npcEmoji: "🤝",
    description: "A recruiter offers $25k more/year but you'd need to relocate to a city with 20% higher cost of living.",
    storyIntro: "After building your skills, a recruiter reaches out with a bigger opportunity.",
    resultGood: "You made a strong career move and increased your future investing power.",
    resultOkay: "You chose stability, which protected your lifestyle but slowed wealth growth.",
    resultBad: "The move added stress without improving your long-term finances.",
    lesson: "A higher salary only helps if the cost of living and savings rate still work.",
    options: [
      { name: "Take it — negotiate relocation", icon: "✈️", xp: 90, impact: { annualIncome: 25000, health: 8, retirementAge: -4 }, mood: "excited" },
      { name: "Counter your current employer", icon: "💬", xp: 80, impact: { annualIncome: 15000, health: 6, retirementAge: -2 }, mood: "happy" },
      { name: "Decline — stability first", icon: "🏠", xp: 50, impact: { health: 5, retirementAge: 1 }, mood: "happy" },
      { name: "Ask to go fully remote", icon: "💻", xp: 100, impact: { annualIncome: 20000, health: 12, retirementAge: -5 }, mood: "excited" },
    ],
  },
  {
    id: "crash",
    scene: "storm",
    year: 4,
    chapter: "The Storm",
    locationName: "Home Office",
    title: "Market Crash -30%!",
    npc: "Wall Street News",
    npcEmoji: "📉",
    description: "Your portfolio is down big. Headlines are scary. Everyone's panicking. What's your move?",
    storyIntro: "The market turns violently. Everyone around you is reacting with fear.",
    resultGood: "You kept a level head, and time did what it always does for patient investors.",
    resultOkay: "You made a reasonable, cautious move without locking in major losses.",
    resultBad: "Fear drove the decision, and it cost you the recovery that followed.",
    lesson: "Market downturns are recoverable. Selling in a panic is what makes losses permanent.",
    options: [
      { name: "Stay the course — hold!", icon: "🧘", xp: 85, impact: { investments: 0.05, health: 8, retirementAge: -2 }, mood: "happy" },
      { name: "Buy more — it's on sale!", icon: "🛒", xp: 100, impact: { investments: 0.15, health: 10, retirementAge: -4 }, mood: "excited" },
      { name: "Sell half to cut losses", icon: "📉", xp: 20, impact: { investments: -0.15, health: -5, retirementAge: 3 }, mood: "sad" },
      { name: "Sell everything — cash out", icon: "😱", xp: 5, impact: { investments: -0.25, health: -15, retirementAge: 6 }, mood: "sad" },
    ],
  },
  {
    id: "house",
    scene: "suburb",
    year: 5,
    chapter: "Putting Down Roots",
    locationName: "Maple Street",
    title: "Buy a House?",
    npc: "Your Realtor",
    npcEmoji: "🏡",
    description: "You have enough for a 10% down on a $400k home. Rent is $2,200/mo, mortgage would be $2,600/mo.",
    storyIntro: "You've saved enough for a down payment. Now the real decision begins.",
    resultGood: "You made a housing choice that fit your finances instead of stretching them.",
    resultOkay: "You played it safe, trading opportunity for certainty.",
    resultBad: "The numbers on this one didn't line up in your favor.",
    lesson: "A house is a lifestyle decision as much as a financial one — run the numbers either way.",
    options: [
      { name: "Buy — build equity!", icon: "🏠", xp: 80, impact: { debt: 40000, investments: -40000, health: 10, retirementAge: -3 }, mood: "excited" },
      { name: "Rent & invest the difference", icon: "📊", xp: 85, impact: { investments: 40000, health: 8, retirementAge: -3 }, mood: "happy" },
      { name: "Wait and save for 20% down", icon: "⏳", xp: 60, impact: { health: 5, retirementAge: 1 }, mood: "happy" },
      { name: "Buy a cheaper starter home", icon: "🏚️", xp: 70, impact: { debt: 25000, investments: -25000, health: 6, retirementAge: -1 }, mood: "happy" },
    ],
  },
];

const SCENES = {
  office: { bg: "from-blue-900/40 via-slate-900/60 to-indigo-900/40", floor: "#1e293b", accent: "#3b82f6" },
  bank:   { bg: "from-amber-900/30 via-slate-900/60 to-yellow-900/30", floor: "#292524", accent: "#f59e0b" },
  city:   { bg: "from-purple-900/40 via-slate-900/60 to-blue-900/40",  floor: "#1e1b2e", accent: "#a855f7" },
  storm:  { bg: "from-red-900/40 via-slate-900/60 to-orange-900/40",   floor: "#1c1917", accent: "#ef4444" },
  suburb: { bg: "from-emerald-900/30 via-slate-900/60 to-teal-900/30", floor: "#14211a", accent: "#10b981" },
};

const CHARACTERS = [
  { id: "milo", name: "Milo", tagline: "Beginner / balanced", blurb: "Just starting his money journey." },
  { id: "nova", name: "Nova", tagline: "Ambitious investor", blurb: "Future-focused and always chasing growth." },
  { id: "finn", name: "Finn", tagline: "Analytical planner", blurb: "Loves the numbers and a good spreadsheet." },
  { id: "zoe",  name: "Zoe",  tagline: "Saver / budget queen", blurb: "Responsible with money, but still knows how to have fun." },
];

const VALID_MOODS = ["neutral", "happy", "sad", "excited"];
const SAVE_KEY = "moneyMovesSave";

// Every option already carries an xp value — bucket it into a story tone
// instead of hand-tagging 20 options individually.
function getTone(xp) {
  if (xp >= 75) return "good";
  if (xp >= 40) return "okay";
  return "risky";
}
const TONE_COPY = {
  good:  { label: "Great Move", color: "#22c55e", resultKey: "resultGood" },
  okay:  { label: "Okay Choice", color: "#f59e0b", resultKey: "resultOkay" },
  risky: { label: "Risky Call",  color: "#ef4444", resultKey: "resultBad" },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => (Math.abs(n) >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n).toLocaleString()}`);
const fmtSigned = (n) => `${n >= 0 ? "+" : ""}${fmt(n)}`;

function buildInitialState(form) {
  const annualExpenses = form.monthlyExpenses * 12;
  const annualInvestable = (form.salary - annualExpenses) * (form.investPct / 100);
  const netWorth = form.savings - form.debt;
  const retirementTarget = form.salary * 25;
  const yearsToRetire = Math.max(5, Math.ceil(Math.log(retirementTarget / Math.max(form.savings, 1)) / Math.log(1.07)));
  return {
    salary: form.salary, savings: form.savings, debt: form.debt,
    investments: form.savings * 0.6, annualInvestable, netWorth,
    retirementAge: Math.min(70, form.age + yearsToRetire),
    healthScore: 60, xp: 0, netWorthHistory: [netWorth],
  };
}

function applyDecision(state, form, option) {
  let s = { ...state };
  const impact = option.impact;
  if (impact.debt) s.debt = Math.max(0, s.debt + impact.debt);
  if (impact.investments) {
    if (Math.abs(impact.investments) < 1) s.investments += s.salary * Math.abs(impact.investments) * (impact.investments > 0 ? 1 : -1);
    else s.investments = Math.max(0, s.investments + impact.investments);
  }
  if (impact.annualIncome) { s.salary += impact.annualIncome; s.annualInvestable += impact.annualIncome * (form.investPct / 100); }
  if (impact.health) s.healthScore = Math.min(100, Math.max(0, s.healthScore + impact.health));
  if (impact.retirementAge) s.retirementAge = Math.min(70, Math.max(form.age + 5, s.retirementAge + impact.retirementAge));
  s.xp = (s.xp || 0) + (option.xp || 0);
  s.investments = s.investments * 1.07 + s.annualInvestable;
  s.netWorth = s.investments + s.savings - s.debt;
  s.netWorthHistory = [...s.netWorthHistory, Math.round(s.netWorth)];
  return s;
}

function saveGame(payload) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); } catch (e) { /* ignore */ }
}
function loadGame() {
  try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}

// ─── CHARACTER IMAGE ──────────────────────────────────────────────────────────
function CharacterImage({ character = "milo", mood = "neutral", size = 200, bounce = false }) {
  const safeMood = VALID_MOODS.includes(mood) ? mood : "neutral";
  const primarySrc = `/characters/${character}-${safeMood}.png`;
  const neutralSrc = `/characters/${character}-neutral.png`;

  const [src, setSrc] = useState(primarySrc);
  const [failedNeutral, setFailedNeutral] = useState(false);

  useEffect(() => {
    setSrc(primarySrc);
    setFailedNeutral(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, safeMood]);

  const handleError = () => {
    if (src !== neutralSrc) setSrc(neutralSrc);
    else setFailedNeutral(true);
  };

  const bodyAnim = bounce && safeMood === "excited" ? { y: [0, -10, 0, -6, 0] } : bounce && safeMood === "happy" ? { y: [0, -5, 0] } : {};
  const bodyTrans = { duration: safeMood === "excited" ? 0.55 : 1, repeat: Infinity, repeatType: "loop", ease: "easeInOut" };

  if (failedNeutral) {
    return (
      <motion.div animate={bodyAnim} transition={bodyTrans}
        style={{ width: size, height: size * 1.3, borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "2px dashed rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", fontWeight: 900, fontSize: size * 0.16,
          filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.4))" }}>
        {character.slice(0, 1).toUpperCase()}
      </motion.div>
    );
  }

  return (
    <motion.img src={src} alt={`${character} (${safeMood})`} onError={handleError} animate={bodyAnim} transition={bodyTrans}
      style={{ width: size, height: "auto", filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.45))", userSelect: "none", pointerEvents: "none" }}
      draggable={false} />
  );
}

// ─── SHARED BITS ──────────────────────────────────────────────────────────────
function SpeechBubble({ text, npc, npcEmoji }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.85, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }} className="relative bg-white/95 text-slate-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-xl max-w-xs">
      <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">{npcEmoji} {npc}</div>
      <p className="text-sm leading-snug font-medium">{text}</p>
      <div className="absolute -bottom-3 left-4 w-4 h-4 bg-white/95" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
    </motion.div>
  );
}

function HudBar({ label, value, max, color, icon: Icon }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-[10px] font-bold mb-0.5">
          <span className="text-white/70">{label}</span>
          <span style={{ color }}>{typeof value === "number" && max > 100 ? fmt(value) : `${Math.round(value)}${max === 100 ? "%" : ""}`}</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }} />
        </div>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "portfolio", label: "Portfolio", icon: PieChart },
  { id: "goals", label: "Goals", icon: Target },
  { id: "shop", label: "Shop", icon: ShoppingBag },
];

function BottomNav({ active, onNav }) {
  return (
    <div className="grid grid-cols-4 gap-2 mt-4">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onNav(id)}
          className="flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all"
          style={{
            borderColor: active === id ? "#f59e0b" : "rgba(255,255,255,0.08)",
            background: active === id ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.02)",
            color: active === id ? "#f59e0b" : "rgba(255,255,255,0.55)",
          }}>
          <Icon className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── SCREEN: TITLE ─────────────────────────────────────────────────────────────
function TitleScreen({ onStart, onContinue, hasSave }) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[75vh] text-center">
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
        <CharacterImage character="milo" mood="excited" size={170} bounce />
      </motion.div>

      <motion.h1 animate={{ textShadow: ["0 0 20px #f59e0b44", "0 0 40px #f59e0b88", "0 0 20px #f59e0b44"] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="font-display text-5xl sm:text-6xl font-black mt-4 mb-1"
        style={{ background: "linear-gradient(135deg,#f59e0b,#3b82f6,#f59e0b)", backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        MONEY MOVES
      </motion.h1>
      <p className="text-white/40 text-sm tracking-widest uppercase font-bold mb-8">A 20-Year Money Journey</p>

      <div className="w-full max-w-xs space-y-3">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onStart}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/30"
          style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}>
          <Play className="w-5 h-5" /> START GAME
        </motion.button>
        {hasSave && (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onContinue}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm border border-white/15 bg-white/5">
            Continue Journey
          </motion.button>
        )}
        <button onClick={() => setShowHelp(true)}
          className="w-full py-3 rounded-2xl text-white/60 font-bold text-sm flex items-center justify-center gap-2 hover:text-white/90">
          <BookOpen className="w-4 h-4" /> How to Play
        </button>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowHelp(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-sm w-full rounded-3xl border border-white/10 p-6 text-left relative"
              style={{ background: "linear-gradient(160deg,#0f172a,#1e293b)" }}>
              <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-display font-black text-xl text-white mb-3">How to Play</h3>
              <ul className="space-y-2 text-sm text-white/60 leading-relaxed">
                <li>• Pick a character, then set your starting finances.</li>
                <li>• Each life event is a real financial decision — your choice changes your Net Worth, Health, Investments, Debt, and Retirement Age.</li>
                <li>• Every couple of decisions you'll get a Year Summary showing how you're trending.</li>
                <li>• Visit the Shop, Goals, and Portfolio tabs anytime from the dashboard.</li>
                <li>• After 5 major life events, see your final results and grade.</li>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── SCREEN: INTRO STORY ───────────────────────────────────────────────────────
function IntroStoryScreen({ onBegin }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[75vh]">
      <div className="relative w-full max-w-xl rounded-3xl overflow-hidden border border-white/10 p-8"
        style={{ background: "linear-gradient(160deg,#0f172a,#1e293b,#0f172a)" }}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <CharacterImage character="milo" mood="neutral" size={130} />
          <div>
            <div className="inline-block text-[10px] font-black tracking-widest uppercase text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full mb-3">
              Year One
            </div>
            <p className="text-white text-lg leading-relaxed font-medium">
              You just started your adult money journey. Every year, your choices affect your wealth, happiness, debt, investments, and retirement age.
            </p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onBegin}
          className="w-full mt-8 py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25"
          style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}>
          BEGIN JOURNEY <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── SCREEN: CUSTOMIZE ──────────────────────────────────────────────────────────
function CustomizeScreen({ onNext }) {
  const [characterId, setCharacterId] = useState(CHARACTERS[0].id);
  const [hoverId, setHoverId] = useState(null);
  const activeId = hoverId || characterId;

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[75vh]">
      <div className="relative w-full max-w-2xl rounded-3xl overflow-hidden border border-white/10" style={{ background: "linear-gradient(160deg,#0f172a,#1e293b,#0f172a)" }}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" />
        <div className="relative p-8">
          <div className="text-center mb-6">
            <div className="inline-block text-xs font-black tracking-widest uppercase text-amber-400 bg-amber-500/15 border border-amber-500/30 px-4 py-1.5 rounded-full mb-3">
              🎮 CHARACTER SELECT
            </div>
            <h2 className="font-display text-3xl font-black text-white">Choose Your Player</h2>
            <p className="text-white/50 text-sm mt-1">Each one plays the money game a little differently</p>
          </div>

          <div className="flex justify-center mb-8 relative h-44 items-end">
            <CharacterImage character={activeId} mood={hoverId ? "excited" : "happy"} size={150} bounce />
            <div className="absolute bottom-2 w-28 h-4 rounded-full blur-sm bg-amber-500/20" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {CHARACTERS.map((c) => {
              const selected = characterId === c.id;
              return (
                <button key={c.id} onClick={() => setCharacterId(c.id)} onMouseEnter={() => setHoverId(c.id)} onMouseLeave={() => setHoverId(null)}
                  className="rounded-2xl p-3 text-center transition-all duration-200 border-2"
                  style={{ borderColor: selected ? "#f59e0b" : "rgba(255,255,255,0.08)", background: selected ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.02)", transform: selected ? "translateY(-2px)" : "none" }}>
                  <div className="h-20 flex items-end justify-center mb-2">
                    <CharacterImage character={c.id} mood="neutral" size={64} />
                  </div>
                  <div className="font-display font-black text-sm text-white">{c.name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-amber-400/80 mt-0.5">{c.tagline}</div>
                  <div className="text-[11px] text-white/40 mt-1 leading-snug">{c.blurb}</div>
                </button>
              );
            })}
          </div>

          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => onNext({ character: characterId })}
            className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/30"
            style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}>
            CONTINUE <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SCREEN: SETUP ──────────────────────────────────────────────────────────────
function SetupScreen({ avatar, onStart }) {
  const [form, setForm] = useState({ age: 28, salary: 80000, monthlyExpenses: 2500, savings: 10000, debt: 0, investPct: 15 });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }));
  const fields = [
    { key: "age", label: "Your Age", icon: "🎂", min: 18, max: 65, step: 1 },
    { key: "salary", label: "Annual Salary ($)", icon: "💵", min: 0, step: 5000 },
    { key: "monthlyExpenses", label: "Monthly Expenses ($)", icon: "🧾", min: 0, step: 100 },
    { key: "savings", label: "Current Savings ($)", icon: "🏦", min: 0, step: 1000 },
    { key: "debt", label: "Current Debt ($)", icon: "💳", min: 0, step: 1000 },
    { key: "investPct", label: "Invest % of Income", icon: "📈", min: 0, max: 50, step: 5 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center justify-center min-h-[75vh]">
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden border border-white/10" style={{ background: "linear-gradient(160deg,#0f172a,#1e293b,#0f172a)" }}>
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-400 to-blue-500" />
        <div className="p-8">
          <div className="flex flex-col items-center mb-6">
            <CharacterImage character={avatar.character} mood="neutral" size={100} />
            <div className="text-center mt-3">
              <div className="inline-block text-[10px] font-black tracking-widest uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-1">⚙️ PLAYER STATS</div>
              <h2 className="font-display text-2xl font-black text-white">Enter Your Finances</h2>
              <p className="text-white/40 text-xs mt-1">These seed your simulation</p>
            </div>
          </div>
          <div className="space-y-3 mb-6">
            {fields.map(({ key, label, icon, min, max, step }) => (
              <div key={key} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
                <span className="text-lg w-6 text-center">{icon}</span>
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block">{label}</label>
                  <input type="number" value={form[key]} onChange={set(key)} min={min} max={max} step={step} className="w-full bg-transparent text-white font-bold text-sm focus:outline-none" />
                </div>
              </div>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => onStart(form)}
            className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25"
            style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}>
            <Zap className="w-5 h-5" /> ENTER THE JOURNEY
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SCREEN: DASHBOARD ───────────────────────────────────────────────────────────
function DashboardScreen({ avatar, state, decision, onNextEvent, onNav, isComplete }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="rounded-3xl border border-white/10 p-6 mb-4" style={{ background: "linear-gradient(160deg,#0f172a,#1e293b)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
              {decision ? `Year ${decision.year} · ${decision.chapter}` : "Journey Complete"}
            </div>
            <h2 className="font-display text-2xl font-black text-white">Your Money Dashboard</h2>
          </div>
          <CharacterImage character={avatar.character} mood="happy" size={72} bounce />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={TrendingUp} label="Net Worth" value={fmt(state.netWorth)} color="#f59e0b" />
          <StatCard icon={Coins} label="Savings" value={fmt(state.savings)} color="#3b82f6" />
          <StatCard icon={TrendingUp} label="Investments" value={fmt(state.investments)} color="#22c55e" />
          <StatCard icon={TrendingDown} label="Debt" value={fmt(state.debt)} color="#ef4444" />
          <StatCard icon={Heart} label="Health" value={`${state.healthScore}%`} color="#ec4899" />
          <StatCard icon={Trophy} label="Retire Age" value={state.retirementAge} color="#a855f7" />
          <StatCard icon={Star} label="XP" value={state.xp} color="#f59e0b" />
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onNextEvent} disabled={isComplete}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}>
          <Zap className="w-5 h-5" /> NEXT LIFE EVENT <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>

      <BottomNav active="dashboard" onNav={onNav} />
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl p-3 text-center border border-white/5" style={{ background: "rgba(255,255,255,0.03)" }}>
      <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color }} />
      <div className="text-[9px] font-bold uppercase tracking-wide text-white/40">{label}</div>
      <div className="font-display font-black text-sm" style={{ color }}>{value}</div>
    </div>
  );
}

// ─── SCREEN: SIMULATION (one decision) ───────────────────────────────────────────
function SimulationScreen({ avatar, decision, xp, onConfirm }) {
  const [selectedOpt, setSelectedOpt] = useState(null);
  const scene = SCENES[decision.scene];
  const mood = selectedOpt !== null ? decision.options[selectedOpt].mood : "neutral";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className={`relative rounded-3xl overflow-hidden mb-4 bg-gradient-to-br ${scene.bg} border border-white/10`} style={{ minHeight: 320 }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 24px,white 24px,white 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,white 24px,white 25px)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-16 rounded-b-3xl" style={{ background: `linear-gradient(to top, ${scene.floor}, transparent)` }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(ellipse 60% 40% at 50% 100%, ${scene.accent}22, transparent)` }} />

        <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/50">{decision.locationName}</div>
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 border border-white/10">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-black text-xs text-amber-400">{xp} XP</span>
          </div>
        </div>

        <div className="relative z-10 text-center px-6 pt-1 pb-2">
          <div className="inline-block font-display font-black text-base sm:text-lg text-white px-4 py-1 rounded-full"
            style={{ background: `${scene.accent}33`, border: `1px solid ${scene.accent}55` }}>
            {decision.title}
          </div>
        </div>

        {/* NPC on the left, player bigger on the right */}
        <div className="relative z-10 flex items-end justify-between px-6 pb-6 pt-4 gap-4">
          <div className="flex flex-col items-start gap-2 max-w-[46%]">
            <div className="text-4xl">{decision.npcEmoji}</div>
            <AnimatePresence mode="wait">
              <SpeechBubble key={decision.id} text={decision.description} npc={decision.npc} npcEmoji={decision.npcEmoji} />
            </AnimatePresence>
          </div>
          <div className="relative shrink-0">
            <AnimatePresence mode="wait">
              <motion.div key={mood} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.25 }}>
                <CharacterImage character={avatar.character} mood={mood} size={190} bounce />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {decision.options.map((opt, i) => {
          const isSelected = selectedOpt === i;
          return (
            <motion.button key={i} onClick={() => setSelectedOpt(i)} whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}
              className="relative rounded-2xl p-4 text-left border-2 overflow-hidden transition-all"
              style={{ borderColor: isSelected ? "#f59e0b" : "rgba(255,255,255,0.07)", background: isSelected ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)" }}>
              {isSelected && <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: "inset 0 0 20px rgba(245,158,11,0.12)" }} />}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{opt.icon}</span>
                <div className="font-display font-bold text-sm text-white">{opt.name}</div>
              </div>
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <span className="text-[10px] text-white font-black">✓</span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <motion.button onClick={() => onConfirm(selectedOpt)} disabled={selectedOpt === null}
        whileHover={selectedOpt !== null ? { scale: 1.02 } : {}} whileTap={{ scale: 0.97 }}
        className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl"
        style={{ background: selectedOpt !== null ? "linear-gradient(135deg,#f59e0b,#f97316)" : "rgba(255,255,255,0.06)", color: "white" }}>
        <Zap className="w-5 h-5" /> LOCK IN DECISION <ArrowRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}

// ─── SCREEN: DECISION RESULT ──────────────────────────────────────────────────────
function DecisionResultScreen({ avatar, result, onContinue }) {
  const { decision, option, tone, deltas } = result;
  const toneInfo = TONE_COPY[tone];
  const consequence = decision[toneInfo.resultKey];

  const deltaRows = [
    { label: "Net Worth", value: deltas.netWorth, icon: TrendingUp },
    { label: "Investments", value: deltas.investments, icon: Coins },
    { label: "Debt", value: -deltas.debt, icon: TrendingDown, invert: true },
    { label: "Health", value: deltas.healthScore, icon: Heart, isPercent: true },
    { label: "Retire Age", value: -deltas.retirementAge, icon: Trophy, invert: true, isYears: true },
  ];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="rounded-3xl border border-white/10 p-6 sm:p-8" style={{ background: "linear-gradient(160deg,#0f172a,#1e293b)" }}>
      <div className="text-center mb-5">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
          className="inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-3"
          style={{ background: `${toneInfo.color}22`, color: toneInfo.color, border: `1px solid ${toneInfo.color}55` }}>
          {toneInfo.label}
        </motion.div>
        <div className="flex justify-center mb-3">
          <CharacterImage character={avatar.character} mood={option.mood} size={130} bounce />
        </div>
        <p className="text-white text-sm leading-relaxed max-w-md mx-auto">{consequence}</p>
      </div>

      <div className="flex items-center justify-center gap-1.5 mb-5">
        <Star className="w-4 h-4 text-amber-400" />
        <span className="font-display font-black text-amber-400">+{option.xp} XP</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
        {deltaRows.map(({ label, value, icon: Icon, isPercent, isYears }) => {
          if (!value) return null;
          const positive = value > 0;
          const display = isPercent ? `${value > 0 ? "+" : ""}${value}%` : isYears ? `${value > 0 ? "+" : ""}${value} yrs` : fmtSigned(value);
          return (
            <div key={label} className="rounded-xl p-2.5 text-center border border-white/5 bg-white/[0.03]">
              <Icon className="w-3 h-3 mx-auto mb-1" style={{ color: positive ? "#22c55e" : "#ef4444" }} />
              <div className="text-[9px] font-bold uppercase tracking-wide text-white/40">{label}</div>
              <div className="font-display font-black text-xs" style={{ color: positive ? "#22c55e" : "#ef4444" }}>{display}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl p-4 mb-6 border border-amber-500/20 bg-amber-500/5">
        <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">Lesson</div>
        <p className="text-white/70 text-sm leading-relaxed">{decision.lesson}</p>
      </div>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onContinue}
        className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25"
        style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}>
        CONTINUE <ArrowRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}

// ─── SCREEN: YEAR SUMMARY ─────────────────────────────────────────────────────────
function YearSummaryScreen({ chunk, avatar, onContinue }) {
  const xpGained = chunk.reduce((sum, c) => sum + c.option.xp, 0);
  const netWorthChange = chunk.reduce((sum, c) => sum + c.deltas.netWorth, 0);
  const best = chunk.reduce((a, b) => (b.option.xp > a.option.xp ? b : a));
  const risky = chunk.reduce((a, b) => (b.option.xp < a.option.xp ? b : a));
  const avgTone = xpGained / chunk.length >= 75 ? "good" : xpGained / chunk.length >= 40 ? "okay" : "risky";
  const messages = {
    good: "You're building real momentum — keep making choices like these.",
    okay: "Steady progress. A few bolder moves could accelerate things.",
    risky: "Rough stretch, but every year is a new chance to course-correct.",
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="rounded-3xl border border-white/10 p-6 sm:p-8 text-center" style={{ background: "linear-gradient(160deg,#0f172a,#1e293b)" }}>
      <div className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/15 border border-amber-500/30 px-4 py-1.5 rounded-full mb-4">
        Year {chunk[chunk.length - 1].decision.year} Complete
      </div>
      <CharacterImage character={avatar.character} mood={avgTone === "risky" ? "sad" : "excited"} size={120} bounce />
      <h2 className="font-display text-2xl font-black text-white mt-3 mb-1">Net Worth {fmtSigned(netWorthChange)}</h2>
      <p className="text-white/50 text-sm mb-6">{messages[avgTone]}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left">
        <div className="rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5">
          <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Best Choice</div>
          <div className="text-white text-sm font-bold">{best.option.name}</div>
        </div>
        <div className="rounded-2xl p-4 border border-red-500/20 bg-red-500/5">
          <div className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1">Riskiest Choice</div>
          <div className="text-white text-sm font-bold">{risky.option.name}</div>
        </div>
        <div className="rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
          <div className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">XP Gained</div>
          <div className="text-white text-sm font-bold">+{xpGained} XP</div>
        </div>
      </div>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onContinue}
        className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25"
        style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}>
        CONTINUE JOURNEY <ArrowRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}

// ─── SCREEN: PORTFOLIO (placeholder breakdown) ────────────────────────────────────
function PortfolioScreen({ state, onNav }) {
  const stocks = state.investments * 0.6;
  const bonds = state.investments * 0.25;
  const cash = state.savings;
  const realEstate = state.debt > 0 ? state.debt * 1.15 : 0; // rough placeholder if a mortgage exists
  const rows = [
    { label: "Stocks", value: stocks, color: "#3b82f6" },
    { label: "Bonds", value: bonds, color: "#a855f7" },
    { label: "Cash", value: cash, color: "#22c55e" },
    { label: "Real Estate", value: realEstate, color: "#f59e0b" },
  ];
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="rounded-3xl border border-white/10 p-6 mb-4" style={{ background: "linear-gradient(160deg,#0f172a,#1e293b)" }}>
        <h2 className="font-display text-2xl font-black text-white mb-1">Portfolio</h2>
        <p className="text-white/40 text-xs mb-5">A simplified breakdown of where your money sits</p>

        <div className="space-y-3">
          {rows.map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-4 border border-white/5 bg-white/[0.03]">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-white">{label}</span>
                <span className="font-black" style={{ color }}>{fmt(value)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div animate={{ width: `${(value / total) * 100}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="portfolio" onNav={onNav} />
    </motion.div>
  );
}

// ─── SCREEN: GOALS ───────────────────────────────────────────────────────────────
function GoalsScreen({ state, form, onNav }) {
  const emergencyTarget = form.monthlyExpenses * 6;
  const goals = [
    { label: "Emergency Fund", pct: Math.min(100, (state.savings / emergencyTarget) * 100), color: "#22c55e" },
    { label: "Pay Off Debt", pct: form.debt > 0 ? Math.min(100, ((form.debt - state.debt) / form.debt) * 100) : 100, color: "#ef4444" },
    { label: "Buy a Home", pct: Math.min(100, (state.savings / 40000) * 100), color: "#f59e0b" },
    { label: "Retire Early", pct: Math.min(100, Math.max(0, ((65 - state.retirementAge) / 15) * 100)), color: "#a855f7" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="rounded-3xl border border-white/10 p-6 mb-4" style={{ background: "linear-gradient(160deg,#0f172a,#1e293b)" }}>
        <h2 className="font-display text-2xl font-black text-white mb-1">Goals</h2>
        <p className="text-white/40 text-xs mb-5">Tracked automatically from your current stats</p>

        <div className="space-y-3">
          {goals.map(({ label, pct, color }) => (
            <div key={label} className="rounded-2xl p-4 border border-white/5 bg-white/[0.03]">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-white">{label}</span>
                <span className="font-black" style={{ color }}>{Math.round(pct)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="goals" onNav={onNav} />
    </motion.div>
  );
}

// ─── SCREEN: SHOP ────────────────────────────────────────────────────────────────
const PERKS = [
  { id: "budgeting", name: "Budgeting Pro", cost: 100, desc: "Sharper control over monthly expenses." },
  { id: "investor", name: "Smart Investor", cost: 150, desc: "A little extra edge on market decisions." },
  { id: "debt", name: "Debt Crusher", cost: 120, desc: "Chip away at balances faster." },
  { id: "career", name: "Career Booster", cost: 200, desc: "Better odds on job & salary events." },
];

function ShopScreen({ xp, onNav }) {
  const [owned, setOwned] = useState([]);
  const toggle = (perk) => {
    if (owned.includes(perk.id)) return;
    if (xp < perk.cost) return;
    setOwned((o) => [...o, perk.id]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="rounded-3xl border border-white/10 p-6 mb-4" style={{ background: "linear-gradient(160deg,#0f172a,#1e293b)" }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-2xl font-black text-white">Perk Shop</h2>
          <div className="flex items-center gap-1.5 bg-black/30 rounded-full px-3 py-1 border border-white/10">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-black text-xs text-amber-400">{xp} XP</span>
          </div>
        </div>
        <p className="text-white/40 text-xs mb-5">Spend XP on perks (cosmetic for now — gameplay effects coming soon)</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PERKS.map((perk) => {
            const isOwned = owned.includes(perk.id);
            const canAfford = xp >= perk.cost;
            return (
              <button key={perk.id} onClick={() => toggle(perk)} disabled={isOwned || !canAfford}
                className="rounded-2xl p-4 text-left border-2 transition-all"
                style={{
                  borderColor: isOwned ? "#22c55e" : "rgba(255,255,255,0.08)",
                  background: isOwned ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                  opacity: !isOwned && !canAfford ? 0.5 : 1,
                }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display font-bold text-sm text-white">{perk.name}</span>
                  {isOwned ? <Check className="w-4 h-4 text-emerald-400" /> : !canAfford ? <Lock className="w-4 h-4 text-white/30" /> : null}
                </div>
                <p className="text-white/50 text-xs mb-2">{perk.desc}</p>
                <div className="text-[10px] font-black uppercase tracking-wide text-amber-400">{isOwned ? "Owned" : `${perk.cost} XP`}</div>
              </button>
            );
          })}
        </div>
      </div>
      <BottomNav active="shop" onNav={onNav} />
    </motion.div>
  );
}

// ─── SCREEN: RESULTS ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm shadow-xl">
      <div className="text-white/50 text-xs mb-1">{label}</div>
      <div className="font-display font-black text-amber-400">{fmt(payload[0].value)}</div>
    </div>
  );
};

function ResultsScreen({ avatar, initialState, finalState, onRestart }) {
  const chartData = finalState.netWorthHistory.map((v, i) => ({ name: i === 0 ? "Start" : `Yr ${i}`, netWorth: v }));
  const delta = finalState.netWorth - initialState.netWorth;
  const totalXP = finalState.xp || 0;
  const grade = totalXP >= 400 ? "S" : totalXP >= 300 ? "A" : totalXP >= 200 ? "B" : totalXP >= 100 ? "C" : "D";
  const gradeColor = { S: "#f59e0b", A: "#22c55e", B: "#3b82f6", C: "#a855f7", D: "#ef4444" }[grade];

  const cards = [
    { label: "Net Worth Delta", value: fmtSigned(delta), color: delta >= 0 ? "#22c55e" : "#ef4444" },
    { label: "Final Net Worth", value: fmt(finalState.netWorth), color: "#f59e0b" },
    { label: "Investments", value: fmt(finalState.investments), color: "#3b82f6" },
    { label: "Debt Left", value: fmt(finalState.debt), color: finalState.debt > 0 ? "#ef4444" : "#22c55e" },
    { label: "Retire At", value: `Age ${finalState.retirementAge}`, color: "#a855f7" },
    { label: "Health Score", value: `${finalState.healthScore}%`, color: finalState.healthScore >= 70 ? "#22c55e" : finalState.healthScore >= 50 ? "#f59e0b" : "#ef4444" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative rounded-3xl overflow-hidden border border-white/10 p-8 text-center" style={{ background: "linear-gradient(160deg,#0f172a,#1e293b)" }}>
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg,transparent,${gradeColor},transparent)` }} />
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-8">
          <CharacterImage character={avatar.character} mood="excited" size={140} bounce />
          <div>
            <motion.div initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 180 }}
              className="w-24 h-24 rounded-full flex flex-col items-center justify-center mx-auto mb-3 border-4 shadow-2xl"
              style={{ borderColor: gradeColor, background: `${gradeColor}15`, boxShadow: `0 0 40px ${gradeColor}40` }}>
              <span className="font-display font-black text-4xl" style={{ color: gradeColor }}>{grade}</span>
              <span className="text-[10px] text-white/50 font-bold">GRADE</span>
            </motion.div>
            <div className="font-display text-2xl font-black text-white mb-1">Journey Complete!</div>
            <div className="text-white/50 text-sm">You earned <span className="font-black text-amber-400">{totalXP} XP</span> across 5 life events</div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
            className="relative rounded-2xl overflow-hidden p-4 text-center border border-white/5" style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))" }}>
            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{label}</div>
            <div className="font-display font-black text-xl" style={{ color }}>{value}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="rounded-3xl overflow-hidden border border-white/10 p-6" style={{ background: "linear-gradient(160deg,#0f172a,#1e293b)" }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <h3 className="font-display font-bold text-sm text-white">Net Worth Journey</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="mmGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="netWorth" stroke="#f59e0b" strokeWidth={2.5} fill="url(#mmGrad2)" dot={{ fill: "#f59e0b", r: 5, strokeWidth: 0 }} activeDot={{ r: 7, fill: "#f97316" }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} onClick={onRestart}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 border border-white/10 text-white transition-all" style={{ background: "rgba(255,255,255,0.05)" }}>
        <RefreshCw className="w-5 h-5" /> PLAY AGAIN
      </motion.button>
    </motion.div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────────
export default function MoneyMoves() {
  const [screen, setScreen] = useState("title");
  const [avatar, setAvatar] = useState(null);
  const [form, setForm] = useState(null);
  const [initialState, setInitialState] = useState(null);
  const [state, setState] = useState(null);
  const [decisionIdx, setDecisionIdx] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]); // full record of every decision made, for year summaries
  const [yearChunk, setYearChunk] = useState([]);

  const hasSave = !!loadGame();
  const isComplete = decisionIdx >= DECISIONS.length;
  const currentDecision = !isComplete ? DECISIONS[decisionIdx] : null;

  // ── navigation handlers ──
  const handleTitleStart = () => setScreen("intro");
  const handleTitleContinue = () => {
    const saved = loadGame();
    if (!saved) return;
    setAvatar(saved.avatar); setForm(saved.form); setInitialState(saved.initialState);
    setState(saved.state); setDecisionIdx(saved.decisionIdx); setHistory(saved.history || []);
    setScreen("dashboard");
  };
  const handleIntroBegin = () => setScreen("customize");
  const handleAvatarDone = (av) => { setAvatar(av); setScreen("setup"); };
  const handleSetupDone = (f) => {
    const init = buildInitialState(f);
    setForm(f); setInitialState(init); setState(init); setDecisionIdx(0); setHistory([]);
    saveGame({ avatar, form: f, initialState: init, state: init, decisionIdx: 0, history: [] });
    setScreen("dashboard");
  };
  const handleNextEvent = () => setScreen("sim");

  const handleDecisionConfirm = (optionIndex) => {
    if (optionIndex === null) return;
    const option = currentDecision.options[optionIndex];
    const tone = getTone(option.xp);
    const before = state;
    const after = applyDecision(state, form, option);
    const deltas = {
      netWorth: after.netWorth - before.netWorth,
      investments: after.investments - before.investments,
      debt: after.debt - before.debt,
      healthScore: after.healthScore - before.healthScore,
      retirementAge: after.retirementAge - before.retirementAge,
    };
    const result = { decision: currentDecision, option, tone, deltas };
    setState(after);
    setLastResult(result);
    setHistory((h) => [...h, result]);
    setScreen("decisionResult");
  };

  const handleDecisionResultContinue = () => {
    const nextIdx = decisionIdx + 1;
    const newHistory = [...history];
    setDecisionIdx(nextIdx);
    saveGame({ avatar, form, initialState, state, decisionIdx: nextIdx, history: newHistory });

    if (nextIdx >= DECISIONS.length) {
      clearSave();
      setScreen("results");
      return;
    }
    if (nextIdx % 2 === 0) {
      setYearChunk(newHistory.slice(-2));
      setScreen("yearSummary");
    } else {
      setScreen("dashboard");
    }
  };

  const handleYearSummaryContinue = () => setScreen("dashboard");
  const handleNav = (target) => setScreen(target);
  const handleRestart = () => {
    clearSave();
    setAvatar(null); setForm(null); setInitialState(null); setState(null);
    setDecisionIdx(0); setHistory([]); setLastResult(null);
    setScreen("title");
  };

  return (
    <div className="relative min-h-screen" style={{ background: "linear-gradient(160deg,#060d1a,#0f172a,#060d1a)" }}>
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,white 2px,white 3px)" }} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <AnimatePresence mode="wait">
          {screen === "title" && <TitleScreen key="title" onStart={handleTitleStart} onContinue={handleTitleContinue} hasSave={hasSave} />}
          {screen === "intro" && <IntroStoryScreen key="intro" onBegin={handleIntroBegin} />}
          {screen === "customize" && <CustomizeScreen key="customize" onNext={handleAvatarDone} />}
          {screen === "setup" && <SetupScreen key="setup" avatar={avatar} onStart={handleSetupDone} />}
          {screen === "dashboard" && (
            <DashboardScreen key="dashboard" avatar={avatar} state={state} decision={currentDecision} onNextEvent={handleNextEvent} onNav={handleNav} isComplete={isComplete} />
          )}
          {screen === "sim" && currentDecision && (
            <SimulationScreen key="sim" avatar={avatar} decision={currentDecision} xp={state.xp} onConfirm={handleDecisionConfirm} />
          )}
          {screen === "decisionResult" && lastResult && (
            <DecisionResultScreen key="decisionResult" avatar={avatar} result={lastResult} onContinue={handleDecisionResultContinue} />
          )}
          {screen === "yearSummary" && yearChunk.length > 0 && (
            <YearSummaryScreen key="yearSummary" chunk={yearChunk} avatar={avatar} onContinue={handleYearSummaryContinue} />
          )}
          {screen === "portfolio" && <PortfolioScreen key="portfolio" state={state} onNav={handleNav} />}
          {screen === "goals" && <GoalsScreen key="goals" state={state} form={form} onNav={handleNav} />}
          {screen === "shop" && <ShopScreen key="shop" xp={state.xp} onNav={handleNav} />}
          {screen === "results" && (
            <ResultsScreen key="results" avatar={avatar} initialState={initialState} finalState={state} onRestart={handleRestart} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}