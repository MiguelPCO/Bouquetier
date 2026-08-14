import { useState, useMemo } from "react";

/* ------------------------------------------------------------------
   SPIRAL PLACEMENT — prototipo 2.5D
   Modelo de Vogel (phyllotaxis) proyectado con tilt.
   θ(n) = n · 137.5°   ·   r(n) = c · √n   ·   depth = sin(θ)
   Medidas en cm/mm reales; el px es solo unidad de pintado.
------------------------------------------------------------------- */

const GOLDEN = (137.5 * Math.PI) / 180;
const PX_PER_CM = 2.8;
const TRIM_CM = 8;        // se sacrifican al recortar la base
const BIND_RATIO = 0.42;  // punto de atado, desde las cabezas
const MAX_TILT_DEG = 38;  // inclinación del tallo más exterior

const ROLE_RANK = { focal: 0, secondary: 1, filler: 2, green: 3 };
const ROLE_LABEL = { focal: "Focal", secondary: "Secundaria", filler: "Relleno", green: "Verde" };

/* Silueta: cuánto se aleja cada rol del eje. El verde rompe el contorno. */
const ROLE_SPREAD = { focal: 0.70, secondary: 0.93, filler: 1.15, green: 1.36 };

const PROFILES = [
  { id: "compacto",  label: "Compacto",  tilt: 34, spread: 0.15, jitter: 0.28 },
  { id: "cupula",    label: "Cúpula",    tilt: 62, spread: 0.55, jitter: 0.50 },
  { id: "silvestre", label: "Silvestre", tilt: 71, spread: 1.00, jitter: 0.86 },
];

/* lengthCm = largo comercial del tallo · headMm = Ø de la cabeza */
const RAW_SPECIES = [
  { id: "peony",   name: "Peonía",         latin: "Paeonia lactiflora",     role: "focal",     shape: "peony",  color: "#E8A8B0", lengthCm: 65, headMm: 120, wholesale: 3.10, season: [4,5,6],           vase: 6, dry: false },
  { id: "dahlia",  name: "Dalia",          latin: "Dahlia pinnata",         role: "focal",     shape: "dahlia", color: "#E9917E", lengthCm: 60, headMm: 100, wholesale: 2.40, season: [7,8,9,10],        vase: 5, dry: false },
  { id: "grose",   name: "Rosa inglesa",   latin: "Rosa × centifolia",      role: "focal",     shape: "peony",  color: "#F2E4D8", lengthCm: 60, headMm:  85, wholesale: 2.80, season: [5,6,7,8,9],       vase: 7, dry: false },
  { id: "ranun",   name: "Ranúnculo",      latin: "Ranunculus asiaticus",   role: "secondary", shape: "ranun",  color: "#EFB6C4", lengthCm: 45, headMm:  55, wholesale: 1.60, season: [2,3,4,5],         vase: 7, dry: false },
  { id: "tulip",   name: "Tulipán",        latin: "Tulipa gesneriana",      role: "secondary", shape: "tulip",  color: "#D4453C", lengthCm: 45, headMm:  55, wholesale: 0.90, season: [1,2,3,4,11,12],   vase: 6, dry: false },
  { id: "anemone", name: "Anémona",        latin: "Anemone coronaria",      role: "secondary", shape: "ranun",  color: "#F6F1EA", lengthCm: 40, headMm:  60, wholesale: 1.35, season: [1,2,3,10,11,12],  vase: 6, dry: false },
  { id: "wax",     name: "Flor de cera",   latin: "Chamelaucium uncinatum", role: "filler",    shape: "umbel",  color: "#DE8FA6", lengthCm: 60, headMm: 100, wholesale: 1.10, season: [3,4,5,6],         vase: 12, dry: true },
  { id: "gyps",    name: "Paniculata",     latin: "Gypsophila paniculata",  role: "filler",    shape: "spray",  color: "#FBF7F2", lengthCm: 70, headMm: 140, wholesale: 0.85, season: [1,2,3,4,5,6,7,8,9,10,11,12], vase: 10, dry: true },
  { id: "corn",    name: "Aciano",         latin: "Centaurea cyanus",       role: "filler",    shape: "umbel",  color: "#7B8FD4", lengthCm: 50, headMm:  35, wholesale: 0.95, season: [5,6,7,8],         vase: 5, dry: true },
  { id: "euca",    name: "Eucalipto",      latin: "Eucalyptus cinerea",     role: "green",     shape: "leaf",   color: "#8FA38C", lengthCm: 70, headMm: 130, wholesale: 1.20, season: [1,2,3,4,5,6,7,8,9,10,11,12], vase: 14, dry: true },
  { id: "ruscus",  name: "Rusco",          latin: "Ruscus hypophyllum",     role: "green",     shape: "leaf",   color: "#5C7A55", lengthCm: 60, headMm: 110, wholesale: 0.80, season: [1,2,3,4,5,6,7,8,9,10,11,12], vase: 21, dry: true },
  { id: "bunny",   name: "Cola de conejo", latin: "Lagurus ovatus",         role: "green",     shape: "spike",  color: "#D8CBAE", lengthCm: 50, headMm:  45, wholesale: 0.70, season: [6,7,8,9],         vase: 30, dry: true },
];

