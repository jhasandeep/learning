import type { TaskPath } from './types'

// Tasks run on the playground database `shop` (customers, products, orders).

export const mongodb: TaskPath = {
  id: 'mongodb',
  title: 'MongoDB',
  blurb: 'Query, update and aggregate documents in the shop database.',
  tasks: [
    {
      id: 'find-filter',
      kind: 'mongo',
      language: 'mongodb',
      title: 'Filter documents',
      goal: 'Find the customers from India who are older than 30.',
      steps: ['Query the `customers` collection with `find`.', 'Match `country: "India"`.', 'Add `age: { $gt: 30 }` to the same filter.'],
      starter: `// Write your query below
db.customers.find({})`,
      hints: ['A filter is an object: `{ field: value }`.', 'Operators start with `$`, for example `$gt` means greater than.', 'Put both conditions in one object: `{ country: "India", age: { $gt: 30 } }`.'],
      solution: 'db.customers.find({ country: "India", age: { $gt: 30 } })',
      learned: 'A MongoDB filter is a JSON object; several fields in it are combined with AND, and `$gt`, `$lt` and friends compare values.',
    },
    {
      id: 'projection-sort',
      kind: 'mongo',
      language: 'mongodb',
      title: 'Top 3 products by price',
      goal: 'Return only the name and price of the 3 most expensive products, highest first.',
      steps: ['Use `find({})` with a projection `{ _id: 0, name: 1, price: 1 }`.', 'Sort with `.sort({ price: -1 })`.', 'Keep three with `.limit(3)`.'],
      starter: `// Write your query below
db.products.find({})`,
      hints: ['The second argument of `find` chooses which fields to return.', '`1` includes a field, `0` hides it; `-1` in sort means descending.', '`db.products.find({}, { _id: 0, name: 1, price: 1 }).sort({ price: -1 }).limit(3)`'],
      solution: 'db.products.find({}, { _id: 0, name: 1, price: 1 }).sort({ price: -1 }).limit(3)',
      ordered: true,
      learned: 'Projection trims the fields you get back, and `sort` + `limit` give you "top N" queries.',
    },
    {
      id: 'update-tier',
      kind: 'mongo',
      language: 'mongodb',
      title: 'Update one document',
      goal: 'Upgrade Eva Novak to the `gold` tier without touching her other fields.',
      steps: ['Use `updateOne` with the filter `{ name: "Eva Novak" }`.', 'Change only the field with `{ $set: { tier: "gold" } }`.', 'The checker reads the gold customers afterwards.'],
      starter: `// Write your update below
db.customers.find({ name: "Eva Novak" })`,
      hints: ['`updateOne(filter, update)` changes the first matching document.', 'Without an operator like `$set`, MongoDB would replace the whole document.', '`db.customers.updateOne({ name: "Eva Novak" }, { $set: { tier: "gold" } })`'],
      solution: 'db.customers.updateOne({ name: "Eva Novak" }, { $set: { tier: "gold" } })',
      verify: 'db.customers.find({ tier: "gold" }).sort({ _id: 1 })',
      ordered: true,
      learned: '`$set` changes just the fields you name; other update operators like `$inc` and `$push` do other targeted changes.',
    },
    {
      id: 'aggregate-spend',
      kind: 'mongo',
      language: 'mongodb',
      title: 'Total spent per customer',
      goal: 'Sum the `total` of paid orders for each customer and list the biggest spender first.',
      steps: ['Start an `aggregate` pipeline with `$match: { status: "paid" }`.', 'Add `$group` with `_id: "$customerId"` and `spent: { $sum: "$total" }`.', 'Finish with `$sort: { spent: -1 }`.'],
      starter: `// Write your pipeline below
db.orders.find({ status: "paid" })`,
      hints: ['A pipeline is an array: each stage feeds the next one.', '`$match` first keeps later stages small and fast.', '`db.orders.aggregate([{ $match: … }, { $group: … }, { $sort: … }])`'],
      solution: 'db.orders.aggregate([{ $match: { status: "paid" } }, { $group: { _id: "$customerId", spent: { $sum: "$total" } } }, { $sort: { spent: -1 } }])',
      ordered: true,
      learned: 'Aggregation pipelines transform data stage by stage; `$match` filters, `$group` summarises and `$sort` orders the result.',
    },
    {
      id: 'insert-product',
      kind: 'mongo',
      language: 'mongodb',
      title: 'Insert a new document',
      goal: 'Add a product named `Webcam` in the `electronics` category with price 1500 and stock 25.',
      steps: ['Use `insertOne` on `db.products`.', 'Give it `_id: 7`, `name`, `category`, `price` and `stock`.', 'The checker lists all electronics afterwards.'],
      starter: `// Write your insert below
db.products.find({})`,
      hints: ['`insertOne` takes one document: a plain object.', 'Documents in a collection need no fixed columns.', '`db.products.insertOne({ _id: 7, name: "Webcam", category: "electronics", price: 1500, stock: 25 })`'],
      solution: 'db.products.insertOne({ _id: 7, name: "Webcam", category: "electronics", price: 1500, stock: 25 })',
      verify: 'db.products.find({ category: "electronics" }).sort({ _id: 1 })',
      ordered: true,
      learned: 'Inserting a document is just handing MongoDB an object: the collection is created or extended automatically.',
    },
  ],
}
