/**
 * Specchio degli Auguri — Felicitatiespegel / Specchio delle Congratulazioni
 * Stile Efteling / Anton Piek  ·  v1.0-nl-it
 * Gebaseerd op Specchio del Laureato v1.0-it
 <!--
================================================================================
  Specchio degli Auguri — Felicitatiespegel
  Versione 1.0-nl-it — 2025
================================================================================
  Copyright (c) 2025 Jan den Hollander
  Tutti i diritti riservati / Alle rechten voorbehouden.
  Contact: jandenhollander@duck.com
================================================================================
-->
 */
import { useState, useRef, useEffect, CSSProperties } from 'react';
import { Key, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ── Types ─────────────────────────────────────────────────────────────────
type Lang = 'nl' | 'it';

interface Fatto {
  anno: number;
  testo: string;
}

interface Messaggio {
  testo: string;
  fatti: Fatto[];
  _isFallback?: boolean;
}

interface ParsedDate {
  day: number;
  month: number;
}

interface KransPunt {
  a: number;
  emoji: string;
  fs: number;
  off: number;
  rot: number;
}

interface SetupOverlayProps {
  step: StepKey;
  lang: Lang;
  name: string;
  setName: (v: string) => void;
  dateInput: string;
  setDateInput: (v: string) => void;
  feest: string;
  setFeest: (v: string) => void;
  customFeest: string;
  setCustomFeest: (v: string) => void;
  onListen: (target: string) => void;
  isListening: boolean;
  listenTarget: string | null;
  onConfirm: () => void;
}

interface SpeechBubbleProps {
  message: Messaggio;
  lang: Lang;
  onSpeak: () => void;
  onScreenshot: () => void;
}

interface OrnateFrameProps {
  W?: number;
  H?: number;
}

// ── Feestsoorten ──────────────────────────────────────────────────────────
const FEESTEN: Record<Lang, { key: string; label: string }[]> = {
  nl: [
    { key: 'huwelijk',    label: '💍 Huwelijk' },
    { key: 'nieuwe_baan', label: '💼 Nieuwe baan' },
    { key: 'nieuwe_woning', label: '🏠 Nieuwe woning' },
    { key: 'verjaardag',  label: '🎂 Verjaardag' },
    { key: 'pensioen',    label: '🌅 Pensioen' },
    { key: 'jubileum',    label: '🥂 Jubileum' },
    { key: 'baby',        label: '👶 Baby geboren' },
    { key: 'anders',      label: '✨ Anders...' },
  ],
  it: [
    { key: 'matrimonio',  label: '💍 Matrimonio' },
    { key: 'nuovo_lavoro', label: '💼 Nuovo lavoro' },
    { key: 'nuova_casa',  label: '🏠 Nuova casa' },
    { key: 'compleanno',  label: '🎂 Compleanno' },
    { key: 'pensione',    label: '🌅 Pensione' },
    { key: 'anniversario', label: '🥂 Anniversario' },
    { key: 'nascita',     label: '👶 Nascita' },
    { key: 'altro',       label: '✨ Altro...' },
  ],
};

// ── Teksten UI ────────────────────────────────────────────────────────────
const T = {
  title:      { nl: '✦ Felicitatiespegel ✦',         it: '✦ Specchio degli Auguri ✦' },
  subtitle:   { nl: 'De spreukenspiegel voor elk feest…', it: 'Lo specchio magico per ogni festa…' },
  stepName:   { nl: 'Wie vieren we vandaag?',         it: 'Chi festeggiamo oggi?' },
  stepFeest:  { nl: 'Wat vieren we?',                 it: 'Cosa festeggiamo?' },
  stepDate:   { nl: 'Op welke datum?',                it: 'In quale data?' },
  namePH:     { nl: 'Schrijf je naam…',               it: 'Scrivi il tuo nome…' },
  datePH:     { nl: '14 juni of 14-06',               it: '14 giugno o 14-06' },
  customPH:   { nl: 'Omschrijf het feest…',           it: 'Descrivi la festa…' },
  btnNext:    { nl: 'Verder ✨',                       it: 'Avanti ✨' },
  btnMagic:   { nl: 'Toon mijn wens 🎊',              it: 'Mostra il mio augurio 🎊' },
  btnAgain:   { nl: '✨ Feliciteer nog iemand ✨',     it: '✨ Festeggia un\'altra persona ✨' },
  btnAgainSub:{ nl: 'Tik hier om opnieuw te beginnen', it: 'Tocca qui per ricominciare' },
  btnMusic:   { nl: 'Muziek van die dag 🎵',           it: 'La musica del tuo giorno 🎵' },
  btnMusicDone:{ nl: 'Veel plezier! 🎶',              it: 'Buon ascolto! 🎶' },
  btnShot:    { nl: '📸 Schermafbeelding',             it: '📸 Screenshot' },
  shotHint:   { nl: 'Sla op in je gallerij',          it: 'Salva nella galleria' },
  thinking:   { nl: 'De spiegel peinst…',             it: 'Lo specchio contempla…' },
  fallback:   { nl: '✦ De spiegel spreekt uit zijn geheugen ✦', it: '✦ Lo specchio parla dalla sua memoria ✦' },
  noKey:      { nl: 'Geen API-sleutel ingesteld 🔑',   it: 'Nessuna chiave API impostata 🔑' },
  keyTitle:   { nl: '🔑 API-sleutel',                  it: '🔑 Chiave API' },
  keyHint:    { nl: 'Gemini API-sleutel (Google AI Studio).\nAlleen op dit toestel opgeslagen.\n👉 Gratis aanmaken:\naistudio.google.com/app/apikey', it: 'Chiave API Gemini (Google AI Studio).\nSalvata solo su questo dispositivo.\n👉 Crea gratis:\naistudio.google.com/app/apikey' },
  keyCancel:  { nl: 'Annuleren',                       it: 'Annulla' },
  keySave:    { nl: 'Opslaan',                         it: 'Salva' },
  keySet:     { nl: 'API-sleutel ✓',                   it: 'Chiave API ✓' },
  keySet0:    { nl: 'API-sleutel instellen',            it: 'Imposta chiave API' },
  dateHint:   { nl: 'Bijv: 14 juni · juni 14 · 14-06', it: 'Es: 14 giugno · giugno 14 · 14-06' },
  histLabel:  { nl: 'Op jouw feestdag, ooit…',         it: 'Nel tuo giorno speciale, in passato…' },
  listenErr:  { nl: 'Microfoon werkt niet in deze browser 🎤', it: 'Il microfono non funziona in questo browser 🎤' },
  noDate:     { nl: 'Datum niet herkend. Probeer: 14 juni of 14-06 ✨', it: 'Non capisco la data. Prova: 14 giugno o 14-06 ✨' },
  noName:     { nl: 'Vertel me eerst je naam! 🌟',      it: 'Prima dimmi come ti chiami! 🌟' },
  noFeest:    { nl: 'Kies of omschrijf wat je viert! 🎊', it: 'Scegli o descrivi cosa festeggi! 🎊' },
  chooseFeest:{ nl: 'Kies een feest:',                  it: 'Scegli una festa:' },
  langSwitch: { nl: '🇮🇹',                              it: '🇳🇱' },
};

// ── ENV key ───────────────────────────────────────────────────────────────
const ENV_KEY: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_KEY) || '';
// Eigen gratis key aanmaken: https://aistudio.google.com/app/apikey
// Vul hier je key in als je geen Vercel env gebruikt:
const DEPLOY_KEY = '';