/* px derivados de las medidas reales — nunca se escriben a mano */
const SPECIES = RAW_SPECIES.map((s) => ({
  ...s,
  stem: s.lengthCm * PX_PER_CM,
  head: (s.headMm / 10) * PX_PER_CM,
}));

const ZONES = [
  { id: "periferia", label: "Periferia", margin: 2.4 },
  { id: "centro",    label: "Centro",    margin: 2.8 },
  { id: "salamanca", label: "Salamanca / Chamberí", margin: 3.2 },
];

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const noise = (seed) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const lerp = (a, b, t) => a + (b - a) * t;

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const colorDist = (a, b) => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
};

/* Hue y croma aproximados. En producción esto es OKLCH; aquí basta HSL. */
function hueChroma(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  if (d < 0.001) return { hue: null, chroma: 0 };
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { hue: (h * 60 + 360) % 360, chroma: d };
}

const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/* Proporciones de referencia por rol y rango de tamaño de ramo de mano. */
const ROLE_TARGET = {
  focal:     [0.10, 0.22],
  secondary: [0.18, 0.32],
  filler:    [0.26, 0.42],
  green:     [0.18, 0.32],
};
const STEM_RANGE = [12, 24];

function validate(stems) {
  const total = stems.length;
  if (!total) return [];
  const out = [];

  const byRole = { focal: 0, secondary: 0, filler: 0, green: 0 };
  stems.forEach((s) => (byRole[s.species.role] += 1));

  if (byRole.focal === 0) {
    out.push({ level: "error", text: "Sin flor focal el ramo no tiene punto de descanso para la vista. Añade una." });
  } else if (byRole.focal % 2 === 0) {
    out.push({ level: "info", text: `${byRole.focal} focales. En número impar el ojo no las empareja y la composición se lee más natural.` });
  }

  Object.entries(ROLE_TARGET).forEach(([role, [lo, hi]]) => {
    const share = byRole[role] / total;
    if (byRole[role] === 0 && role !== "focal") {
      out.push({ level: "warn", text: `Falta ${ROLE_LABEL[role].toLowerCase()}: es lo que da ${role === "green" ? "silueta y contorno" : "densidad entre las focales"}.` });
    } else if (share > hi + 0.08) {
      out.push({ level: "info", text: `${ROLE_LABEL[role]} al ${Math.round(share * 100)}%, por encima del ${Math.round(hi * 100)}% habitual.` });
    } else if (byRole[role] > 0 && share < lo - 0.06) {
      out.push({ level: "info", text: `${ROLE_LABEL[role]} al ${Math.round(share * 100)}%, escaso frente al ${Math.round(lo * 100)}% habitual.` });
    }
  });

  if (total < STEM_RANGE[0]) {
    out.push({ level: "warn", text: `${total} tallos. Un ramo de mano suele llevar entre ${STEM_RANGE[0]} y ${STEM_RANGE[1]}; por debajo se ve ralo.` });
  } else if (total > STEM_RANGE[1]) {
    out.push({ level: "warn", text: `${total} tallos. Por encima de ${STEM_RANGE[1]} cuesta sujetarlo con una mano y la espiral se cierra.` });
  }

  /* Armonía: hues saturados que caen en la zona de choque (60–140°). */
  const hues = [...new Set(stems.map((s) => s.species.color))]
    .map((c) => ({ c, ...hueChroma(c) }))
    .filter((h) => h.hue !== null && h.chroma > 0.22);

  const clashes = [];
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const g = hueGap(hues[i].hue, hues[j].hue);
      if (g > 60 && g < 140) clashes.push(g);
    }
  }
  if (clashes.length) {
    out.push({ level: "info", text: `Hay ${clashes.length} par${clashes.length > 1 ? "es" : ""} de colores saturados a media distancia de tono. Ni análogos ni complementarios: suele leerse como desorden. Un verde neutro entre medias lo resuelve.` });
  }

  if (!out.length) out.push({ level: "ok", text: "Composición equilibrada: proporciones por rol, número de tallos y armonía cromática dentro de lo habitual." });
  return out;
}

/* ---------------------------- Layout ---------------------------- */

