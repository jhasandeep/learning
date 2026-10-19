/** Node-style, readable formatting for console.log arguments. */
export function inspect(value: unknown, depth = 0, seen = new WeakSet<object>()): string {
  if (typeof value === 'string') return depth === 0 ? value : JSON.stringify(value)
  if (typeof value === 'bigint') return `${value}n`
  if (typeof value === 'symbol') return value.toString()
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`
  if (value === null || typeof value !== 'object') return String(value)
  if (seen.has(value)) return '[Circular]'
  if (depth > 4) return Array.isArray(value) ? '[Array]' : '[Object]'
  seen.add(value)
  const inner = (v: unknown) => inspect(v, depth + 1, seen)
  if (value instanceof Error) return value.stack ?? `${value.name}: ${value.message}`
  if (value instanceof Date) return value.toISOString()
  if (value instanceof RegExp) return value.toString()
  if (value instanceof Map) return `Map(${value.size}) { ${[...value].map(([k, v]) => `${inner(k)} => ${inner(v)}`).join(', ')} }`
  if (value instanceof Set) return `Set(${value.size}) { ${[...value].map(inner).join(', ')} }`
  if (Array.isArray(value)) return `[ ${value.map(inner).join(', ')} ]`.replace('[  ]', '[]')
  const entries = Object.entries(value).map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${inner(v)}`)
  const name = value.constructor && value.constructor !== Object ? `${value.constructor.name} ` : ''
  return entries.length ? `${name}{ ${entries.join(', ')} }` : `${name}{}`
}
