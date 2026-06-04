#!/usr/bin/env python3
"""Generate public/bank/sql.json: run each authored solution against the seed DB
(Python's built-in sqlite3) and emit the `expected` block from the real output,
so `expected` is correct by construction."""
import json, sqlite3, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
SEED = (ROOT / "src/lib/sql/seed.sql").read_text()

# Authored exercises (no `expected` — it is generated below).
EX = [
    dict(id="sql01-select-names", tier=1, topic="SELECT", difficulty="easy", ordered=False,
         prompt="List the name of every employee. Return the `name` column.",
         starterQuery="SELECT name FROM employees;",
         hint="SELECT <column> FROM <table>;",
         solution="SELECT name FROM employees;"),
    dict(id="sql02-where-dept", tier=1, topic="WHERE", difficulty="easy", ordered=False,
         prompt="List the names of employees in the Sales department (dept_id = 1). Return `name`.",
         starterQuery="SELECT name FROM employees WHERE ...;",
         hint="Filter with WHERE dept_id = 1.",
         solution="SELECT name FROM employees WHERE dept_id = 1;"),
    dict(id="sql03-salary-filter", tier=1, topic="WHERE", difficulty="easy", ordered=False,
         prompt="List the names of employees earning more than 60000. Return `name`.",
         starterQuery="SELECT name FROM employees WHERE salary ... ;",
         hint="Use a > comparison on salary.",
         solution="SELECT name FROM employees WHERE salary > 60000;"),
    dict(id="sql04-top-paid", tier=1, topic="ORDER BY / LIMIT", difficulty="medium", ordered=True,
         prompt="Return the `name` and `salary` of the 3 highest-paid employees, highest salary first.",
         starterQuery="SELECT name, salary FROM employees ORDER BY ... LIMIT 3;",
         hint="ORDER BY salary DESC then LIMIT 3.",
         solution="SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 3;"),
    dict(id="sql05-count", tier=2, topic="COUNT", difficulty="easy", ordered=False,
         prompt="Count all employees. Return the count aliased as `n`.",
         starterQuery="SELECT COUNT(*) AS n FROM employees;",
         hint="COUNT(*) AS n.",
         solution="SELECT COUNT(*) AS n FROM employees;"),
    dict(id="sql06-avg-salary", tier=2, topic="AVG", difficulty="easy", ordered=False,
         prompt="Return the average employee salary, aliased as `avg_salary`.",
         starterQuery="SELECT AVG(salary) AS avg_salary FROM employees;",
         hint="AVG(salary) AS avg_salary.",
         solution="SELECT AVG(salary) AS avg_salary FROM employees;"),
    dict(id="sql07-group-count", tier=2, topic="GROUP BY", difficulty="medium", ordered=False,
         prompt="For each department, return the `dept_id` and the number of employees aliased as `n`.",
         starterQuery="SELECT dept_id, COUNT(*) AS n FROM employees GROUP BY ...;",
         hint="GROUP BY dept_id with COUNT(*) AS n.",
         solution="SELECT dept_id, COUNT(*) AS n FROM employees GROUP BY dept_id;"),
    dict(id="sql08-having", tier=2, topic="HAVING", difficulty="hard", ordered=False,
         prompt="Return the `dept_id` of departments whose average employee salary exceeds 60000.",
         starterQuery="SELECT dept_id FROM employees GROUP BY dept_id HAVING ...;",
         hint="GROUP BY dept_id then HAVING AVG(salary) > 60000.",
         solution="SELECT dept_id FROM employees GROUP BY dept_id HAVING AVG(salary) > 60000;"),
    dict(id="sql09-join-names", tier=3, topic="JOIN", difficulty="medium", ordered=False,
         prompt="List each employee's name and their department name, aliased as `name` and `dept`.",
         starterQuery="SELECT e.name AS name, d.name AS dept FROM employees e JOIN departments d ON ...;",
         hint="JOIN departments ON e.dept_id = d.id.",
         solution="SELECT e.name AS name, d.name AS dept FROM employees e JOIN departments d ON e.dept_id = d.id;"),
    dict(id="sql10-sales-per-emp", tier=3, topic="JOIN + GROUP BY", difficulty="hard", ordered=False,
         prompt="Return the total sales `amount` per employee name, for employees who have sales. Columns `name` and `total`.",
         starterQuery="SELECT e.name AS name, SUM(s.amount) AS total FROM employees e JOIN sales s ON ... GROUP BY e.id;",
         hint="JOIN sales ON s.emp_id = e.id, GROUP BY e.id, SUM(s.amount) AS total.",
         solution="SELECT e.name AS name, SUM(s.amount) AS total FROM employees e JOIN sales s ON s.emp_id = e.id GROUP BY e.id;"),
    dict(id="sql11-no-sales", tier=3, topic="LEFT JOIN", difficulty="hard", ordered=False,
         prompt="List the `name` of employees who have NO sales.",
         starterQuery="SELECT e.name AS name FROM employees e LEFT JOIN sales s ON ... WHERE s.id IS NULL;",
         hint="LEFT JOIN sales, keep rows where the sales side IS NULL.",
         solution="SELECT e.name AS name FROM employees e LEFT JOIN sales s ON s.emp_id = e.id WHERE s.id IS NULL;"),
    dict(id="sql12-above-avg", tier=4, topic="subquery", difficulty="hard", ordered=False,
         prompt="List the `name` of employees earning more than the company-wide average salary.",
         starterQuery="SELECT name FROM employees WHERE salary > (SELECT ... FROM employees);",
         hint="Compare salary to a scalar subquery returning AVG(salary).",
         solution="SELECT name FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);"),
    dict(id="sql13-richest-dept", tier=4, topic="subquery", difficulty="medium", ordered=False,
         prompt="Return the `name` of the department with the highest budget.",
         starterQuery="SELECT name FROM departments WHERE budget = (SELECT MAX(budget) FROM departments);",
         hint="Match budget to the MAX(budget) scalar subquery.",
         solution="SELECT name FROM departments WHERE budget = (SELECT MAX(budget) FROM departments);"),
    dict(id="sql14-carols-dept", tier=4, topic="subquery", difficulty="hard", ordered=False,
         prompt="List the `name` of employees in the same department as Carol, excluding Carol herself.",
         starterQuery="SELECT name FROM employees WHERE dept_id = (SELECT dept_id FROM employees WHERE name = 'Carol') AND ...;",
         hint="Use a scalar subquery for Carol's dept_id, and exclude name = 'Carol'.",
         solution="SELECT name FROM employees WHERE dept_id = (SELECT dept_id FROM employees WHERE name = 'Carol') AND name <> 'Carol';"),
]

def main():
    db = sqlite3.connect(":memory:")
    db.executescript(SEED)
    out = []
    for e in EX:
        cur = db.execute(e["solution"])
        cols = [d[0] for d in cur.description]
        rows = [list(r) for r in cur.fetchall()]
        q = {k: e[k] for k in ("id", "tier", "topic", "prompt", "starterQuery", "hint", "solution", "difficulty")}
        q["expected"] = {"columns": cols, "rows": rows, "ordered": e["ordered"]}
        out.append(q)
        print(f"  {e['id']}: {len(rows)} rows, cols={cols}")
    (ROOT / "public/bank/sql.json").write_text(json.dumps(out, indent=2))
    print(f"Generated {len(out)} SQL exercises -> public/bank/sql.json")

if __name__ == "__main__":
    main()
