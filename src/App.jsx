import React, { useState, useEffect } from 'react';
import {
  Heart, ShieldAlert, MessageCircle, Clock, BookOpen, CheckCircle,
  ArrowRight, ArrowLeft, Zap, User, Sparkles, HelpCircle,
  Copy, Check, AlertCircle, Play, Pause, ChevronRight,
  Activity, Search, HeartHandshake, Wand2, RefreshCw,
  Brain, Lightbulb, Shuffle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// ─── DATA ────────────────────────────────────────────────────────────────────

const FOUR_HORSEMEN = [
  { name: "Criticism", emoji: "🗡️", description: "Attacking your loverrr's character rather than a specific behavior.", howItSounds: "You always forget the groceries! You're so irresponsible.", healthyAlternative: "A Complaint: I feel stressed that we don't have dinner items. I need us to check the list together.", antidote: "Gentle Start-Up" },
  { name: "Contempt", emoji: "😤", description: "Acting superior, mocking, or using sarcasm to make your partner feel worthless. The #1 predictor of divorce.", howItSounds: "Oh, you're 'overwhelmed'? Please. I do everything while you just sit there.", healthyAlternative: "Culture of Appreciation: I see how hard you've been working, and I'd love some help with dinner.", antidote: "Build Appreciation" },
  { name: "Defensiveness", emoji: "🛡️", description: "Self-protection through righteous indignation or playing the victim to ward off a perceived attack.", howItSounds: "It's not my fault we're late! If you hadn't reminded me, we wouldn't have this problem!", healthyAlternative: "Taking Responsibility: You're right, I forgot to check the time. I'm sorry.", antidote: "Take Responsibility" },
  { name: "Stonewalling", emoji: "🧱", description: "Withdrawing from the interaction, shutting down, or walking away. Usually due to physiological flooding.", howItSounds: "(Silence, avoiding eye contact, or walking away without a word.)", healthyAlternative: "Self-Soothing Break: I'm starting to feel too upset to listen. I need 20 minutes to calm down.", antidote: "Physiological Self-Soothing" },
];

const REPAIR_PHRASES = [
  { category: "I Feel", emoji: "💭", outcome: "Softens intensity by focusing on your internal state.", phrases: ["I'm getting scared.", "Please say that more gently.", "I feel blamed. Can you rephrase?", "I'm feeling unappreciated."] },
  { category: "Calm Down", emoji: "🌊", outcome: "De-escalates physiological arousal (flooding).", phrases: ["Can we take a break?", "Please help me calm down.", "I need your support right now.", "Just listen and try to understand."] },
  { category: "I'm Sorry", emoji: "🤍", outcome: "Takes responsibility and validates your loverrr.", phrases: ["My reactions were too extreme.", "I really blew that one.", "Let me try again.", "I can see my part in this."] },
  { category: "Get to Yes", emoji: "🤝", outcome: "Moves the conversation toward compromise.", phrases: ["I agree with part of that.", "Let's find common ground.", "You're starting to convince me.", "What are your concerns?"] },
];

const REPAIR_STEPS = [
  { id: 'R1', title: "Regulate", desc: "Biology First", emoji: "🫁", content: "When flooded, your heart rate is over 100 BPM and your logic centers shut down. You cannot solve a problem in this state.", instruction: "Take a 20-minute break. Use the timer below and look at the puppy. Do not think about the fight." },
  { id: 'E', title: "Empathize", desc: "Listen without Defense", emoji: "👂", content: "Try to understand your loverrr's subjective reality. Their feelings are valid even if you disagree on facts.", instruction: "Your goal is to be a reporter. Ask: 'Tell me more about how you felt.' Do not correct their memory." },
  { id: 'P', title: "Perspective", desc: "Share Your Truth", emoji: "🗣️", content: "Describe your feelings and the situation, not your loverrr's character flaws.", instruction: "Use the Start-up Guide. Focus on 'I feel...' about 'the situation' and 'I need...'" },
  { id: 'A', title: "Acknowledge", desc: "Take Ownership", emoji: "🙏", content: "Find at least 2% of the situation that you can take responsibility for. It builds a bridge.", instruction: "Say: 'I can see how my part in this was...' or 'I am sorry for using that tone.'" },
  { id: 'I', title: "Investigate", desc: "Find the Hidden Dream", emoji: "🔍", content: "Behind every stubborn conflict is a hidden dream or value that isn't being met.", instruction: "Ask each other: 'What about this is so important to you? Is there a deeper story here?'" },
  { id: 'R2', title: "Reunite", desc: "Plan & Reconnect", emoji: "💞", content: "Repair isn't complete until you feel connected again. Plan one specific thing to do differently next time.", instruction: "Final step: Give each other a 6-second kiss or a long hug to seal the repair." },
];

const MAGIC_HOURS = [
  { id: 'partings', emoji: '👋', label: 'Partings', desc: 'Learn one thing about their day.', time: '2 min' },
  { id: 'reunions', emoji: '💋', label: 'Reunions', desc: '6-second kiss & stress-reducing talk.', time: '20 min' },
  { id: 'admiration', emoji: '🙏', label: 'Appreciation', desc: 'Express genuine gratitude daily.', time: '5 min' },
  { id: 'affection', emoji: '🤗', label: 'Affection', desc: 'Physical touch & intimacy.', time: '5 min' },
  { id: 'date', emoji: '🍽️', label: 'Weekly Date', desc: 'Focus on connection, no distractions.', time: '2 hrs' },
  { id: 'sou', emoji: '📋', label: 'State of Union', desc: 'Weekly check-in on relationship.', time: '1 hr' },
];

const FEELING_WORDS = ["Overwhelmed", "Lonely", "Frustrated", "Worried", "Hurt", "Anxious", "Ignored", "Scared"];
const NEED_WORDS = ["Support", "A hug", "Reassurance", "10 mins to talk", "Attention", "Kindness", "Validation"];

const THINKING_TRAPS_DATA = [
  { name: "Jumping to Conclusions", emoji: "🦘", description: "Making assumptions about your partner without evidence.", example: "Your partner is quiet so you assume they're angry at you.", reframe: "Ask yourself: What actual evidence do I have? Could there be another explanation?" },
  { name: "Mind-Reading", emoji: "🔮", description: "Assuming you know what your partner is thinking or feeling.", example: "You're sure your partner doesn't want to go out, even though they agreed to plans.", reframe: "Replace assumptions with curiosity. Ask: 'What are you thinking right now?'" },
  { name: "All-or-Nothing Thinking", emoji: "⚫", description: "Seeing things in black and white with no middle ground.", example: "You have one argument and think 'This relationship is over.'", reframe: "Look for the gray area. One bad moment doesn't erase all the good ones." },
  { name: "Overgeneralization", emoji: "🌊", description: "Using one incident to describe your partner's behavior in general.", example: "Partner forgets anniversary → 'You never care about our relationship.'", reframe: "Replace 'always' and 'never' with 'sometimes' or 'in this situation.'" },
  { name: "Magnifying & Minimizing", emoji: "🔍", description: "Blowing up the negatives and shrinking the positives.", example: "Focusing on one critical comment while ignoring 10 kind ones.", reframe: "Deliberately list 3 positive things your partner did recently." },
  { name: "Personalization", emoji: "🎯", description: "Taking your partner's behavior as a personal attack.", example: "Partner didn't do dishes → 'They don't respect me.'", reframe: "Consider external factors. Their behavior is usually about them, not you." },
  { name: "Catastrophizing", emoji: "💥", description: "Assuming the worst possible outcome will happen.", example: "Partner is 10 mins late → imagining they've been in an accident or are cheating.", reframe: "Ask: What is the most likely explanation? What would I tell a friend in this situation?" },
  { name: "Emotional Reasoning", emoji: "❤️‍🔥", description: "Treating feelings as facts.", example: "'I feel unloved, therefore I am unloved.'", reframe: "Feelings are data, not facts. Ask: What evidence supports or contradicts this feeling?" },
  { name: "Labeling", emoji: "🏷️", description: "Reducing your partner to a single negative label.", example: "Partner forgets a task → 'They are so irresponsible.'", reframe: "Separate the behavior from the person. The action was forgetful, not the person." },
  { name: "Tunnel Vision", emoji: "🔭", description: "Only seeing what confirms your negative view of your partner.", example: "You think they're selfish so you only notice selfish acts, not generous ones.", reframe: "Actively look for one example that contradicts your current belief." },
  { name: "Should Statements", emoji: "📏", description: "Rigid rules about how your partner must think or behave.", example: "'They should know what I need without me saying it.'", reframe: "Replace 'should' with 'I would appreciate it if...' and communicate it directly." },
  { name: "Biased Explanations", emoji: "👓", description: "Assuming your partner has negative motives.", example: "'They're only being nice because they want something.'", reframe: "Ask: Could there be a positive or neutral reason for their behavior?" },
];

const CONVO_CATEGORIES = [
  { id: 'fun', label: 'Fun & Lighthearted', emoji: '😄', accent: '#10b981', questions: ["If you could only eat one meal for the rest of your life, what would it be?", "What's the most embarrassing song you secretly love?", "If you were a dog, what breed would you be and why?", "What's your go-to karaoke song?", "If you could have any superpower for one day, what would it be?", "What's the weirdest food combination you actually enjoy?", "If your life were a movie, what genre would it be?", "What's the most useless talent you have?", "If you could live in any TV show world, which would you pick?", "What's the funniest thing that's ever happened to you?", "If animals could talk, which would be the rudest?", "What's the strangest dream you can remember?", "If you could only wear one color forever, what would it be?", "What's your most irrational fear?", "If you could have dinner with any fictional character, who would it be?"] },
  { id: 'deep', label: 'Deep & Personal', emoji: '💭', accent: '#8b5cf6', questions: ["What's something you've never told anyone that you wish someone knew?", "What moment in your life changed you the most?", "What do you think your biggest strength is that others don't notice?", "What's something you're still trying to forgive yourself for?", "When do you feel most like yourself?", "What's a belief you held strongly that you've since changed?", "What does love mean to you — in one sentence?", "What are you most afraid people will find out about you?", "What part of your childhood shaped you the most?", "What's something you're proud of that you've never been acknowledged for?", "What would you do differently if you knew no one would judge you?", "What does a truly good life look like to you?", "What's your relationship like with failure?", "What's something you've always wanted to say but never have?", "What's the kindest thing someone has ever done for you?"] },
  { id: 'knowme', label: 'How Well Do You Know Me?', emoji: '🎯', accent: '#f43f5e', questions: ["What's my biggest insecurity?", "What's the first thing I notice when I walk into a room?", "What's my love language?", "What's something that always cheers me up?", "What's my biggest pet peeve?", "What am I most proud of in my life so far?", "What's something I do that I don't even realize I do?", "What's my go-to comfort food?", "What's something I've always wanted to try but haven't?", "What's the best gift anyone has ever given me?", "What's my most used phrase or word?", "What would I do if I won the lottery tomorrow?", "What's my biggest regret?", "What's the thing that stresses me out the most?", "What's your favorite memory of us together?"] },
  { id: 'hypothetical', label: 'Would You Rather', emoji: '🤔', accent: '#f59e0b', questions: ["Would you rather know when you're going to die, or how?", "Would you rather be able to fly or be invisible?", "Would you rather lose all your memories or never be able to make new ones?", "Would you rather always say what you're thinking or never be able to speak again?", "Would you rather live 100 years in the past or 100 years in the future?", "Would you rather be the funniest person in the room or the smartest?", "Would you rather have unlimited money or unlimited time?", "Would you rather know all the languages in the world or play all instruments?", "Would you rather go on a road trip or a flight to a faraway destination?", "Would you rather never be cold again or never be hot again?", "Would you rather always win arguments or always give the best advice?", "Would you rather explore the ocean or outer space?", "Would you rather read minds for a day or be invisible for a day?", "Would you rather only eat sweet or only savory foods forever?", "Would you rather live in the city or the countryside for the rest of your life?"] },
  { id: 'values', label: 'Values & Beliefs', emoji: '⭐', accent: '#06b6d4', questions: ["What's the one value you'd never compromise on?", "What does success look like to you — not financially, but personally?", "What role does faith or spirituality play in your life?", "How do you define a good person?", "What do you think the purpose of life is?", "What's something the world gets completely wrong?", "What's one thing you think more people should care about?", "How important is financial security vs. doing meaningful work?", "What does friendship mean to you?", "What do you believe about forgiveness — can people truly change?", "What's your philosophy on raising children?", "What's a cause you'd sacrifice something significant for?", "How do you think about death?", "What do you think makes a relationship last?", "What's the most important lesson life has taught you so far?"] },
  { id: 'dreams', label: 'Dreams & Bucket List', emoji: '🌟', accent: '#a855f7', questions: ["If money was no object, where would you live?", "What's the one experience you want to have before you die?", "What would your perfect day look like, start to finish?", "If you could master any skill instantly, what would it be?", "What country are you most curious to explore?", "What's a business you'd start if you knew it would succeed?", "What does your dream home look like?", "What's something you want to learn in the next 5 years?", "If you could witness any historical event, which would it be?", "What's one adventure you've always wanted to go on together?", "If you could write a book, what would it be about?", "What does retirement look like in your dream scenario?", "What's one tradition you want to create in our relationship?", "If we could take one epic trip together, where would it be?", "What's a goal you have that you haven't told many people?"] },
  { id: 'memories', label: 'Our Shared Memories', emoji: '💝', accent: '#ec4899', questions: ["What's your favorite memory of our first year together?", "What was your first impression of me — be honest!", "What's the hardest thing we've been through together?", "What moment made you realize you were falling for me?", "What's a small thing I do that makes you feel loved?", "What's a trip or experience we've shared that you'll never forget?", "What's something silly we've laughed about that still makes you smile?", "What's the best decision we've made together?", "What's a challenge we faced that made us stronger?", "What's something about our relationship that you never expected?", "What's a moment when you were really proud of me?", "What's something we used to do early on that you miss?", "What's your favorite photo of us and why?", "What's something I did that really surprised you?", "What's a memory of us you want to recreate?"] },
];

// ─── Firebase ─────────────────────────────────────────────────────────────────
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
const safeLS = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: '#0D0D14',
  surface: '#13131E',
  card: '#1A1A28',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.16)',
  text: '#F0EEFF',
  muted: 'rgba(240,238,255,0.45)',
  dim: 'rgba(240,238,255,0.22)',
  rose: '#f43f5e',
  roseGlow: 'rgba(244,63,94,0.18)',
  roseBorder: 'rgba(244,63,94,0.35)',
  violet: '#8b5cf6',
  violetGlow: 'rgba(139,92,246,0.18)',
  violetBorder: 'rgba(139,92,246,0.35)',
  emerald: '#10b981',
  emeraldGlow: 'rgba(16,185,129,0.18)',
  emeraldBorder: 'rgba(16,185,129,0.35)',
  amber: '#f59e0b',
  amberGlow: 'rgba(245,158,11,0.18)',
  amberBorder: 'rgba(245,158,11,0.35)',
  cyan: '#06b6d4',
  cyanGlow: 'rgba(6,182,212,0.18)',
  cyanBorder: 'rgba(6,182,212,0.35)',
};

