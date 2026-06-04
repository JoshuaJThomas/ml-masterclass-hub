const PYODIDE_VERSION = 'v0.27.7';
const CDN = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

let pyodidePromise = null;

// Lazily load Pyodide once, with the scientific packages our exercises use.
export function getPyodide(onStatus = () => {}) {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    onStatus('Loading Python…');
    if (!window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = `${CDN}pyodide.js`;
        s.onload = resolve;
        s.onerror = () => reject(new Error('Failed to load Pyodide script'));
        document.head.appendChild(s);
      });
    }
    const pyodide = await window.loadPyodide({ indexURL: CDN });
    onStatus('Loading numpy, pandas, matplotlib…');
    await pyodide.loadPackage(['numpy', 'pandas', 'matplotlib']);
    onStatus('');
    return pyodide;
  })();
  return pyodidePromise;
}

// Pure: turn (stdout, error|null) into a result object. Tested in isolation.
export function shapeResult(stdout, error) {
  if (!error) return { passed: true, stdout, error: null };
  const msg = String(error.message || error);
  // Show the most informative line (the AssertionError / exception line) if present.
  const line = msg.split('\n').reverse().find((l) => /Error|Exception/.test(l)) || msg.trim();
  return { passed: false, stdout, error: line };
}

// Run the user's code then the check, in a FRESH namespace each time.
// stdout is captured; any exception (including failed assertions) => failure.
export async function runCode(pyodide, userCode, checkCode) {
  const program = [
    'import sys, io',
    '_buf = io.StringIO()',
    '_old = sys.stdout',
    'sys.stdout = _buf',
    'try:',
    ..._indent(userCode),
    ..._indent(checkCode),
    'finally:',
    '    sys.stdout = _old',
    '_buf.getvalue()',
  ].join('\n');
  try {
    const stdout = await pyodide.runPythonAsync(program);
    return shapeResult(stdout ?? '', null);
  } catch (error) {
    // Recover any stdout printed before the error, if available.
    let stdout = '';
    try { stdout = pyodide.globals.get('_buf')?.getvalue() ?? ''; } catch { /* ignore */ }
    return shapeResult(stdout, error);
  }
}

function _indent(code) {
  return String(code).split('\n').map((l) => '    ' + l);
}
