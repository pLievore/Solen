/**
 * Ilustrações SVG de dispositivos para cada categoria.
 * Cada ícone usa currentColor como base e tem gradientes
 * embutidos para aparência 3D/produto.
 */

type P = { className?: string };

// ─── iPhone ────────────────────────────────────────────────────────────────
export function IPhoneIcon({ className }: P) {
  return (
    <svg viewBox="0 0 110 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className={className}>
      <defs>
        <linearGradient id="ipb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a3a3c" />
          <stop offset="100%" stopColor="#1c1c1e" />
        </linearGradient>
        <linearGradient id="ips" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2a3a" />
          <stop offset="100%" stopColor="#06090d" />
        </linearGradient>
      </defs>
      {/* Body */}
      <rect x="2" y="2" width="106" height="216" rx="20" fill="url(#ipb)" />
      <rect x="2" y="2" width="106" height="216" rx="20" fill="none" stroke="#5a5a5e" strokeWidth="1.5" />
      {/* Screen */}
      <rect x="6" y="6" width="98" height="208" rx="16" fill="url(#ips)" />
      {/* Highlight */}
      <rect x="6" y="6" width="8" height="208" rx="4" fill="rgba(255,255,255,0.04)" />
      {/* Dynamic Island */}
      <rect x="34" y="14" width="42" height="13" rx="6.5" fill="#000" />
      <circle cx="68" cy="20.5" r="3.5" fill="#111" />
      <circle cx="68" cy="20.5" r="1.5" fill="#1a1a1a" />
      {/* Home indicator */}
      <rect x="40" y="204" width="30" height="4" rx="2" fill="rgba(255,255,255,0.18)" />
      {/* Side button */}
      <rect x="109" y="66" width="5" height="30" rx="2.5" fill="#48484a" />
      {/* Action button */}
      <rect x="-4" y="56" width="5" height="14" rx="2.5" fill="#48484a" />
      {/* Volume buttons */}
      <rect x="-4" y="76" width="5" height="22" rx="2.5" fill="#48484a" />
      <rect x="-4" y="103" width="5" height="22" rx="2.5" fill="#48484a" />
      {/* USB-C */}
      <rect x="38" y="213" width="34" height="6" rx="3" fill="#000" />
      <rect x="40" y="213.5" width="30" height="5" rx="2.5" fill="#2a2a2c" />
      {/* Speaker dots */}
      <circle cx="26" cy="216" r="1.5" fill="#2a2a2c" />
      <circle cx="21" cy="216" r="1.5" fill="#2a2a2c" />
      <circle cx="89" cy="216" r="1.5" fill="#2a2a2c" />
      <circle cx="84" cy="216" r="1.5" fill="#2a2a2c" />
      {/* Status bar hints */}
      <rect x="15" y="15" width="16" height="4" rx="2" fill="rgba(255,255,255,0.09)" />
      <rect x="79" y="15" width="18" height="4" rx="2" fill="rgba(255,255,255,0.09)" />
    </svg>
  );
}