// ── Retry helper ──────────────────────────────────────────────────────────
const sleep = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 15000)
        ),
      ]);
    } catch (err: any) {
      const isLast = attempt === maxAttempts;
      const isRetryable =
        err?.message?.includes('timeout') ||
        err?.message?.includes('503') ||
        err?.message?.includes('overloaded') ||
        err?.message?.includes('network');
      if (isLast || !isRetryable) throw err;
      await sleep(attempt * 1500);
    }
  }
  throw new Error('alle pogingen mislukt');
}

// ── TTS ───────────────────────────────────────────────────────────────────
const getVoices = (): Promise<SpeechSynthesisVoice[]> =>
  new Promise(resolve => {
    const v = window.speechSynthesis.getVoices();
    if (v.length) { resolve(v); return; }
    window.speechSynthesis.onvoiceschanged = () =>
      resolve(window.speechSynthesis.getVoices());
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
  });

async function speakWithFallback(text: string, lang: Lang, onEnd: () => void = () => {}): Promise<void> {
  if (!text) { onEnd(); return; }
  window.speechSynthesis.cancel();
  const voices = await getVoices();
  const bcp = lang === 'nl' ? 'nl' : 'it';
  const pick =
    voices.find(v => v.lang.startsWith(bcp) && /female|woman|vrouw/i.test(v.name)) ||
    voices.find(v => v.lang.startsWith(bcp)) ||
    voices[0];
  const utt = new SpeechSynthesisUtterance(text);
  if (pick) utt.voice = pick;
  utt.lang = lang === 'nl' ? 'nl-NL' : 'it-IT';
  utt.rate = 0.88; utt.pitch = 1.08;
  utt.onend = onEnd; utt.onerror = onEnd;
  window.speechSynthesis.speak(utt);
  setTimeout(() => {
    try { window.speechSynthesis.cancel(); } catch {}
  }, text.length * 70 + 3000);
}

async function speakAll(
  messaggio: string, fatti: Fatto[], lang: Lang, onEnd: () => void = () => {}
): Promise<void> {
  if (!messaggio) { onEnd(); return; }
  const histPrefix = lang === 'nl'
    ? 'En wist je dat er op jouw feestdag vroeger bijzondere dingen gebeurden? '
    : 'E sapevi che nel tuo giorno speciale sono successe cose straordinarie? ';
  const fattiTesto = fatti.length > 0
    ? histPrefix + fatti.map(f => `${lang === 'nl' ? 'In het jaar' : "Nell'anno"} ${f.anno}: ${f.testo}`).join('. ') + '.'
    : '';
  speakWithFallback(fattiTesto ? `${messaggio} ${fattiTesto}` : messaggio, lang, onEnd);
}

// ── Stappen ───────────────────────────────────────────────────────────────
const STEP = { NAME: 'name', FEEST: 'feest', DATE: 'date', DONE: 'done' } as const;
type StepKey = typeof STEP[keyof typeof STEP];

// ── Prompt builder ────────────────────────────────────────────────────────
const buildPrompt = (
  name: string, day: number, month: number, feest: string, lang: Lang
): string => {
  const maanden_nl = ['januari','februari','maart','april','mei','juni',
    'juli','augustus','september','oktober','november','december'];
  const mesi_it = ['gennaio','febbraio','marzo','aprile','maggio','giugno',
    'luglio','agosto','settembre','ottobre','novembre','dicembre'];
  const maand = lang === 'nl' ? maanden_nl[month - 1] : mesi_it[month - 1];

  if (lang === 'nl') {
    return `Je bent de Felicitatiespegel, een betoverde spiegel uit een oud sprookjesbos. Spreek warm, poëtisch en persoonlijk. Gebruik alleen Nederlands.

Persoon: ${name} | Datum: ${day} ${maand} | Aanleiding: ${feest}

Geef een persoonlijke, inspirerende felicitatieboodschap (max 3 zinnen) die expliciet "${feest}" benoemt en positief en hoopvol is.

Voeg precies 2 echte historische weetjes toe van ${day} ${maand} — gebeurtenissen op het gebied van wetenschap, kunst, cultuur, uitvindingen of ontdekkingen. Kies bij voorkeur weetjes die resoneren met het thema "${feest}".

Antwoord ALLEEN als JSON zonder markdown:
{"testo":"...","fatti":[{"anno":1969,"testo":"..."}]}`;
  } else {
    return `Sei lo Specchio degli Auguri, uno specchio incantato di una foresta sapiente. Parla in modo caloroso, ispirato e rispettoso. Usa solo l'italiano.

Persona: ${name} | Data: ${day} ${maand} | Occasione: ${feest}

Dai un messaggio di auguri personale e ispirato (max 3 frasi) che menzioni esplicitamente "${feest}" e sia ottimista e concreto.

Aggiungi precisamente 2 curiosità storiche reali del ${day} ${maand} — eventi legati alla scienza, arte, cultura, invenzioni o scoperte. Se possibile, scegli eventi che risuonano con il tema "${feest}".

Rispondi SOLO come JSON senza markdown:
{"testo":"...","fatti":[{"anno":1969,"testo":"..."}]}`;
  }
};

// ── Ornate Frame — 🍾🥳🥂 wisselend ipv 📚 ───────────────────────────────
function ptOnEllipse(
  cx: number, cy: number, rx: number, ry: number, angleDeg: number
): [number, number] {
  const a = (angleDeg - 90) * Math.PI / 180;
  return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
}

