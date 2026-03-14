import React, { useState, useEffect } from 'react';
import { 
  Heart, ShieldAlert, MessageCircle, Clock, BookOpen, CheckCircle, 
  ArrowRight, ArrowLeft, Smile, Zap, User, Sparkles, HelpCircle, 
  Copy, Check, Info, AlertCircle, Play, Pause, ChevronRight,
  Activity, Search, HeartHandshake, Wand2, RefreshCw, ChevronDown,
  Brain, Lightbulb, MessageSquare, Shuffle, ChevronLeft, Star
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- DATA CONSTANTS ---

const FOUR_HORSEMEN = [
  {
    name: "Criticism",
    description: "Attacking your loverrr's character rather than a behavior. It sounds like a character defect.",
    howItSounds: "You always forget the groceries! You're so irresponsible.",
    healthyAlternative: "A Complaint: I feel stressed that we don't have dinner items. I need us to check the list together.",
    antidote: "Gentle Start-Up",
    antidoteDescription: "Describe the situation neutrally, speak about your feelings, and state a positive need."
  },
  {
    name: "Contempt",
    description: "Acting superior, mocking, or using sarcasm to make a partner feel worthless. This is the #1 predictor of divorce.",
    howItSounds: "Oh, you're 'overwhelmed'? Please. I do everything while you just sit there.",
    healthyAlternative: "Culture of Appreciation: I see how hard you've been working, and I'd love some help with dinner.",
    antidote: "Build Appreciation",
    antidoteDescription: "Focus on your loverrr's positive qualities and express gratitude daily."
  },
  {
    name: "Defensiveness",
    description: "Self-protection through righteous indignation or playing the victim to ward off a perceived attack.",
    howItSounds: "It's not my fault we're late! If you hadn't reminded me, we wouldn't have this problem!",
    healthyAlternative: "Taking Responsibility: You're right, I forgot to check the time. I'm sorry.",
    antidote: "Take Responsibility",
    antidoteDescription: "Accept your loverrr's perspective even if you only agree with a small part of it."
  },
  {
    name: "Stonewalling",
    description: "Withdrawing from the interaction, shutting down, or walking away. Usually due to physiological 'flooding'.",
    howItSounds: "(Silence, avoiding eye contact, or walking away without a word.)",
    healthyAlternative: "Self-Soothing Break: I'm starting to feel too upset to listen. I need 20 minutes to calm down.",
    antidote: "Physiological Self-Soothing",
    antidoteDescription: "Take a break for at least 20 minutes to let your heart rate drop and your logic return."
  }
];

const REPAIR_PHRASES = [
  { category: "I Feel", outcome: "Softens intensity by focusing on your internal state.", phrases: ["I'm getting scared.", "Please say that more gently.", "I feel blamed. Can you rephrase?", "I'm feeling unappreciated."] },
  { category: "Calm Down", outcome: "De-escalates physiological arousal (flooding).", phrases: ["Can we take a break?", "Please help me calm down.", "I need your support right now.", "Just listen and try to understand."] },
  { category: "I'm Sorry", outcome: "Takes responsibility and validates your loverrr.", phrases: ["My reactions were too extreme.", "I really blew that one.", "Let me try again.", "I can see my part in this."] },
  { category: "Get to Yes", outcome: "Moves the conversation toward compromise.", phrases: ["I agree with part of that.", "Let's find common ground.", "You're starting to convince me.", "What are your concerns?"] }
];

const REPAIR_STEPS = [
  { 
    id: 'R1', 
    title: "Regulate", 
    desc: "Biology First", 
    icon: <Activity size={24} />,
    content: "When flooded, your heart rate is over 100 BPM and your logic centers shut down. You cannot solve a problem in this state.",
    instruction: "Take a 20-minute break. Use the timer below and look at the puppy. Do not think about the fight."
  },
  { 
    id: 'E', 
    title: "Empathize", 
    desc: "Listen without Defense", 
    icon: <Heart size={24} />,
    content: "Try to understand your loverrr's subjective reality. Their feelings are valid even if you disagree on facts.",
    instruction: "Your goal is to be a reporter. Ask: 'Tell me more about how you felt.' Do not correct their memory."
  },
  { 
    id: 'P', 
    title: "Perspective", 
    desc: "Share Your Truth", 
    icon: <User size={24} />,
    content: "Describe your feelings and the situation, not your loverrr's character flaws.",
    instruction: "Use the Start-up Guide. Focus on 'I feel...' about 'the situation' and 'I need...'"
  },
  { 
    id: 'A', 
    title: "Acknowledge", 
    desc: "Take Ownership", 
    icon: <CheckCircle size={24} />,
    content: "Find at least 2% of the situation that you can take responsibility for. It builds a bridge.",
    instruction: "Say: 'I can see how my part in this was...' or 'I am sorry for using that tone.'"
  },
  { 
    id: 'I', 
    title: "Investigate", 
    desc: "Find the Hidden Dream", 
    icon: <Search size={24} />,
    content: "Behind every stubborn conflict is a hidden dream or value that isn't being met.",
    instruction: "Ask each other: 'What about this is so important to you? Is there a deeper story here?'"
  },
  { 
    id: 'R2', 
    title: "Reunite", 
    desc: "Plan & Reconnect", 
    icon: <HeartHandshake size={24} />,
    content: "Repair isn't complete until you feel connected again. Plan one specific thing to do differently next time.",
    instruction: "Final step: Give each other a 6-second kiss or a long hug to seal the repair."
  }
];

const MAGIC_HOURS = [
  { id: 'partings', label: 'Partings', desc: 'Learn one thing about their day.', time: '2 mins / day' },
  { id: 'reunions', label: 'Reunions', desc: '6-second kiss & stress-reducing talk.', time: '20 mins / day' },
  { id: 'admiration', label: 'Appreciation', desc: 'Express genuine gratitude daily.', time: '5 mins / day' },
  { id: 'affection', label: 'Affection', desc: 'Physical touch & intimacy.', time: '5 mins / day' },
  { id: 'date', label: 'Weekly Date', desc: 'Focus on connection, no distractions.', time: '2 hours / week' },
  { id: 'sou', label: 'State of the Union', desc: 'Weekly check-in on relationship.', time: '1 hour / week' }
];

const LOVE_MAP_QUESTIONS = [
  "What is your loverrr's current biggest stressor?",
  "Who are your loverrr's two best friends?",
  "What is your loverrr's favorite way to be soothed?",
  "What was your loverrr's best childhood experience?",
  "What is your loverrr's favorite meal?",
  "What personal improvements does your loverrr want to make?"
];

const FEELING_WORDS = ["Overwhelmed", "Lonely", "Frustrated", "Worried", "Hurt", "Anxious", "Ignored", "Scared"];
const NEED_WORDS = ["Support", "A hug", "Reassurance", "10 mins to talk", "Attention", "Kindness", "Validation"];

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app_init = initializeApp(firebaseConfig);
const auth = getAuth(app_init);
const db = getFirestore(app_init);
const APP_ID = 'harmony-repair-app';

// Safe localStorage helper
const safeLocalStorage = {
  getItem: (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key, val) => {
    try { localStorage.setItem(key, val); } catch {}
  }
};

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [coupleId, setCoupleId] = useState(safeLocalStorage.getItem('harmony_couple_id') || '');
  const [sharedData, setSharedData] = useState({ completedRituals: {} });

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, (u) => { if (u) setUser(u); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !coupleId) return;
    const coupleDocRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'couples_sync', coupleId);
    const unsubscribe = onSnapshot(coupleDocRef, (docSnap) => {
      if (docSnap.exists()) setSharedData(docSnap.data());
    }, (error) => console.error("Sync error:", error));
    return () => unsubscribe();
  }, [user, coupleId]);

  const saveSharedData = async (newData) => {
    if (!user || !coupleId) return;
    const coupleDocRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'couples_sync', coupleId);
    await setDoc(coupleDocRef, { ...sharedData, ...newData }, { merge: true });
  };

  const renderContent = () => {
    if (!coupleId) return <SetupView onComplete={(id) => { setCoupleId(id); safeLocalStorage.setItem('harmony_couple_id', id); }} />;
    
    switch (activeTab) {
      case 'home': return <HomeView onNavigate={setActiveTab} coupleId={coupleId} />;
      case 'navigator': return <ConflictNavigator onBack={() => setActiveTab('home')} onProcess={() => setActiveTab('repair-journey')} onHorsemen={() => setActiveTab('horsemen')} onRepair={() => setActiveTab('repair')} onStartup={() => setActiveTab('startup')} onTraps={() => setActiveTab('traps')} />;
      case 'repair-journey': return <RepairJourney onBack={() => setActiveTab('navigator')} />;
      case 'horsemen': return <FourHorsemenView onBack={() => setActiveTab('navigator')} />;
      case 'repair': return <RepairToolbox onBack={() => setActiveTab('navigator')} />;
      case 'startup': return <SoftenedStartup onBack={() => setActiveTab('navigator')} />;
      case 'traps': return <ThinkingTraps onBack={() => setActiveTab('navigator')} />;
      case 'magic': return <MagicHoursTracker onBack={() => setActiveTab('home')} sharedData={sharedData} onUpdate={saveSharedData} />;
      case 'growth': return <GrowthHub onNavigate={setActiveTab} onBack={() => setActiveTab('home')} />;
      case 'convo': return <ConversationStarters onBack={() => setActiveTab('growth')} />;
      case 'polisher': return <PhrasePolisher onBack={() => setActiveTab('home')} />;
      default: return <HomeView onNavigate={setActiveTab} coupleId={coupleId} />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans pb-24">
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-50 px-5 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          <Heart className="text-rose-500 fill-rose-500" size={24} />
          <h1 className="text-lg font-black tracking-tight text-zinc-900 uppercase">Harmony</h1>
        </div>
        {coupleId && (
          <div className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full">
            ID: {coupleId}
          </div>
        )}
      </header>

      <main className="max-w-md mx-auto px-4 pt-2">
        {renderContent()}
      </main>

      {coupleId && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-3 py-2 z-40 flex justify-around">
          <NavButton icon={<Clock size={24}/>} label="Rituals" active={activeTab === 'magic'} onClick={() => setActiveTab('magic')} />
          <NavButton icon={<ShieldAlert size={24}/>} label="Conflict" active={['navigator','repair-journey','horsemen','repair','startup','traps'].includes(activeTab)} onClick={() => setActiveTab('navigator')} />
          <NavButton icon={<Wand2 size={24}/>} label="Polish" active={activeTab === 'polisher'} onClick={() => setActiveTab('polisher')} />
          <NavButton icon={<Sparkles size={24}/>} label="Growth" active={['growth','convo'].includes(activeTab)} onClick={() => setActiveTab('growth')} />
        </nav>
      )}
    </div>
  );
}

