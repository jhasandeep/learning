// Sample database loaded into the SQL editor (and restored by "Reset database").
export const SAMPLE_DB = `
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  age         INTEGER,
  country     TEXT
);
INSERT INTO customers VALUES
  (1, 'Asha',   'Verma',  31, 'India'),
  (2, 'Ben',    'Carter', 25, 'USA'),
  (3, 'Chen',   'Li',     22, 'China'),
  (4, 'Dina',   'Haddad', 28, 'UAE'),
  (5, 'Eva',    'Novak',  35, 'UK');

CREATE TABLE orders (
  order_id    INTEGER PRIMARY KEY,
  item        TEXT NOT NULL,
  amount      INTEGER NOT NULL,
  customer_id INTEGER REFERENCES customers(customer_id)
);
INSERT INTO orders VALUES
  (1, 'Keyboard', 400, 4),
  (2, 'Mouse',    300, 4),
  (3, 'Monitor', 12000, 3),
  (4, 'Keyboard', 400, 1),
  (5, 'Mousepad', 250, 2),
  (6, 'Laptop',  55000, 1);

CREATE TABLE shippings (
  shipping_id INTEGER PRIMARY KEY,
  status      TEXT NOT NULL,
  customer    INTEGER REFERENCES customers(customer_id)
);
INSERT INTO shippings VALUES
  (1, 'Pending',   2),
  (2, 'Pending',   4),
  (3, 'Delivered', 3),
  (4, 'Pending',   5),
  (5, 'Delivered', 1);
`