// ─── Apple Watch ───────────────────────────────────────────────────────────
export function AppleWatchIcon({ className }: P) {
  return (
    <svg viewBox="0 0 110 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className={className}>
      <defs>
        <linearGradient id="awb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a3a3c" />
          <stop offset="100%" stopColor="#1c1c1e" />
        </linearGradient>
        <linearGradient id="aws" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2030" />
          <stop offset="100%" stopColor="#06090d" />
        </linearGradient>
        <linearGradient id="awband" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2c2c2e" />
          <stop offset="100%" stopColor="#1c1c1e" />
        </linearGradient>
      </defs>
      {/* Top band */}
      <rect x="30" y="2" width="50" height="46" rx="8" fill="url(#awband)" />
      <rect x="30" y="2" width="50" height="46" rx="8" fill="none" stroke="#3a3a3c" strokeWidth="1" />
      {/* Band clasp detail */}
      <rect x="42" y="12" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
      <rect x="42" y="18" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
      <rect x="42" y="24" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
      <rect x="42" y="30" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />

      {/* Watch body */}
      <rect x="10" y="44" width="90" height="92" rx="22" fill="url(#awb)" />
      <rect x="10" y="44" width="90" height="92" rx="22" fill="none" stroke="#5a5a5e" strokeWidth="1.5" />
      {/* Screen */}
      <rect x="14" y="48" width="82" height="84" rx="18" fill="url(#aws)" />
      <rect x="14" y="48" width="8" height="84" rx="4" fill="rgba(255,255,255,0.04)" />
      {/* Watch face content */}
      <circle cx="55" cy="90" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <rect x="53" y="62" width="4" height="10" rx="2" fill="rgba(255,255,255,0.2)" />
      <rect x="53" y="108" width="4" height="10" rx="2" fill="rgba(255,255,255,0.12)" />
      <rect x="27" y="88" width="10" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
      <rect x="73" y="88" width="10" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
      {/* Time digits hint */}
      <rect x="40" y="82" width="30" height="16" rx="3" fill="rgba(255,255,255,0.08)" />
      {/* Digital Crown */}
      <circle cx="103" cy="78" r="5" fill="#48484a" stroke="#5a5a5e" strokeWidth="1" />
      <circle cx="103" cy="78" r="2" fill="#3a3a3c" />
      {/* Side button */}
      <rect x="103" y="95" width="8" height="10" rx="3" fill="#48484a" />

      {/* Bottom band */}
      <rect x="30" y="132" width="50" height="46" rx="8" fill="url(#awband)" />
      <rect x="30" y="132" width="50" height="46" rx="8" fill="none" stroke="#3a3a3c" strokeWidth="1" />
      <rect x="42" y="145" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
      <rect x="42" y="151" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
      <rect x="42" y="157" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
      <rect x="42" y="163" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
    </svg>
  );
}

// ─── iPad ──────────────────────────────────────────────────────────────────
export function IPadIcon({ className }: P) {
  return (
    <svg viewBox="0 0 150 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className={className}>
      <defs>
        <linearGradient id="ipadb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d0d0d5" />
          <stop offset="100%" stopColor="#b0b0b8" />
        </linearGradient>
        <linearGradient id="ipads" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2a3a" />
          <stop offset="100%" stopColor="#06090d" />
        </linearGradient>
      </defs>
      {/* Body (silver) */}
      <rect x="2" y="2" width="146" height="196" rx="14" fill="url(#ipadb)" />
      <rect x="2" y="2" width="146" height="196" rx="14" fill="none" stroke="#a0a0a8" strokeWidth="1.5" />
      {/* Screen */}
      <rect x="8" y="8" width="134" height="184" rx="10" fill="url(#ipads)" />
      <rect x="8" y="8" width="8" height="184" rx="4" fill="rgba(255,255,255,0.05)" />
      {/* Front camera */}
      <rect x="62" y="11" width="26" height="5" rx="2.5" fill="#111" />
      <circle cx="80" cy="13.5" r="2" fill="#1a1a1a" />
      {/* Home indicator */}
      <rect x="56" y="191" width="38" height="3.5" rx="1.75" fill="rgba(255,255,255,0.2)" />
      {/* Smart Connector dots */}
      <circle cx="4" cy="80" r="2" fill="#888" />
      <circle cx="4" cy="90" r="2" fill="#888" />
      <circle cx="4" cy="100" r="2" fill="#888" />
      {/* Top button */}
      <rect x="58" y="-3" width="20" height="5" rx="2.5" fill="#a0a0a8" />
      {/* Volume buttons */}
      <rect x="148" y="60" width="5" height="16" rx="2.5" fill="#a0a0a8" />
      <rect x="148" y="80" width="5" height="16" rx="2.5" fill="#a0a0a8" />
      {/* USB-C */}
      <rect x="60" y="197" width="30" height="5" rx="2.5" fill="#999" />
    </svg>
  );
}

