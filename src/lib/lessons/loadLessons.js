export async function loadLessons(base, fetchFn = fetch) {
  const res = await fetchFn(`${base}bank/lessons.json`);
  if (!res.ok) throw new Error(`Failed to load lessons (status ${res.status})`);
  return res.json();
}