function OrnateFrame({ W = 270, H = 330 }: OrnateFrameProps) {
  const cx = W / 2, cy = H / 2;
  const rx = cx - 10, ry = cy - 10;

  // 🍾🥳🥂 wisselen ipv 📚
  const feestEmojis = ['🍾', '🥳', '🥂'];
  const kransPunten: KransPunt[] = [
    { a:  0, emoji: feestEmojis[0], fs:18, off: 12, rot:  0 },
    { a: 14, emoji:'🍀', fs:15, off:  4, rot: 20 },
    { a: 25, emoji:'🌱', fs:13, off: -2, rot: 35 },
    { a: 37, emoji: feestEmojis[1], fs:16, off:  8, rot: 50 },
    { a: 50, emoji:'🍀', fs:14, off:  2, rot: 65 },
    { a: 63, emoji:'🌸', fs:18, off: 11, rot: 80 },
    { a: 76, emoji:'🌱', fs:12, off: -4, rot: 95 },
    { a: 87, emoji:'🍀', fs:15, off:  5, rot:110 },
    { a: 99, emoji: feestEmojis[2], fs:17, off: 10, rot:125 },
    { a:111, emoji:'🌱', fs:12, off: -3, rot:140 },
    { a:122, emoji:'🍀', fs:16, off:  6, rot:155 },
    { a:134, emoji: feestEmojis[0], fs:17, off: 12, rot:170 },
    { a:146, emoji:'🌱', fs:13, off: -2, rot:185 },
    { a:157, emoji:'🌸', fs:19, off: 13, rot:200 },
    { a:169, emoji:'🍀', fs:14, off:  3, rot:215 },
    { a:180, emoji: feestEmojis[1], fs:19, off: 13, rot:180 },
    { a:192, emoji:'🌱', fs:12, off: -4, rot:245 },
    { a:204, emoji:'🍀', fs:15, off:  5, rot:260 },
    { a:216, emoji: feestEmojis[2], fs:16, off: 11, rot:200 },
    { a:228, emoji:'🌱', fs:12, off: -3, rot:290 },
    { a:239, emoji:'🌸', fs:20, off: 14, rot:185 },
    { a:251, emoji:'🍀', fs:14, off:  4, rot:320 },
    { a:263, emoji: feestEmojis[0], fs:17, off: 11, rot:195 },
    { a:274, emoji:'🌱', fs:12, off: -4, rot:350 },
    { a:286, emoji:'🍀', fs:15, off:  5, rot: 10 },
    { a:298, emoji:'🌸', fs:19, off: 12, rot: 25 },
    { a:309, emoji:'🌱', fs:12, off: -2, rot: 40 },
    { a:320, emoji: feestEmojis[1], fs:16, off:  9, rot: 55 },
    { a:332, emoji:'🍀', fs:14, off:  3, rot: 70 },
    { a:344, emoji: feestEmojis[2], fs:18, off: 12, rot: -5 },
    { a:356, emoji:'🌱', fs:12, off: -3, rot: 10 },
  ];

  const pts = Array.from({ length: 73 }, (_, i) => {
    const angle = i * 5;
    const wave = Math.sin(i * 0.9) * 6;
    const [x, y] = ptOnEllipse(cx, cy, rx + wave, ry + wave, angle);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pathD = pts.join(' ') + 'Z';

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:2 }}>
      <defs>
        <linearGradient id="gG1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fff0a0"/>
          <stop offset="25%"  stopColor="#d4a017"/>
          <stop offset="55%"  stopColor="#b8860b"/>
          <stop offset="80%"  stopColor="#f0c040"/>
          <stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
        <linearGradient id="gG2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#ffe566"/>
          <stop offset="50%"  stopColor="#c49a0c"/>
          <stop offset="100%" stopColor="#f5e642"/>
        </linearGradient>
        <filter id="gGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <filter id="emojiShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0a1a04" floodOpacity="0.55"/>
        </filter>
        <filter id="festShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#300010" floodOpacity="0.5"/>
        </filter>
      </defs>

      <path d={pathD} fill="none" stroke="#18420a" strokeWidth="5" opacity="0.6"/>
      <path d={pathD} fill="none" stroke="#3d8e1e" strokeWidth="3" opacity="0.85"/>
      <path d={pathD} fill="none" stroke="#7acc40" strokeWidth="1.2" opacity="0.28" strokeDasharray="3 9"/>

      <ellipse cx={cx} cy={cy} rx={rx}    ry={ry}    fill="none" stroke="url(#gG1)" strokeWidth="5.5"/>
      <ellipse cx={cx} cy={cy} rx={rx-8}  ry={ry-8}  fill="none" stroke="url(#gG2)" strokeWidth="1.6" opacity="0.6"/>
      <ellipse cx={cx} cy={cy} rx={rx-13} ry={ry-13} fill="none" stroke="#f5e642"   strokeWidth="0.5" opacity="0.18"/>

      {/* Groene bladeren */}
      {kransPunten.filter(p => ['🌱','🍀'].includes(p.emoji)).map((p, i) => {
        const [px, py] = ptOnEllipse(cx, cy, rx + p.off, ry + p.off, p.a);
        return (
          <text key={`g${i}`} x={px} y={py} fontSize={p.fs}
            textAnchor="middle" dominantBaseline="middle"
            transform={`rotate(${p.rot},${px},${py})`}
            filter="url(#emojiShadow)" style={{ userSelect:'none' }}>
            {p.emoji}
          </text>
        );
      })}

      {/* Feest-emoji's en bloemen */}
      {kransPunten.filter(p => ['🍾','🥳','🥂','🌸'].includes(p.emoji)).map((p, i) => {
        const [px, py] = ptOnEllipse(cx, cy, rx + p.off, ry + p.off, p.a);
        return (
          <text key={`f${i}`} x={px} y={py} fontSize={p.fs}
            textAnchor="middle" dominantBaseline="middle"
            transform={`rotate(${p.rot},${px},${py})`}
            filter="url(#festShadow)" style={{ userSelect:'none' }}>
            {p.emoji}
          </text>
        );
      })}

      {/* Bovenste decoratie — 📯 */}
      <circle cx={cx} cy={13} r={23} fill="url(#gG1)" filter="url(#gGlow)"/>
      <circle cx={cx} cy={13} r={19} fill="#100802"/>
      <circle cx={cx} cy={13} r={17} fill="url(#gG1)" opacity="0.08"/>
      <text x={cx} y={20} textAnchor="middle" fontSize="18" style={{ userSelect:'none' }}>📯</text>
      <line x1={cx} y1={36} x2={cx} y2={cy-ry} stroke="url(#gG1)" strokeWidth="2.5" opacity="0.75"/>
      <circle cx={cx} cy={37} r={3.5} fill="url(#gG1)"/>

      {/* Onderkant decoratie */}
      <path d={`M${cx-42} ${H-18} Q${cx} ${H-4} ${cx+42} ${H-18}`}
        fill="none" stroke="url(#gG1)" strokeWidth="2.5"/>
      <circle cx={cx} cy={H-4} r={5} fill="url(#gG1)"/>
      {([-24, 24] as number[]).map((dx, i) =>
        <circle key={i} cx={cx+dx} cy={H-14} r={3} fill="#d4a017" opacity="0.72"/>
      )}

      {/* Hoekversieringen */}
      {([[cx, cy-ry-18],[cx, cy+ry+12],[cx-rx-12, cy],[cx+rx+12, cy]] as [number,number][])
        .map(([ex, ey], i) => (
          <text key={`sp${i}`} x={ex} y={ey}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="10" opacity="0.55" style={{ userSelect:'none' }}>✨</text>
        ))
      }
    </svg>
  );
}

// ── Vuurvliegjes & Particles ──────────────────────────────────────────────
const FIREFLIES = Array.from({ length: 16 }, (_, i) => ({
  id: i, x: Math.random()*100, y: Math.random()*100,
  delay: Math.random()*4, dur: 3 + Math.random()*3,
  dx: (Math.random()-0.5)*60, dy: (Math.random()-0.5)*40,
}));

const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i, x: 10+Math.random()*80, y: 10+Math.random()*80,
  size: 4+Math.random()*7, delay: Math.random()*3, dur: 2+Math.random()*2,
  color: ['#f5e642','#fff8c0','#ffb347','#a8edea','#c3f0ca'][i % 5],
}));

// ── Spiegel intern: feest-emoji ───────────────────────────────────────────
function MirrorOverlay() {
  return (
    <div style={{
      position:'absolute', inset:0, display:'flex',
      alignItems:'center', justifyContent:'center',
      pointerEvents:'none', zIndex:3,
      flexDirection:'column', gap:2,
    }}>
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center', gap:1,
        filter:'drop-shadow(0 0 8px rgba(245,230,66,0.6))',
        opacity:0.82, fontSize:22, lineHeight:1.2,
      }}>
        <span>🎊</span>
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          <span style={{ fontSize:16 }}>✨</span>
          <span>📯</span>
          <span style={{ fontSize:16 }}>✨</span>
        </div>
        <span>🥂</span>
      </div>
    </div>
  );
}