// ─── AirPods ───────────────────────────────────────────────────────────────
export function AirPodsIcon({ className }: P) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className={className}>
      <defs>
        <linearGradient id="apcase" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2f2f4" />
          <stop offset="100%" stopColor="#d8d8dc" />
        </linearGradient>
        <linearGradient id="apbud" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5f5f7" />
          <stop offset="100%" stopColor="#e0e0e4" />
        </linearGradient>
      </defs>
      {/* Case body */}
      <rect x="30" y="50" width="100" height="100" rx="24" fill="url(#apcase)" />
      <rect x="30" y="50" width="100" height="100" rx="24" fill="none" stroke="#c0c0c4" strokeWidth="1.5" />
      {/* Case lid line */}
      <line x1="30" y1="100" x2="130" y2="100" stroke="#c0c0c4" strokeWidth="1" />
      {/* Hinge */}
      <rect x="73" y="97" width="14" height="6" rx="3" fill="#d0d0d4" />
      {/* LED dot */}
      <circle cx="80" cy="140" r="4" fill="#e0e0e4" stroke="#c0c0c4" strokeWidth="1" />
      {/* USB-C port */}
      <rect x="68" y="146" width="24" height="5" rx="2.5" fill="#c8c8cc" />

      {/* Left AirPod (in case, visible from top) */}
      <ellipse cx="56" cy="78" rx="14" ry="18" fill="url(#apbud)" stroke="#c8c8cc" strokeWidth="1" />
      <ellipse cx="56" cy="70" rx="8" ry="5" fill="rgba(200,200,204,0.5)" />
      {/* Stem */}
      <rect x="50" y="88" width="12" height="28" rx="6" fill="url(#apbud)" stroke="#c8c8cc" strokeWidth="1" />
      {/* Ear tip */}
      <ellipse cx="56" cy="60" rx="10" ry="7" fill="#e0e0e4" stroke="#c0c0c4" strokeWidth="1" />

      {/* Right AirPod */}
      <ellipse cx="104" cy="78" rx="14" ry="18" fill="url(#apbud)" stroke="#c8c8cc" strokeWidth="1" />
      <ellipse cx="104" cy="70" rx="8" ry="5" fill="rgba(200,200,204,0.5)" />
      {/* Stem */}
      <rect x="98" y="88" width="12" height="28" rx="6" fill="url(#apbud)" stroke="#c8c8cc" strokeWidth="1" />
      {/* Ear tip */}
      <ellipse cx="104" cy="60" rx="10" ry="7" fill="#e0e0e4" stroke="#c0c0c4" strokeWidth="1" />
    </svg>
  );
}

// ─── Acessórios ────────────────────────────────────────────────────────────
export function AccessoriesIcon({ className }: P) {
  return (
    <svg viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className={className}>
      <defs>
        <linearGradient id="accbrick" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2f2f4" />
          <stop offset="100%" stopColor="#d0d0d4" />
        </linearGradient>
        <linearGradient id="acccable" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e8e8ec" />
          <stop offset="100%" stopColor="#c8c8cc" />
        </linearGradient>
      </defs>
      {/* MagSafe charger brick */}
      <rect x="10" y="30" width="70" height="80" rx="12" fill="url(#accbrick)" />
      <rect x="10" y="30" width="70" height="80" rx="12" fill="none" stroke="#c0c0c4" strokeWidth="1.5" />
      {/* USB-C port on brick */}
      <rect x="28" y="104" width="34" height="6" rx="3" fill="#b8b8bc" />
      {/* Brick top (prong slot) */}
      <rect x="30" y="22" width="30" height="12" rx="4" fill="#d8d8dc" stroke="#c0c0c4" strokeWidth="1" />
      <rect x="37" y="20" width="16" height="6" rx="3" fill="#c8c8cc" />
      {/* Prongs */}
      <rect x="38" y="12" width="5" height="12" rx="2" fill="#a0a0a4" />
      <rect x="47" y="12" width="5" height="12" rx="2" fill="#a0a0a4" />

      {/* Cable going from brick to USB-C head */}
      <path d="M 80 110 Q 130 110 130 80" stroke="#c8c8cc" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* USB-C connector head */}
      <rect x="118" y="50" width="34" height="20" rx="6" fill="url(#accbrick)" stroke="#b8b8bc" strokeWidth="1.5" />
      <rect x="124" y="55" width="22" height="10" rx="5" fill="#aaaaae" />
      {/* Connector housing */}
      <rect x="112" y="54" width="10" height="12" rx="3" fill="#d0d0d4" stroke="#b8b8bc" strokeWidth="1" />

      {/* Lightning bolt accent */}
      <path d="M 98 70 L 88 88 L 96 88 L 86 108 L 100 86 L 92 86 Z"
        fill="#16a34a" opacity="0.5" />
    </svg>
  );
}