// --- Component Definitions ---


// ── Inline SVG Illustrations ──────────────────────────────────────────────
function IllustrationHome() {
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="20" r="10" stroke="white" strokeWidth="2.5" fill="none" opacity="0.6"/>
      <circle cx="52" cy="20" r="10" stroke="white" strokeWidth="2.5" fill="none" opacity="0.6"/>
      <path d="M18 45 Q28 35 40 38 Q52 35 62 45" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M40 14 L43 20 L50 21 L45 26 L46 33 L40 30 L34 33 L35 26 L30 21 L37 20 Z" fill="white" opacity="0.9"/>
    </svg>
  );
}
function IllustrationConflict() {
  return (
    <svg width="70" height="60" viewBox="0 0 70 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M35 5 L38 22 L52 18 L30 55 L27 38 L13 42 Z" stroke="white" strokeWidth="2.5" fill="none" strokeLinejoin="round" opacity="0.85"/>
      <circle cx="14" cy="12" r="3" fill="white" opacity="0.4"/>
      <circle cx="58" cy="8" r="2" fill="white" opacity="0.3"/>
      <circle cx="62" cy="48" r="4" fill="white" opacity="0.25"/>
    </svg>
  );
}
function IllustrationGrowth() {
  return (
    <svg width="70" height="65" viewBox="0 0 70 65" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M35 60 L35 25" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
      <path d="M35 40 Q20 35 18 20 Q30 20 35 33" fill="white" opacity="0.5"/>
      <path d="M35 32 Q50 25 52 10 Q40 12 35 26" fill="white" opacity="0.5"/>
      <path d="M25 60 L45 60" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}
function IllustrationRepair() {
  return (
    <svg width="80" height="55" viewBox="0 0 80 55" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 45 Q20 20 35 28 Q50 36 65 10" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
      <circle cx="35" cy="28" r="4" fill="white" opacity="0.7"/>
      <circle cx="65" cy="10" r="5" fill="white" opacity="0.9"/>
      <path d="M60 10 L65 5 L70 10 L65 15 Z" fill="white" opacity="0.7"/>
    </svg>
  );
}
function IllustrationTraps() {
  return (
    <svg width="65" height="65" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="1.5" opacity="0.3"/>
      <circle cx="32" cy="32" r="18" stroke="white" strokeWidth="1.5" opacity="0.4"/>
      <circle cx="32" cy="32" r="8" stroke="white" strokeWidth="1.5" opacity="0.6"/>
      <line x1="32" y1="4" x2="32" y2="60" stroke="white" strokeWidth="1.5" opacity="0.25"/>
      <line x1="4" y1="32" x2="60" y2="32" stroke="white" strokeWidth="1.5" opacity="0.25"/>
      <line x1="12" y1="12" x2="52" y2="52" stroke="white" strokeWidth="1.5" opacity="0.2"/>
      <line x1="52" y1="12" x2="12" y2="52" stroke="white" strokeWidth="1.5" opacity="0.2"/>
      <circle cx="32" cy="32" r="3" fill="white" opacity="0.9"/>
    </svg>
  );
}
function IllustrationConvo() {
  return (
    <svg width="75" height="60" viewBox="0 0 75 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="38" height="26" rx="8" stroke="white" strokeWidth="2.5" fill="none" opacity="0.8"/>
      <path d="M12 37 L8 47 L22 40" fill="white" opacity="0.6"/>
      <rect x="30" y="28" width="38" height="26" rx="8" stroke="white" strokeWidth="2.5" fill="none" opacity="0.6"/>
      <path d="M60 48 L67 55 L55 53" fill="white" opacity="0.4"/>
      <circle cx="17" cy="18" r="2.5" fill="white" opacity="0.7"/>
      <circle cx="25" cy="18" r="2.5" fill="white" opacity="0.7"/>
      <circle cx="33" cy="18" r="2.5" fill="white" opacity="0.7"/>
    </svg>
  );
}
function IllustrationPolish() {
  return (
    <svg width="65" height="65" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 50 L45 20 L52 27 L22 57 Z" stroke="white" strokeWidth="2.5" fill="none" strokeLinejoin="round" opacity="0.8"/>
      <path d="M45 20 L50 10 L55 15 L52 27" stroke="white" strokeWidth="2.5" fill="none" strokeLinejoin="round" opacity="0.8"/>
      <path d="M15 50 L10 55" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
      <circle cx="48" cy="14" r="3" fill="white" opacity="0.6"/>
      <path d="M8 18 L12 14 M56 44 L60 48 M58 20 L54 24" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

function SetupView({ onComplete }) {
  const [input, setInput] = useState('');
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-6">
      <div className="w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center mb-8">
        <Heart className="text-white fill-white" size={36} />
      </div>
      <h2 className="text-3xl font-black mb-3 text-zinc-900 tracking-tight leading-tight">Connect with<br/>your Loverrr</h2>
      <p className="text-zinc-400 text-sm mb-10 max-w-[280px] leading-relaxed">Choose a unique Couple ID. Both partners enter the same ID to sync in real-time.</p>
      <div className="w-full space-y-3 max-w-sm">
        <input type="text" placeholder="e.g. SecretLover" className="w-full p-4 rounded-xl border border-zinc-200 focus:border-zinc-900 outline-none text-center font-bold text-xl transition-all text-zinc-900" value={input} onChange={(e) => setInput(e.target.value)} />
        <button onClick={() => onComplete(input)} disabled={!input} className="w-full bg-zinc-900 text-white py-4 rounded-xl font-black text-base active:scale-95 disabled:opacity-40 transition-all tracking-wide">CONNECT NOW</button>
      </div>
    </div>
  );
}

function HomeView({ onNavigate, coupleId }) {
  return (
    <div className="space-y-5 pt-2">
      <section className="bg-zinc-900 rounded-2xl p-7 text-white relative overflow-hidden">
        <div className="absolute right-5 top-5 opacity-20"><IllustrationHome /></div>
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">Synced as {coupleId}</p>
        <h2 className="text-2xl font-black mb-1 tracking-tight leading-tight">Welcome back,<br/>Loverrr 💛</h2>
        <p className="text-zinc-400 text-xs font-medium mb-6 leading-relaxed">Research-backed tools for a stronger relationship.</p>
        <button onClick={() => onNavigate('navigator')} className="bg-white text-zinc-900 w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all tracking-wide">
          <Zap size={16} fill="currentColor" /> NAVIGATE CONFLICT
        </button>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Card icon={<ShieldAlert size={20} className="text-zinc-600" />} title="Conflict" subtitle="Fix Issues" onClick={() => onNavigate('navigator')} />
        <Card icon={<Sparkles size={20} className="text-zinc-600" />} title="Growth" subtitle="Deepen Love" onClick={() => onNavigate('growth')} />
        <Card icon={<BookOpen size={20} className="text-zinc-600" />} title="4 Horsemen" subtitle="Understand Patterns" onClick={() => onNavigate('horsemen')} />
        <Card icon={<Clock size={20} className="text-zinc-600" />} title="Rituals" subtitle="Magic Hours" onClick={() => onNavigate('magic')} />
      </div>
    </div>
  );
}

function GrowthHub({ onNavigate, onBack }) {
  return (
    <div className="space-y-5 pt-2">
      <button onClick={onBack} className="text-zinc-400 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest hover:text-zinc-900 transition-colors"><ArrowLeft size={14} /> Back</button>
      <div className="bg-zinc-900 rounded-2xl p-7 text-white relative overflow-hidden">
        <div className="absolute right-5 top-4 opacity-20"><IllustrationGrowth /></div>
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Growth Hub</p>
        <h2 className="text-2xl font-black tracking-tight leading-tight mb-1">Deepen<br/>Your Bond 🌱</h2>
        <p className="text-zinc-400 text-xs font-medium leading-relaxed">Tools to know each other better every day.</p>
      </div>
      <div className="space-y-3">
        <button onClick={() => onNavigate('convo')} className="w-full bg-white p-5 rounded-2xl border border-zinc-200 text-left flex items-center gap-4 hover:border-zinc-900 transition-all active:scale-95 group">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-colors"><MessageSquare size={22} /></div>
          <div className="flex-grow">
            <h3 className="font-black text-zinc-900 text-sm">Conversation Starters</h3>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">Road trips, date nights & picnics.</p>
          </div>
          <ChevronRight size={16} className="text-zinc-300" />
        </button>
      </div>
    </div>
  );
}

function ConflictNavigator({ onBack, onProcess, onHorsemen, onRepair, onStartup, onTraps }) {
  const [st, setSt] = useState('s');
  if (st === 'f') return <FloodingView onBack={() => setSt('s')} />;
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold mb-4 hover:text-zinc-800 transition-colors"><ArrowLeft size={18} /> Back to Space</button>
      <div className="bg-zinc-900 rounded-2xl p-7 text-white relative overflow-hidden mb-2">
        <div className="absolute right-5 top-4 opacity-20"><IllustrationConflict /></div>
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Conflict Navigator</p>
        <h2 className="text-2xl font-black tracking-tight leading-tight mb-1">Navigate<br/>The Storm ⚡</h2>
        <p className="text-zinc-400 text-xs font-medium leading-relaxed">Tools to de-escalate and find resolution.</p>
      </div>
      <div className="space-y-3">
        <ActionButton title="Repair Phrases" desc="Instant de-escalation toolbox" onClick={onRepair} color="rose" />
        <div className="flex gap-3">
          <ActionButton title="Horsemen" desc="Identify patterns" onClick={onHorsemen} color="rose" className="flex-1" />
          <ActionButton title="Break" desc="Flooding" onClick={() => setSt('f')} color="indigo" className="flex-1" />
        </div>
        <div className="flex gap-3">
          <ActionButton title="Thinking Traps" desc="Spot cognitive distortions" onClick={onTraps} color="amber" className="flex-1" />
          <ActionButton title="Start-up Guide" desc="Soften your approach" onClick={onStartup} color="indigo" className="flex-1" />
        </div>
        <ActionButton title="The REPAIR Journey" desc="Full 6-step roadmap for conflict" onClick={onProcess} color="amber" />
      </div>
    </div>
  );
}

function RepairJourney({ onBack }) {
  const [step, setStep] = useState(0);
  const currentStep = REPAIR_STEPS[step];
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold mb-4 hover:text-zinc-800 transition-colors"><ArrowLeft size={18} /> Back</button>
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-black text-zinc-900 tracking-tight">REPAIR Journey™</h2>
        <span className="text-xs font-black text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">Step {step + 1} of 6</span>
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden min-h-[520px] flex flex-col">
        <div className="bg-zinc-900 p-7 text-white relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2 opacity-60">
            {currentStep.icon}
            <span className="text-xs font-bold tracking-wider">Phase {step + 1}</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight">{currentStep.title}</h3>
          <p className="text-zinc-400 text-sm font-bold mt-1">{currentStep.desc}</p>
        </div>
        <div className="p-8 flex-grow flex flex-col justify-center">
          <p className="text-zinc-700 text-lg leading-relaxed font-bold mb-8 italic text-center">
            "{currentStep.content}"
          </p>
          <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-100">
            <p className="text-xs text-zinc-500 font-bold mb-2 uppercase tracking-wide">How to Proceed:</p>
            <p className="text-base text-zinc-700 font-medium leading-relaxed">{currentStep.instruction}</p>
          </div>
          {currentStep.id === 'R1' && <div className="mt-8"><FloodingView inline={true} /></div>}
        </div>
        <div className="p-6 border-t border-zinc-50 flex gap-4 bg-zinc-50/30">
          {step > 0 && <button onClick={() => setStep(s => s - 1)} className="flex-1 bg-white border border-zinc-200 text-zinc-500 py-4 rounded-xl font-black transition-all active:scale-95 text-sm">Prev</button>}
          <button onClick={() => step < 5 ? setStep(s => s + 1) : onBack()} className="flex-[2] bg-zinc-900 text-white py-4 rounded-xl font-black active:scale-95 transition-all tracking-wide text-sm uppercase">
            {step < 5 ? 'Next Step' : 'Journey Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FloodingView({ onBack, inline = false }) {
  const [sec, setSec] = useState(20 * 60);
  const [run, setRun] = useState(false);
  useEffect(() => {
    let t; if (run && sec > 0) t = setInterval(() => setSec(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [run, sec]);

  const view = (
    <div className={`bg-white rounded-[40px] ${!inline ? 'border border-zinc-200 p-8 shadow-2xl' : ''} text-center`}>
      {!inline && <h2 className="text-2xl font-black mb-4 text-zinc-900 tracking-tight">Take a Break ⏱️</h2>}
      <div className="text-6xl font-black py-4 text-zinc-900 tabular-nums tracking-tighter">{Math.floor(sec/60)}:{(sec%60).toString().padStart(2,'0')}</div>
      <button onClick={() => setRun(!run)} className={`px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 mx-auto transition-all ${run ? "bg-zinc-100 text-zinc-700" : "bg-zinc-900 text-white"}`}>
        {run ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Start 20m Break</>}
      </button>
      <div className="mt-8 rounded-[32px] overflow-hidden border-8 border-white shadow-2xl group">
        <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600" alt="Puppy" className="group-hover:scale-105 transition-transform duration-700" />
      </div>
      {!inline && <p className="text-sm text-zinc-500 mt-6 italic font-medium leading-relaxed px-4 text-center">"Research shows looking at animals lowers cortisol. Focus on the puppy and breathe."</p>}
    </div>
  );

  if (inline) return view;
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold mb-2"><ArrowLeft size={18}/> Back</button>
      {view}
    </div>
  );
}

function SoftenedStartup({ onBack }) {
  const [feel, setFeel] = useState('');
  const [about, setAbout] = useState('');
  const [need, setNeed] = useState('');
  const [copied, setCopied] = useState(false);
  const result = `I feel ${feel || '...'} about ${about || '...'} and I need ${need || '...'}.`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getFlags = (t) => {
    const f = []; if (!t) return f;
    const l = t.toLowerCase();
    if (l.includes('you ')) f.push("Avoid 'You' statements (Try 'I')");
    if (l.includes('always')) f.push("Avoid absolute words like 'Always'");
    if (l.includes('never')) f.push("Avoid absolute words like 'Never'");
    return f;
  };

  return (
    <div className="space-y-8 pb-12">
      <button onClick={onBack} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold mb-4 hover:text-zinc-800 transition-colors"><ArrowLeft size={18} /> Back to Conflict</button>
      <div className="bg-zinc-900 rounded-2xl p-6 text-white mb-2">
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Communication</p>
        <h2 className="text-2xl font-black tracking-tight">Start-up Guide 💬</h2>
        <p className="text-zinc-400 text-xs font-medium mt-1 leading-relaxed">Build a Gottman-approved opening statement.</p>
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <InputField label="1. I Feel..." val={feel} setVal={setFeel} placeholder="Loneliness, worry..." />
          {getFlags(feel).map(f => <p key={f} className="text-xs text-rose-500 font-bold px-4 flex items-center gap-2"><AlertCircle size={14}/> {f}</p>)}
          <div className="flex flex-wrap gap-2">{FEELING_WORDS.map(w => <button key={w} onClick={() => setFeel(w)} className="text-xs bg-white border border-zinc-200 px-3 py-1.5 rounded-lg font-bold text-zinc-600 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition-all">{w}</button>)}</div>
        </div>
        <div className="space-y-3">
          <InputField label="2. About What..." val={about} setVal={setAbout} placeholder="Describe the neutral situation..." />
          {getFlags(about).map(f => <p key={f} className="text-xs text-rose-500 font-bold px-4 flex items-center gap-2"><AlertCircle size={14}/> {f}</p>)}
        </div>
        <div className="space-y-3">
          <InputField label="3. I Need..." val={need} setVal={setNeed} placeholder="A hug, help tonight..." />
          {getFlags(need).map(f => <p key={f} className="text-xs text-rose-500 font-bold px-4 flex items-center gap-2"><AlertCircle size={14}/> {f}</p>)}
          <div className="flex flex-wrap gap-2">{NEED_WORDS.map(w => <button key={w} onClick={() => setNeed(w)} className="text-xs bg-white border border-zinc-200 px-3 py-1.5 rounded-lg font-bold text-zinc-600 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition-all">{w}</button>)}</div>
        </div>
        <div className="bg-zinc-900 p-7 rounded-2xl text-white relative overflow-hidden text-center mt-6">
          <Sparkles className="absolute -top-6 -right-6 text-white/10 w-32 h-32" />
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">Gottman Compliant Draft</p>
          <p className="text-lg font-bold italic leading-relaxed mb-7 text-zinc-100">"{result}"</p>
          <button onClick={handleCopy} className="bg-white text-zinc-900 w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
            {copied ? <><Check size={16}/> Copied!</> : <><Copy size={16}/> Copy Complete Draft</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function FourHorsemenView({ onBack }) {
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold mb-4 hover:text-zinc-800 transition-colors"><ArrowLeft size={18} /> Back</button>
      <div className="bg-zinc-900 rounded-2xl p-6 text-white mb-2">
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Education</p>
        <h2 className="text-2xl font-black tracking-tight">The 4 Horsemen 🐴</h2>
        <p className="text-zinc-400 text-xs font-medium mt-1 leading-relaxed">Patterns that predict relationship breakdown — and their antidotes.</p>
      </div>
      <div className="space-y-5 text-left">
        {FOUR_HORSEMEN.map((h, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-200 hover:border-zinc-900 transition-colors group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-all"><ShieldAlert size={28} /></div>
              <h3 className="font-black text-lg text-zinc-900 tracking-tight">{h.name}</h3>
            </div>
            <p className="text-sm text-zinc-500 mb-4 leading-relaxed font-medium">{h.description}</p>
            <div className="space-y-4">
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100"><p className="text-xs font-black text-zinc-400 mb-1.5 uppercase tracking-widest">How it sounds:</p><p className="italic text-sm text-zinc-700 font-medium">"{h.howItSounds}"</p></div>
              <div className="bg-zinc-900 p-4 rounded-xl"><p className="text-xs font-black text-zinc-300 mb-1.5 flex items-center gap-1.5 uppercase tracking-widest"><CheckCircle size={14}/> Healthy Choice:</p><p className="italic text-sm text-zinc-200 font-medium">{h.healthyAlternative}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// LoveMapQuiz replaced by ConversationStarters

function RepairToolbox({ onBack }) {
  const [cat, setCat] = useState(REPAIR_PHRASES[0].category);
  const [sel, setSel] = useState(null);
  const current = REPAIR_PHRASES.find(c => c.category === cat);
  return (
    <div className="space-y-6 pb-12">
      <button onClick={onBack} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold mb-4 hover:text-zinc-800 transition-colors"><ArrowLeft size={18} /> Back</button>
      <div className="bg-zinc-900 rounded-2xl p-6 text-white mb-1">
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">De-escalate</p>
        <h2 className="text-2xl font-black tracking-tight">Repair Toolbox 🛠️</h2>
        <p className="text-zinc-400 text-xs font-medium mt-1 leading-relaxed">A repair attempt stops the negativity spiral before it takes hold.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-4 px-1">{REPAIR_PHRASES.map(c => <button key={c.category} onClick={() => {setCat(c.category); setSel(null);}} className={`whitespace-nowrap px-5 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-widest ${cat === c.category ? "bg-zinc-900 text-white" : "bg-white text-zinc-400 border border-zinc-200 hover:border-zinc-500"}`}>{c.category}</button>)}</div>
      <div className="grid gap-3">{current.phrases.map(p => <button key={p} onClick={() => setSel(p)} className={`w-full text-left p-5 rounded-xl border flex justify-between items-center transition-all active:scale-[0.99] ${sel === p ? "border-zinc-900 bg-zinc-900" : "border-zinc-200 hover:border-zinc-500 bg-white"}`}><span className={`font-bold text-sm ${sel === p ? "text-white" : "text-zinc-800"}`}>{p}</span>{sel === p && <Check size={16} className="text-white flex-shrink-0"/>}</button>)}</div>
      {sel && <div className="bg-zinc-900 p-7 rounded-2xl text-white mt-4"><p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">Partner Response Guide</p><p className="text-sm leading-relaxed font-medium italic text-zinc-200">"Acknowledge the attempt! Say: 'I hear you. Thank you for repairing. Let's slow down.'"</p><p className="text-xs text-zinc-500 mt-4 font-bold uppercase tracking-widest">Outcome: {current.outcome}</p></div>}
    </div>
  );
}

function MagicHoursTracker({ onBack, sharedData, onUpdate }) {
  const completed = sharedData.completedRituals || {};
  const progress = (Object.values(completed).filter(Boolean).length / MAGIC_HOURS.length) * 100;
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold mb-4 hover:text-zinc-800 transition-colors"><ArrowLeft size={18} /> Back</button>
      <div className="bg-zinc-900 rounded-2xl p-7 text-white">
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Daily Rituals</p>
        <h2 className="text-2xl font-black tracking-tight mb-4">6 Magic Hours ✨</h2>
        <div className="flex items-center gap-4">
          <span className="text-4xl font-black tabular-nums text-white">{Math.round(progress)}%</span>
          <div className="flex-grow">
            <div className="w-full bg-zinc-700 h-2.5 rounded-full overflow-hidden"><div className="bg-white h-full transition-all duration-1000 rounded-full" style={{ width: `${progress}%` }}></div></div>
            <p className="text-zinc-400 text-xs font-medium mt-1.5">Today's rituals complete</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">{MAGIC_HOURS.map(h => <div key={h.id} onClick={() => onUpdate({ completedRituals: { ...completed, [h.id]: !completed[h.id] } })} className={`p-5 rounded-2xl border cursor-pointer flex items-center gap-4 transition-all active:scale-[0.99] ${completed[h.id] ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-zinc-200 hover:border-zinc-400'}`}><div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${completed[h.id] ? 'bg-white text-zinc-900' : 'bg-zinc-100 text-zinc-300'}`}>{completed[h.id] ? <CheckCircle size={28}/> : <Clock size={28}/>}</div><div className="flex-grow"><div className="flex justify-between items-center"><h3 className={`font-black text-sm tracking-tight ${completed[h.id] ? "text-white" : "text-zinc-900"}`}>{h.label}</h3><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${completed[h.id] ? "bg-zinc-700 text-zinc-300" : "bg-zinc-100 text-zinc-400"}`}>{h.time}</span></div><p className={`text-xs font-medium leading-relaxed mt-0.5 ${completed[h.id] ? "text-zinc-400" : "text-zinc-400"}`}>{h.desc}</p></div></div>)}</div>
    </div>
  );
}


// --- Thinking Traps Data ---
const THINKING_TRAPS_DATA = [
  { name: "Jumping to Conclusions", emoji: "🦘", color: "rose", description: "Making assumptions about your partner without evidence.", example: "Your partner is quiet so you assume they're angry at you.", reframe: "Ask yourself: What actual evidence do I have? Could there be another explanation?" },
  { name: "Mind-Reading", emoji: "🔮", color: "indigo", description: "Assuming you know what your partner is thinking or feeling.", example: "You're sure your partner doesn't want to go out, even though they agreed to plans.", reframe: "Replace assumptions with curiosity. Ask: 'What are you thinking right now?'" },
  { name: "All-or-Nothing Thinking", emoji: "⚫", color: "slate", description: "Seeing things in black and white with no middle ground.", example: "You have one argument and think 'This relationship is over.'", reframe: "Look for the gray area. One bad moment doesn't erase all the good ones." },
  { name: "Overgeneralization", emoji: "🌊", color: "blue", description: "Using one incident to describe your partner's behavior in general.", example: "Partner forgets anniversary → 'You never care about our relationship.'", reframe: "Replace 'always' and 'never' with 'sometimes' or 'in this situation.'" },
  { name: "Magnifying & Minimizing", emoji: "🔍", color: "amber", description: "Blowing up the negatives and shrinking the positives.", example: "Focusing on one critical comment while ignoring 10 kind ones.", reframe: "Deliberately list 3 positive things your partner did recently." },
  { name: "Personalization", emoji: "🎯", color: "rose", description: "Taking your partner's behavior as a personal attack.", example: "Partner didn't do dishes → 'They don't respect me.'", reframe: "Consider external factors. Their behavior is usually about them, not you." },
  { name: "Catastrophizing", emoji: "💥", color: "orange", description: "Assuming the worst possible outcome will happen.", example: "Partner is 10 mins late → imagining they've been in an accident or are cheating.", reframe: "Ask: What is the most likely explanation? What would I tell a friend in this situation?" },
  { name: "Emotional Reasoning", emoji: "❤️‍🔥", color: "red", description: "Treating feelings as facts.", example: "'I feel unloved, therefore I am unloved.'", reframe: "Feelings are data, not facts. Ask: What evidence supports or contradicts this feeling?" },
  { name: "Labeling", emoji: "🏷️", color: "purple", description: "Reducing your partner to a single negative label.", example: "Partner forgets a task → 'They are so irresponsible.'", reframe: "Separate the behavior from the person. The action was forgetful, not the person." },
  { name: "Tunnel Vision", emoji: "🔭", color: "teal", description: "Only seeing what confirms your negative view of your partner.", example: "You think they're selfish so you only notice selfish acts, not generous ones.", reframe: "Actively look for one example that contradicts your current belief." },
  { name: "Should Statements", emoji: "📏", color: "indigo", description: "Rigid rules about how your partner must think or behave.", example: "'They should know what I need without me saying it.'", reframe: "Replace 'should' with 'I would appreciate it if...' and communicate it directly." },
  { name: "Biased Explanations", emoji: "👓", color: "amber", description: "Assuming your partner has negative motives.", example: "'They're only being nice because they want something.'", reframe: "Ask: Could there be a positive or neutral reason for their behavior?" }
];

// --- Thinking Traps Component ---
function ThinkingTraps({ onBack }) {
  const [view, setView] = useState('menu'); // menu | list | identify | ai
  const [selectedTrap, setSelectedTrap] = useState(null);
  const [situation, setSituation] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const colorMap = {
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    slate: 'bg-zinc-50 border-zinc-200 text-zinc-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
  };

  const runAI = async () => {
    if (!situation.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    setAiError('');
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) { setAiError('API key not configured.'); setAiLoading(false); return; }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a cognitive behavioral therapy expert specializing in relationship conflicts. Analyze the situation described and identify thinking traps present.

Respond ONLY with a JSON object in this exact format, no preamble, no markdown:
{
  "traps": ["Trap Name 1", "Trap Name 2"],
  "explanation": "Brief explanation of what thinking traps are present and why",
  "reframe": "A compassionate, practical reframe of the situation using healthier thinking",
  "suggestion": "One concrete thing they could do or say right now"
}`,
          messages: [{ role: 'user', content: `My situation: "${situation}"` }]
        })
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e?.error?.message || 'API error'); }
      const data = await response.json();
      const text = data.content.map(i => i.text || '').join('');
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      setAiResult(parsed);
    } catch (err) {
      setAiError('Error: ' + (err.message || 'Something went wrong.'));
    }
    setAiLoading(false);
  };

  if (selectedTrap) return (
    <div className="space-y-6 pb-12">
      <button onClick={() => setSelectedTrap(null)} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold hover:text-zinc-800 transition-colors"><ArrowLeft size={18}/> Back</button>
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="bg-zinc-900 p-7 text-white relative overflow-hidden">
          <div className="text-5xl mb-4">{selectedTrap.emoji}</div>
          <h3 className="text-2xl font-bold tracking-tight">{selectedTrap.name}</h3>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">What it is</p>
            <p className="text-base text-zinc-700 font-medium leading-relaxed">{selectedTrap.description}</p>
          </div>
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Example</p>
            <p className="text-sm text-zinc-700 italic font-medium">"{selectedTrap.example}"</p>
          </div>
          <div className="bg-zinc-900 p-4 rounded-xl">
            <p className="text-xs font-black text-zinc-300 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Lightbulb size={12}/> How to Reframe</p>
            <p className="text-sm text-zinc-200 font-medium leading-relaxed">{selectedTrap.reframe}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (view === 'list') return (
    <div className="space-y-4 pb-12">
      <button onClick={() => setView('menu')} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold hover:text-zinc-800 transition-colors"><ArrowLeft size={18}/> Back</button>
      <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">All Thinking Traps</h2>
      <p className="text-sm text-zinc-500 font-medium">Tap any trap to learn more and how to reframe it.</p>
      <div className="space-y-3">
        {THINKING_TRAPS_DATA.map((trap, i) => (
          <button key={i} onClick={() => setSelectedTrap(trap)} className="w-full bg-white p-4 rounded-2xl border border-zinc-200 text-left flex items-center gap-4 hover:border-zinc-900 transition-all active:scale-95 group">
            <span className="text-3xl">{trap.emoji}</span>
            <div className="flex-grow">
              <h3 className="font-black text-zinc-900 text-sm group-hover:text-zinc-900">{trap.name}</h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5 line-clamp-1">{trap.description}</p>
            </div>
            <ChevronRight size={18} className="text-zinc-300 flex-shrink-0"/>
          </button>
        ))}
      </div>
    </div>
  );

  if (view === 'ai') return (
    <div className="space-y-6 pb-12">
      <button onClick={() => { setView('menu'); setAiResult(null); setSituation(''); }} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold hover:text-zinc-800 transition-colors"><ArrowLeft size={18}/> Back</button>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Identify My Trap</h2>
        <p className="text-zinc-500 text-sm font-medium">Describe what you're thinking or feeling and AI will identify your thinking traps and help you reframe.</p>
      </div>
      <div className="space-y-3">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">What's going through your mind?</label>
        <textarea value={situation} onChange={e => setSituation(e.target.value)} placeholder="e.g. My partner didn't text me back for 3 hours and I'm convinced they're upset with me..." rows={4} className="w-full p-4 rounded-xl border border-zinc-200 bg-white focus:border-zinc-900 outline-none transition-all font-medium text-zinc-800 text-base resize-none"/>
        <button onClick={runAI} disabled={!situation.trim() || aiLoading} className="w-full bg-zinc-900 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
          {aiLoading ? <><RefreshCw size={18} className="animate-spin"/> Analyzing...</> : <><Brain size={18}/> Identify My Traps</>}
        </button>
      </div>
      {aiError && <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-sm font-bold">{aiError}</div>}
      {aiResult && (
        <div className="space-y-4">
          <div className="bg-zinc-100 border border-zinc-200 p-5 rounded-2xl">
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">Thinking Traps Detected</p>
            <div className="flex flex-wrap gap-2">
              {aiResult.traps.map((t, i) => <span key={i} className="bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-xs font-black">{t}</span>)}
            </div>
          </div>
          <div className="bg-white border border-zinc-200 p-5 rounded-2xl space-y-4">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">What's happening</p>
              <p className="text-sm text-zinc-700 font-medium leading-relaxed">{aiResult.explanation}</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl">
              <p className="text-xs font-black text-zinc-300 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Lightbulb size={12}/> Reframe</p>
              <p className="text-sm text-zinc-200 font-medium leading-relaxed">{aiResult.reframe}</p>
            </div>
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Try This Now</p>
              <p className="text-sm text-zinc-700 font-medium leading-relaxed">{aiResult.suggestion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold mb-4 hover:text-zinc-800 transition-colors"><ArrowLeft size={18}/> Back to Conflict</button>
      <div className="bg-zinc-900 rounded-2xl p-7 text-white relative overflow-hidden">
        <div className="absolute right-5 top-4 opacity-20"><IllustrationTraps /></div>
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Cognitive Patterns</p>
        <h2 className="text-2xl font-black tracking-tight leading-tight mb-1">Thinking<br/>Traps 🕸️</h2>
        <p className="text-zinc-400 text-xs font-medium leading-relaxed">Spot and reframe the thoughts that make conflict worse.</p>
      </div>
      <div className="space-y-3">
        <button onClick={() => setView('ai')} className="w-full bg-white p-5 rounded-2xl border border-zinc-200 text-left flex items-center gap-4 hover:border-zinc-900 transition-all active:scale-95 group">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-colors"><Brain size={22}/></div>
          <div className="flex-grow">
            <h3 className="font-black text-zinc-900 text-sm">Identify My Trap</h3>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">Describe your situation — AI spots your traps.</p>
          </div>
          <ChevronRight size={16} className="text-zinc-300"/>
        </button>
        <button onClick={() => setView('list')} className="w-full bg-white p-5 rounded-2xl border border-zinc-200 text-left flex items-center gap-4 hover:border-zinc-900 transition-all active:scale-95 group">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-colors"><Lightbulb size={22}/></div>
          <div className="flex-grow">
            <h3 className="font-black text-zinc-900 text-sm">All 12 Thinking Traps</h3>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">Learn each trap with examples and how to reframe.</p>
          </div>
          <ChevronRight size={16} className="text-zinc-300"/>
        </button>
      </div>
    </div>
  );
}


// --- Conversation Starters Data ---
const CONVO_CATEGORIES = [
  { id: 'fun', label: 'Fun & Lighthearted', emoji: '😄', color: 'emerald', questions: [
    "If you could only eat one meal for the rest of your life, what would it be?",
    "What's the most embarrassing song you secretly love?",
    "If you were a dog, what breed would you be and why?",
    "What's your go-to karaoke song?",
    "If you could have any superpower for one day, what would it be?",
    "What's the weirdest food combination you actually enjoy?",
    "If your life were a movie, what genre would it be?",
    "What's the most useless talent you have?",
    "If you could live in any TV show world, which would you pick?",
    "What's the funniest thing that's ever happened to you?",
    "If animals could talk, which would be the rudest?",
    "What's the strangest dream you can remember?",
    "If you could only wear one color forever, what would it be?",
    "What's your most irrational fear?",
    "If you could have dinner with any fictional character, who would it be?",
  ]},
  { id: 'deep', label: 'Deep & Personal', emoji: '💭', color: 'indigo', questions: [
    "What's something you've never told anyone that you wish someone knew?",
    "What moment in your life changed you the most?",
    "What do you think your biggest strength is that others don't notice?",
    "What's something you're still trying to forgive yourself for?",
    "When do you feel most like yourself?",
    "What's a belief you held strongly that you've since changed?",
    "What does love mean to you — in one sentence?",
    "What are you most afraid people will find out about you?",
    "What part of your childhood shaped you the most?",
    "What's something you're proud of that you've never been acknowledged for?",
    "What would you do differently if you knew no one would judge you?",
    "What does a truly good life look like to you?",
    "What's your relationship like with failure?",
    "What's something you've always wanted to say but never have?",
    "What's the kindest thing someone has ever done for you?",
  ]},
  { id: 'knowme', label: 'How Well Do You Know Me?', emoji: '🎯', color: 'rose', questions: [
    "What's my biggest insecurity?",
    "What's the first thing I notice when I walk into a room?",
    "What's my love language?",
    "What's something that always cheers me up?",
    "What's my biggest pet peeve?",
    "What am I most proud of in my life so far?",
    "What's something I do that I don't even realize I do?",
    "What's my go-to comfort food?",
    "What's something I've always wanted to try but haven't?",
    "What's the best gift anyone has ever given me?",
    "What's my most used phrase or word?",
    "What would I do if I won the lottery tomorrow?",
    "What's my biggest regret?",
    "What's the thing that stresses me out the most?",
    "What's my favorite memory of us together?",
  ]},
  { id: 'hypothetical', label: 'Would You Rather', emoji: '🤔', color: 'purple', questions: [
    "Would you rather know when you're going to die, or how?",
    "Would you rather be able to fly or be invisible?",
    "Would you rather lose all your memories or never be able to make new ones?",
    "Would you rather always say what you're thinking or never be able to speak again?",
    "Would you rather live 100 years in the past or 100 years in the future?",
    "Would you rather be the funniest person in the room or the smartest?",
    "Would you rather have unlimited money or unlimited time?",
    "Would you rather know all the languages in the world or be able to play all instruments?",
    "Would you rather go on a road trip or a flight to a faraway destination?",
    "Would you rather never be cold again or never be hot again?",
    "Would you rather always win arguments or always give the best advice?",
    "Would you rather explore the ocean or outer space?",
    "Would you rather read minds for a day or be invisible for a day?",
    "Would you rather only eat sweet foods or only savory foods forever?",
    "Would you rather live in the city or the countryside for the rest of your life?",
  ]},
  { id: 'values', label: 'Values & Beliefs', emoji: '⭐', color: 'amber', questions: [
    "What's the one value you'd never compromise on?",
    "What does success look like to you — not financially, but personally?",
    "What role does faith or spirituality play in your life?",
    "How do you define a good person?",
    "What do you think the purpose of life is?",
    "What's something the world gets completely wrong?",
    "What's one thing you think more people should care about?",
    "How important is financial security to you vs. doing meaningful work?",
    "What does friendship mean to you?",
    "What do you believe about forgiveness — can people truly change?",
    "What's your philosophy on raising children?",
    "What's a cause you'd sacrifice something significant for?",
    "How do you think about death?",
    "What do you think makes a relationship last?",
    "What's the most important lesson life has taught you so far?",
  ]},
  { id: 'dreams', label: 'Dreams & Bucket List', emoji: '🌟', color: 'teal', questions: [
    "If money was no object, where would you live?",
    "What's the one experience you want to have before you die?",
    "What would your perfect day look like, start to finish?",
    "If you could master any skill instantly, what would it be?",
    "What country are you most curious to explore?",
    "What's a business you'd start if you knew it would succeed?",
    "What does your dream home look like?",
    "What's something you want to learn in the next 5 years?",
    "If you could witness any historical event, which would it be?",
    "What's one adventure you've always wanted to go on together?",
    "If you could write a book, what would it be about?",
    "What does retirement look like in your dream scenario?",
    "What's one tradition you want to create in our relationship?",
    "If we could take one epic trip together, where would it be?",
    "What's a goal you have that you haven't told many people?",
  ]},
  { id: 'memories', label: 'Our Shared Memories', emoji: '💝', color: 'pink', questions: [
    "What's your favorite memory of our first year together?",
    "What was your first impression of me — be honest!",
    "What's the hardest thing we've been through together?",
    "What moment made you realize you were falling for me?",
    "What's a small thing I do that makes you feel loved?",
    "What's a trip or experience we've shared that you'll never forget?",
    "What's something silly we've laughed about that still makes you smile?",
    "What's the best decision we've made together?",
    "What's a challenge we faced that made us stronger?",
    "What's something about our relationship that you never expected?",
    "What's a moment when you were really proud of me?",
    "What's something we used to do early on that you miss?",
    "What's your favorite photo of us and why?",
    "What's something I did that really surprised you?",
    "What's a memory of us you want to recreate?",
  ]},
];

// --- Conversation Starters Component ---
function ConversationStarters({ onBack }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentQ, setCurrentQ] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [usedIndexes, setUsedIndexes] = useState([]);

  const colorMap = {
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    indigo: { bg: 'bg-indigo-500', light: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700' },
    rose: { bg: 'bg-rose-500', light: 'bg-rose-50 border-rose-200', text: 'text-rose-600', btn: 'bg-rose-600 hover:bg-rose-700' },
    purple: { bg: 'bg-purple-500', light: 'bg-purple-50 border-purple-200', text: 'text-purple-600', btn: 'bg-purple-600 hover:bg-purple-700' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-50 border-amber-200', text: 'text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700' },
    teal: { bg: 'bg-teal-500', light: 'bg-teal-50 border-teal-200', text: 'text-teal-600', btn: 'bg-teal-600 hover:bg-teal-700' },
    pink: { bg: 'bg-pink-500', light: 'bg-pink-50 border-pink-200', text: 'text-pink-600', btn: 'bg-pink-600 hover:bg-pink-700' },
  };

  const getNextQuestion = (cat) => {
    const available = cat.questions.map((_, i) => i).filter(i => !usedIndexes.includes(`${cat.id}-${i}`));
    if (available.length === 0) {
      setUsedIndexes([]);
      const idx = Math.floor(Math.random() * cat.questions.length);
      setCurrentQ(cat.questions[idx]);
      setUsedIndexes([`${cat.id}-${idx}`]);
    } else {
      const idx = available[Math.floor(Math.random() * available.length)];
      setCurrentQ(cat.questions[idx]);
      setUsedIndexes(prev => [...prev, `${cat.id}-${idx}`]);
    }
    setIsFlipped(false);
  };

  const getAIQuestion = async (cat) => {
    setAiLoading(true);
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) { setAiLoading(false); return; }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          system: `Generate ONE creative, original conversation starter question for couples in the category: "${cat.label}". 
Make it thought-provoking, fun, and relationship-focused. 
Respond with ONLY the question text, nothing else. No quotes, no explanation.`,
          messages: [{ role: 'user', content: 'Generate a fresh question.' }]
        })
      });
      const data = await response.json();
      const q = data.content.map(i => i.text || '').join('').trim();
      setCurrentQ(q);
      setIsFlipped(false);
    } catch (err) { console.error(err); }
    setAiLoading(false);
  };

  if (selectedCategory) {
    const cat = CONVO_CATEGORIES.find(c => c.id === selectedCategory);
    const colors = colorMap[cat.color];
    return (
      <div className="space-y-6 pb-12">
        <button onClick={() => { setSelectedCategory(null); setCurrentQ(null); setIsFlipped(false); }} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold hover:text-zinc-800 transition-colors"><ArrowLeft size={18}/> All Categories</button>
        <div className="text-center">
          <span className="text-5xl">{cat.emoji}</span>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mt-2">{cat.label}</h2>
        </div>

        {/* Flip Card */}
        <div onClick={() => currentQ && setIsFlipped(!isFlipped)} className={`min-h-[260px] rounded-2xl border-2 cursor-pointer flex items-center justify-center p-7 text-center transition-all duration-300 ${currentQ ? (isFlipped ? "bg-zinc-900 border-zinc-900 text-white" : "bg-white border-zinc-200") : "bg-zinc-50 border-zinc-100"}`}>
          {!currentQ ? (
            <div className="space-y-4">
              <span className="text-6xl">{cat.emoji}</span>
              <p className="text-zinc-400 font-medium">Tap a button below to get your first question!</p>
            </div>
          ) : isFlipped ? (
            <div className="space-y-4">
              <p className="text-lg font-black leading-relaxed text-white">"{currentQ}"</p>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Tap to flip back</p>
            </div>
          ) : (
            <div className="space-y-4">
              <span className="text-6xl">{cat.emoji}</span>
              <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">Tap to reveal</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => getNextQuestion(cat)} className="bg-zinc-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
            <Shuffle size={16}/> Random
          </button>
          <button onClick={() => getAIQuestion(cat)} disabled={aiLoading} className="bg-white border border-zinc-200 text-zinc-900 py-4 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 hover:border-zinc-900">
            {aiLoading ? <><RefreshCw size={16} className="animate-spin"/> Generating...</> : <><Sparkles size={16}/> AI Question</>}
          </button>
        </div>
        <p className="text-center text-xs text-zinc-400 font-medium tracking-wide">Tap card to reveal — tap again to flip</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <button onClick={onBack} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold mb-4 hover:text-zinc-800 transition-colors"><ArrowLeft size={18}/> Back</button>
      <div className="bg-zinc-900 rounded-2xl p-7 text-white relative overflow-hidden">
        <div className="absolute right-5 top-4 opacity-20"><IllustrationConvo /></div>
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Conversation Starters</p>
        <h2 className="text-2xl font-black tracking-tight leading-tight mb-1">Questions for<br/>Every Moment 💬</h2>
        <p className="text-zinc-400 text-xs font-medium leading-relaxed">100+ questions · 7 categories · Unlimited AI</p>
      </div>
      <div className="space-y-3">
        {CONVO_CATEGORIES.map(cat => {
          const colors = colorMap[cat.color];
          return (
            <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setCurrentQ(null); setIsFlipped(false); }} className="w-full bg-white p-4 rounded-2xl border border-zinc-200 text-left flex items-center gap-4 hover:border-zinc-900 transition-all active:scale-95 group">
              <span className="text-3xl">{cat.emoji}</span>
              <div className="flex-grow">
                <h3 className="font-black text-zinc-900 text-sm">{cat.label}</h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">{cat.questions.length} questions + unlimited AI</p>
              </div>
              <ChevronRight size={18} className="text-zinc-300"/>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Phrase Polisher ---

function PhrasePolisher({ onBack }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const polish = async (textToPolish) => {
    if (!textToPolish.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        setError('API key not configured. Please check Vercel environment variables.');
        setLoading(false);
        return;
      }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a Gottman Method relationship communication expert. Your job is to take a rough, emotionally charged, or poorly worded statement and rewrite it using Gottman principles.

Rules:
- Use "I feel..." language, never "You always/never..."
- Remove criticism, contempt, defensiveness, and stonewalling (the Four Horsemen)
- Focus on the speaker feelings and needs, not the partner flaws
- Be warm, specific, and constructive
- Keep the core message intact, just improve how it is said

Respond ONLY with a JSON object in this exact format, no preamble, no markdown:
{
  "polished": "The rewritten phrase here",
  "breakdown": [
    {"issue": "What was problematic", "fix": "What was changed and why"},
    {"issue": "...", "fix": "..."}
  ]
}

Keep breakdown to 2-4 items maximum. Be concise.`,
          messages: [{ role: 'user', content: `Please polish this phrase: "${textToPolish}"` }]
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      const text = data.content.map(i => i.text || '').join('');
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (err) {
      setError('Error: ' + (err.message || 'Something went wrong. Please try again.'));
      console.error(err);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.polished).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRefine = () => {
    if (!result) return;
    setInput(result.polished);
    setResult(null);
  };

  return (
    <div className="space-y-6 pb-12">
      <button onClick={onBack} className="text-zinc-500 flex items-center gap-1.5 text-sm font-semibold mb-4 hover:text-zinc-800 transition-colors"><ArrowLeft size={18} /> Back</button>
      <div className="bg-zinc-900 rounded-2xl p-7 text-white relative overflow-hidden">
        <div className="absolute right-5 top-4 opacity-20"><IllustrationPolish /></div>
        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">AI-Powered</p>
        <h2 className="text-2xl font-black tracking-tight leading-tight mb-1">Phrase<br/>Polisher ✨</h2>
        <p className="text-zinc-400 text-xs font-medium leading-relaxed">Type it rough — get a Gottman-approved version back.</p>
      </div>
      <div className="space-y-3">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">What do you want to say?</label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. You never listen to me and it's so frustrating..."
          rows={4}
          className="w-full p-4 rounded-xl border border-zinc-200 bg-white focus:border-zinc-900 outline-none transition-all font-medium text-zinc-800 text-base resize-none"
        />
        <button
          onClick={() => polish(input)}
          disabled={!input.trim() || loading}
          className="w-full bg-zinc-900 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <><RefreshCw size={18} className="animate-spin" /> Polishing...</>
          ) : (
            <><Wand2 size={18} /> Polish It</>
          )}
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-sm font-bold">
          {error}
        </div>
      )}
      {result && (
        <div className="space-y-4">
          <div className="bg-zinc-900 p-7 rounded-2xl text-white relative overflow-hidden">
            <Sparkles className="absolute -top-4 -right-4 text-white/10 w-24 h-24" />
            <p className="text-xs font-black text-zinc-400 mb-3 uppercase tracking-widest">Gottman-Approved Version</p>
            <p className="text-lg font-bold italic leading-relaxed mb-6 text-zinc-100">"{result.polished}"</p>
            <div className="flex gap-3">
              <button onClick={handleCopy} className="flex-1 bg-white text-zinc-900 py-3 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
                {copied ? <><Check size={16}/> Copied!</> : <><Copy size={16}/> Copy</>}
              </button>
              <button onClick={handleRefine} className="flex-1 bg-zinc-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
                <RefreshCw size={16}/> Refine Further
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-100">
              <h3 className="font-black text-zinc-900 text-sm flex items-center gap-2 uppercase tracking-widest"><ChevronDown size={18} className="text-rose-400"/> What changed & why</h3>
            </div>
            <div className="divide-y divide-zinc-50">
              {result.breakdown.map((item, i) => (
                <div key={i} className="p-5 space-y-2">
                  <p className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><AlertCircle size={12}/> {item.issue}</p>
                  <p className="text-sm text-zinc-600 font-medium leading-relaxed">{item.fix}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Common Components ---

function NavButton({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${active ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-600"}`}>
      <div>{icon}</div>
      <span className="text-[10px] font-bold tracking-wide uppercase">{label}</span>
    </button>
  );
}
function Card({ icon, title, subtitle, onClick }) {
  return (
    <button onClick={onClick} className="bg-white p-5 rounded-2xl border border-zinc-200 text-left active:scale-95 flex flex-col items-start min-h-[150px] group hover:border-zinc-900 hover:bg-zinc-900 transition-all duration-200">
      <div className="bg-zinc-100 p-3 rounded-xl mb-auto group-hover:bg-white/10 transition-colors">{icon}</div>
      <h3 className="font-black text-zinc-900 text-sm tracking-tight group-hover:text-white">{title}</h3>
      <p className="text-zinc-400 text-xs font-semibold mt-1 group-hover:text-zinc-300">{subtitle}</p>
    </button>
  );
}
function InputField({ label, val, setVal, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">{label}</label>
      <input type="text" value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} className="w-full p-4 rounded-xl border border-zinc-200 bg-white focus:border-zinc-900 outline-none transition-all font-medium text-zinc-800 text-base" />
    </div>
  );
}
function ActionButton({ title, desc, onClick, color, className="" }) {
  const c = {
    rose: "border-zinc-200 hover:border-rose-500 hover:bg-rose-50",
    indigo: "border-zinc-200 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white",
    amber: "border-zinc-200 hover:border-amber-500 hover:bg-amber-50",
  };
  return (
    <button onClick={onClick} className={`w-full p-6 rounded-2xl border bg-white text-left transition-all duration-200 active:scale-[0.98] group ${c[color]} ${className}`}>
      <h4 className="font-black text-zinc-900 text-base tracking-tight group-hover:inherit">{title}</h4>
      <p className="text-sm text-zinc-400 font-medium mt-1 leading-relaxed">{desc}</p>
    </button>
  );
}