// ─── Shared style helpers ─────────────────────────────────────────────────────
const glowCard = (color, glow, border) => ({
  background: glow,
  border: `1px solid ${border}`,
  borderRadius: 20,
  padding: '20px 18px',
  position: 'relative',
  overflow: 'hidden',
});

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [coupleId, setCoupleId] = useState(safeLS.get('harmony_couple_id') || '');
  const [sharedData, setSharedData] = useState({ completedRituals: {} });

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsub = onAuthStateChanged(auth, (u) => { if (u) setUser(u); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !coupleId) return;
    const ref = doc(db, 'artifacts', APP_ID, 'public', 'data', 'couples_sync', coupleId);
    const unsub = onSnapshot(ref, (snap) => { if (snap.exists()) setSharedData(snap.data()); }, console.error);
    return () => unsub();
  }, [user, coupleId]);

  const saveSharedData = async (newData) => {
    if (!user || !coupleId) return;
    const ref = doc(db, 'artifacts', APP_ID, 'public', 'data', 'couples_sync', coupleId);
    await setDoc(ref, { ...sharedData, ...newData }, { merge: true });
  };

  const nav = (tab) => setActiveTab(tab);

  const renderContent = () => {
    if (!coupleId) return <SetupView onComplete={(id) => { setCoupleId(id); safeLS.set('harmony_couple_id', id); }} />;
    switch (activeTab) {
      case 'home': return <HomeView onNavigate={nav} coupleId={coupleId} sharedData={sharedData} onUpdate={saveSharedData} />;
      case 'navigator': return <ConflictNavigator onBack={() => nav('home')} onProcess={() => nav('repair-journey')} onHorsemen={() => nav('horsemen')} onRepair={() => nav('repair')} onStartup={() => nav('startup')} onTraps={() => nav('traps')} />;
      case 'repair-journey': return <RepairJourney onBack={() => nav('navigator')} />;
      case 'horsemen': return <FourHorsemenView onBack={() => nav('navigator')} />;
      case 'repair': return <RepairToolbox onBack={() => nav('navigator')} />;
      case 'startup': return <SoftenedStartup onBack={() => nav('navigator')} />;
      case 'traps': return <ThinkingTraps onBack={() => nav('navigator')} />;
      case 'magic': return <MagicHoursTracker onBack={() => nav('home')} sharedData={sharedData} onUpdate={saveSharedData} />;
      case 'growth': return <GrowthHub onNavigate={nav} onBack={() => nav('home')} />;
      case 'convo': return <ConversationStarters onBack={() => nav('growth')} />;
      case 'polisher': return <PhrasePolisher onBack={() => nav('home')} />;
      default: return <HomeView onNavigate={nav} coupleId={coupleId} sharedData={sharedData} onUpdate={saveSharedData} />;
    }
  };

  const navItems = [
    { tab: 'magic', emoji: '✨', label: 'Rituals', accent: T.emerald, glow: T.emeraldGlow, border: T.emeraldBorder, tabs: ['magic'] },
    { tab: 'navigator', emoji: '⚡', label: 'Conflict', accent: T.rose, glow: T.roseGlow, border: T.roseBorder, tabs: ['navigator','repair-journey','horsemen','repair','startup','traps'] },
    { tab: 'polisher', emoji: '🪄', label: 'Polish', accent: T.violet, glow: T.violetGlow, border: T.violetBorder, tabs: ['polisher'] },
    { tab: 'growth', emoji: '🌱', label: 'Growth', accent: T.cyan, glow: T.cyanGlow, border: T.cyanBorder, tabs: ['growth','convo'] },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 50, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => nav('home')}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${T.rose}, ${T.violet})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>💛</div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px' }}>Harmony</span>
        </div>
        {coupleId && (
          <div style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${T.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, color: T.muted }}>
            ID: {coupleId}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 430, margin: '0 auto', padding: '16px 16px 0' }}>
        {renderContent()}
      </div>

      {/* Bottom Nav */}
      {coupleId && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.surface, borderTop: `1px solid ${T.border}`, padding: '10px 12px 14px', zIndex: 40, display: 'flex', justifyContent: 'space-around', maxWidth: '100%' }}>
          {navItems.map(item => {
            const isActive = item.tabs.includes(activeTab);
            return (
              <button key={item.tab} onClick={() => nav(item.tab)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '7px 16px', borderRadius: 14, border: `1px solid ${isActive ? item.border : 'transparent'}`, background: isActive ? item.glow : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                <span style={{ fontSize: 20 }}>{item.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: isActive ? item.accent : T.dim }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Back Button ──────────────────────────────────────────────────────────────
function BackBtn({ onBack, label = 'Back' }) {
  return (
    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.muted, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 18, padding: 0 }}>
      <ArrowLeft size={14} /> {label}
    </button>
  );
}

// ─── Section Hero ─────────────────────────────────────────────────────────────
function SectionHero({ emoji, tag, title, subtitle, accent, glow, border, children }) {
  return (
    <div style={{ background: glow, border: `1px solid ${border}`, borderRadius: 20, padding: '22px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: 0.08, lineHeight: 1 }}>{emoji}</div>
      <p style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{tag}</p>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, lineHeight: 1.15, marginBottom: 6, letterSpacing: '-0.3px' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

// ─── SetupView ────────────────────────────────────────────────────────────────
function SetupView({ onComplete }) {
  const [input, setInput] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', textAlign: 'center', padding: '0 20px' }}>
      <div style={{ width: 80, height: 80, borderRadius: 22, background: `linear-gradient(135deg, ${T.roseGlow}, ${T.violetGlow})`, border: `1px solid ${T.violetBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 28 }}>💛</div>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: 10 }}>Connect with<br/>your Loverrr</h2>
      <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 32, maxWidth: 280 }}>Choose a unique Couple ID. Both partners enter the same ID to sync in real-time.</p>
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="e.g. SecretLover"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: `1px solid ${T.violetBorder}`, background: T.card, color: T.text, fontSize: 18, fontWeight: 700, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
        />
        <button
          onClick={() => onComplete(input)}
          disabled={!input}
          style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${T.rose}, ${T.violet})`, color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: '0.05em', cursor: input ? 'pointer' : 'not-allowed', opacity: input ? 1 : 0.4, transition: 'opacity 0.2s' }}
        >
          CONNECT NOW ✨
        </button>
      </div>
    </div>
  );
}

// ─── HomeView ─────────────────────────────────────────────────────────────────
function HomeView({ onNavigate, coupleId, sharedData, onUpdate }) {
  const completed = sharedData.completedRituals || {};
  const doneCount = Object.values(completed).filter(Boolean).length;

  const cards = [
    { tab: 'navigator', emoji: '⚡', title: 'Conflict', sub: 'Navigate Issues', accent: T.rose, glow: T.roseGlow, border: T.roseBorder },
    { tab: 'growth', emoji: '🌱', title: 'Growth', sub: 'Deepen Love', accent: T.cyan, glow: T.cyanGlow, border: T.cyanBorder },
    { tab: 'horsemen', emoji: '🐴', title: '4 Horsemen', sub: 'Understand Patterns', accent: T.violet, glow: T.violetGlow, border: T.violetBorder },
    { tab: 'magic', emoji: '✨', title: 'Rituals', sub: `${doneCount}/6 Today`, accent: T.emerald, glow: T.emeraldGlow, border: T.emeraldBorder },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, #1a1035 0%, #0f1a30 100%)`, border: `1px solid ${T.violetBorder}`, borderRadius: 22, padding: '22px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: `radial-gradient(circle, ${T.violetGlow} 0%, transparent 70%)` }} />
        <p style={{ fontSize: 10, fontWeight: 700, color: T.violet, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Synced as {coupleId}</p>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, lineHeight: 1.2, marginBottom: 6, letterSpacing: '-0.3px' }}>Loverrr's<br/>Space 💛</h2>
        <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.55, marginBottom: 16 }}>Research-backed tools for a stronger relationship.</p>
        <button onClick={() => onNavigate('navigator')} style={{ background: `linear-gradient(135deg, ${T.rose}, ${T.violet})`, border: 'none', borderRadius: 12, padding: '11px 0', width: '100%', color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <span>⚡</span> NAVIGATE CONFLICT NOW
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cards.map(c => (
          <button key={c.tab} onClick={() => onNavigate(c.tab)} style={{ background: c.glow, border: `1px solid ${c.border}`, borderRadius: 18, padding: '16px 14px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 130, transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: 28 }}>{c.emoji}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{c.title}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{c.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ConflictNavigator ────────────────────────────────────────────────────────
function ConflictNavigator({ onBack, onProcess, onHorsemen, onRepair, onStartup, onTraps }) {
  const [flooding, setFlooding] = useState(false);
  if (flooding) return <FloodingView onBack={() => setFlooding(false)} />;

  const items = [
    { emoji: '🛠️', title: 'Repair Phrases', desc: 'Instant de-escalation toolbox', onClick: onRepair, accent: T.rose, border: T.roseBorder, glow: T.roseGlow },
    { emoji: '🐴', title: '4 Horsemen', desc: 'Identify harmful patterns', onClick: onHorsemen, accent: T.violet, border: T.violetBorder, glow: T.violetGlow },
    { emoji: '⏱️', title: 'Take a Break', desc: 'Flooding timer + reset', onClick: () => setFlooding(true), accent: T.cyan, border: T.cyanBorder, glow: T.cyanGlow },
    { emoji: '🕸️', title: 'Thinking Traps', desc: 'Spot cognitive distortions', onClick: onTraps, accent: T.amber, border: T.amberBorder, glow: T.amberGlow },
    { emoji: '💬', title: 'Start-up Guide', desc: 'Soften how you begin', onClick: onStartup, accent: T.emerald, border: T.emeraldBorder, glow: T.emeraldGlow },
    { emoji: '🗺️', title: 'REPAIR Journey', desc: 'Full 6-step roadmap', onClick: onProcess, accent: T.rose, border: T.roseBorder, glow: T.roseGlow },
  ];

  return (
    <div>
      <BackBtn onBack={onBack} />
      <SectionHero emoji="⚡" tag="Conflict Navigator" title={"Navigate\nThe Storm ⚡"} subtitle="Tools to de-escalate and reach resolution." accent={T.rose} glow={T.roseGlow} border={T.roseBorder} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <button key={i} onClick={item.onClick} style={{ background: item.glow, border: `1px solid ${item.border}`, borderRadius: 16, padding: '16px 18px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
          >
            <span style={{ fontSize: 26, lineHeight: 1 }}>{item.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{item.title}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{item.desc}</div>
            </div>
            <ChevronRight size={16} color={T.dim} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── RepairJourney ────────────────────────────────────────────────────────────
function RepairJourney({ onBack }) {
  const [step, setStep] = useState(0);
  const s = REPAIR_STEPS[step];
  return (
    <div>
      <BackBtn onBack={onBack} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>REPAIR Journey™</span>
        <span style={{ background: T.roseGlow, border: `1px solid ${T.roseBorder}`, borderRadius: 20, padding: '4px 10px', fontSize: 10, fontWeight: 700, color: T.rose }}>Step {step + 1} of 6</span>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.roseBorder}`, borderRadius: 20, overflow: 'hidden', minHeight: 500, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: T.roseGlow, borderBottom: `1px solid ${T.roseBorder}`, padding: '24px 22px' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{s.emoji}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.rose, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Phase {step + 1}</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>{s.title}</h3>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{s.desc}</p>
        </div>
        <div style={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <p style={{ fontSize: 15, color: T.text, fontWeight: 600, lineHeight: 1.6, fontStyle: 'italic', textAlign: 'center' }}>"{s.content}"</p>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>How to Proceed</p>
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{s.instruction}</p>
          </div>
          {s.id === 'R1' && <FloodingView inline />}
        </div>
        <div style={{ padding: '16px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10 }}>
          {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '13px', borderRadius: 12, border: `1px solid ${T.border}`, background: 'transparent', color: T.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Prev</button>}
          <button onClick={() => step < 5 ? setStep(s => s + 1) : onBack()} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${T.rose}, ${T.violet})`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
            {step < 5 ? 'Next Step →' : 'Journey Complete ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FloodingView ─────────────────────────────────────────────────────────────
function FloodingView({ onBack, inline = false }) {
  const [sec, setSec] = useState(20 * 60);
  const [run, setRun] = useState(false);
  useEffect(() => {
    let t; if (run && sec > 0) t = setInterval(() => setSec(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [run, sec]);

  const content = (
    <div style={{ textAlign: 'center' }}>
      {!inline && <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 16 }}>Take a Break ⏱️</h2>}
      <div style={{ fontSize: 56, fontWeight: 800, color: T.cyan, letterSpacing: '-2px', marginBottom: 16 }}>
        {Math.floor(sec / 60)}:{(sec % 60).toString().padStart(2, '0')}
      </div>
      <button onClick={() => setRun(!run)} style={{ background: run ? T.amberGlow : T.cyanGlow, border: `1px solid ${run ? T.amberBorder : T.cyanBorder}`, borderRadius: 12, padding: '10px 28px', color: run ? T.amber : T.cyan, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        {run ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start 20m Break</>}
      </button>
      <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}` }}>
        <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600" alt="Puppy" style={{ width: '100%', display: 'block' }} />
      </div>
      {!inline && <p style={{ color: T.muted, fontSize: 12, marginTop: 14, lineHeight: 1.6, fontStyle: 'italic' }}>"Research shows looking at animals lowers cortisol. Focus on the puppy and breathe."</p>}
    </div>
  );

  if (inline) return content;
  return (
    <div>
      <BackBtn onBack={onBack} />
      <div style={{ background: T.cyanGlow, border: `1px solid ${T.cyanBorder}`, borderRadius: 20, padding: '24px 20px' }}>{content}</div>
    </div>
  );
}

// ─── SoftenedStartup ──────────────────────────────────────────────────────────
function SoftenedStartup({ onBack }) {
  const [feel, setFeel] = useState('');
  const [about, setAbout] = useState('');
  const [need, setNeed] = useState('');
  const [copied, setCopied] = useState(false);
  const result = `I feel ${feel || '...'} about ${about || '...'} and I need ${need || '...'}.`;

  const handleCopy = () => navigator.clipboard.writeText(result).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  const flags = (t) => { const f = [], l = (t || '').toLowerCase(); if (l.includes('you ')) f.push("Avoid 'You' statements"); if (l.includes('always')) f.push("Avoid 'Always'"); if (l.includes('never')) f.push("Avoid 'Never'"); return f; };

  const Section = ({ label, val, setVal, placeholder, words }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</label>
      <input value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 14, fontWeight: 500, outline: 'none', boxSizing: 'border-box' }} />
      {flags(val).map(f => <p key={f} style={{ fontSize: 11, color: T.rose, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={12} /> {f}</p>)}
      {words && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{words.map(w => <button key={w} onClick={() => setVal(w)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 11px', fontSize: 11, fontWeight: 700, color: T.muted, cursor: 'pointer' }}>{w}</button>)}</div>}
    </div>
  );

  return (
    <div style={{ paddingBottom: 24 }}>
      <BackBtn onBack={onBack} label="Back to Conflict" />
      <SectionHero emoji="💬" tag="Communication" title="Start-up Guide 💬" subtitle="Build a Gottman-approved opening statement." accent={T.emerald} glow={T.emeraldGlow} border={T.emeraldBorder} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Section label="1. I Feel..." val={feel} setVal={setFeel} placeholder="Loneliness, worry..." words={FEELING_WORDS} />
        <Section label="2. About What..." val={about} setVal={setAbout} placeholder="Describe the neutral situation..." />
        <Section label="3. I Need..." val={need} setVal={setNeed} placeholder="A hug, help tonight..." words={NEED_WORDS} />
        <div style={{ background: T.violetGlow, border: `1px solid ${T.violetBorder}`, borderRadius: 18, padding: '22px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: T.violet, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Gottman Compliant Draft</p>
          <p style={{ fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: T.text, lineHeight: 1.5, marginBottom: 18 }}>"{result}"</p>
          <button onClick={handleCopy} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${T.violet}, ${T.rose})`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Draft</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FourHorsemenView ─────────────────────────────────────────────────────────
function FourHorsemenView({ onBack }) {
  return (
    <div style={{ paddingBottom: 24 }}>
      <BackBtn onBack={onBack} />
      <SectionHero emoji="🐴" tag="Education" title="The 4 Horsemen 🐴" subtitle="Patterns that predict relationship breakdown — and their antidotes." accent={T.violet} glow={T.violetGlow} border={T.violetBorder} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FOUR_HORSEMEN.map((h, i) => (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>{h.emoji}</span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{h.name}</h3>
                <p style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{h.antidote} is the antidote</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{h.description}</p>
            <div style={{ background: T.roseGlow, border: `1px solid ${T.roseBorder}`, borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.rose, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>How it sounds</p>
              <p style={{ fontSize: 12, fontStyle: 'italic', color: T.text, lineHeight: 1.5 }}>"{h.howItSounds}"</p>
            </div>
            <div style={{ background: T.emeraldGlow, border: `1px solid ${T.emeraldBorder}`, borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.emerald, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>✓ Healthy Choice</p>
              <p style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{h.healthyAlternative}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RepairToolbox ────────────────────────────────────────────────────────────
function RepairToolbox({ onBack }) {
  const [cat, setCat] = useState(REPAIR_PHRASES[0].category);
  const [sel, setSel] = useState(null);
  const current = REPAIR_PHRASES.find(c => c.category === cat);
  return (
    <div style={{ paddingBottom: 24 }}>
      <BackBtn onBack={onBack} />
      <SectionHero emoji="🛠️" tag="De-escalate" title="Repair Toolbox 🛠️" subtitle="A repair attempt stops the negativity spiral before it takes hold." accent={T.rose} glow={T.roseGlow} border={T.roseBorder} />
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 4 }}>
        {REPAIR_PHRASES.map(c => (
          <button key={c.category} onClick={() => { setCat(c.category); setSel(null); }} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: 20, border: `1px solid ${cat === c.category ? T.roseBorder : T.border}`, background: cat === c.category ? T.roseGlow : 'transparent', color: cat === c.category ? T.rose : T.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            {c.emoji} {c.category}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {current.phrases.map(p => (
          <button key={p} onClick={() => setSel(p)} style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 14, border: `1px solid ${sel === p ? T.roseBorder : T.border}`, background: sel === p ? T.roseGlow : T.card, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{p}</span>
            {sel === p && <Check size={16} color={T.rose} style={{ flexShrink: 0, marginLeft: 10 }} />}
          </button>
        ))}
      </div>
      {sel && (
        <div style={{ background: T.violetGlow, border: `1px solid ${T.violetBorder}`, borderRadius: 16, padding: '18px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: T.violet, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Partner Response Guide</p>
          <p style={{ fontSize: 13, color: T.text, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 10 }}>"Acknowledge the attempt! Say: 'I hear you. Thank you for repairing. Let's slow down.'"</p>
          <p style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Outcome: {current.outcome}</p>
        </div>
      )}
    </div>
  );
}

// ─── MagicHoursTracker ────────────────────────────────────────────────────────
function MagicHoursTracker({ onBack, sharedData, onUpdate }) {
  const completed = sharedData.completedRituals || {};
  const doneCount = Object.values(completed).filter(Boolean).length;
  const progress = (doneCount / MAGIC_HOURS.length) * 100;
  return (
    <div style={{ paddingBottom: 24 }}>
      <BackBtn onBack={onBack} />
      <SectionHero emoji="✨" tag="Daily Rituals" title="6 Magic Hours ✨" accent={T.emerald} glow={T.emeraldGlow} border={T.emeraldBorder}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: T.emerald }}>{Math.round(progress)}%</span>
          <div style={{ flex: 1 }}>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${T.emerald}, ${T.cyan})`, borderRadius: 4, transition: 'width 1s ease' }} />
            </div>
            <p style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>{doneCount} of 6 rituals complete today</p>
          </div>
        </div>
      </SectionHero>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {MAGIC_HOURS.map(h => {
          const done = !!completed[h.id];
          return (
            <div key={h.id} onClick={() => onUpdate({ completedRituals: { ...completed, [h.id]: !done } })} style={{ background: done ? T.emeraldGlow : T.card, border: `1px solid ${done ? T.emeraldBorder : T.border}`, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: done ? T.emeraldGlow : 'rgba(255,255,255,0.05)', border: `1px solid ${done ? T.emeraldBorder : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{h.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{h.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: done ? T.emerald : T.dim, background: done ? T.emeraldGlow : 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 20 }}>{h.time}</span>
                </div>
                <p style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{h.desc}</p>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${done ? T.emerald : T.border}`, background: done ? T.emerald : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: '#fff' }}>{done ? '✓' : ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GrowthHub ────────────────────────────────────────────────────────────────
function GrowthHub({ onNavigate, onBack }) {
  return (
    <div>
      <BackBtn onBack={onBack} />
      <SectionHero emoji="🌱" tag="Growth Hub" title={"Deepen\nYour Bond 🌱"} subtitle="Tools to know each other better every day." accent={T.cyan} glow={T.cyanGlow} border={T.cyanBorder} />
      <button onClick={() => onNavigate('convo')} style={{ width: '100%', background: T.card, border: `1px solid ${T.cyanBorder}`, borderRadius: 16, padding: '16px 18px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, boxSizing: 'border-box' }}>
        <span style={{ fontSize: 28 }}>💬</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Conversation Starters</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Road trips, date nights & picnics.</div>
        </div>
        <ChevronRight size={16} color={T.dim} />
      </button>
    </div>
  );
}

// ─── ThinkingTraps ────────────────────────────────────────────────────────────
function ThinkingTraps({ onBack }) {
  const [view, setView] = useState('menu');
  const [selectedTrap, setSelectedTrap] = useState(null);
  const [situation, setSituation] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const runAI = async () => {
    if (!situation.trim()) return;
    setAiLoading(true); setAiResult(null); setAiError('');
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) { setAiError('API key not configured.'); setAiLoading(false); return; }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: `You are a CBT expert. Analyze the situation and identify thinking traps. Respond ONLY with JSON: {"traps":["name1","name2"],"explanation":"brief explanation","reframe":"compassionate reframe","suggestion":"one concrete action"}`, messages: [{ role: 'user', content: `My situation: "${situation}"` }] })
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e?.error?.message || `HTTP ${response.status}`); }
      const data = await response.json();
      setAiResult(JSON.parse(data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim()));
    } catch (err) { setAiError('Error: ' + (err.message || 'Something went wrong.')); }
    setAiLoading(false);
  };

  if (selectedTrap) return (
    <div>
      <BackBtn onBack={() => setSelectedTrap(null)} />
      <div style={{ background: T.amberGlow, border: `1px solid ${T.amberBorder}`, borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${T.amberBorder}` }}>
          <span style={{ fontSize: 40 }}>{selectedTrap.emoji}</span>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 8, letterSpacing: '-0.3px' }}>{selectedTrap.name}</h3>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 6, lineHeight: 1.55 }}>{selectedTrap.description}</p>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: T.roseGlow, border: `1px solid ${T.roseBorder}`, borderRadius: 14, padding: '14px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.rose, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Example</p>
            <p style={{ fontSize: 13, color: T.text, fontStyle: 'italic', lineHeight: 1.5 }}>"{selectedTrap.example}"</p>
          </div>
          <div style={{ background: T.emeraldGlow, border: `1px solid ${T.emeraldBorder}`, borderRadius: 14, padding: '14px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.emerald, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>💡 How to Reframe</p>
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.55 }}>{selectedTrap.reframe}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (view === 'list') return (
    <div style={{ paddingBottom: 24 }}>
      <BackBtn onBack={() => setView('menu')} />
      <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 14 }}>All 12 Thinking Traps</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {THINKING_TRAPS_DATA.map((trap, i) => (
          <button key={i} onClick={() => setSelectedTrap(trap)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '13px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13 }}>
            <span style={{ fontSize: 24 }}>{trap.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{trap.name}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '90%' }}>{trap.description}</div>
            </div>
            <ChevronRight size={14} color={T.dim} />
          </button>
        ))}
      </div>
    </div>
  );

  if (view === 'ai') return (
    <div style={{ paddingBottom: 24 }}>
      <BackBtn onBack={() => { setView('menu'); setAiResult(null); setSituation(''); }} />
      <SectionHero emoji="🕸️" tag="AI Analysis" title="Identify My Trap 🧠" subtitle="Describe what you're thinking — AI identifies your traps and helps you reframe." accent={T.amber} glow={T.amberGlow} border={T.amberBorder} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <textarea value={situation} onChange={e => setSituation(e.target.value)} placeholder="e.g. My partner didn't text me back for 3 hours and I'm convinced they're upset with me..." rows={4} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1px solid ${T.amberBorder}`, background: T.card, color: T.text, fontSize: 14, fontWeight: 500, outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.5 }} />
        <button onClick={runAI} disabled={!situation.trim() || aiLoading} style={{ padding: '13px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${T.amber}, ${T.rose})`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: situation.trim() && !aiLoading ? 'pointer' : 'not-allowed', opacity: situation.trim() && !aiLoading ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {aiLoading ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : <><Brain size={16} /> Identify My Traps</>}
        </button>
        {aiError && <p style={{ color: T.rose, fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{aiError}</p>}
        {aiResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: T.amberGlow, border: `1px solid ${T.amberBorder}`, borderRadius: 14, padding: '14px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.amber, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Traps Detected</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{aiResult.traps.map((t, i) => <span key={i} style={{ background: T.amberGlow, border: `1px solid ${T.amberBorder}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: T.amber }}>{t}</span>)}</div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>What's happening</p>
              <p style={{ fontSize: 13, color: T.text, lineHeight: 1.55 }}>{aiResult.explanation}</p>
            </div>
            <div style={{ background: T.emeraldGlow, border: `1px solid ${T.emeraldBorder}`, borderRadius: 14, padding: '14px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.emerald, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>💡 Reframe</p>
              <p style={{ fontSize: 13, color: T.text, lineHeight: 1.55 }}>{aiResult.reframe}</p>
            </div>
            <div style={{ background: T.violetGlow, border: `1px solid ${T.violetBorder}`, borderRadius: 14, padding: '14px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.violet, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Try This Now</p>
              <p style={{ fontSize: 13, color: T.text, lineHeight: 1.55 }}>{aiResult.suggestion}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <BackBtn onBack={onBack} label="Back to Conflict" />
      <SectionHero emoji="🕸️" tag="Cognitive Patterns" title={"Thinking\nTraps 🕸️"} subtitle="Spot and reframe the thoughts that make conflict worse." accent={T.amber} glow={T.amberGlow} border={T.amberBorder} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { view: 'ai', emoji: '🧠', title: 'Identify My Trap', desc: 'Describe your situation — AI spots your traps', accent: T.amber, glow: T.amberGlow, border: T.amberBorder },
          { view: 'list', emoji: '📋', title: 'All 12 Thinking Traps', desc: 'Learn each trap with examples and reframes', accent: T.violet, glow: T.violetGlow, border: T.violetBorder },
        ].map(item => (
          <button key={item.view} onClick={() => setView(item.view)} style={{ background: item.glow, border: `1px solid ${item.border}`, borderRadius: 16, padding: '16px 18px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 26 }}>{item.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{item.title}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{item.desc}</div>
            </div>
            <ChevronRight size={16} color={T.dim} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ConversationStarters ─────────────────────────────────────────────────────
function ConversationStarters({ onBack }) {
  const [selectedCat, setSelectedCat] = useState(null);
  const [currentQ, setCurrentQ] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [usedIdx, setUsedIdx] = useState([]);

  const getNext = (cat) => {
    const avail = cat.questions.map((_, i) => i).filter(i => !usedIdx.includes(`${cat.id}-${i}`));
    const pool = avail.length === 0 ? cat.questions.map((_, i) => i) : avail;
    if (avail.length === 0) setUsedIdx([]);
    const idx = pool[Math.floor(Math.random() * pool.length)];
    setCurrentQ(cat.questions[idx]);
    setUsedIdx(prev => [...prev, `${cat.id}-${idx}`]);
    setIsFlipped(false);
  };

  const getAI = async (cat) => {
    setAiLoading(true);
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) { setAiLoading(false); return; }
      const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 200, system: `Generate ONE creative conversation starter for couples in the category: "${cat.label}". Respond with ONLY the question, no quotes, no explanation.`, messages: [{ role: 'user', content: 'Generate one.' }] }) });
      const data = await res.json();
      setCurrentQ(data.content.map(i => i.text || '').join('').trim());
      setIsFlipped(false);
    } catch (err) { console.error(err); }
    setAiLoading(false);
  };

  if (selectedCat) {
    const cat = CONVO_CATEGORIES.find(c => c.id === selectedCat);
    return (
      <div style={{ paddingBottom: 24 }}>
        <BackBtn onBack={() => { setSelectedCat(null); setCurrentQ(null); }} label="All Categories" />
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 44 }}>{cat.emoji}</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginTop: 6 }}>{cat.label}</h2>
        </div>
        {/* Flip Card */}
        <div onClick={() => currentQ && setIsFlipped(!isFlipped)} style={{ minHeight: 240, borderRadius: 20, border: `1px solid ${isFlipped ? cat.accent + '55' : T.border}`, background: isFlipped ? `${cat.accent}22` : T.card, cursor: currentQ ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 24px', textAlign: 'center', marginBottom: 14, transition: 'all 0.3s' }}>
          {!currentQ ? (
            <p style={{ color: T.dim, fontSize: 13, fontWeight: 600 }}>Tap a button below to get your first question!</p>
          ) : isFlipped ? (
            <div>
              <p style={{ fontSize: 17, fontWeight: 700, color: T.text, lineHeight: 1.55 }}>"{currentQ}"</p>
              <p style={{ fontSize: 10, color: T.muted, marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tap to flip back</p>
            </div>
          ) : (
            <div>
              <span style={{ fontSize: 50 }}>{cat.emoji}</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginTop: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tap to reveal</p>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={() => getNext(cat)} style={{ padding: '13px', borderRadius: 12, border: `1px solid ${cat.accent}55`, background: `${cat.accent}22`, color: cat.accent, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <Shuffle size={15} /> Random
          </button>
          <button onClick={() => getAI(cat)} disabled={aiLoading} style={{ padding: '13px', borderRadius: 12, border: `1px solid ${T.violetBorder}`, background: T.violetGlow, color: T.violet, fontSize: 12, fontWeight: 800, cursor: 'pointer', opacity: aiLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            {aiLoading ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating</> : <><Sparkles size={15} /> AI Question</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <BackBtn onBack={onBack} />
      <SectionHero emoji="💬" tag="Conversation Starters" title={"Questions for\nEvery Moment 💬"} subtitle="100+ questions · 7 categories · Unlimited AI" accent={T.cyan} glow={T.cyanGlow} border={T.cyanBorder} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {CONVO_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => { setSelectedCat(cat.id); setCurrentQ(null); setIsFlipped(false); }} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '13px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxSizing: 'border-box', width: '100%' }}>
            <span style={{ fontSize: 24 }}>{cat.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{cat.label}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{cat.questions.length} questions + unlimited AI</div>
            </div>
            <ChevronRight size={14} color={T.dim} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── PhrasePolisher ───────────────────────────────────────────────────────────
function PhrasePolisher({ onBack }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const polish = async (text) => {
    if (!text.trim()) return;
    setLoading(true); setResult(null); setError('');
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) { setError('API key not configured.'); setLoading(false); return; }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: `You are a Gottman Method expert. Rewrite the phrase using Gottman principles. Use "I feel..." language, remove criticism/contempt/defensiveness, focus on speaker's feelings and needs. Respond ONLY with JSON: {"polished":"rewritten phrase","breakdown":[{"issue":"what was problematic","fix":"what changed and why"}]}. Keep breakdown to 2-4 items.`, messages: [{ role: 'user', content: `Polish: "${text}"` }] })
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e?.error?.message || `HTTP ${response.status}`); }
      const data = await response.json();
      setResult(JSON.parse(data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim()));
    } catch (err) { setError('Error: ' + (err.message || 'Something went wrong.')); }
    setLoading(false);
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      <BackBtn onBack={onBack} />
      <SectionHero emoji="🪄" tag="AI-Powered" title={"Phrase\nPolisher 🪄"} subtitle="Type it rough — get a Gottman-approved version back." accent={T.violet} glow={T.violetGlow} border={T.violetBorder} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. You never listen to me and just ignore everything I say..." rows={4} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1px solid ${T.violetBorder}`, background: T.card, color: T.text, fontSize: 14, fontWeight: 500, outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.5 }} />
        <button onClick={() => polish(input)} disabled={!input.trim() || loading} style={{ padding: '13px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${T.violet}, ${T.rose})`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', opacity: input.trim() && !loading ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Polishing...</> : <><Wand2 size={16} /> Polish It</>}
        </button>
        {error && <p style={{ color: T.rose, fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{error}</p>}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: T.violetGlow, border: `1px solid ${T.violetBorder}`, borderRadius: 18, padding: '20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.violet, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Gottman-Approved Version</p>
              <p style={{ fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: T.text, lineHeight: 1.55, marginBottom: 16 }}>"{result.polished}"</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={() => navigator.clipboard.writeText(result.polished).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })} style={{ padding: '11px', borderRadius: 10, border: `1px solid ${T.violetBorder}`, background: 'rgba(255,255,255,0.07)', color: T.text, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                </button>
                <button onClick={() => { setInput(result.polished); setResult(null); }} style={{ padding: '11px', borderRadius: 10, border: `1px solid ${T.violetBorder}`, background: 'rgba(255,255,255,0.07)', color: T.text, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <RefreshCw size={14} /> Refine
                </button>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>What changed & why</p>
              </div>
              {result.breakdown.map((item, i) => (
                <div key={i} style={{ padding: '13px 16px', borderBottom: i < result.breakdown.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: T.rose, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={11} /> {item.issue}</p>
                  <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.55 }}>{item.fix}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
