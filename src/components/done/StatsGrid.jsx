function Stat({ value, label }) {
  return (
    <div className="stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export default function StatsGrid({ attempts, hold, time }) {
  return (
    <div className="stats">
      <Stat value={attempts} label="pokusov" />
      <Stat value={`${hold} ms`} label="priemerné držanie klávesy" />
      <Stat value={`${time} s`} label="priemerný čas vety" />
    </div>
  );
}
