import type { LearnTrack } from './types'

const DB = `CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT, email TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), amount REAL NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL);
INSERT INTO customers VALUES
  (1, 'Ada', 'London', 'ada@example.com'),
  (2, 'Linus', 'Helsinki', NULL),
  (3, 'Grace', 'New York', 'grace@example.com'),
  (4, 'Alan', 'London', 'alan@example.com'),
  (5, 'Margaret', 'Boston', NULL);
INSERT INTO orders VALUES
  (1, 1, 120.0, 'paid', '2026-01-05'),
  (2, 1, 35.5, 'paid', '2026-02-11'),
  (3, 2, 80.0, 'refunded', '2026-02-20'),
  (4, 3, 300.0, 'paid', '2026-03-01'),
  (5, 3, 45.0, 'pending', '2026-03-15'),
  (6, 4, 60.0, 'paid', '2026-03-20'),
  (7, 3, 150.0, 'paid', '2026-04-02');`

const SCHEMA = 'Tables: `customers(id, name, city, email)` and `orders(id, customer_id, amount, status, created_at)`.'

const same = (sql: string): [string, string] => ['returns the right rows', `expect(result.rows).toEqual(reference(${JSON.stringify(sql)}).rows)`]
const columns = (cols: string[]): [string, string] => [`returns the columns ${cols.join(', ')}`, `expect(result.columns).toEqual(${JSON.stringify(cols)})`]

