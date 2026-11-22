import type { MistakeSet } from './types'

const DB = `CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT, email TEXT);
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount REAL NOT NULL, status TEXT NOT NULL);
INSERT INTO customers VALUES (1, 'Ada', 'London', 'ada@example.com'), (2, 'Linus', 'Helsinki', NULL), (3, 'Grace', 'New York', 'grace@example.com'), (4, 'Alan', 'London', NULL);
INSERT INTO orders VALUES (1, 1, 120.0, 'paid'), (2, 1, 35.5, 'paid'), (3, 2, 80.0, 'refunded'), (4, 3, 300.0, 'paid'), (5, 3, 45.0, 'pending');`

const same = (sql: string): [string, string] => ['returns the right rows', `expect(result.rows).toEqual(reference(${JSON.stringify(sql)}).rows)`]

export const sql: MistakeSet = {
  id: 'sql',
  title: 'SQL',
  kind: 'sql',
  lang: 'sql',
  items: [
    {
      id: 'unquoted-text',
      title: 'Text without quotes',
      difficulty: 'Easy',
      task: 'Names of customers who live in London. Tables: `customers(id, name, city, email)`, `orders(id, customer_id, amount, status)`.',
      setup: DB,
      broken: `SELECT name FROM customers WHERE city = London;
`,
      solution: `SELECT name FROM customers WHERE city = 'London';
`,
      tests: [same("SELECT name FROM customers WHERE city = 'London'"), ['two rows', 'expect(result.rows.length).toBe(2)']],
      explain: 'Text values go in **single quotes**. Without them `London` is read as a column name, which does not exist, so the database reports an error.',
      hints: ['Read the error message: what does it say cannot be found?', "Write `'London'` with single quotes."],
    },
    {
      id: 'is-null',
      title: 'Comparing with NULL',
      difficulty: 'Medium',
      task: 'Names of customers that have **no email** (the email is NULL).',
      setup: DB,
      broken: `SELECT name FROM customers WHERE email = NULL;
`,
      solution: `SELECT name FROM customers WHERE email IS NULL;
`,
      tests: [same('SELECT name FROM customers WHERE email IS NULL'), ['two customers without an email', 'expect(result.rows.length).toBe(2)']],
      explain: '`NULL` means "unknown", so `email = NULL` is never true (not even for NULL). Test for it with **`IS NULL`** (or `IS NOT NULL`).',
      hints: ['No error, but also no rows. Why?', 'Use `IS NULL` instead of `=`.'],
    },
    {
      id: 'where-vs-having',
      title: 'Filtering an aggregate',
      difficulty: 'Hard',
      task: 'Customers whose paid orders add up to more than 100: columns `customer_id` and `total`, only `status = \'paid\'` orders.',
      setup: DB,
      broken: `SELECT customer_id, SUM(amount) AS total
FROM orders
WHERE status = 'paid' AND SUM(amount) > 100
GROUP BY customer_id;
`,
      solution: `SELECT customer_id, SUM(amount) AS total
FROM orders
WHERE status = 'paid'
GROUP BY customer_id
HAVING SUM(amount) > 100;
`,
      tests: [
        same("SELECT customer_id, SUM(amount) AS total FROM orders WHERE status = 'paid' GROUP BY customer_id HAVING SUM(amount) > 100"),
        ['the columns are customer_id and total', 'expect(result.columns).toEqual(["customer_id", "total"])'],
      ],
      explain: '`WHERE` filters **rows before** they are grouped, so it cannot use an aggregate such as `SUM`. Filtering on a group\'s result belongs in **`HAVING`**, after `GROUP BY`.',
      hints: ['SQL complains about `SUM` in `WHERE`.', 'Move the aggregate condition to `HAVING`, after `GROUP BY`.'],
    },
    {
      id: 'join-on',
      title: 'JOIN without ON',
      difficulty: 'Medium',
      task: 'Each order with its customer\'s name: columns `name` and `amount`, one row per order.',
      setup: DB,
      broken: `SELECT customers.name, orders.amount
FROM customers
JOIN orders;
`,
      solution: `SELECT customers.name, orders.amount
FROM customers
JOIN orders ON orders.customer_id = customers.id;
`,
      tests: [
        ['one row per order (5)', 'expect(result.rows.length).toBe(5)'],
        same('SELECT customers.name, orders.amount FROM customers JOIN orders ON orders.customer_id = customers.id'),
      ],
      explain: 'A join needs a condition that says **which rows belong together**: `ON orders.customer_id = customers.id`. Without it every customer is paired with every order (a cross join: 4 × 5 = 20 rows).',
      hints: ['How many rows came back? More than the number of orders?', 'Add `ON orders.customer_id = customers.id`.'],
    },
    {
      id: 'like-wildcard',
      title: 'LIKE needs a wildcard',
      difficulty: 'Easy',
      task: 'Customers whose name starts with `A`: columns `name`.',
      setup: DB,
      broken: `SELECT name FROM customers WHERE name LIKE 'A';
`,
      solution: `SELECT name FROM customers WHERE name LIKE 'A%';
`,
      tests: [same("SELECT name FROM customers WHERE name LIKE 'A%'"), ['Ada and Alan', 'expect(result.rows.length).toBe(2)']],
      explain: '`LIKE \'A\'` without a wildcard matches only the text exactly `A`. `%` stands for "any characters", so `\'A%\'` means "starts with A" (and `\'%a\'` "ends with a").',
      hints: ['`LIKE` without `%` is the same as `=`.', "Add `%` after the letter: `'A%'`."],
    },
  ],
}
