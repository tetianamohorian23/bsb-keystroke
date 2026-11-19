function postJson(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function identifyAttempt(rows, mode) {
  const response = await postJson("/api/identify", { rows, mode });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail || "Nepodarilo sa rozpoznať pokus");
  }
  return result;
}

// Vráti { ok, result }; `result` je null, ak server odpovedal chybou.
export async function saveSession(meta, rows) {
  const response = await postJson("/api/sessions", { meta, rows });
  return { ok: response.ok, result: response.ok ? await response.json() : null };
}

export async function fetchComparison() {
  const response = await fetch("/api/compare");
  if (!response.ok) throw new Error("Nepodarilo sa načítať porovnanie");
  return response.json();
}
