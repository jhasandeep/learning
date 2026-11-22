// Guided MongoDB lessons for the compiler's "Learn" tab. Every lesson has an
// example you can load and run, and a challenge that is checked by running your
// code and a reference solution on identical fresh databases (see
// checkChallenge in src/lib/run/mongo-engine.ts), so the lessons never go stale.

export interface MongoChallenge {
  task: string
  starter: string
  hint: string
  solution: string
  /** Query run after the code, to compare the resulting data (for writes). */
  verify?: string
  /** Whether the order of the returned documents matters. */
  ordered?: boolean
}

export interface MongoLesson {
  id: string
  title: string
  summary: string
  /** Paragraphs; `backticks` mark inline code. */
  body: string[]
  example: { title: string; code: string }
  challenge: MongoChallenge
}

export const MONGO_LESSONS: MongoLesson[] = [
  {
    id: 'documents',
    title: 'Documents and collections',
    summary: 'How MongoDB stores data, and your first queries.',
    body: [
      'MongoDB stores **documents**: JSON-like objects with fields and values. Documents live in **collections** (like tables, but with no fixed columns), and collections live in a **database**.',
      'Every document has a unique `_id`. If you do not give one, MongoDB creates an `ObjectId` for you. The playground database `shop` has three collections: `customers`, `products` and `orders`.',
      '`find()` returns every document that matches a filter (all of them when the filter is empty). `findOne()` returns just the first match, or `null`.',
    ],
    example: {
      title: 'Look around the shop database',
      code: `show collections

db.customers.find()

db.customers.findOne({ name: "Asha Verma" })

db.products.countDocuments()
`,
    },
    challenge: {
      task: 'Use `findOne` to get the customer named "Dina Haddad".',
      starter: '// db.customers.findOne(...)\n',
      hint: 'The filter is an object: { name: "Dina Haddad" }.',
      solution: 'db.customers.findOne({ name: "Dina Haddad" })',
    },
  },
  {
    id: 'filter',
    title: 'Filtering with operators',
    summary: 'Comparison and logical operators: $gt, $in, $or and friends.',
    body: [
      'A filter like `{ country: "India" }` means equals. For other comparisons use operators, which start with `$`: `$gt`, `$gte`, `$lt`, `$lte`, `$ne`, `$in` and `$nin`.',
      'Several conditions in one filter are combined with AND. For OR (or NOT) use the logical operators `$or`, `$and`, `$nor` and `$not`, which take an array of filters.',
    ],
    example: {
      title: 'Comparison and logic',
      code: `// price greater than 300
db.products.find({ price: { $gt: 300 } })

// one of several values
db.customers.find({ country: { $in: ["India", "UAE"] } })

// OR: Indian customers or gold-tier customers
db.customers.find({ $or: [{ country: "India" }, { tier: "gold" }] })
`,
    },
    challenge: {
      task: 'Find the products in the "electronics" category that cost less than 1000.',
      starter: '// combine a category filter with a $lt price filter\ndb.products.find({})\n',
      hint: 'Put both conditions in one object: { category: "electronics", price: { $lt: 1000 } }.',
      solution: 'db.products.find({ category: "electronics", price: { $lt: 1000 } })',
    },
  },
  {
    id: 'shape',
    title: 'Projection, sort, skip and limit',
    summary: 'Choose the fields you get back and the order and number of results.',
    body: [
      'The second argument of `find()` is a **projection**: `1` includes a field, `0` excludes it. `_id` is included unless you exclude it. Do not mix 1 and 0 (except for `_id`).',
      'Chain `.sort({ field: 1 })` (ascending) or `-1` (descending), `.skip(n)` and `.limit(n)` to page through results. MongoDB applies the sort first, then skip, then limit.',
    ],
    example: {
      title: 'Names only, cheapest first, two results',
      code: `db.products
  .find({}, { _id: 0, name: 1, price: 1 })
  .sort({ price: 1 })
  .limit(2)
`,
    },
    challenge: {
      task: 'Return only the name and price (no _id) of the 3 most expensive products, highest price first.',
      starter: 'db.products.find({})\n',
      hint: 'Projection { _id: 0, name: 1, price: 1 }, then .sort({ price: -1 }).limit(3).',
      solution: 'db.products.find({}, { _id: 0, name: 1, price: 1 }).sort({ price: -1 }).limit(3)',
      ordered: true,
    },
  },
  {
    id: 'insert',
    title: 'Inserting documents',
    summary: 'insertOne and insertMany.',
    body: [
      '`insertOne(doc)` adds one document and `insertMany([docs])` adds several. The result tells you the generated `_id` values.',
      'Collections are created the first time you insert into them. Documents in the same collection can have different fields, which is why people call MongoDB "schemaless" (you can still add validation rules in a real deployment).',
      'Inserting a document whose `_id` already exists fails with a duplicate key error (E11000). Try it!',
    ],
    example: {
      title: 'Add a customer',
      code: `db.customers.insertOne({
  name: "Gita Rao",
  country: "India",
  age: 29,
  tier: "silver",
  tags: []
})

db.customers.find({ name: "Gita Rao" })
`,
    },
    challenge: {
      task: 'Insert this product: { _id: 7, name: "Webcam", category: "electronics", price: 1500, stock: 25, tags: ["usb"] }.',
      starter: '// db.products.insertOne({ ... })\n',
      hint: 'db.products.insertOne({ _id: 7, name: "Webcam", category: "electronics", price: 1500, stock: 25, tags: ["usb"] })',
      solution: 'db.products.insertOne({ _id: 7, name: "Webcam", category: "electronics", price: 1500, stock: 25, tags: ["usb"] })',
      verify: 'db.products.findOne({ _id: 7 })',
    },
  },
  {
    id: 'update',
    title: 'Updating with $set and $inc',
    summary: 'Change fields without rewriting the whole document.',
    body: [
      '`updateOne(filter, update)` changes the first match and `updateMany` changes all of them. The update uses operators: `$set` sets a field, `$inc` adds to a number, `$unset` removes a field and `$rename` renames one.',
      'The result has `matchedCount` (documents the filter found) and `modifiedCount` (documents that actually changed). With `{ upsert: true }` MongoDB inserts a new document when nothing matches.',
    ],
    example: {
      title: 'Update one and many',
      code: `db.customers.updateOne({ name: "Chen Li" }, { $set: { tier: "gold" } })

db.products.updateMany({ category: "stationery" }, { $inc: { stock: 50 } })

db.products.find({ category: "stationery" }, { name: 1, stock: 1 })
`,
    },
    challenge: {
      task: 'Add 10 to the stock of the product named "Pen" using $inc.',
      starter: '// db.products.updateOne(filter, { $inc: ... })\n',
      hint: 'db.products.updateOne({ name: "Pen" }, { $inc: { stock: 10 } })',
      solution: 'db.products.updateOne({ name: "Pen" }, { $inc: { stock: 10 } })',
      verify: 'db.products.findOne({ name: "Pen" }, { _id: 0, name: 1, stock: 1 })',
    },
  },
  {
    id: 'arrays',
    title: 'Arrays and nested documents',
    summary: 'Dot notation, $all, $size and $elemMatch.',
    body: [
      'Reach into a nested document with **dot notation**: `{ "address.city": "Delhi" }` (quotes are required because of the dot).',
      'Matching an array field against a single value checks whether the array **contains** it: `{ tags: "vip" }`. Use `$all` to require several values, `$size` for the length and `$elemMatch` when one array element must satisfy several conditions.',
    ],
    example: {
      title: 'Nested fields and arrays',
      code: `db.customers.find({ "address.city": "Delhi" })

db.customers.find({ tags: "vip" })

db.customers.find({ tags: { $size: 0 } })

// an order containing an item with qty >= 3 of productId 5
db.orders.find({ items: { $elemMatch: { productId: 5, qty: { $gte: 3 } } } })
`,
    },
    challenge: {
      task: 'Find the customers whose tags contain both "newsletter" and "vip".',
      starter: '// use $all on the tags array\ndb.customers.find({})\n',
      hint: 'db.customers.find({ tags: { $all: ["newsletter", "vip"] } })',
      solution: 'db.customers.find({ tags: { $all: ["newsletter", "vip"] } })',
    },
  },
  {
    id: 'array-updates',
    title: 'Updating arrays',
    summary: '$push, $addToSet and $pull.',
    body: [
      '`$push` appends a value to an array, `$addToSet` appends only if it is not already there, `$pull` removes matching values and `$pop` removes the first or last one.',
      'To work on every array element at once or one element by condition, MongoDB has positional operators (`$`, `$[]`, `$[<id>]`) and `arrayFilters`.',
    ],
    example: {
      title: 'Edit a tags array',
      code: `db.customers.updateOne({ _id: 3 }, { $push: { tags: "newsletter" } })

db.customers.updateOne({ _id: 3 }, { $addToSet: { tags: "newsletter" } })

db.customers.updateOne({ _id: 3 }, { $pull: { tags: "newsletter" } })

db.customers.findOne({ _id: 3 }, { name: 1, tags: 1 })
`,
    },
    challenge: {
      task: 'Add the tag "sale" to the product named "Keyboard", without creating duplicates ($addToSet).',
      starter: '// db.products.updateOne(filter, { $addToSet: ... })\n',
      hint: 'db.products.updateOne({ name: "Keyboard" }, { $addToSet: { tags: "sale" } })',
      solution: 'db.products.updateOne({ name: "Keyboard" }, { $addToSet: { tags: "sale" } })',
      verify: 'db.products.findOne({ name: "Keyboard" })',
    },
  },
  {
    id: 'delete',
    title: 'Deleting documents',
    summary: 'deleteOne and deleteMany.',
    body: [
      '`deleteOne(filter)` removes the first match and `deleteMany(filter)` removes every match. `deleteMany({})` empties a collection, so double-check your filter first (run it with `find()` before you delete).',
      'Changes stay in the playground until you press **Reset DB**.',
    ],
    example: {
      title: 'Check, then delete',
      code: `db.orders.find({ status: "pending" })

db.orders.deleteOne({ _id: 7 })

db.orders.countDocuments()
`,
    },
    challenge: {
      task: 'Delete every order whose status is "pending".',
      starter: '// db.orders.deleteMany(...)\n',
      hint: 'db.orders.deleteMany({ status: "pending" })',
      solution: 'db.orders.deleteMany({ status: "pending" })',
      verify: 'db.orders.find({}, { _id: 1 }).sort({ _id: 1 })',
      ordered: true,
    },
  },
  {
    id: 'aggregate',
    title: 'Aggregation: $match, $group, $sort',
    summary: 'Build a pipeline that filters, groups and sorts.',
    body: [
      'An **aggregation pipeline** is an array of stages. Each stage transforms the documents and passes them to the next one: `$match` filters, `$group` groups and computes (`$sum`, `$avg`, `$min`, `$max`, `$push`), `$sort` orders, `$limit` and `$skip` trim.',
      'In `$group`, `_id` is the group key. Refer to a field of the incoming documents with `"$fieldName"`.',
      'Put `$match` as early as possible so later stages have fewer documents to process (and so an index can be used).',
    ],
    example: {
      title: 'Revenue per customer',
      code: `db.orders.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: "$customerId", spent: { $sum: "$total" }, orders: { $sum: 1 } } },
  { $sort: { spent: -1 } }
])
`,
    },
    challenge: {
      task: 'Per customerId, total the "total" of paid orders into a field called spent. Sort by spent, highest first.',
      starter: 'db.orders.aggregate([\n  // $match, $group, $sort\n])\n',
      hint: '[{ $match: { status: "paid" } }, { $group: { _id: "$customerId", spent: { $sum: "$total" } } }, { $sort: { spent: -1 } }]',
      solution: 'db.orders.aggregate([{ $match: { status: "paid" } }, { $group: { _id: "$customerId", spent: { $sum: "$total" } } }, { $sort: { spent: -1 } }])',
      ordered: true,
    },
  },
  {
    id: 'unwind',
    title: 'Aggregation: $unwind, $project, $addFields',
    summary: 'Flatten arrays and reshape documents.',
    body: [
      '`$unwind: "$items"` turns one document with an array of N elements into N documents, one per element. That makes it easy to group by something inside the array.',
      '`$project` chooses and computes the fields to keep, and `$addFields` adds computed fields while keeping the rest. Both can use expressions such as `$multiply`, `$concat` and `$cond`.',
    ],
    example: {
      title: 'Units sold per product',
      code: `db.orders.aggregate([
  { $unwind: "$items" },
  { $group: { _id: "$items.productId", units: { $sum: "$items.qty" } } },
  { $sort: { units: -1 } }
])
`,
    },
    challenge: {
      task: 'Count the total units ordered per productId (field named units), sorted by _id ascending. Use $unwind on items.',
      starter: 'db.orders.aggregate([\n  // $unwind, $group, $sort\n])\n',
      hint: '[{ $unwind: "$items" }, { $group: { _id: "$items.productId", units: { $sum: "$items.qty" } } }, { $sort: { _id: 1 } }]',
      solution: 'db.orders.aggregate([{ $unwind: "$items" }, { $group: { _id: "$items.productId", units: { $sum: "$items.qty" } } }, { $sort: { _id: 1 } }])',
      ordered: true,
    },
  },
  {
    id: 'lookup',
    title: 'Joins with $lookup',
    summary: 'Combine documents from two collections.',
    body: [
      'MongoDB is not relational, but `$lookup` can join another collection: for each input document it finds the documents in `from` whose `foreignField` equals the input\'s `localField` and puts them in an array called `as`.',
      'Follow it with `$unwind` to turn that one-element array into a single embedded document. In real schemas, embedding related data in one document is often better than joining, so use `$lookup` where you really need it.',
    ],
    example: {
      title: 'Orders with the customer name',
      code: `db.orders.aggregate([
  { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customer" } },
  { $unwind: "$customer" },
  { $project: { total: 1, status: 1, customer: "$customer.name" } }
])
`,
    },
    challenge: {
      task: 'Join each order with its customer. Return total and the customer\'s name as a field called customer, sorted by _id ascending.',
      starter: 'db.orders.aggregate([\n  // $lookup, $unwind, $project, $sort\n])\n',
      hint: '$lookup from "customers" (localField customerId, foreignField _id, as "customer"), $unwind "$customer", $project { total: 1, customer: "$customer.name" }, $sort { _id: 1 }',
      solution: 'db.orders.aggregate([{ $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customer" } }, { $unwind: "$customer" }, { $project: { total: 1, customer: "$customer.name" } }, { $sort: { _id: 1 } }])',
      ordered: true,
    },
  },
  {
    id: 'indexes',
    title: 'Indexes',
    summary: 'Make queries fast and enforce uniqueness.',
    body: [
      'Without an index MongoDB reads every document in the collection (a **COLLSCAN**). An index on the fields you filter and sort by lets it jump straight to the matches (an **IXSCAN**). Every collection has an index on `_id`.',
      '`createIndex({ field: 1 })` builds one. Add `{ unique: true }` to reject duplicates. For several fields, order matters: put equality fields first, then sort fields, then range fields. `explain()` shows the plan a query used.',
      'Indexes speed up reads but cost write time and memory, so index what you actually query.',
    ],
    example: {
      title: 'Create an index and check the plan',
      code: `db.customers.find({ country: "India" }).explain()

db.customers.createIndex({ country: 1 })

db.customers.find({ country: "India" }).explain()

db.customers.getIndexes()
`,
    },
    challenge: {
      task: 'Create an ascending index on customers.country.',
      starter: '// db.customers.createIndex(...)\n',
      hint: 'db.customers.createIndex({ country: 1 })',
      solution: 'db.customers.createIndex({ country: 1 })',
      verify: 'db.customers.getIndexes().map((i) => i.name)',
      ordered: true,
    },
  },
]