// ─── Consoles ──────────────────────────────────────────────────────────────
export function ConsolesIcon({ className }: P) {
  return (
    <svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className={className}>
      <defs>
        <linearGradient id="ctrlbody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2c2c2e" />
          <stop offset="100%" stopColor="#1c1c1e" />
        </linearGradient>
      </defs>
      {/* Controller body */}
      <path d="M 50 50 Q 20 50 10 80 Q 2 100 10 120 Q 20 135 45 130 Q 70 125 80 100 L 120 100 Q 130 125 155 130 Q 180 135 190 120 Q 198 100 190 80 Q 180 50 150 50 L 120 45 Q 100 38 80 45 Z"
        fill="url(#ctrlbody)" />
      <path d="M 50 50 Q 20 50 10 80 Q 2 100 10 120 Q 20 135 45 130 Q 70 125 80 100 L 120 100 Q 130 125 155 130 Q 180 135 190 120 Q 198 100 190 80 Q 180 50 150 50 L 120 45 Q 100 38 80 45 Z"
        fill="none" stroke="#4a4a4c" strokeWidth="1.5" />

      {/* Center panel */}
      <rect x="72" y="50" width="56" height="40" rx="8" fill="#222" stroke="#3a3a3c" strokeWidth="1" />
      {/* Touchpad */}
      <rect x="76" y="54" width="48" height="28" rx="6" fill="#2a2a2c" stroke="#3a3a3c" strokeWidth="0.5" />

      {/* D-pad (left side) */}
      <rect x="28" y="62" width="28" height="10" rx="2" fill="#3a3a3c" />
      <rect x="37" y="53" width="10" height="28" rx="2" fill="#3a3a3c" />
      <rect x="42" y="58" width="6" height="6" rx="1" fill="#555" />
      <rect x="42" y="70" width="6" height="6" rx="1" fill="#555" />
      <rect x="30" y="64" width="6" height="6" rx="1" fill="#555" />
      <rect x="54" y="64" width="6" height="6" rx="1" fill="#555" />

      {/* Face buttons (right side) */}
      <circle cx="152" cy="62" r="7" fill="#3a3a3c" stroke="#4a4a4c" strokeWidth="1" />
      <circle cx="168" cy="68" r="7" fill="#3a3a3c" stroke="#4a4a4c" strokeWidth="1" />
      <circle cx="152" cy="78" r="7" fill="#3a3a3c" stroke="#4a4a4c" strokeWidth="1" />
      <circle cx="136" cy="68" r="7" fill="#3a3a3c" stroke="#4a4a4c" strokeWidth="1" />
      {/* Button symbols */}
      <text x="152" y="66" textAnchor="middle" fontSize="8" fill="#16a34a" fontFamily="sans-serif">▲</text>
      <text x="168" y="72" textAnchor="middle" fontSize="7" fill="#3b82f6" fontFamily="sans-serif">○</text>
      <text x="152" y="82" textAnchor="middle" fontSize="7" fill="#ef4444" fontFamily="sans-serif">✕</text>
      <text x="136" y="72" textAnchor="middle" fontSize="7" fill="#a855f7" fontFamily="sans-serif">□</text>

      {/* Left analog stick */}
      <circle cx="45" cy="95" r="12" fill="#2a2a2c" stroke="#4a4a4c" strokeWidth="1" />
      <circle cx="45" cy="95" r="7" fill="#333" />

      {/* Right analog stick */}
      <circle cx="115" cy="95" r="12" fill="#2a2a2c" stroke="#4a4a4c" strokeWidth="1" />
      <circle cx="115" cy="95" r="7" fill="#333" />

      {/* L1/R1 bumpers */}
      <path d="M 15 55 Q 40 42 70 48" stroke="#4a4a4c" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M 185 55 Q 160 42 130 48" stroke="#4a4a4c" strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* Options + Create buttons */}
      <circle cx="90" cy="60" r="5" fill="#3a3a3c" />
      <circle cx="110" cy="60" r="5" fill="#3a3a3c" />
      <text x="90" y="63" textAnchor="middle" fontSize="5" fill="#888" fontFamily="sans-serif">≡</text>
      <text x="110" y="63" textAnchor="middle" fontSize="5" fill="#888" fontFamily="sans-serif">☰</text>
    </svg>
  );
}

