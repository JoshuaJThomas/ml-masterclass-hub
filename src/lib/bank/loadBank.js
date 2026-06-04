// Loads the question bank. `base` is import.meta.env.BASE_URL (ends with '/').
// `fetchFn` is injectable for testing; defaults to global fetch.
export async function loadBank(base, fetchFn = fetch) {
  async function getJson(name) {
    const res = await fetchFn(`${base}bank/${name}`);
    if (!res.ok) throw new Error(`Failed to load bank file ${name} (status ${res.status})`);
    return res.json();
  }
  const [meta, questions] = await Promise.all([getJson('meta.json'), getJson('questions.json')]);
  return { meta, questions };
}
