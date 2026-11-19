import type { SVGProps } from "react";

// Silhouette stilizzate dei formati: è dalla forma della cialda/capsula che il cliente
// riconosce la compatibilità. ⚠️ Solo forme generiche disegnate da noi, MAI loghi o
// marchi altrui (i nomi compaiono solo come testo dopo "compatibili").
//
// Tutte su viewBox 48×48, flangia in basso, tratto `currentColor`: il colore lo
// decide chi le usa (oro sulla card scelta, grigio caffè nelle alternative).

type IconProps = SVGProps<SVGSVGElement>;

/** Le capsule occupano solo il centro del 48×48: per loro si inquadra più stretto. */
function Svg({ children, tight, ...props }: IconProps & { tight?: boolean }) {
  return (
    <svg
      viewBox={tight ? "5 5 38 38" : "0 0 48 48"}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

const BODY = { fill: "currentColor", fillOpacity: 0.12 } as const;

/** Cialda ESE vista dall'alto: bordo pinzato, carta, dischetto di caffè. */
function Cialda({ size, ...props }: IconProps & { size?: 44 | 38 }) {
  const outer = size === 38 ? 16.5 : 20;
  const inner = size === 38 ? 10.5 : 13;
  return (
    <Svg {...props}>
      <circle cx={24} cy={24} r={outer} strokeDasharray="1.6 2" />
      <circle cx={24} cy={24} r={outer - 2.6} />
      <circle cx={24} cy={24} r={inner} {...BODY} stroke="none" />
      {size && (
        <text
          x={24}
          y={27.2}
          textAnchor="middle"
          fontSize={9}
          fontWeight={700}
          fill="currentColor"
          stroke="none"
          fontFamily="inherit"
        >
          {size}
        </text>
      )}
    </Svg>
  );
}

/** Flangia comune alle capsule. */
function Rim({ x, w, y = 35 }: { x: number; w: number; y?: number }) {
  return <rect x={x} y={y} width={w} height={3.5} rx={1.75} />;
}

/** Tronco di cono slanciato. */
function CapsuleCone(props: IconProps) {
  return (
    <Svg tight {...props}>
      <path d="M13 35 L19.5 14 Q24 11.5 28.5 14 L35 35 Z" {...BODY} />
      <path d="M15.4 28 H32.6" />
      <Rim x={8} w={32} />
    </Svg>
  );
}

/** Larga e bassa, coperchio piatto. */
function CapsuleWide(props: IconProps) {
  return (
    <Svg tight {...props}>
      <path d="M9 33 L11 17 Q11.2 15 13.2 15 H34.8 Q36.8 15 37 17 L39 33 Z" {...BODY} />
      <path d="M12.6 21 H35.4" />
      <Rim x={5} w={38} y={33} />
    </Svg>
  );
}

/** Cilindro a spigoli morbidi con la fossetta in cima. */
function CapsuleRounded(props: IconProps) {
  return (
    <Svg tight {...props}>
      <path d="M13 35 V19 Q13 13 19 13 H29 Q35 13 35 19 V35 Z" {...BODY} />
      <circle cx={24} cy={21} r={2.4} />
      <Rim x={10} w={28} />
    </Svg>
  );
}

/** Cilindro con fascia centrale e piccolo innesto in cima. */
function CapsuleBand(props: IconProps) {
  return (
    <Svg tight {...props}>
      <rect x={20.5} y={11} width={7} height={4} rx={1.2} />
      <path d="M14 35 L15 15 H33 L34 35 Z" {...BODY} />
      <path d="M14.5 25 H33.5" />
      <Rim x={11} w={26} />
    </Svg>
  );
}

/** Alta e stretta, con due anelli. */
function CapsuleTall(props: IconProps) {
  return (
    <Svg tight {...props}>
      <path d="M16 36 L17 11 Q17 9.5 18.5 9.5 H29.5 Q31 9.5 31 11 L32 36 Z" {...BODY} />
      <path d="M16.6 18 H31.4 M16.3 27 H31.7" />
      <Rim x={13} w={22} y={36} />
    </Svg>
  );
}

/** Cilindro a cupola. */
function CapsuleDome(props: IconProps) {
  return (
    <Svg tight {...props}>
      <path d="M15 35 V21 A9 9 0 0 1 33 21 V35 Z" {...BODY} />
      <path d="M15 27 H33" />
      <Rim x={12} w={24} />
    </Svg>
  );
}

/**
 * Sceglie la silhouette dall'etichetta della macchina (src/lib/product.ts → machineLabel).
 * Un formato nuovo non mappato riceve l'icona generica del suo gruppo: niente si rompe,
 * ma conviene aggiungere qui la sua forma.
 */
export function PodIcon({ label, group, ...props }: IconProps & { label: string; group: string }) {
  const l = label.toLowerCase();
  if (/\b44\b/.test(l)) return <Cialda size={44} {...props} />;
  if (/\b38\b/.test(l)) return <Cialda size={38} {...props} />;
  if (l.includes("dolce gusto")) return <CapsuleWide {...props} />;
  if (l.includes("nespresso")) return <CapsuleCone {...props} />;
  if (l.includes("a modo mio")) return <CapsuleRounded {...props} />;
  if (l.includes("point")) return <CapsuleBand {...props} />;
  if (l.includes("blue")) return <CapsuleTall {...props} />;
  if (l.includes("firma")) return <CapsuleDome {...props} />;
  return /ciald/i.test(group) ? <Cialda {...props} /> : <CapsuleCone {...props} />;
}
