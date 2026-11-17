import type { Doc } from './mongo-engine'

// Sample database for the MongoDB playground (and restored by "Reset DB").
// Numeric _id values keep the lessons deterministic.
export const DB_NAME = 'shop'

export function seedData(): Record<string, Doc[]> {
  const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`)
  return {
    customers: [
      { _id: 1, name: 'Asha Verma', country: 'India', age: 31, tier: 'gold', tags: ['newsletter', 'vip'], address: { city: 'Delhi', zip: '110001' } },
      { _id: 2, name: 'Ben Carter', country: 'USA', age: 25, tier: 'silver', tags: ['newsletter'], address: { city: 'Austin', zip: '73301' } },
      { _id: 3, name: 'Chen Li', country: 'China', age: 22, tier: 'silver', tags: [], address: { city: 'Shanghai', zip: '200000' } },
      { _id: 4, name: 'Dina Haddad', country: 'UAE', age: 28, tier: 'gold', tags: ['vip'], address: { city: 'Dubai', zip: '00000' } },
      { _id: 5, name: 'Eva Novak', country: 'UK', age: 35, tier: 'bronze', tags: ['newsletter'], address: { city: 'London', zip: 'SW1A 1AA' } },
      { _id: 6, name: 'Farid Khan', country: 'India', age: 41, tier: 'bronze', tags: [], address: { city: 'Mumbai', zip: '400001' } },
    ],
    products: [
      { _id: 1, name: 'Keyboard', category: 'electronics', price: 400, stock: 50, tags: ['wired', 'usb'] },
      { _id: 2, name: 'Mouse', category: 'electronics', price: 300, stock: 120, tags: ['wireless', 'usb'] },
      { _id: 3, name: 'Monitor', category: 'electronics', price: 12000, stock: 15, tags: ['display'] },
      { _id: 4, name: 'Laptop', category: 'electronics', price: 55000, stock: 8, tags: ['portable'] },
      { _id: 5, name: 'Notebook', category: 'stationery', price: 120, stock: 300, tags: ['paper'] },
      { _id: 6, name: 'Pen', category: 'stationery', price: 20, stock: 1000, tags: ['ink'] },
    ],
    orders: [
      { _id: 1, customerId: 4, items: [{ productId: 1, qty: 1 }, { productId: 2, qty: 1 }], total: 700, status: 'paid', date: d('2025-01-10') },
      { _id: 2, customerId: 3, items: [{ productId: 3, qty: 1 }], total: 12000, status: 'shipped', date: d('2025-01-15') },
      { _id: 3, customerId: 1, items: [{ productId: 1, qty: 1 }], total: 400, status: 'paid', date: d('2025-02-01') },
      { _id: 4, customerId: 2, items: [{ productId: 5, qty: 3 }, { productId: 6, qty: 10 }], total: 560, status: 'pending', date: d('2025-02-03') },
      { _id: 5, customerId: 1, items: [{ productId: 4, qty: 1 }], total: 55000, status: 'shipped', date: d('2025-02-10') },
      { _id: 6, customerId: 5, items: [{ productId: 2, qty: 2 }], total: 600, status: 'paid', date: d('2025-03-05') },
      { _id: 7, customerId: 4, items: [{ productId: 6, qty: 5 }], total: 100, status: 'pending', date: d('2025-03-09') },
      { _id: 8, customerId: 1, items: [{ productId: 2, qty: 1 }, { productId: 5, qty: 2 }], total: 540, status: 'paid', date: d('2025-03-20') },
    ],
  }
}
