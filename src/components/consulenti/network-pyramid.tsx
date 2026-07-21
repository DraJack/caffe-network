"use client";

import * as React from "react";
import { MAX_NODES_PER_ROW, formatCount, type LevelRow } from "./network-math";

/* Geometria in unità viewBox. L'SVG contiene SOLO l'albero: le etichette
   vivono in HTML nella legenda sotto, altrimenti su mobile il testo scalerebbe
   a 6px e diventerebbe illeggibile. */
const VB_W = 520;
const VB_H = 440;
const CENTER = VB_W / 2;
const ROOT_Y = 26;
const ROW_GAP = 78;
const MAX_SPAN = 400; // lascia margine ai puntini di troncamento
const ROOT_R = 15;

const rowY = (level: number) => ROOT_Y + level * ROW_GAP;

/** Posizione orizzontale del nodo `i` di una riga da `count` nodi. */
function nodeX(count: number, i: number): number {
  if (count <= 1) return CENTER;
  const span = Math.min(MAX_SPAN, (count - 1) * 44);
  return CENTER - span / 2 + (i * span) / (count - 1);
}

/** Il raggio si stringe quando la riga si affolla, così i nodi non si toccano. */
function nodeR(count: number): number {
  if (count <= 4) return 9;
  if (count <= 8) return 7.5;
  if (count <= 14) return 6;
  if (count <= 20) return 5;
  return 4.2;
}

type Props = {
  rows: LevelRow[];
  perPerson: number;
  /** Cambia a ogni movimento degli slider: rimonta l'albero e riavvia le animazioni CSS. */
  animationKey: string;
};

export function NetworkPyramid({ rows, perPerson, animationKey }: Props) {
  const activeCount = rows.filter((r) => r.active).length;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-auto w-full"
      role="img"
      aria-label={`Diagramma della rete: ogni persona ne invita ${perPerson}, su ${activeCount} livelli attivi. ${rows
        .filter((r) => r.active)
        .map((r) => `livello ${r.level}, ${formatCount(r.people)} persone`)
        .join("; ")}.`}
    >
      {/* La key forza React a rimontare il gruppo: senza, le animazioni di
          ingresso girerebbero una volta sola al primo render. */}
      <g key={animationKey}>
        {/* Collegamenti prima dei nodi, così i cerchi ci passano sopra */}
        {rows.map((row) => (
          <Links key={`links-${row.level}`} row={row} rows={rows} perPerson={perPerson} />
        ))}

        {/* Radice: sei tu */}
        <circle
          cx={CENTER}
          cy={ROOT_Y}
          r={ROOT_R}
          className="animate-pulse-ring fill-accent opacity-30"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          aria-hidden
        />
        <circle
          cx={CENTER}
          cy={ROOT_Y}
          r={ROOT_R}
          className="animate-scale-in fill-accent stroke-white"
          strokeWidth={3}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          aria-hidden
        />
        <text
          x={CENTER}
          y={ROOT_Y + 4}
          textAnchor="middle"
          className="animate-fade-in fill-coffee-950 text-[11px] font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
          aria-hidden
        >
          TU
        </text>

        {/* Nodi */}
        {rows.map((row) => (
          <Nodes key={`nodes-${row.level}`} row={row} />
        ))}
      </g>
    </svg>
  );
}

