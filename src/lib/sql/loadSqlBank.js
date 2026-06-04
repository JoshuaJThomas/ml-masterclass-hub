export async function loadSqlBank(base, fetchFn = fetch) {
  const res = await fetchFn(`${base}bank/sql.json`);
  if (!res.ok) throw new Error(`Failed to load SQL bank (status ${res.status})`);
  return res.json();
}