function layout(stems, { density, tilt, rotation, jitter, spread }) {
  const ordered = [...stems].sort((a, b) => {
    const r = ROLE_RANK[a.species.role] - ROLE_RANK[b.species.role];
    return r !== 0 ? r : a.uid - b.uid;
  });

  return ordered
    .map((stem, i) => {
      const n = i + 1;
      const ja = noise(stem.uid) - 0.5;
      const jb = noise(stem.uid + 97) - 0.5;

      const theta = n * GOLDEN + rotation + ja * jitter * 0.9;
      const silhouette = lerp(1, ROLE_SPREAD[stem.species.role], spread);
      const r = density * Math.sqrt(n) * silhouette * (1 + jb * jitter * 0.35);

      const sin = Math.sin(theta);
      const x = r * Math.cos(theta);
      const y = r * sin * tilt - stem.species.stem * (1 + jb * 0.05);

      return {
        ...stem, n, x, y, r,
        depth: sin,
        sortKey: r * sin,
        scale: 1 + sin * 0.16,
        tone: 0.72 + (sin + 1) * 0.14,
      };
    })
    .sort((a, b) => a.sortKey - b.sortKey);
}

/* -------------------------- Cabezas ----------------------------- */

function FlowerHead({ shape, size, color, uid }) {
  const s = size;
  switch (shape) {
    case "peony":
      return (
        <g>
          <circle r={s * 0.5} fill={color} opacity="0.55" />
          <circle r={s * 0.36} fill={color} />
          <circle r={s * 0.2} fill={color} opacity="0.75" />
          <circle r={s * 0.08} fill="#1C1F1A" opacity="0.18" />
        </g>
      );
    case "dahlia":
      return (
        <g>
          {Array.from({ length: 10 }, (_, i) => (
            <ellipse key={i} rx={s * 0.13} ry={s * 0.42} fill={color} opacity={i % 2 ? 0.8 : 1} transform={`rotate(${i * 36})`} />
          ))}
          <circle r={s * 0.13} fill="#FBF3E4" />
        </g>
      );
    case "ranun":
      return (
        <g>
          <circle r={s * 0.5} fill={color} opacity="0.4" />
          <circle r={s * 0.38} fill={color} opacity="0.7" />
          <circle r={s * 0.24} fill={color} />
          <circle r={s * 0.1} fill="#1C1F1A" opacity="0.22" />
        </g>
      );
    case "tulip":
      return (
        <path
          d={`M ${-s * 0.34} ${s * 0.1} C ${-s * 0.38} ${-s * 0.5} ${-s * 0.12} ${-s * 0.6} 0 ${-s * 0.6} C ${s * 0.12} ${-s * 0.6} ${s * 0.38} ${-s * 0.5} ${s * 0.34} ${s * 0.1} C ${s * 0.2} ${s * 0.44} ${-s * 0.2} ${s * 0.44} ${-s * 0.34} ${s * 0.1} Z`}
          fill={color}
        />
      );
    case "umbel":
      return (
        <g>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2 + noise(uid + i) * 1.4;
            const d = s * (0.16 + noise(uid + i * 3) * 0.34);
            return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={s * 0.12} fill={color} />;
          })}
        </g>
      );
    case "spray":
      return (
        <g opacity="0.95">
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2 + noise(uid + i * 7) * 2;
            const d = s * (0.12 + noise(uid + i) * 0.48);
            return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={s * 0.075} fill={color} />;
          })}
        </g>
      );
    case "leaf":
      return (
        <g transform={`rotate(${noise(uid) * 60 - 30})`}>
          <path d={`M 0 ${-s * 0.6} C ${s * 0.36} ${-s * 0.24} ${s * 0.36} ${s * 0.3} 0 ${s * 0.6} C ${-s * 0.36} ${s * 0.3} ${-s * 0.36} ${-s * 0.24} 0 ${-s * 0.6} Z`} fill={color} />
          <line x1="0" y1={-s * 0.5} x2="0" y2={s * 0.5} stroke="#1C1F1A" strokeWidth="0.6" opacity="0.2" />
        </g>
      );
    case "spike":
      return (
        <g transform={`rotate(${noise(uid) * 24 - 12})`}>
          <ellipse rx={s * 0.22} ry={s * 0.5} fill={color} />
          <ellipse rx={s * 0.12} ry={s * 0.34} fill="#FFFFFF" opacity="0.35" />
        </g>
      );
    default:
      return <circle r={s * 0.4} fill={color} />;
  }
}

/* --------------------------- App -------------------------------- */

