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
  // Fresh namespace per run so no variable (e.g. `result`) leaks between exercises.
  const ns = pyodide.toPy({});
  try {
    const stdout = await pyodide.runPythonAsync(program, { globals: ns });
    return shapeResult(stdout ?? '', null);
  } catch (error) {
    // Recover any stdout printed before the error, if available.
    let stdout = '';
    try {
      const buf = ns.get('_buf');
      if (buf) { stdout = buf.getvalue() ?? ''; buf.destroy?.(); }
    } catch { /* ignore */ }
    return shapeResult(stdout, error);
  } finally {
    ns.destroy?.();
  }
}

function _indent(code) {
  return String(code).split('\n').map((l) => '    ' + l);
}

function _indentBy(code, spaces) {
  const pad = ' '.repeat(spaces);
  return String(code).split('\n').map((l) => pad + l);
}

// Pick the most informative line from a thrown PythonError (keeps line numbers).
function _firstError(error) {
  const msg = String(error?.message || error);
  return msg.split('\n').reverse().find((l) => /Error|Exception/.test(l)) || msg.trim();
}

// Richer graded run → { passed, stdout, error, value }.
//  - value: repr() of the user's `result` if they set one, else null
//  - error: 'assert' when the check's assertion failed; otherwise "ExcType: message"
//    from an exception in the user's code or the check. null on pass.
export async function runGraded(pyodide, userCode, checkCode) {
  const program = [
    'import sys, io, json',
    '_buf = io.StringIO(); _old = sys.stdout; sys.stdout = _buf',
    '_st = {"passed": False, "error": None, "value": None, "stdout": ""}',
    'try:',
    '    try:',
    ..._indentBy(userCode, 8),
    '    except Exception as _e:',
    '        _st["error"] = type(_e).__name__ + ": " + str(_e)',
    '        raise',
    '    try:',
    '        _st["value"] = repr(result)',
    '    except Exception:',
    '        _st["value"] = None',
    '    try:',
    ..._indentBy(checkCode, 8),
    '        _st["passed"] = True',
    '    except AssertionError:',
    '        _st["error"] = "assert"',
    '    except Exception as _e:',
    '        _st["error"] = type(_e).__name__ + ": " + str(_e)',
    'except Exception:',
    '    pass',
    'finally:',
    '    sys.stdout = _old',
    '_st["stdout"] = _buf.getvalue()',
    'json.dumps(_st)',
  ].join('\n');
  const ns = pyodide.toPy({});
  try {
    return JSON.parse(await pyodide.runPythonAsync(program, { globals: ns }));
  } catch (error) {
    return { passed: false, error: _firstError(error), value: null, stdout: '' };
  } finally {
    ns.destroy?.();
  }
}

// No-grade run → { stdout, value, error }. Execute and show output; never grades.
export async function runScratch(pyodide, userCode) {
  const program = [
    'import sys, io, json',
    '_buf = io.StringIO(); _old = sys.stdout; sys.stdout = _buf',
    '_st = {"error": None, "value": None, "stdout": ""}',
    'try:',
    ..._indentBy(userCode, 4),
    '    try:',
    '        _st["value"] = repr(result)',
    '    except Exception:',
    '        _st["value"] = None',
    'except Exception as _e:',
    '    _st["error"] = type(_e).__name__ + ": " + str(_e)',
    'finally:',
    '    sys.stdout = _old',
    '_st["stdout"] = _buf.getvalue()',
    'json.dumps(_st)',
  ].join('\n');
  const ns = pyodide.toPy({});
  try {
    return JSON.parse(await pyodide.runPythonAsync(program, { globals: ns }));
  } catch (error) {
    return { error: _firstError(error), value: null, stdout: '' };
  } finally {
    ns.destroy?.();
  }
}

// Run the model solution to derive the expected `result` value (repr), or null.
export async function runExpected(pyodide, solutionCode) {
  const program = [
    'import sys, io, json',
    '_buf = io.StringIO(); _old = sys.stdout; sys.stdout = _buf',
    '_val = None',
    'try:',
    ..._indentBy(solutionCode, 4),
    '    try:',
    '        _val = repr(result)',
    '    except Exception:',
    '        _val = None',
    'except Exception:',
    '    _val = None',
    'finally:',
    '    sys.stdout = _old',
    'json.dumps({"value": _val})',
  ].join('\n');
  const ns = pyodide.toPy({});
  try {
    return JSON.parse(await pyodide.runPythonAsync(program, { globals: ns })).value;
  } catch {
    return null;
  } finally {
    ns.destroy?.();
  }
}