// ── Setup Overlay ─────────────────────────────────────────────────────────
function SetupOverlay({
  step, lang,
  name, setName,
  dateInput, setDateInput,
  feest, setFeest,
  customFeest, setCustomFeest,
  onListen, isListening, listenTarget, onConfirm,
}: SetupOverlayProps) {
  const isName  = step === STEP.NAME;
  const isFeest = step === STEP.FEEST;
  const isDate  = step === STEP.DATE;

  const feestLijst = FEESTEN[lang];
  const showCustom = feest === (lang === 'nl' ? 'anders' : 'altro');

  const questionText = isName  ? T.stepName[lang]
    : isFeest ? T.stepFeest[lang]
    : T.stepDate[lang];

  const iconTop = isName ? '🎊📯✨' : isFeest ? '🎉' : '📅';

  return (
    <motion.div key={step}
      initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
      exit={{ opacity:0, scale:0.92 }}
      style={{
        position:'absolute', inset:0,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'12px 16px',
        background:'rgba(14,7,28,0.94)',
        borderRadius:'50% 50% 47% 47%',
        zIndex:10, gap:8,
        overflowY:'auto',
      }}
    >
      <div style={{ fontSize:22 }}>{iconTop}</div>

      <p style={{
        color:'#f5e642', fontSize:12, textAlign:'center', margin:0,
        lineHeight:1.55, fontFamily:"'IM Fell English', serif",
        textShadow:'0 0 10px rgba(245,230,66,0.48)',
      }}>
        {questionText}
      </p>

      {isName && (
        <>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onConfirm()}
            placeholder={T.namePH[lang]}
            inputMode="text"
            autoFocus
            style={S.input}
          />
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={() => onListen(STEP.NAME)} style={S.btnMic(isListening && listenTarget===STEP.NAME)}>
              {isListening && listenTarget===STEP.NAME ? '🔴' : '🎤'}
            </button>
            <button onClick={onConfirm} style={S.btnGold}>{T.btnNext[lang]}</button>
          </div>
        </>
      )}

      {isFeest && (
        <>
          <p style={{ fontSize:10, color:'rgba(245,230,66,0.42)', margin:0 }}>{T.chooseFeest[lang]}</p>
          <div style={{ position:'relative', width:'96%' }}>
          <div style={{
            display:'grid', gridTemplateColumns:'1fr 1fr', gap:5,
            width:'100%', maxHeight:160, overflowY:'auto',
          }}>
            {feestLijst.map(f => (
              <button key={f.key} onClick={() => { setFeest(f.key); }}
                style={{
                  padding:'6px 8px', borderRadius:10, fontSize:11,
                  fontFamily:"'IM Fell English', serif",
                  background: feest === f.key
                    ? 'linear-gradient(135deg,#d4a017,#f5e642)'
                    : 'rgba(245,230,66,0.07)',
                  border: feest === f.key
                    ? '1.5px solid #f5e642'
                    : '1px solid rgba(245,230,66,0.22)',
                  color: feest === f.key ? '#180c00' : '#f5e642',
                  cursor:'pointer', transition:'all 0.18s', textAlign:'left',
                }}>
                {f.label}
              </button>
            ))}
          </div>
          {/* Pijltje: scroll-hint */}
          <div style={{
            textAlign:'center', fontSize:14, color:'rgba(245,230,66,0.45)',
            marginTop:2, animation:'bounce 1.4s ease-in-out infinite',
            pointerEvents:'none',
          }}>▾</div>
          </div>
          {showCustom && (
            <input
              value={customFeest}
              onChange={e => setCustomFeest(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onConfirm()}
              placeholder={T.customPH[lang]}
              inputMode="text"
              autoFocus
              style={S.input}
            />
          )}
          <button onClick={onConfirm} style={S.btnGold}>{T.btnNext[lang]}</button>
        </>
      )}

      {isDate && (
        <>
          <input
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onConfirm()}
            placeholder={T.datePH[lang]}
            inputMode="numeric"
            autoFocus
            style={S.input}
          />
          <p style={{ fontSize:9, color:'rgba(245,230,66,0.32)', margin:0, textAlign:'center' }}>
            {T.dateHint[lang]}
          </p>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={() => onListen(STEP.DATE)} style={S.btnMic(isListening && listenTarget===STEP.DATE)}>
              {isListening && listenTarget===STEP.DATE ? '🔴' : '🎤'}
            </button>
            <button onClick={onConfirm} style={S.btnGold}>{T.btnMagic[lang]}</button>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ── Tekstwolk met screenshot-knop ─────────────────────────────────────────
function SpeechBubble({ message, lang, onSpeak, onScreenshot }: SpeechBubbleProps) {
  const text  = message.testo || '';
  const fatti = message.fatti || [];
  return (
    <motion.div
      initial={{ opacity:0, y:18, scale:0.95 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:-8 }}
      style={{
        width:'100%',
        background:'linear-gradient(160deg,rgba(36,20,6,0.98),rgba(20,11,3,0.99))',
        border:'2px solid rgba(212,160,23,0.52)',
        borderRadius:18, padding:'13px 16px',
        boxShadow:'0 8px 28px rgba(0,0,0,0.65),0 0 18px rgba(212,160,23,0.07)',
        position:'relative',
      }}
    >
      <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
        width:0, height:0, borderLeft:'9px solid transparent',
        borderRight:'9px solid transparent', borderBottom:'12px solid rgba(212,160,23,0.52)' }}/>
      <div style={{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)',
        width:0, height:0, borderLeft:'7px solid transparent',
        borderRight:'7px solid transparent', borderBottom:'10px solid rgba(36,20,6,0.98)' }}/>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:8 }}>
        <button onClick={onSpeak} title="Voorlezen / Leggi ad alta voce"
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, opacity:0.6, padding:'0 2px' }}>
          🔊
        </button>
        <button onClick={onScreenshot} title={T.btnShot[lang]}
          style={{
            background:'rgba(245,230,66,0.09)', border:'1px solid rgba(245,230,66,0.3)',
            borderRadius:8, cursor:'pointer', fontSize:13, opacity:0.85, padding:'3px 8px',
            color:'#f5e642', display:'flex', alignItems:'center', gap:4,
            fontFamily:"'IM Fell English', serif",
          }}>
          <Camera size={12}/> {T.btnShot[lang]}
        </button>
      </div>

      <p style={{
        margin:'0 0 10px', color:'#f5e642', lineHeight:1.7, fontSize:14,
        fontFamily:"'IM Fell English', serif",
        textShadow:'0 0 8px rgba(245,230,66,0.22)',
      }}>🎊 {text}</p>

      {fatti.length > 0 && (
        <div style={{ borderTop:'1px solid rgba(212,160,23,0.16)', paddingTop:8,
          display:'flex', flexDirection:'column', gap:5 }}>
          <p style={{ margin:0, fontSize:9, color:'rgba(212,160,23,0.46)',
            letterSpacing:'0.14em', textTransform:'uppercase' }}>
            ✦ {T.histLabel[lang]} ✦
          </p>
          {fatti.map((f, i) => (
            <div key={i} style={{
              background:'rgba(245,230,66,0.04)',
              border:'1px solid rgba(212,160,12,0.12)',
              borderRadius:9, padding:'5px 10px',
            }}>
              <span style={{ color:'#d4a017', fontSize:10, fontWeight:700 }}>{f.anno} · </span>
              <span style={{ color:'rgba(245,230,66,0.7)', fontSize:11, fontStyle:'italic' }}>
                {f.testo}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Muziekknop ────────────────────────────────────────────────────────────
function MusicButton({ day, month, lang }: { day?: number; month?: number; lang: Lang }) {
  const [clicked, setClicked] = useState(false);
  const maanden_nl = ['januari','februari','maart','april','mei','juni',
    'juli','augustus','september','oktober','november','december'];
  const mesi_it = ['gennaio','febbraio','marzo','aprile','maggio','giugno',
    'luglio','agosto','settembre','ottobre','novembre','dicembre'];
  const maandNaam = month
    ? (lang === 'nl' ? maanden_nl[month-1] : mesi_it[month-1])
    : '';

  const openPlaylist = () => {
    setClicked(true);
    const q = lang === 'nl'
      ? `hits ${maandNaam} ${new Date().getFullYear()} playlist`
      : `hits ${maandNaam} ${new Date().getFullYear()} playlist musica italiana`;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
    setTimeout(() => setClicked(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:2.2 }}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6,
        position:'relative', zIndex:5, marginTop:6 }}
    >
      <button onClick={openPlaylist} style={{
        padding:'10px 22px',
        background: clicked
          ? 'linear-gradient(135deg,#1a6b1a,#2ecc2e)'
          : 'linear-gradient(135deg,#0d3b7a,#1565c0,#1976d2)',
        border:'none', borderRadius:28, color:'#fff', fontWeight:700, fontSize:13,
        cursor:'pointer', fontFamily:"'IM Fell English', serif", letterSpacing:'0.06em',
        boxShadow: clicked
          ? '0 4px 18px rgba(46,204,46,0.5)'
          : '0 4px 18px rgba(21,101,192,0.55)',
        transition:'all 0.4s ease', display:'flex', alignItems:'center', gap:8,
      }}>
        <span style={{ fontSize:18 }}>{clicked ? '✅' : '🎵'}</span>
        {clicked ? T.btnMusicDone[lang] : T.btnMusic[lang]}
      </button>
      {maandNaam && (
        <p style={{ margin:0, fontSize:9, color:'rgba(245,230,66,0.28)',
          fontStyle:'italic', textAlign:'center', maxWidth:280 }}>
          {lang === 'nl' ? `Hits van ${maandNaam}` : `I grandi successi di ${maandNaam}`}
        </p>
      )}
    </motion.div>
  );
}

// ── Screenshot helper ─────────────────────────────────────────────────────
async function takeScreenshot(): Promise<void> {
  try {
    // html2canvas via CDN via dynamisch script
    if (!(window as any).html2canvas) {
      await new Promise<void>((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = () => res();
        s.onerror = () => rej(new Error('html2canvas laden mislukt'));
        document.head.appendChild(s);
      });
    }
    const canvas = await (window as any).html2canvas(document.body, {
      useCORS: true, allowTaint: true, scale: 2,
      backgroundColor: '#0b0802',
    });
    canvas.toBlob((blob: Blob | null) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `felicitatie-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (e) {
    // Fallback: gebruik Web Share API als beschikbaar
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: 'Felicitatie', text: '🎊 Gefeliciteerd!' });
      }
    } catch {}
  }
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────
export default function SpecchioAuguri() {
  const [lang, setLang]               = useState<Lang>('nl');
  const [step, setStep]               = useState<StepKey>(STEP.NAME);
  const [name, setName]               = useState('');
  const [dateInput, setDateInput]     = useState('');
  const [feest, setFeest]             = useState('');
  const [customFeest, setCustomFeest] = useState('');
  const [message, setMessage]         = useState<Messaggio | null>(null);
  const [status, setStatus]           = useState('');
  const [isListening, setIsListening] = useState(false);
  const [listenTarget, setListenTarget] = useState<string | null>(null);
  const [isThinking, setIsThinking]   = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [parsedDate, setParsedDate]   = useState<ParsedDate | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey]           = useState<string>(() => {
    if (ENV_KEY) return ENV_KEY;
    try { return localStorage.getItem('specchio_auguri_gemini_key') || DEPLOY_KEY; } catch { return DEPLOY_KEY; }
  });
  const [cameraOk, setCameraOk]        = useState(false);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef    = useRef<any>(null);

  // Camera
  useEffect(() => {
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user' }, audio:false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setCameraOk(true);
        }
      } catch (e) {
        console.warn('Camera niet beschikbaar:', e);
        setCameraOk(false);
      }
    })();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  // TTS bij stap-overgang
  useEffect(() => {
    let cancelled = false;
    const vragen: Record<StepKey, string> = {
      name:  lang === 'nl'
        ? 'Welkom bij de Felicitatiespegel. Wie vieren we vandaag?'
        : 'Benvenuto allo Specchio degli Auguri. Chi festeggiamo oggi?',
      feest: lang === 'nl'
        ? `Hallo ${name || ''}! Wat vieren we?`
        : `Ciao ${name || ''}! Cosa festeggiamo?`,
      date:  lang === 'nl'
        ? `Mooi! Op welke datum vieren we ${feest}?`
        : `Bene! In quale data festeggiamo ${feest}?`,
      done:  '',
    };
    const delay = setTimeout(() => {
      if (cancelled || step === STEP.DONE) return;
      const v = vragen[step];
      if (v) { setIsSpeaking(true); speakWithFallback(v, lang, () => { if (!cancelled) setIsSpeaking(false); }); }
    }, step === STEP.NAME ? 900 : 400);
    return () => { cancelled = true; clearTimeout(delay); };
  }, [step, lang]);

  // ── Datum parser ─────────────────────────────────────────────────────
  const parseDatum = (input: string): ParsedDate | null => {
    const raw = input.trim().toLowerCase();
    const MAANDEN: Record<string, number> = {
      januari:1, jan:1, january:1,
      februari:2, feb:2, february:2,
      maart:3, mar:3, march:3,
      april:4, apr:4,
      mei:5, may:5, maggio:5, mag:5,
      juni:6, jun:6, giugno:6, giu:6, june:6,
      juli:7, jul:7, luglio:7, lug:7, july:7,
      augustus:8, aug:8, agosto:8, ago:8, august:8,
      september:9, sep:9, sept:9, settembre:9, set:9,
      oktober:10, oct:10, ottobre:10, ott:10, october:10,
      november:11, nov:11, novembre:11,
      december:12, dec:12, dicembre:12, dic:12,
    };
    const mPat = Object.keys(MAANDEN).join('|');
    const mMatch = raw.match(new RegExp(`\\b(${mPat})\\b`));
    if (mMatch) {
      const month = MAANDEN[mMatch[1]];
      const nums = raw.match(/\d+/g)?.map(Number) || [];
      const day = nums.find(n => n >= 1 && n <= 31);
      if (day && month) return { day, month };
    }
    const clean = raw.replace(/[\/\.\s]/g, '-');
    const parts = clean.split('-').map(p => parseInt(p, 10));
    if (parts.length >= 2) {
      const [a, b] = parts;
      if (a >= 1 && a <= 31 && b >= 1 && b <= 12) return { day:a, month:b };
      if (b >= 1 && b <= 31 && a >= 1 && a <= 12) return { day:b, month:a };
    }
    return null;
  };

  const effectiefFeest = feest === (lang === 'nl' ? 'anders' : 'altro')
    ? customFeest
    : FEESTEN[lang].find(f => f.key === feest)?.label.replace(/^\S+\s/, '') || feest;

  // ── Stap-bevestigingen ────────────────────────────────────────────────
  const confirmName = () => {
    if (!name.trim()) { setStatus(T.noName[lang]); return; }
    setStatus(''); setStep(STEP.FEEST);
  };

  const confirmFeest = () => {
    const ok = feest && feest !== (lang === 'nl' ? 'anders' : 'altro');
    const okCustom = (feest === (lang === 'nl' ? 'anders' : 'altro')) && customFeest.trim();
    if (!ok && !okCustom) { setStatus(T.noFeest[lang]); return; }
    setStatus(''); setStep(STEP.DATE);
  };

  const confirmDate = () => {
    const parsed = parseDatum(dateInput);
    if (!parsed) { setStatus(T.noDate[lang]); return; }
    setParsedDate(parsed);
    setStatus(''); setStep(STEP.DONE);
    fetchMessage(name, parsed.day, parsed.month, effectiefFeest);
  };

  const onConfirm = () => {
    if (step === STEP.NAME)  confirmName();
    else if (step === STEP.FEEST) confirmFeest();
    else if (step === STEP.DATE)  confirmDate();
  };

  // ── Spraakherkenning ──────────────────────────────────────────────────
  const startListening = (target: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatus(T.listenErr[lang]); return; }
    try { recRef.current?.stop(); } catch {}
    const rec = new SR();
    recRef.current = rec;
    rec.lang = lang === 'nl' ? 'nl-NL' : 'it-IT';
    rec.continuous = false; rec.interimResults = false;
    rec.onstart  = () => { setIsListening(true);  setListenTarget(target); setStatus(lang === 'nl' ? 'Ik luister… 👂' : 'Ti ascolto… 👂'); };
    rec.onend    = () => { setIsListening(false); setListenTarget(null);   setStatus(''); };
    rec.onerror  = () => { setIsListening(false); setListenTarget(null);   setStatus(lang === 'nl' ? 'Niet goed verstaan 🌟' : 'Non ho capito bene 🌟'); };
    rec.onresult = (e: any) => {
      const heard: string = e.results[0][0].transcript;
      if (target === STEP.NAME) setName(heard.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '').trim());
      else setDateInput(heard);
    };
    rec.start();
  };

  // ── Fallback bericht ──────────────────────────────────────────────────
  const buildFallback = (n: string, day: number, month: number, fst: string): Messaggio => {
    const maanden_nl = ['januari','februari','maart','april','mei','juni',
      'juli','augustus','september','oktober','november','december'];
    const mesi_it = ['gennaio','febbraio','marzo','aprile','maggio','giugno',
      'luglio','agosto','settembre','ottobre','novembre','dicembre'];
    const maandNaam = lang === 'nl' ? maanden_nl[month-1] : mesi_it[month-1];

    const testo = lang === 'nl'
      ? `Van harte gefeliciteerd, ${n}! Dit bijzondere moment — jouw ${fst} op ${day} ${maandNaam} — is het begin van een nieuw en prachtig hoofdstuk. Moge alles wat voor je ligt worden gevuld met vreugde, verbondenheid en avontuur. De spiegel ziet een stralende toekomst voor je! ✨`
      : `Tante congratulazioni, ${n}! Questo momento speciale — il tuo ${fst} il ${day} ${maandNaam} — segna l'inizio di un capitolo magnifico. Che tutto ciò che ti aspetta sia pieno di gioia, connessione e meraviglia. Lo specchio vede un futuro radioso per te! ✨`;

    return {
      testo,
      fatti: lang === 'nl'
        ? [
            { anno: 1687, testo: 'Isaac Newton publiceerde de Principia Mathematica, fundament van de moderne wetenschap.' },
            { anno: 1969, testo: 'De mens zette voor het eerst voet op de maan — bewijs dat de grootste dromen werkelijkheid worden.' },
          ]
        : [
            { anno: 1687, testo: 'Isaac Newton pubblicò i Principia Mathematica, fondamento di tutta la scienza moderna.' },
            { anno: 1969, testo: "L'umanità posò piede sulla Luna per la prima volta — la prova che i sogni più grandi si realizzano." },
          ],
      _isFallback: true,
    };
  };

  // ── Gemini API ────────────────────────────────────────────────────────
  const fetchMessage = async (n: string, day: number, month: number, fst: string) => {
    if (!apiKey) { setStatus(T.noKey[lang]); return; }
    setIsThinking(true); setMessage(null);
    setStatus(lang === 'nl' ? 'De spiegel peinst… ✨' : 'Lo specchio contempla… ✨');
    try {
      const resp = await fetchWithRetry(() =>
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({
              contents:[{ parts:[{ text: buildPrompt(n, day, month, fst, lang) }] }],
              generationConfig:{ temperature:0.9, maxOutputTokens:1000 },
            }),
          }
        ).then(r => r.json())
      );
      if (resp.error) throw new Error(resp.error.message || 'API error');
      const raw: string = resp.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const data: Messaggio = JSON.parse(raw.replace(/```json|```/g,'').trim());
      setMessage(data); setStatus('');
      if (data.testo) {
        setIsSpeaking(true);
        speakAll(data.testo, data.fatti || [], lang, () => setIsSpeaking(false));
      }
    } catch {
      const fallback = buildFallback(n, day, month, fst);
      setMessage(fallback);
      setStatus(lang === 'nl' ? '✨ De spiegel spreekt uit zijn geheugen…' : '✨ Lo specchio parla dalla sua memoria…');
      setTimeout(() => setStatus(''), 3500);
      setIsSpeaking(true);
      speakAll(fallback.testo, fallback.fatti, lang, () => setIsSpeaking(false));
    }
    setIsThinking(false);
  };

  const handleReset = () => {
    window.speechSynthesis.cancel();
    setStep(STEP.NAME); setName(''); setDateInput(''); setFeest(''); setCustomFeest('');
    setMessage(null); setParsedDate(null); setStatus(''); setIsSpeaking(false);
  };

  const saveKey = (k: string) => {
    setApiKey(k);
    try { localStorage.setItem('specchio_auguri_gemini_key', k); } catch {}
    setShowKeyModal(false);
  };

  const isDone = step === STEP.DONE;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      <style>{CSS}</style>
      <div style={S.bg}/><div style={S.bgForest}/>

      {/* Vuurvliegjes */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        {FIREFLIES.map(f => (
          <div key={f.id} style={{
            position:'absolute', left:`${f.x}%`, top:`${f.y}%`,
            width:5, height:5, borderRadius:'50%', background:'#f5e642',
            boxShadow:'0 0 7px #f5e642, 0 0 14px rgba(245,230,66,0.38)',
            animation:`ffloat ${f.dur}s ease-in-out ${f.delay}s infinite`,
            ['--dx' as any]:`${f.dx}px`, ['--dy' as any]:`${f.dy}px`,
          }}/>
        ))}
      </div>

      {/* Taalknop */}
      <div style={{ position:'fixed', top:10, right:12, zIndex:20 }}>
        <button onClick={() => {
          const newLang: Lang = lang === 'nl' ? 'it' : 'nl';
          setLang(newLang);
          handleReset();
        }} style={{
          background:'rgba(245,230,66,0.09)', border:'1px solid rgba(245,230,66,0.25)',
          borderRadius:'50%', width:36, height:36, fontSize:20,
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          padding:0,
        }}>
          {T.langSwitch[lang]}
        </button>
      </div>

      {/* Header */}
      <header style={S.header}>
        <h1 style={S.title}>{T.title[lang]}</h1>
        <p style={S.subtitle}>{T.subtitle[lang]}</p>
      </header>

      {/* Tekstwolk */}
      <AnimatePresence>
        {message && (
          <div style={{ width:'100%', maxWidth:430, padding:'0 12px', marginBottom:4, position:'relative', zIndex:5 }}>
            <SpeechBubble
              message={message}
              lang={lang}
              onSpeak={() => { setIsSpeaking(true); speakAll(message.testo, message.fatti || [], lang, () => setIsSpeaking(false)); }}
              onScreenshot={takeScreenshot}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Spiegel */}
      <div style={{ ...S.mirrorWrap, marginTop:10 }}>
        <OrnateFrame W={270} H={330}/>
        <div style={S.mirrorGlass}>
          <video ref={videoRef} autoPlay playsInline muted style={S.video}/>
          {!cameraOk && (
            <div style={{
              position:'absolute', inset:0, display:'flex',
              alignItems:'center', justifyContent:'center',
              background:'radial-gradient(ellipse at 50% 40%,#12200a,#060d04)',
              flexDirection:'column', gap:4, pointerEvents:'none',
            }}>
              <span style={{ fontSize:32, opacity:0.35 }}>🪞</span>
              <span style={{ fontSize:9, color:'rgba(245,230,66,0.22)', fontStyle:'italic' }}>
                {lang === 'nl' ? 'camera niet beschikbaar' : 'fotocamera non disponibile'}
              </span>
            </div>
          )}

          {isDone && !isThinking && <MirrorOverlay />}

          {isDone && message && (
            <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden',
              borderRadius:'50% 50% 47% 47%', zIndex:3 }}>
              {PARTICLES.map(p => (
                <div key={p.id} style={{
                  position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
                  width:p.size, height:p.size, borderRadius:'50%',
                  background:p.color, opacity:0,
                  animation:`sparkle ${p.dur}s ease-in-out ${p.delay}s infinite`,
                  boxShadow:`0 0 ${p.size}px ${p.color}`,
                }}/>
              ))}
            </div>
          )}

          <AnimatePresence>
            {step !== STEP.DONE && (
              <SetupOverlay
                step={step} lang={lang}
                name={name} setName={setName}
                dateInput={dateInput} setDateInput={setDateInput}
                feest={feest} setFeest={setFeest}
                customFeest={customFeest} setCustomFeest={setCustomFeest}
                onListen={startListening}
                isListening={isListening} listenTarget={listenTarget}
                onConfirm={onConfirm}
              />
            )}
          </AnimatePresence>

          {isThinking && (
            <div style={{ position:'absolute', bottom:14, left:'50%',
              transform:'translateX(-50%)', display:'flex', gap:6, zIndex:15 }}>
              {[0,200,400].map((d,i) => (
                <div key={i} style={{
                  width:8, height:8, borderRadius:'50%', background:'#f5e642',
                  animation:`bounce 1s ease-in-out ${d}ms infinite`,
                  boxShadow:'0 0 6px #f5e642',
                }}/>
              ))}
            </div>
          )}

          {isSpeaking && (
            <div style={{ position:'absolute', inset:-4, borderRadius:'50% 50% 47% 47%',
              border:'3px solid #f5e642', animation:'speakRing 1s ease-in-out infinite',
              pointerEvents:'none', zIndex:4 }}/>
          )}
        </div>

        {isDone && name && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={S.nameBadge}>
            🎊 {name} ✦ {effectiefFeest}
          </motion.div>
        )}
      </div>

      {status && <p style={S.status}>{status}</p>}

      <AnimatePresence>
        {message?._isFallback && !isThinking && (
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ margin:'2px 0 0', fontSize:10, color:'rgba(245,230,66,0.32)',
              fontStyle:'italic', textAlign:'center', position:'relative', zIndex:5 }}>
            {T.fallback[lang]}
          </motion.p>
        )}
      </AnimatePresence>

      {isDone && !isThinking && message && (
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:1.8 }}
          style={{ marginTop:14, display:'flex', flexDirection:'column',
            alignItems:'center', gap:5, position:'relative', zIndex:5 }}>
          <button onClick={handleReset} style={S.btnNext}>{T.btnAgain[lang]}</button>
          <p style={{ margin:0, fontSize:10, color:'rgba(245,230,66,0.26)', fontStyle:'italic' }}>
            {T.btnAgainSub[lang]}
          </p>
        </motion.div>
      )}

      {isDone && !isThinking && message && (
        <MusicButton day={parsedDate?.day} month={parsedDate?.month} lang={lang} />
      )}

      {!ENV_KEY && (
        <button onClick={() => setShowKeyModal(true)} style={S.btnKey}>
          <Key size={10} style={{ marginRight:4 }}/>
          {apiKey ? T.keySet[lang] : T.keySet0[lang]}
        </button>
      )}

      <AnimatePresence>
        {showKeyModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={S.modal}
            onClick={(e) => e.target === e.currentTarget && setShowKeyModal(false)}>
            <div style={S.modalBox}>
              <h2 style={S.modalTitle}>{T.keyTitle[lang]}</h2>
              <div style={S.modalHint}>
                <p style={{ margin:'0 0 6px' }}>
                  {lang === 'nl'
                    ? 'Gemini API-sleutel (Google AI Studio). Alleen op dit toestel opgeslagen.'
                    : 'Chiave API Gemini (Google AI Studio). Salvata solo su questo dispositivo.'}
                </p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color:'#f5e642', fontSize:12, textDecoration:'underline',
                    display:'block', textAlign:'center', marginTop:4,
                  }}
                >
                  👉 {lang === 'nl' ? 'Gratis key aanmaken' : 'Crea chiave gratis'}
                </a>
              </div>
              <input type="password" id="keyInp" defaultValue={apiKey}
                placeholder="AIza…" style={S.modalInput}/>
              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button onClick={() => setShowKeyModal(false)} style={S.modalCancel}>{T.keyCancel[lang]}</button>
                <button onClick={() => saveKey((document.getElementById('keyInp') as HTMLInputElement).value)}
                  style={S.modalSave}>{T.keySave[lang]}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap');
  * { box-sizing:border-box; }
  input::placeholder { color:rgba(245,230,66,0.26); }

  @keyframes ffloat {
    0%   { opacity:0; transform:translate(0,0); }
    25%  { opacity:0.82; }
    50%  { opacity:0.28; transform:translate(var(--dx,20px),var(--dy,-15px)); }
    75%  { opacity:0.68; }
    100% { opacity:0; transform:translate(0,0); }
  }
  @keyframes sparkle {
    0%,100% { opacity:0; transform:scale(0.5); }
    50%     { opacity:0.88; transform:scale(1.2); }
  }
  @keyframes bounce {
    0%,100% { transform:translateY(0); opacity:0.38; }
    50%     { transform:translateY(-6px); opacity:1; }
  }
  @keyframes speakRing {
    0%,100% { opacity:0.32; transform:scale(1); }
    50%     { opacity:1; transform:scale(1.05); }
  }
  @keyframes mirrorPulse {
    0%,100% { box-shadow:0 0 32px rgba(212,160,23,0.22),0 0 65px rgba(212,160,23,0.07),inset 0 0 26px rgba(0,0,0,0.55); }
    50%     { box-shadow:0 0 52px rgba(212,160,23,0.42),0 0 105px rgba(212,160,23,0.14),inset 0 0 26px rgba(0,0,0,0.55); }
  }
  @keyframes titleShimmer {
    0%,100% { text-shadow:0 0 10px rgba(245,230,66,0.42),0 2px 4px rgba(0,0,0,0.8); }
    50%     { text-shadow:0 0 22px rgba(245,230,66,0.88),0 0 42px rgba(245,230,66,0.32),0 2px 4px rgba(0,0,0,0.8); }
  }
