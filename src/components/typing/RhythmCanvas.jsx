import { useEffect, useRef } from "react";

const COLOR_CURRENT = "#ff7048";
const COLOR_PREVIOUS = "#e8b85c";
const PAD_X = 14;
const PAD_Y = 10;
const DOT = 14; // výška a minimálna šírka značky
const LANES = 4;

// Koniec posledného stlačenia v pokuse (ms od začiatku).
const duration = (bars) => bars.reduce((max, bar) => Math.max(max, bar.e ?? bar.s), 0);

// Časová os stlačení kláves: aktuálny pokus + "duch" predchádzajúceho.
// Mierka sa prispôsobí dĺžke pokusu (pri prvom pokuse očakávanej dĺžke), takže
// značky vyplnia celú šírku grafu; šírka značky zodpovedá dobe držania klávesy.
export default function RhythmCanvas({ bars, ghost, expectedMs }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const windowMs = Math.max(
      duration(bars) * 1.06,
      ghost.length ? duration(ghost) * 1.06 : expectedMs,
    );
    const scale = (w - 2 * PAD_X - DOT) / windowMs;
    const laneGap = (h - 2 * PAD_Y - DOT) / (LANES - 1);

    const drawBar = (bar, color, alpha, lane) => {
      const left = PAD_X + bar.s * scale;
      const width = bar.e === null ? DOT : Math.max(DOT, (bar.e - bar.s) * scale);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(left, PAD_Y + (lane % LANES) * laneGap, width, DOT, DOT / 2);
      ctx.fill();
    };

    ghost.forEach((bar, i) => drawBar(bar, COLOR_PREVIOUS, 0.5, i));
    bars.forEach((bar, i) => drawBar(bar, COLOR_CURRENT, 1, i));
  }, [bars, ghost, expectedMs]);

  return (
    <div className="roll">
      <canvas ref={canvasRef} className="rhythm-canvas" aria-hidden="true" />
      <div className="legend">
        <span>
          <b className="legend-a" />
          aktuálny pokus
        </span>
        <span>
          <b className="legend-b" />
          predchádzajúci
        </span>
      </div>
    </div>
  );
}
