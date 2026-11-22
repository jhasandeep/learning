import { caching } from './lessons/caching'
import { consistentHashing } from './lessons/consistent-hashing'
import { loadBalancer } from './lessons/load-balancer'
import { messageQueue } from './lessons/message-queue'
import { rateLimiter } from './lessons/rate-limiter'
import { resilience } from './lessons/resilience'
import { urlShortener } from './lessons/url-shortener'
import type { SdLesson } from './types'

/** In course order: from "one server is not enough" to a complete design. */
export const buildingBlockLessons: SdLesson[] = [loadBalancer, caching, consistentHashing, rateLimiter, messageQueue, resilience, urlShortener]
