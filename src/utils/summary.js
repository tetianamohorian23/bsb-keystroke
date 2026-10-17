const average = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

// attemptsBars: pole pokusov, každý pokus je pole { s, e } (ms od začiatku pokusu).
export function summarizeAttempts(attemptsBars, participantId) {
  const holds = attemptsBars
    .flat()
    .filter((bar) => bar.e !== null)
    .map((bar) => bar.e - bar.s);

  const durations = attemptsBars.map(
    (bars) =>
      Math.max(...bars.map((b) => b.e ?? b.s)) -
      Math.min(...bars.map((b) => b.s)),
  );

  return {
    hold: Math.round(average(holds)),
    time: (average(durations) / 1000).toFixed(2),
    id: participantId,
  };
}