export default function SpiralBouquet() {
  const [stems, setStems] = useState([]);
  const [uid, setUid] = useState(1);
  const [manualDensity, setManualDensity] = useState(17);
  const [autoDensity, setAutoDensity] = useState(true);
  const [tiltDeg, setTiltDeg] = useState(62);
  const [rotation, setRotation] = useState(0);
  const [jitter, setJitter] = useState(0.5);
  const [spread, setSpread] = useState(0.55);
  const [showSpiral, setShowSpiral] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [zone, setZone] = useState(ZONES[1]);
  const [tab, setTab] = useState("compra");

  const tilt = Math.cos((tiltDeg * Math.PI) / 180);

  /* El espaciado entre vecinos en la espiral de Vogel es ~constante e igual a c.
     Atando c al Ø medio de cabeza, el solape se controla solo. */
  const density = useMemo(() => {
    if (!autoDensity) return manualDensity;
    if (!stems.length) return 17;
    const avgHead = stems.reduce((s, x) => s + x.species.head, 0) / stems.length;
    return Math.round(avgHead * 0.86);
  }, [autoDensity, manualDensity, stems]);

  const placed = useMemo(
    () => layout(stems, { density, tilt, rotation: (rotation * Math.PI) / 180, jitter, spread }),
    [stems, density, tilt, rotation, jitter, spread]
  );

  const counts = useMemo(() => {
    const m = {};
    stems.forEach((s) => (m[s.species.id] = (m[s.species.id] || 0) + 1));
    return m;
  }, [stems]);

  /* ---------------------- Lista de la compra ---------------------- */
  const shopping = useMemo(() => {
    const byId = {};
    stems.forEach((s) => {
      if (!byId[s.species.id]) byId[s.species.id] = { species: s.species, qty: 0 };
      byId[s.species.id].qty += 1;
    });

    return Object.values(byId)
      .sort((a, b) => ROLE_RANK[a.species.role] - ROLE_RANK[b.species.role])
      .map((row) => {
        const inSeason = row.species.season.includes(month);
        const unit = row.species.wholesale * (inSeason ? 1 : 2.4) * zone.margin;
        let substitute = null;
        if (!inSeason) {
          const cands = SPECIES.filter(
            (x) => x.id !== row.species.id && x.role === row.species.role && x.season.includes(month)
          );
          if (cands.length) {
            substitute = cands.sort(
              (a, b) => colorDist(a.color, row.species.color) - colorDist(b.color, row.species.color)
            )[0];
          }
        }
        return { ...row, inSeason, unit, subtotal: unit * row.qty, substitute };
      });
  }, [stems, month, zone]);

  const total = shopping.reduce((s, r) => s + r.subtotal, 0);
  const price = { low: total * 0.85, high: total * 1.15 };

  /* ------------------------- Montaje ------------------------------ */
  const assembly = useMemo(() => {
    if (!placed.length) return null;

    const longest = Math.max(...stems.map((s) => s.species.lengthCm));
    const height = Math.round(longest - TRIM_CM);
    const bindFromTop = Math.round(height * BIND_RATIO);
    const rMax = Math.max(...placed.map((p) => p.r), 1);

    const steps = [...placed]
      .sort((a, b) => a.n - b.n)
      .map((p) => {
        const cutCm = Math.round(-p.y / PX_PER_CM);
        return {
          n: p.n,
          species: p.species,
          cutCm,
          angle: Math.round((p.r / rMax) * MAX_TILT_DEG),
          short: cutCm > p.species.lengthCm - 2,
        };
      });

    return { height, bindFromTop, belowBind: height - bindFromTop, steps, vase: Math.min(...stems.map((s) => s.species.vase)) };
  }, [placed, stems]);

  const offSeason = shopping.filter((r) => !r.inSeason);
  const notes = useMemo(() => validate(stems), [stems]);

  const add = (species) => {
    setStems((prev) => [...prev, { uid, species }]);
    setUid((u) => u + 1);
  };

  const remove = (speciesId) => {
    setStems((prev) => {
      const idx = [...prev].reverse().findIndex((s) => s.species.id === speciesId);
      if (idx === -1) return prev;
      const real = prev.length - 1 - idx;
      return prev.filter((_, i) => i !== real);
    });
  };

  const spiralGuide = useMemo(() => {
    if (!showSpiral || placed.length === 0) return "";
    const pts = [];
    for (let n = 0.4; n <= placed.length; n += 0.12) {
      const th = n * GOLDEN + (rotation * Math.PI) / 180;
      const r = density * Math.sqrt(n);
      pts.push(`${r * Math.cos(th)},${r * Math.sin(th) * tilt - 150}`);
    }
    return `M ${pts.join(" L ")}`;
  }, [showSpiral, placed.length, density, rotation, tilt]);

  const applyProfile = (p) => { setTiltDeg(p.tilt); setSpread(p.spread); setJitter(p.jitter); };
  const activeProfile = PROFILES.find(
    (p) => p.tilt === tiltDeg && Math.abs(p.spread - spread) < 0.001 && Math.abs(p.jitter - jitter) < 0.001
  );

  const grouped = ["focal", "secondary", "filler", "green"].map((role) => ({
    role,
    items: SPECIES.filter((s) => s.role === role),
  }));

  return (
    <div className="sb-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .sb-root {
          --canvas: #EDECE6; --surface: #FFFFFF; --ink: #1C1F1A;
          --muted: #6B6F66; --line: #DEDCD3; --accent: #3F5D3A; --warn: #8A5A2B;
          min-height: 100%; background: var(--canvas); color: var(--ink);
          font-family: 'IBM Plex Sans', system-ui, sans-serif; padding: 20px; box-sizing: border-box;
        }
        .sb-root *, .sb-root *::before, .sb-root *::after { box-sizing: border-box; }

        .sb-head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
        .sb-title { font-family: 'Fraunces', Georgia, serif; font-size: 26px; font-weight: 600; letter-spacing: -0.015em; margin: 0; }
        .sb-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }

        .sb-grid { display: grid; grid-template-columns: 258px 1fr 216px; gap: 16px; align-items: start; }
        @media (max-width: 900px) { .sb-grid { grid-template-columns: 1fr; } }

        .sb-panel { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 14px; }
        .sb-panel + .sb-panel { margin-top: 12px; }

        .sb-legend { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted); margin: 0 0 8px; }
        .sb-group + .sb-group { margin-top: 16px; }

        .sb-row { display: flex; align-items: center; gap: 9px; padding: 5px 0; }
        .sb-swatch { width: 15px; height: 15px; border-radius: 50%; flex: none; border: 1px solid rgba(0,0,0,0.1); }
        .sb-names { flex: 1; min-width: 0; line-height: 1.25; }
        .sb-name { font-size: 12.5px; font-weight: 500; }
        .sb-latin { font-family: 'Fraunces', serif; font-style: italic; font-size: 10.5px; color: var(--muted); }
        .sb-dims { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; color: var(--muted); }
        .sb-count { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; min-width: 17px; text-align: center; color: var(--muted); }

        .sb-btn { width: 22px; height: 22px; border: 1px solid var(--line); background: var(--surface); border-radius: 5px;
                  cursor: pointer; font-size: 13px; line-height: 1; color: var(--ink); flex: none; }
        .sb-btn:hover { background: var(--canvas); }
        .sb-btn:disabled { opacity: 0.3; cursor: default; }
        .sb-root :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

        .sb-stage { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
        .sb-svg { display: block; width: 100%; height: auto; }
        .sb-stem-g { transition: transform 340ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease; }
        @media (prefers-reduced-motion: reduce) { .sb-stem-g { transition: none; } }
        .sb-empty { font-family: 'Fraunces', serif; font-style: italic; font-size: 14px; fill: #A9AB9F; }
        .sb-rule { stroke: var(--muted); stroke-width: 0.7; opacity: 0.5; }
        .sb-ruletext { font-family: 'IBM Plex Mono', monospace; font-size: 8px; fill: var(--muted); }

        .sb-profiles { display: flex; gap: 5px; margin-bottom: 14px; }
        .sb-chip { flex: 1; padding: 5px 4px; border: 1px solid var(--line); background: var(--surface);
                   border-radius: 6px; font-family: inherit; font-size: 11px; color: var(--muted); cursor: pointer; }
        .sb-chip:hover { background: var(--canvas); }
        .sb-chip.is-on { background: var(--accent); border-color: var(--accent); color: #F6F4EE; }

        .sb-ctrl { margin-bottom: 13px; }
        .sb-ctrl label { display: flex; justify-content: space-between; font-family: 'IBM Plex Mono', monospace;
                         font-size: 10px; letter-spacing: 0.09em; text-transform: uppercase; color: var(--muted); margin-bottom: 5px; }
        .sb-ctrl input[type=range] { width: 100%; accent-color: var(--accent); }
        .sb-ctrl select { width: 100%; padding: 6px 8px; border: 1px solid var(--line); border-radius: 6px;
                          background: var(--surface); font-family: inherit; font-size: 12.5px; color: var(--ink); }
        .sb-toggle { display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; color: var(--muted); }
        .sb-toggle input { accent-color: var(--accent); }

        .sb-price { font-family: 'Fraunces', serif; font-size: 27px; font-weight: 600; letter-spacing: -0.02em; }
        .sb-note { font-size: 11px; color: var(--muted); line-height: 1.45; margin-top: 7px; }
        .sb-warn { font-size: 11px; color: var(--warn); line-height: 1.45; margin-top: 7px; }
        .sb-meta { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.1em;
                   text-transform: uppercase; color: var(--muted); display: flex; justify-content: space-between; }

        .sb-out { margin-top: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }
        .sb-tabs { display: flex; gap: 20px; border-bottom: 1px solid var(--line); padding: 0 16px; }
        .sb-tab { background: none; border: none; padding: 12px 0; font-family: 'IBM Plex Mono', monospace; font-size: 10px;
                  letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
        .sb-tab.is-on { color: var(--ink); border-bottom-color: var(--accent); }
        .sb-out-body { padding: 16px; }

        .sb-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .sb-table th { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase;
                       color: var(--muted); font-weight: 400; text-align: left; padding: 0 10px 8px 0; }
        .sb-table td { padding: 8px 10px 8px 0; border-top: 1px solid var(--line); vertical-align: top; }
        .sb-num { font-family: 'IBM Plex Mono', monospace; text-align: right; white-space: nowrap; }
        .sb-total td { border-top: 1px solid var(--ink); font-weight: 600; }

        .sb-steps { display: grid; grid-template-columns: repeat(auto-fill, minmax(178px, 1fr)); gap: 8px; }
        .sb-step { border: 1px solid var(--line); border-radius: 8px; padding: 9px 10px; display: flex; gap: 9px; }
        .sb-step.is-short { border-color: var(--warn); }
        .sb-stepn { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--muted); min-width: 17px; }
        .sb-bars { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px 22px; margin-bottom: 10px; }
        .sb-bar-head { display: flex; justify-content: space-between; font-size: 11.5px; color: var(--muted); margin-bottom: 4px; }
        .sb-track { position: relative; height: 6px; background: var(--canvas); border-radius: 3px; overflow: hidden; }
        .sb-target { position: absolute; top: 0; bottom: 0; background: #C9D6C4; }
        .sb-fill { position: absolute; top: 0; bottom: 0; left: 0; background: var(--accent); border-radius: 3px; }

        .sb-notes { list-style: none; margin: 0; padding: 0; }
        .sb-n { font-size: 12.5px; line-height: 1.5; padding: 7px 0 7px 14px; border-top: 1px solid var(--line); position: relative; }
        .sb-n::before { content: ""; position: absolute; left: 0; top: 13px; width: 6px; height: 6px; border-radius: 50%; }
        .sb-n-error::before { background: #A33B2E; }
        .sb-n-warn::before  { background: var(--warn); }
        .sb-n-info::before  { background: #8A8D82; }
        .sb-n-ok::before    { background: var(--accent); }

        .sb-recipe { display: flex; gap: 26px; flex-wrap: wrap; margin-bottom: 14px; }
        .sb-fig { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 600; }
      `}</style>

      <div className="sb-head">
        <h1 className="sb-title">Monta tu ramo</h1>
        <span className="sb-eyebrow">Espiral 137,5° · {stems.length} tallo{stems.length === 1 ? "" : "s"}</span>
      </div>

      <div className="sb-grid">
        {/* Catálogo */}
        <div className="sb-panel">
          {grouped.map(({ role, items }) => (
            <div className="sb-group" key={role}>
              <p className="sb-legend">{ROLE_LABEL[role]}</p>
              {items.map((sp) => (
                <div className="sb-row" key={sp.id}>
                  <span className="sb-swatch" style={{ background: sp.color }} />
                  <span className="sb-names">
                    <div className="sb-name">{sp.name}</div>
                    <div className="sb-latin">{sp.latin}</div>
                    <div className="sb-dims">{sp.lengthCm} cm · Ø {sp.headMm} mm</div>
                  </span>
                  <button className="sb-btn" onClick={() => remove(sp.id)} disabled={!counts[sp.id]} aria-label={`Quitar ${sp.name}`}>−</button>
                  <span className="sb-count">{counts[sp.id] || 0}</span>
                  <button className="sb-btn" onClick={() => add(sp)} aria-label={`Añadir ${sp.name}`}>+</button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Escenario */}
        <div className="sb-stage">
          <svg className="sb-svg" viewBox="-200 -310 400 450" role="img" aria-label="Vista previa del ramo">
            {showSpiral && (
              <>
                <path d={spiralGuide} fill="none" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
                <circle cx="0" cy="-150" r="2" fill="var(--accent)" opacity="0.6" />
              </>
            )}

            {assembly && (
              <g>
                <line className="sb-rule" x1="-180" y1="0" x2="180" y2="0" strokeDasharray="4 4" />
                <text className="sb-ruletext" x="-178" y="-5">atado · {assembly.bindFromTop} cm desde las cabezas</text>
                <line className="sb-rule" x1="-180" y1={assembly.belowBind * PX_PER_CM * 0.34} x2="180" y2={assembly.belowBind * PX_PER_CM * 0.34} strokeDasharray="4 4" />
                <text className="sb-ruletext" x="-178" y={assembly.belowBind * PX_PER_CM * 0.34 - 5}>corte · alto total {assembly.height} cm</text>
              </g>
            )}

            {placed.map((s) => {
              const baseX = s.x * 0.16;
              const baseY = 74 + noise(s.uid + 41) * 26;
              return (
                <g key={s.uid} className="sb-stem-g" style={{ opacity: s.tone }}>
                  <path d={`M 0 0 Q ${s.x * 0.34} ${s.y * 0.55} ${s.x} ${s.y}`} fill="none" stroke="var(--accent)" strokeWidth={1.5 * s.scale} strokeLinecap="round" opacity="0.75" />
                  <line x1="0" y1="0" x2={baseX} y2={baseY} stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
                  <g transform={`translate(${s.x} ${s.y}) scale(${s.scale})`}>
                    <FlowerHead shape={s.species.shape} size={s.species.head} color={s.species.color} uid={s.uid} />
                    {showSpiral && (
                      <text y="3.5" textAnchor="middle" fontSize="8" fontFamily="IBM Plex Mono, monospace" fill="#1C1F1A" opacity="0.65">{s.n}</text>
                    )}
                  </g>
                </g>
              );
            })}

            {placed.length > 0 && (
              <g>
                <path d="M -12 -4 Q 0 2 12 -4" fill="none" stroke="#A8895E" strokeWidth="5" strokeLinecap="round" />
                <path d="M -12 2 Q 0 8 12 2" fill="none" stroke="#94794F" strokeWidth="4.5" strokeLinecap="round" />
              </g>
            )}

            {placed.length === 0 && (
              <text x="0" y="-110" textAnchor="middle" className="sb-empty">Añade una flor focal para empezar</text>
            )}
          </svg>
        </div>

        {/* Controles */}
        <div>
          <div className="sb-panel">
            <p className="sb-legend">Perfil</p>
            <div className="sb-profiles">
              {PROFILES.map((p) => (
                <button key={p.id} className={`sb-chip${activeProfile?.id === p.id ? " is-on" : ""}`} onClick={() => applyProfile(p)}>{p.label}</button>
              ))}
            </div>

            <div className="sb-ctrl">
              <label>Silueta <span>{spread === 0 ? "uniforme" : spread.toFixed(2)}</span></label>
              <input type="range" min="0" max="1" step="0.05" value={spread} onChange={(e) => setSpread(+e.target.value)} />
            </div>
            <div className="sb-ctrl">
              <label>Densidad <span>{density}{autoDensity ? " auto" : ""}</span></label>
              <input type="range" min="10" max="40" value={density} disabled={autoDensity} onChange={(e) => setManualDensity(+e.target.value)} />
              <label className="sb-toggle" style={{ marginTop: 4 }}>
                <input type="checkbox" checked={autoDensity} onChange={(e) => setAutoDensity(e.target.checked)} />
                Ajustar al Ø de cabeza
              </label>
            </div>
            <div className="sb-ctrl">
              <label>Inclinación <span>{tiltDeg}°</span></label>
              <input type="range" min="20" max="80" value={tiltDeg} onChange={(e) => setTiltDeg(+e.target.value)} />
            </div>
            <div className="sb-ctrl">
              <label>Giro <span>{rotation}°</span></label>
              <input type="range" min="0" max="360" value={rotation} onChange={(e) => setRotation(+e.target.value)} />
            </div>
            <div className="sb-ctrl">
              <label>Naturalidad <span>{jitter.toFixed(2)}</span></label>
              <input type="range" min="0" max="1" step="0.05" value={jitter} onChange={(e) => setJitter(+e.target.value)} />
            </div>
            <label className="sb-toggle">
              <input type="checkbox" checked={showSpiral} onChange={(e) => setShowSpiral(e.target.checked)} />
              Ver la espiral
            </label>
          </div>

          <div className="sb-panel">
            <div className="sb-meta" style={{ marginBottom: 8 }}><span>Coste estimado</span></div>
            <div className="sb-price">{stems.length ? `${price.low.toFixed(0)} – ${price.high.toFixed(0)} €` : "— €"}</div>
            <div className="sb-ctrl" style={{ marginTop: 12 }}>
              <label>Mes</label>
              <select value={month} onChange={(e) => setMonth(+e.target.value)}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="sb-ctrl">
              <label>Zona</label>
              <select value={zone.id} onChange={(e) => setZone(ZONES.find((z) => z.id === e.target.value))}>
                {ZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
              </select>
            </div>
            <p className="sb-note">Estimación sobre precio mayorista por tallo y margen habitual de floristería en Madrid.</p>
          </div>
        </div>
      </div>

      {/* Salida: lista de la compra + montaje */}
      {stems.length > 0 && (
        <div className="sb-out">
          <div className="sb-tabs">
            <button className={`sb-tab${tab === "compra" ? " is-on" : ""}`} onClick={() => setTab("compra")}>Lista de la compra</button>
            <button className={`sb-tab${tab === "montaje" ? " is-on" : ""}`} onClick={() => setTab("montaje")}>Diagrama de montaje</button>
            <button className={`sb-tab${tab === "composicion" ? " is-on" : ""}`} onClick={() => setTab("composicion")}>
              Composición{notes.some((n) => n.level !== "ok") ? ` (${notes.filter((n) => n.level !== "ok").length})` : ""}
            </button>
          </div>

          <div className="sb-out-body">
            {tab === "compra" && (
              <>
                <table className="sb-table">
                  <thead>
                    <tr>
                      <th>Especie</th><th>Rol</th>
                      <th className="sb-num">Tallos</th><th className="sb-num">€/tallo</th><th className="sb-num">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopping.map((r) => (
                      <tr key={r.species.id}>
                        <td>
                          <div className="sb-name">{r.species.name}</div>
                          <div className="sb-latin">{r.species.latin}</div>
                          {!r.inSeason && (
                            <div className="sb-warn">
                              Fuera de temporada en {MONTHS[month - 1].toLowerCase()}
                              {r.substitute && <> · sustituir por {r.substitute.name}</>}
                            </div>
                          )}
                        </td>
                        <td style={{ color: "var(--muted)" }}>{ROLE_LABEL[r.species.role]}</td>
                        <td className="sb-num">{r.qty}</td>
                        <td className="sb-num">{r.unit.toFixed(2)}</td>
                        <td className="sb-num">{r.subtotal.toFixed(2)} €</td>
                      </tr>
                    ))}
                    <tr className="sb-total">
                      <td colSpan="4">Total estimado · {zone.label}</td>
                      <td className="sb-num">{price.low.toFixed(0)} – {price.high.toFixed(0)} €</td>
                    </tr>
                  </tbody>
                </table>
                {offSeason.length > 0 && (
                  <p className="sb-warn">{offSeason.length} especie{offSeason.length > 1 ? "s" : ""} fuera de temporada: cuenta con un sobreprecio de unas 2,4 veces y menor duración en jarrón.</p>
                )}
              </>
            )}

            {tab === "composicion" && (
              <>
                <div className="sb-bars">
                  {["focal", "secondary", "filler", "green"].map((role) => {
                    const n = stems.filter((s) => s.species.role === role).length;
                    const share = n / stems.length;
                    const [lo, hi] = ROLE_TARGET[role];
                    return (
                      <div className="sb-bar" key={role}>
                        <div className="sb-bar-head">
                          <span>{ROLE_LABEL[role]}</span>
                          <span className="sb-num">{n} · {Math.round(share * 100)}%</span>
                        </div>
                        <div className="sb-track">
                          <div className="sb-target" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }} />
                          <div className="sb-fill" style={{ width: `${Math.min(share, 1) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="sb-note" style={{ marginBottom: 12 }}>La banda clara marca la proporción habitual del rol; la barra, la tuya.</p>
                <ul className="sb-notes">
                  {notes.map((n, i) => (
                    <li className={`sb-n sb-n-${n.level}`} key={i}>{n.text}</li>
                  ))}
                </ul>
              </>
            )}

            {tab === "montaje" && assembly && (
              <>
                <div className="sb-recipe">
                  <div><div className="sb-legend">Alto final</div><div className="sb-fig">{assembly.height} cm</div></div>
                  <div><div className="sb-legend">Atado desde arriba</div><div className="sb-fig">{assembly.bindFromTop} cm</div></div>
                  <div><div className="sb-legend">Tallo bajo el atado</div><div className="sb-fig">{assembly.belowBind} cm</div></div>
                  <div><div className="sb-legend">Duración en jarrón</div><div className="sb-fig">{assembly.vase} días</div></div>
                </div>

                <p className="sb-note" style={{ marginBottom: 14 }}>
                  Sujeta el ramo con la mano izquierda a la altura del atado. Añade cada tallo <strong>en diagonal</strong> sobre los anteriores
                  y gira el ramo un poco en la <strong>misma dirección</strong> tras cada uno: eso es lo que forma la espiral.
                  Ata al final, y solo entonces corta la base al bies bajo el agua.
                </p>

                <div className="sb-steps">
                  {assembly.steps.map((s) => (
                    <div className={`sb-step${s.short ? " is-short" : ""}`} key={s.n}>
                      <span className="sb-stepn">{s.n}</span>
                      <span style={{ lineHeight: 1.35 }}>
                        <div className="sb-name">{s.species.name}</div>
                        <div className="sb-dims">corte {s.cutCm} cm · {s.angle}° de inclinación</div>
                        {s.short && <div className="sb-warn">No llega: el tallo comercial mide {s.species.lengthCm} cm</div>}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