`;

// ── Stijlen ───────────────────────────────────────────────────────────────
const S: Record<string, any> = {
  app: {
    minHeight:'100vh', background:'#0b0802',
    color:'#f0e8d0', fontFamily:"'IM Fell English', serif",
    display:'flex', flexDirection:'column', alignItems:'center',
    padding:'0 0 44px', position:'relative', overflow:'hidden',
  } as CSSProperties,
  bg: {
    position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
    background:'radial-gradient(ellipse at 50% 0%,rgba(52,30,4,0.78) 0%,rgba(7,4,2,0.95) 60%,#030200 100%)',
  } as CSSProperties,
  bgForest: {
    position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
    background:`
      radial-gradient(ellipse at 12% 90%,rgba(16,42,7,0.3) 0%,transparent 50%),
      radial-gradient(ellipse at 88% 90%,rgba(16,42,7,0.3) 0%,transparent 50%),
      radial-gradient(ellipse at 50% 100%,rgba(26,52,7,0.38) 0%,transparent 38%)
    `,
  } as CSSProperties,
  header: {
    width:'100%', maxWidth:480, padding:'6px 16px 3px',
    display:'flex', flexDirection:'column', alignItems:'center',
    position:'relative', zIndex:5,
  } as CSSProperties,
  title: {
    margin:'0 0 2px', fontSize:20, fontWeight:700, color:'#f5e642',
    animation:'titleShimmer 3s ease-in-out infinite', letterSpacing:'0.05em',
    textAlign:'center',
  } as CSSProperties,
  subtitle: {
    margin:'3px 0 0', fontSize:11, color:'rgba(245,230,66,0.38)',
    letterSpacing:'0.14em', fontStyle:'italic',
  } as CSSProperties,
  mirrorWrap: {
    position:'relative', width:270, height:330,
    display:'flex', alignItems:'center', justifyContent:'center',
    zIndex:5, marginBottom:6,
  } as CSSProperties,
  mirrorGlass: {
    position:'absolute', top:18, left:22, width:226, height:290,
    borderRadius:'50% 50% 47% 47%', overflow:'hidden',
    background:'linear-gradient(160deg,#0b1606 0%,#030702 100%)',
    animation:'mirrorPulse 4s ease-in-out infinite', zIndex:1,
  } as CSSProperties,
  video: {
    width:'100%', height:'100%', objectFit:'cover',
    transform:'scaleX(-1)',
    filter:'brightness(0.82) contrast(1.06) saturate(0.76)',
  } as CSSProperties,
  nameBadge: {
    position:'absolute', bottom:-10, left:'50%', transform:'translateX(-50%)',
    background:'linear-gradient(135deg,rgba(26,14,2,0.96),rgba(16,9,0,0.96))',
    border:'1px solid rgba(212,160,23,0.46)', borderRadius:20, padding:'4px 18px',
    fontSize:11, color:'#f5e642', whiteSpace:'nowrap', zIndex:10,
    letterSpacing:'0.06em', boxShadow:'0 2px 10px rgba(0,0,0,0.5)',
    maxWidth:260, overflow:'hidden', textOverflow:'ellipsis',
  } as CSSProperties,
  status: {
    fontSize:12, color:'rgba(245,230,66,0.55)', fontStyle:'italic', margin:'4px 12px',
    zIndex:5, textAlign:'center', position:'relative', maxWidth:380, lineHeight:1.6,
  } as CSSProperties,
  btnNext: {
    padding:'11px 28px',
    background:'linear-gradient(135deg,#8B6914,#d4a017,#f5e642,#d4a017,#8B6914)',
    backgroundSize:'200% auto', border:'none', borderRadius:30,
    color:'#160b00', fontWeight:700, cursor:'pointer', fontSize:14,
    fontFamily:"'IM Fell English', serif", letterSpacing:'0.08em',
    boxShadow:'0 4px 18px rgba(212,160,23,0.46),0 0 34px rgba(212,160,23,0.16)',
  } as CSSProperties,
  btnKey: {
    marginTop:14, padding:'5px 14px', background:'transparent',
    border:'1px solid rgba(212,160,23,0.13)', borderRadius:20, fontSize:10,
    color:'rgba(212,160,12,0.36)', letterSpacing:'0.1em', cursor:'pointer',
    display:'flex', alignItems:'center', position:'relative', zIndex:5,
    fontFamily:"'IM Fell English', serif",
  } as CSSProperties,
  input: {
    background:'rgba(245,230,66,0.07)',
    border:'1px solid rgba(245,230,66,0.38)',
    borderRadius:12, padding:'8px 12px',
    color:'#f5e642', fontSize:15, textAlign:'center' as const,
    outline:'none', fontFamily:"'IM Fell English', serif",
    width:'85%',
  } as CSSProperties,
  btnGold: {
    padding:'9px 20px', borderRadius:22,
    background:'linear-gradient(135deg,#d4a017,#f5e642)',
    border:'none', color:'#180c00',
    fontWeight:700, fontSize:13, cursor:'pointer',
    fontFamily:"'IM Fell English', serif",
    boxShadow:'0 2px 14px rgba(212,160,23,0.52)',
    letterSpacing:'0.04em',
  } as CSSProperties,
  btnMic: (active: boolean) => ({
    width:40, height:40, borderRadius:'50%',
    background: active ? 'rgba(200,50,50,0.85)' : 'rgba(245,230,66,0.11)',
    border:'1.5px solid rgba(245,230,66,0.42)',
    cursor:'pointer', fontSize:17,
    display:'flex', alignItems:'center', justifyContent:'center',
    transition:'all 0.2s',
  } as CSSProperties),
  modal: {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.88)',
    display:'flex', alignItems:'center', justifyContent:'center', zIndex:100,
  } as CSSProperties,
  modalBox: {
    background:'linear-gradient(160deg,#160c05,#0a0502)',
    border:'2px solid rgba(212,160,23,0.46)', borderRadius:20, padding:24,
    maxWidth:300, width:'90%', boxShadow:'0 8px 40px rgba(0,0,0,0.8)',
  } as CSSProperties,
  modalTitle: {
    margin:'0 0 4px', fontWeight:400, fontSize:18, color:'#f5e642',
    textAlign:'center' as const, fontFamily:"'IM Fell English', serif",
  } as CSSProperties,
  modalHint: {
    margin:'0 0 14px', fontSize:11, lineHeight:1.6,
    color:'rgba(245,230,66,0.4)', textAlign:'center' as const,
  } as CSSProperties,
  modalInput: {
    width:'100%', background:'rgba(0,0,0,0.4)',
    border:'1px solid rgba(212,160,23,0.26)', borderRadius:10, padding:'10px 14px',
    fontSize:13, color:'#f0e8d0', outline:'none', textAlign:'center' as const,
  } as CSSProperties,
  modalCancel: {
    flex:1, padding:'9px', background:'transparent',
    border:'1px solid rgba(255,255,255,0.1)', borderRadius:10,
    color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:12,
    fontFamily:"'IM Fell English', serif",
  } as CSSProperties,
  modalSave: {
    flex:1, padding:'9px',
    background:'linear-gradient(135deg,#d4a017,#f5e642)',
    border:'none', borderRadius:10, color:'#160900', fontWeight:700,
    cursor:'pointer', fontSize:12, fontFamily:"'IM Fell English', serif",
    letterSpacing:'0.05em',
  } as CSSProperties,
};
