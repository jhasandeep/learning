import type { SpotSet } from './types'

export const sql: SpotSet = {
  id: 'sql',
  bugs: [
    {
      id: 'null-equals',
      title: 'No customers without email?',
      task: 'There are customers with no email on file, yet this returns no rows.',
      lang: 'sql',
      code: `SELECT id, name
FROM customers
WHERE email = NULL;`,
      line: 3,
      fix: 'WHERE email IS NULL;',
      explain: 'Comparing with NULL gives ==unknown==, never true. Use `IS NULL` / `IS NOT NULL`.',
      difficulty: 'Easy',
    },
    {
      id: 'where-aggregate',
      title: 'Aggregate in WHERE',
      task: 'List customers with more than 5 orders. The database rejects the query.',
      lang: 'sql',
      code: `SELECT customer_id, COUNT(*) AS orders
FROM orders
WHERE COUNT(*) > 5
GROUP BY customer_id;`,
      line: 3,
      fixed: `SELECT customer_id, COUNT(*) AS orders
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 5;`,
      explain: '`WHERE` filters rows before grouping, when counts do not exist yet. Filter groups with ==`HAVING`==.',
      difficulty: 'Easy',
    },
    {
      id: 'left-join-where',
      title: 'Where did the quiet customers go?',
      task: 'Show every customer with their 2024 orders, including customers with none. Customers without orders are missing.',
      lang: 'sql',
      code: `SELECT c.name, o.id AS order_id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.created_at >= '2024-01-01';`,
      line: 4,
      fixed: `SELECT c.name, o.id AS order_id
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id
 AND o.created_at >= '2024-01-01';`,
      explain: 'For customers without orders, `o.created_at` is NULL, so the `WHERE` drops them and the LEFT JOIN acts like an INNER JOIN. Put conditions on the right table ==in the `ON` clause==.',
      difficulty: 'Medium',
    },
    {
      id: 'group-by-missing',
      title: 'Not in GROUP BY',
      task: 'Total sales per city. Postgres says "column customers.city must appear in the GROUP BY clause".',
      lang: 'sql',
      code: `SELECT c.city, SUM(o.amount) AS total
FROM orders o
JOIN customers c ON c.id = o.customer_id
GROUP BY o.customer_id;`,
      line: 4,
      fix: 'GROUP BY c.city;',
      explain: 'Every selected column must be ==grouped or aggregated==. Group by what you are reporting on: the city.',
      difficulty: 'Medium',
    },
    {
      id: 'update-no-where',
      title: 'Everyone is an admin now',
      task: 'Promote user 42 to admin. After running it, every user is an admin.',
      lang: 'sql',
      code: `UPDATE users
SET role = 'admin';
WHERE id = 42;`,
      line: 2,
      fix: "SET role = 'admin'",
      explain: 'The stray semicolon ends the UPDATE ==without a WHERE==, so it changes every row, and `WHERE id = 42;` then fails on its own as a syntax error. Run risky updates inside a transaction and check the affected row count before committing.',
      difficulty: 'Medium',
    },
    {
      id: 'count-column',
      title: 'Undercounted signups',
      task: 'Count all signups. The number is lower than the row count because some rows have no referral code.',
      lang: 'sql',
      code: `SELECT COUNT(referral_code) AS signups
FROM signups
WHERE created_at >= '2024-01-01';`,
      line: 1,
      fix: 'SELECT COUNT(*) AS signups',
      explain: '`COUNT(column)` skips NULLs. ==`COUNT(*)`== counts rows.',
      difficulty: 'Easy',
    },
  ],
}