function Nodes({ row }: { row: LevelRow }) {
  const y = rowY(row.level);
  const r = nodeR(row.shown);
  const base = (row.level - 1) * 90;

  return (
    <g aria-hidden>
      {Array.from({ length: row.shown }, (_, i) => (
        <circle
          key={i}
          cx={nodeX(row.shown, i)}
          cy={y}
          r={r}
          className={
            row.active
              ? "animate-scale-in fill-accent stroke-white"
              : "animate-scale-in fill-coffee-200 stroke-white opacity-40"
          }
          strokeWidth={1.5}
          style={{
            animationDelay: `${base + i * 14}ms`,
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
        />
      ))}

      {/* Troncamento: la riga continua oltre quello che si può disegnare.
          Puntini invece di testo, perché il testo SVG diventa illeggibile su mobile —
          il numero esatto sta nella legenda HTML. */}
      {row.hidden > 0 &&
        [0, 1, 2].map((d) => (
          <React.Fragment key={`dots-${d}`}>
            <circle
              cx={CENTER - MAX_SPAN / 2 - 12 - d * 8}
              cy={y}
              r={1.8}
              className={row.active ? "fill-coffee-300" : "fill-coffee-200 opacity-40"}
              style={{ animationDelay: `${base + 340}ms` }}
            />
            <circle
              cx={CENTER + MAX_SPAN / 2 + 12 + d * 8}
              cy={y}
              r={1.8}
              className={row.active ? "fill-coffee-300" : "fill-coffee-200 opacity-40"}
              style={{ animationDelay: `${base + 340}ms` }}
            />
          </React.Fragment>
        ))}
    </g>
  );
}

/**
 * Collegamenti verso il livello superiore.
 *
 * Strategia ibrida: finché la riga sta sotto MAX_NODES_PER_ROW disegniamo il
 * grafo VERO (ogni nodo attaccato al suo effettivo genitore). Oltre, i nodi
 * mostrati sono un campione e fingere una parentela sarebbe una bugia: si passa
 * a una barra di raccordo, che dice "questo livello discende da quello sopra"
 * senza affermare quale nodo da quale.
 */
function Links({
  row,
  rows,
  perPerson,
}: {
  row: LevelRow;
  rows: LevelRow[];
  perPerson: number;
}) {
  const y = rowY(row.level);
  const yPrev = rowY(row.level - 1);
  const base = (row.level - 1) * 90;
  const stroke = row.active ? "stroke-coffee-300" : "stroke-coffee-100 opacity-40";

  const truthful = row.people <= MAX_NODES_PER_ROW;

  if (truthful) {
    const parentCount = row.level === 1 ? 1 : rows[row.level - 2].shown;
    return (
      <g aria-hidden>
        {Array.from({ length: row.shown }, (_, i) => {
          const parent = Math.floor(i / perPerson);
          return (
            <line
              key={i}
              x1={nodeX(parentCount, parent)}
              y1={yPrev}
              x2={nodeX(row.shown, i)}
              y2={y}
              pathLength={1}
              strokeDasharray={1}
              strokeWidth={1.25}
              className={`animate-draw-line ${stroke}`}
              style={{ animationDelay: `${base + i * 14}ms` }}
            />
          );
        })}
      </g>
    );
  }

  // Riga campionata: spina centrale + barra di raccordo + stub verso i nodi.
  const railY = y - 26;
  const xFirst = nodeX(row.shown, 0);
  const xLast = nodeX(row.shown, row.shown - 1);

  return (
    <g aria-hidden>
      <line
        x1={CENTER}
        y1={yPrev}
        x2={CENTER}
        y2={railY}
        pathLength={1}
        strokeDasharray={1}
        strokeWidth={1.25}
        className={`animate-draw-line ${stroke}`}
        style={{ animationDelay: `${base}ms` }}
      />
      <line
        x1={xFirst}
        y1={railY}
        x2={xLast}
        y2={railY}
        pathLength={1}
        strokeDasharray={1}
        strokeWidth={1.25}
        className={`animate-draw-line ${stroke}`}
        style={{ animationDelay: `${base + 120}ms` }}
      />
      {Array.from({ length: row.shown }, (_, i) => (
        <line
          key={i}
          x1={nodeX(row.shown, i)}
          y1={railY}
          x2={nodeX(row.shown, i)}
          y2={y}
          pathLength={1}
          strokeDasharray={1}
          strokeWidth={1.25}
          className={`animate-draw-line ${stroke}`}
          style={{ animationDelay: `${base + 220 + i * 10}ms` }}
        />
      ))}
    </g>
  );
}