// ─── Colecionáveis ─────────────────────────────────────────────────────────
export function CollectiblesIcon({ className }: P) {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className={className}>
      <defs>
        <linearGradient id="star1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="gem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      {/* Main star */}
      <path d="M 80 12 L 92 52 L 135 52 L 102 76 L 114 116 L 80 92 L 46 116 L 58 76 L 25 52 L 68 52 Z"
        fill="url(#star1)" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Star shine */}
      <path d="M 80 20 L 88 50 L 72 50 Z" fill="rgba(255,255,255,0.3)" />
      {/* Gem diamond */}
      <polygon points="80,28 100,48 80,78 60,48"
        fill="url(#gem)" stroke="#60a5fa" strokeWidth="1" />
      <polygon points="80,28 100,48 80,38" fill="rgba(255,255,255,0.25)" />
      <line x1="80" y1="38" x2="60" y2="48" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <line x1="80" y1="38" x2="100" y2="48" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Small sparkles */}
      <path d="M 128 25 L 130 32 L 135 30 L 130 37 L 128 44 L 126 37 L 121 30 L 126 32 Z"
        fill="#fbbf24" opacity="0.8" />
      <path d="M 30 30 L 31.5 35 L 36 33.5 L 31.5 38 L 30 43 L 28.5 38 L 24 33.5 L 28.5 35 Z"
        fill="#fbbf24" opacity="0.6" />
      <path d="M 140 90 L 141 94 L 145 92 L 141 96 L 140 100 L 139 96 L 135 92 L 139 94 Z"
        fill="#fbbf24" opacity="0.5" />
      {/* Trophy base */}
      <rect x="64" y="118" width="32" height="8" rx="3" fill="url(#star1)" />
      <rect x="56" y="124" width="48" height="6" rx="3" fill="#d97706" />
      <rect x="76" y="112" width="8" height="10" rx="2" fill="#d97706" />
    </svg>
  );
}

// ─── Lookup ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, (p: P) => JSX.Element> = {
  iphones: IPhoneIcon,
  "apple-watches": AppleWatchIcon,
  ipads: IPadIcon,
  airpods: AirPodsIcon,
  "acessorios-e-perifericos": AccessoriesIcon,
  consoles: ConsolesIcon,
  colecionaveis: CollectiblesIcon,
};

export default function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICON_MAP[slug];
  if (Icon) return <Icon className={className} />;
  // fallback: generic box
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden className={className}>
      <rect x="10" y="10" width="60" height="60" rx="10"
        fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <rect x="10" y="25" width="60" height="2" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}