export const sql: LearnTrack = {
  id: 'sql',
  intro: 'Query a real SQLite database: filtering, sorting, aggregates, grouping, joins, NULLs, changing data and subqueries.',
  kind: 'sql',
  lang: 'sql',
  steps: [
    {
      id: 'select-where',
      title: 'SELECT and WHERE',
      learn: `\`SELECT\` picks columns, \`FROM\` the table and \`WHERE\` filters rows:

\`\`\`
SELECT name, city FROM customers WHERE city = 'London';
\`\`\`

Text values go in single quotes. List the columns you need rather than \`SELECT *\`.

${SCHEMA}`,
      task: 'Select the `name` and `email` of customers in London.',
      starter: `SELECT * FROM customers;
`,
      solution: `SELECT name, email FROM customers WHERE city = 'London';
`,
      tests: [columns(['name', 'email']), same("SELECT name, email FROM customers WHERE city = 'London'")],
      hints: ['Name the two columns after `SELECT`.', "Filter with `WHERE city = 'London'`."],
      setup: DB,
    },
    {
      id: 'order-limit',
      title: 'ORDER BY and LIMIT',
      learn: `\`ORDER BY column DESC\` sorts largest first (\`ASC\` is the default). \`LIMIT n\` keeps the first n rows: together they answer "top N" questions.

${SCHEMA}`,
      task: 'Return the `id` and `amount` of the 3 largest orders, largest first.',
      starter: `SELECT id, amount FROM orders;
`,
      solution: `SELECT id, amount FROM orders ORDER BY amount DESC LIMIT 3;
`,
      tests: [columns(['id', 'amount']), same('SELECT id, amount FROM orders ORDER BY amount DESC LIMIT 3')],
      hints: ['`ORDER BY amount DESC` sorts largest first.', 'Then `LIMIT 3`.'],
      setup: DB,
    },
    {
      id: 'aggregates',
      title: 'Aggregates',
      learn: `Aggregate functions turn many rows into one value: \`COUNT(*)\`, \`SUM(x)\`, \`AVG(x)\`, \`MIN\`, \`MAX\`. Name the result with \`AS\`:

\`\`\`
SELECT COUNT(*) AS n FROM orders WHERE status = 'paid';
\`\`\`

${SCHEMA}`,
      task: 'For paid orders, return `paid_orders` (how many) and `revenue` (total amount).',
      starter: `SELECT * FROM orders WHERE status = 'paid';
`,
      solution: `SELECT COUNT(*) AS paid_orders, SUM(amount) AS revenue
FROM orders
WHERE status = 'paid';
`,
      tests: [columns(['paid_orders', 'revenue']), same("SELECT COUNT(*), SUM(amount) FROM orders WHERE status = 'paid'")],
      hints: ['`COUNT(*) AS paid_orders, SUM(amount) AS revenue`.', "Keep the `WHERE status = 'paid'`."],
      setup: DB,
    },
    {
      id: 'group-by',
      title: 'GROUP BY and HAVING',
      learn: `\`GROUP BY\` makes one row per group, with aggregates computed per group. \`WHERE\` filters rows **before** grouping; \`HAVING\` filters the groups **after**:

\`\`\`
SELECT city, COUNT(*) AS n FROM customers GROUP BY city HAVING COUNT(*) > 1;
\`\`\`

${SCHEMA}`,
      task: 'For each `customer_id` with more than one **paid** order, return `customer_id` and `total` (sum of their paid amounts), ordered by `total` descending.',
      starter: `SELECT customer_id, amount AS total FROM orders;
`,
      solution: `SELECT customer_id, SUM(amount) AS total
FROM orders
WHERE status = 'paid'
GROUP BY customer_id
HAVING COUNT(*) > 1
ORDER BY total DESC;
`,
      tests: [columns(['customer_id', 'total']), same("SELECT customer_id, SUM(amount) FROM orders WHERE status = 'paid' GROUP BY customer_id HAVING COUNT(*) > 1 ORDER BY 2 DESC")],
      hints: ["`WHERE status = 'paid'` goes before `GROUP BY customer_id`.", '`HAVING COUNT(*) > 1` filters the groups; then `ORDER BY total DESC`.'],
      setup: DB,
    },
    {
      id: 'inner-join',
      title: 'Joining tables',
      learn: `A \`JOIN\` combines rows from two tables where a condition matches, usually a foreign key:

\`\`\`
SELECT c.name, o.amount
FROM orders o
JOIN customers c ON c.id = o.customer_id;
\`\`\`

Short aliases (\`o\`, \`c\`) keep it readable. An inner join drops rows with no match.

${SCHEMA}`,
      task: 'List each paid order as `name` (the customer) and `amount`, ordered by amount descending.',
      starter: `SELECT customer_id, amount FROM orders WHERE status = 'paid';
`,
      solution: `SELECT c.name, o.amount
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'paid'
ORDER BY o.amount DESC;
`,
      tests: [columns(['name', 'amount']), same("SELECT c.name, o.amount FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.status = 'paid' ORDER BY o.amount DESC")],
      hints: ['`JOIN customers c ON c.id = o.customer_id`.', 'Select `c.name, o.amount` and order by `o.amount DESC`.'],
      setup: DB,
    },
    {
      id: 'left-join',
      title: 'LEFT JOIN and NULL',
      learn: `A \`LEFT JOIN\` keeps every row from the left table; where there is no match, the right side's columns are \`NULL\`.

Test for missing values with \`IS NULL\` (never \`= NULL\`, which is never true). \`COALESCE(x, 0)\` swaps a NULL for a default.

${SCHEMA}`,
      task: 'Return every customer\'s `name` and `orders` (their number of orders, 0 if none), ordered by name.',
      starter: `SELECT c.name, COUNT(*) AS orders
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id
ORDER BY c.name;
`,
      solution: `SELECT c.name, COUNT(o.id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id
ORDER BY c.name;
`,
      tests: [columns(['name', 'orders']), same('SELECT c.name, COUNT(o.id) FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY c.name'), ['Margaret (no orders) has 0', 'expect(result.rows.find((r) => r[0] === "Margaret")?.[1]).toBe(0)']],
      hints: ['An inner `JOIN` drops Margaret; use `LEFT JOIN`.', '`COUNT(*)` counts the NULL row as 1; `COUNT(o.id)` skips NULLs.'],
      setup: DB,
    },
    {
      id: 'modify',
      title: 'INSERT, UPDATE and DELETE',
      learn: `Changing data:

\`\`\`
INSERT INTO customers (name, city) VALUES ('Barbara', 'Paris');
UPDATE orders SET status = 'paid' WHERE id = 5;
DELETE FROM orders WHERE status = 'refunded';
\`\`\`

**Always** write the \`WHERE\` of an UPDATE or DELETE first: without it, every row changes.

${SCHEMA}`,
      task: "Mark order 5 as 'paid', give Linus (id 2) the email 'linus@example.com', and delete refunded orders.",
      starter: `UPDATE orders SET status = 'paid';
`,
      solution: `UPDATE orders SET status = 'paid' WHERE id = 5;
UPDATE customers SET email = 'linus@example.com' WHERE id = 2;
DELETE FROM orders WHERE status = 'refunded';
`,
      tests: [
        ['order 5 is paid, the others unchanged', 'expect(query("SELECT id, status FROM orders ORDER BY id").rows).toEqual([[1, "paid"], [2, "paid"], [4, "paid"], [5, "paid"], [6, "paid"], [7, "paid"]])'],
        ['Linus has an email', 'expect(query("SELECT email FROM customers WHERE id = 2").rows).toEqual([["linus@example.com"]])'],
        ['refunded orders are gone', 'expect(query("SELECT COUNT(*) FROM orders WHERE status = \'refunded\'").rows).toEqual([[0]])'],
        ['other customers keep their emails', 'expect(query("SELECT COUNT(*) FROM customers WHERE email = \'linus@example.com\'").rows).toEqual([[1]])'],
      ],
      hints: ['Every UPDATE needs a `WHERE id = …`.', 'Three statements, each ending in `;`.'],
      setup: DB,
    },
    {
      id: 'subqueries',
      title: 'Subqueries and CTEs',
      learn: `A **subquery** is a query inside another. A **CTE** (\`WITH name AS (…)\`) names one, so complex queries read top to bottom:

\`\`\`
WITH totals AS (
  SELECT customer_id, SUM(amount) AS spent FROM orders GROUP BY customer_id
)
SELECT * FROM totals WHERE spent > 100;
\`\`\`

${SCHEMA}`,
      task: 'Using a CTE of paid totals per customer, return the `name` and `spent` of customers whose paid total is above the **average** paid total, highest first.',
      starter: `SELECT name FROM customers;
`,
      solution: `WITH totals AS (
  SELECT customer_id, SUM(amount) AS spent
  FROM orders
  WHERE status = 'paid'
  GROUP BY customer_id
)
SELECT c.name, t.spent
FROM totals t
JOIN customers c ON c.id = t.customer_id
WHERE t.spent > (SELECT AVG(spent) FROM totals)
ORDER BY t.spent DESC;
`,
      tests: [
        columns(['name', 'spent']),
        same("WITH t AS (SELECT customer_id, SUM(amount) AS s FROM orders WHERE status = 'paid' GROUP BY customer_id) SELECT c.name, t.s FROM t JOIN customers c ON c.id = t.customer_id WHERE t.s > (SELECT AVG(s) FROM t) ORDER BY t.s DESC"),
        ['uses a WITH clause', 'expect(code).toMatch(/\\bWITH\\b/i)'],
      ],
      hints: ['`WITH totals AS (SELECT customer_id, SUM(amount) AS spent … GROUP BY customer_id)`.', 'Compare with `(SELECT AVG(spent) FROM totals)` in the WHERE.'],
      setup: DB,
    },
  ],
}
