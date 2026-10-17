const COLUMNS = [
  "participant_id",
  "session_id",
  "device",
  "keyboard",
  "rep",
  "seq",
  "event",
  "code",
  "key",
  "t_ms",
];

const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function toCsv(rows) {
  return [
    COLUMNS.join(","),
    ...rows.map((row) => COLUMNS.map((c) => escapeCell(row[c])).join(",")),
  ].join("\n");
}

export function downloadCsv(rows, participantId) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv" }));
  link.download = `keystrokes_${participantId}_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
