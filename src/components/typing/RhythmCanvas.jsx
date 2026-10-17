import { useEffect, useRef } from "react";
import { WINDOW_MS } from "../../constants";

const COLOR_CURRENT = "#ff7048";
const COLOR_PREVIOUS = "#e8b85c";

// Časová os stlačení kláves: aktuálny pokus + "duch" predchádzajúceho.
export default function RhythmCanvas({ bars, ghost }) {
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

    const scale = (w - 20) / WINDOW_MS;
    const drawBar = (bar, color, alpha, lane) => {
      const left = 10 + Math.max(0, Math.min(bar.s, WINDOW_MS)) * scale;
      if (left > w - 10) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(left, 8 + (lane % 4) * 22, 12, 15, 7);
      ctx.fill();
    };

    ghost.forEach((bar, i) => drawBar(bar, COLOR_PREVIOUS, 0.5, i));
    bars.forEach((bar, i) => drawBar(bar, COLOR_CURRENT, 1, i));
  }, [bars, ghost]);

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
