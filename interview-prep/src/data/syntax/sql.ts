import type { SyntaxSet } from './types'

export const sql: SyntaxSet = {
  id: 'sql',
  title: 'SQL',
  snippets: [
    {
      id: 'select-basics',
      title: 'SELECT, WHERE, ORDER BY, LIMIT',
      lang: 'sql',
      code: `SELECT name, salary
FROM emp
WHERE salary >= 70000 AND dept_id IS NOT NULL
ORDER BY salary DESC, name
LIMIT 3 OFFSET 0;`,
      note: 'The building block of every answer. Use `IS NULL` / `IS NOT NULL`, never `= NULL`, and `OFFSET` for **pagination**.',
    },
    {
      id: 'inner-left-join',
      title: 'INNER and LEFT JOIN',
      lang: 'sql',
      code: `-- INNER: only employees that have a department
SELECT e.name, d.name AS dept
FROM emp e
JOIN dept d ON d.id = e.dept_id;

-- LEFT: every department with its headcount (HR has 0)
SELECT d.name, COUNT(e.id) AS headcount
FROM dept d
LEFT JOIN emp e ON e.dept_id = d.id
GROUP BY d.id, d.name;`,
      note: '`INNER JOIN` keeps matches only; **LEFT JOIN** keeps every left row with NULLs. Count `e.id`, not `*`, so empty departments show 0.',
    },
    {
      id: 'group-by-having',
      title: 'GROUP BY with HAVING',
      lang: 'sql',
      code: `SELECT d.name, COUNT(*) AS n, AVG(e.salary) AS avg_salary
FROM emp e
JOIN dept d ON d.id = e.dept_id
GROUP BY d.name
HAVING COUNT(*) > 1
ORDER BY avg_salary DESC;`,
      note: '`WHERE` filters rows before grouping, **HAVING** filters groups after. The classic "departments with more than N employees".',
    },
    {
      id: 'second-highest-salary',
      title: 'Second highest salary',
      lang: 'sql',
      code: `-- subquery: the highest salary below the max
SELECT MAX(salary) AS second_highest
FROM emp
WHERE salary < (SELECT MAX(salary) FROM emp);

-- DENSE_RANK: ties share a rank, works for any N
SELECT name, salary
FROM (
  SELECT name, salary,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM emp
) AS ranked
WHERE rnk = 2;`,
      note: 'The most asked SQL question. `DENSE_RANK` is the general answer for the **Nth highest**: Ben and Chen tie at 120000, so both are second.',
    },
    {
      id: 'earns-more-than-manager',
      title: 'Earns more than manager',
      lang: 'sql',
      code: `SELECT e.name, e.salary, m.name AS manager, m.salary AS mgr_salary
FROM emp e
JOIN emp m ON m.id = e.manager_id
WHERE e.salary > m.salary;`,
      note: 'A **self join**: the same table twice under two aliases, joined on `manager_id`. Returns no rows on the sample data, which is fine.',
    },
    {
      id: 'top-earner-per-dept',
      title: 'Top earner per department',
      lang: 'sql',
      code: `WITH ranked AS (
  SELECT name, dept_id, salary,
    ROW_NUMBER() OVER (
      PARTITION BY dept_id ORDER BY salary DESC
    ) AS rn
  FROM emp
)
SELECT d.name AS dept, r.name, r.salary
FROM ranked r
JOIN dept d ON d.id = r.dept_id
WHERE r.rn = 1;`,
      note: '`PARTITION BY` restarts the numbering per group, and a **CTE** (`WITH`) names the step so you can filter on `rn`. Swap in `RANK` to keep ties.',
    },
    {
      id: 'running-total',
      title: 'Running total with SUM OVER',
      lang: 'sql',
      code: `SELECT name, salary,
  SUM(salary) OVER (
    ORDER BY id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total,
  SUM(salary) OVER (PARTITION BY dept_id) AS dept_total
FROM emp
ORDER BY id;`,
      note: 'A **window function** adds an aggregate to each row without collapsing them like `GROUP BY` does. `ORDER BY` inside `OVER` makes it cumulative.',
    },
    {
      id: 'recursive-cte',
      title: 'Recursive CTE org chart',
      lang: 'sql',
      code: `WITH RECURSIVE org(id, name, depth, path) AS (
  SELECT id, name, 0, name
  FROM emp
  WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, o.depth + 1, o.path || ' > ' || e.name
  FROM emp e
  JOIN org o ON e.manager_id = o.id
)
SELECT depth, path FROM org ORDER BY path;`,
      note: 'An **anchor** query (the CEO) `UNION ALL` a recursive step that joins back to the CTE. Asked for org charts, manager chains and category trees.',
    },
    {
      id: 'case-expression',
      title: 'CASE expression',
      lang: 'sql',
      code: `SELECT name, salary,
  CASE
    WHEN salary >= 120000 THEN 'senior'
    WHEN salary >= 80000 THEN 'mid'
    ELSE 'junior'
  END AS band
FROM emp;

-- conditional aggregation: counts as columns
SELECT
  SUM(CASE WHEN salary >= 100000 THEN 1 ELSE 0 END) AS high,
  SUM(CASE WHEN salary < 100000 THEN 1 ELSE 0 END) AS low
FROM emp;`,
      note: '`CASE` is SQL\'s if/else. Inside `SUM` it gives **conditional aggregation**, the usual way to pivot rows into columns.',
    },
    {
      id: 'find-duplicates',
      title: 'Find and delete duplicates',
      lang: 'sql',
      code: `CREATE TEMP TABLE users (id INTEGER PRIMARY KEY, email TEXT);
INSERT INTO users (email) VALUES
  ('a@x.io'), ('b@x.io'), ('a@x.io'), ('c@x.io'), ('b@x.io');

SELECT email, COUNT(*) AS n
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- keep the lowest id of each email
DELETE FROM users
WHERE id NOT IN (SELECT MIN(id) FROM users GROUP BY email);`,
      note: '`GROUP BY` the column and keep groups with `COUNT(*) > 1`. The follow-up is ==delete the duplicates but keep one==, here the lowest id.',
    },
    {
      id: 'transaction',
      title: 'UPDATE and DELETE in a transaction',
      lang: 'sql',
      code: `BEGIN TRANSACTION;

UPDATE emp
SET salary = ROUND(salary * 1.10)
WHERE dept_id = (SELECT id FROM dept WHERE name = 'Sales');

DELETE FROM emp
WHERE dept_id IS NULL;

COMMIT;`,
      note: 'Both statements succeed or neither does (**atomicity**); on error you `ROLLBACK`. Always write the `WHERE` first: without it every row changes.',
    },
    {
      id: 'create-index',
      title: 'CREATE INDEX',
      lang: 'sql',
      code: `CREATE INDEX idx_emp_dept_salary ON emp (dept_id, salary);
CREATE UNIQUE INDEX idx_dept_name ON dept (name);

EXPLAIN QUERY PLAN
SELECT name FROM emp WHERE dept_id = 1 ORDER BY salary DESC;`,
      note: 'A **composite index** serves filters on its leftmost columns, here `dept_id` and then the sort on `salary`. `EXPLAIN` shows whether it is used.',
    },
  ],
}
