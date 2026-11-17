import type { TaskPath } from './types'

// Every task runs on the compiler's sample database:
//   customers(customer_id, first_name, last_name, age, country)
//   orders(order_id, item, amount, customer_id)
//   shippings(shipping_id, status, customer)

export const sql: TaskPath = {
  id: 'sql',
  title: 'SQL',
  blurb: 'Answer real questions about a shop database: filter, join, group and update.',
  tasks: [
    {
      id: 'filter-sort',
      kind: 'sql',
      language: 'sql',
      title: 'Find and sort customers',
      goal: 'List the first name and age of customers older than 25, oldest first.',
      steps: [
        'SELECT only `first_name` and `age` from `customers`.',
        'Keep customers with `age > 25` using WHERE.',
        'Sort with `ORDER BY age DESC`.',
      ],
      starter: `-- Write your query below
SELECT * FROM customers;`,
      hints: ['Choose columns after SELECT instead of `*`.', 'WHERE goes after FROM, ORDER BY goes last.', '`SELECT first_name, age FROM customers WHERE age > 25 ORDER BY age DESC;`'],
      solution: `SELECT first_name, age
FROM customers
WHERE age > 25
ORDER BY age DESC;`,
      expect: { columns: ['first_name', 'age'], rows: [['Eva', 35], ['Asha', 31], ['Dina', 28]], ordered: true },
      learned: 'SELECT picks columns, WHERE filters rows, ORDER BY sorts: the database applies them in that logical order.',
    },
    {
      id: 'join-orders',
      kind: 'sql',
      language: 'sql',
      title: 'Join orders to customers',
      goal: 'Show who bought what: the customer first name next to each order item.',
      steps: [
        'Start from `orders` and `JOIN customers` on the customer id.',
        'The join condition is `orders.customer_id = customers.customer_id`.',
        'Return only `first_name` and `item`.',
      ],
      starter: `-- Write your query below
SELECT item FROM orders;`,
      hints: ['`JOIN` combines rows from two tables that match a condition.', 'Use `ON orders.customer_id = customers.customer_id`.', 'You can write `FROM orders o JOIN customers c ON …` to shorten names.'],
      solution: `SELECT c.first_name, o.item
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;`,
      expect: {
        columns: ['first_name', 'item'],
        rows: [['Dina', 'Keyboard'], ['Dina', 'Mouse'], ['Chen', 'Monitor'], ['Asha', 'Keyboard'], ['Ben', 'Mousepad'], ['Asha', 'Laptop']],
      },
      learned: 'A JOIN links tables through matching keys (a foreign key points to a primary key), so related data can live in separate tables.',
    },
    {
      id: 'group-spend',
      kind: 'sql',
      language: 'sql',
      title: 'Total spend per customer',
      goal: 'Find customers who spent more than 500 in total, biggest spender first.',
      steps: [
        'Join `orders` with `customers` and `GROUP BY` the customer.',
        'Return `first_name` and `SUM(amount) AS total`.',
        'Keep only groups with `HAVING SUM(amount) > 500`, sorted by total descending.',
      ],
      starter: `-- Write your query below
SELECT first_name FROM customers;`,
      hints: ['GROUP BY creates one row per customer; SUM adds up their amounts.', 'WHERE filters rows before grouping; HAVING filters groups after.', 'Alias the sum with `AS total` and sort `ORDER BY total DESC`.'],
      solution: `SELECT c.first_name, SUM(o.amount) AS total
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.customer_id
HAVING SUM(o.amount) > 500
ORDER BY total DESC;`,
      expect: { columns: ['first_name', 'total'], rows: [['Asha', 55400], ['Chen', 12000], ['Dina', 700]], ordered: true },
      learned: 'GROUP BY collapses rows into groups and aggregate functions summarise each group; HAVING is the WHERE for groups.',
    },
    {
      id: 'left-join',
      kind: 'sql',
      language: 'sql',
      title: 'Find customers with no orders',
      goal: 'List the first names of customers who never placed an order.',
      steps: [
        'Start from `customers` and `LEFT JOIN orders` on the customer id.',
        'Customers with no order get NULL in the order columns.',
        'Keep rows where `orders.order_id IS NULL`.',
      ],
      starter: `-- Write your query below
SELECT first_name FROM customers;`,
      hints: ['A LEFT JOIN keeps every row from the left table, even without a match.', 'Test for missing data with `IS NULL`, never `= NULL`.', '`WHERE o.order_id IS NULL` finds the unmatched customers.'],
      solution: `SELECT c.first_name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;`,
      expect: { columns: ['first_name'], rows: [['Eva']] },
      learned: 'LEFT JOIN plus `IS NULL` is the standard way to find "things that have no match", like customers without orders.',
    },
    {
      id: 'update-shipping',
      kind: 'sql',
      language: 'sql',
      title: 'Update rows safely',
      goal: 'Mark every shipping for customer 4 as `Delivered`.',
      steps: [
        'Write an `UPDATE shippings SET status = \'Delivered\'`.',
        'Add a WHERE so only `customer = 4` changes.',
        'The checker then reads the table to see if only the right row changed.',
      ],
      starter: `-- Write your UPDATE below
SELECT * FROM shippings;`,
      hints: ['UPDATE table SET column = value WHERE condition;', 'Without WHERE every row would change. Be careful.', "`UPDATE shippings SET status = 'Delivered' WHERE customer = 4;`"],
      solution: `UPDATE shippings
SET status = 'Delivered'
WHERE customer = 4;`,
      after: 'SELECT shipping_id, status FROM shippings ORDER BY shipping_id;',
      expect: { columns: ['shipping_id', 'status'], rows: [[1, 'Pending'], [2, 'Delivered'], [3, 'Delivered'], [4, 'Pending'], [5, 'Delivered']], ordered: true },
      learned: 'UPDATE and DELETE always need a WHERE clause: without one they change every row in the table.',
    },
  ],
}
