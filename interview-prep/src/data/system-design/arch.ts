import { caseInstagram } from './lessons/case-instagram'
import { caseIrctc } from './lessons/case-irctc'
import { caseUpi } from './lessons/case-upi'
import { jwtSessions } from './lessons/jwt-sessions'
import { microservices } from './lessons/microservices'
import { solid } from './lessons/solid'
import type { SdModule } from './types'

export const architecture: SdModule = {
  id: 'architecture',
  title: 'Architecture and security',
  blurb: 'How to organise a system into services, keep code clean as it grows, and keep users safe.',
  color: '#f59e0b',
  lessons: [microservices, solid, jwtSessions],
}

export const caseStudies: SdModule = {
  id: 'case-studies',
  title: 'Case studies',
  blurb: 'Real systems that combine many building blocks: a news feed, a rush-hour ticket counter and a payment network.',
  color: '#ec4899',
  lessons: [caseInstagram, caseIrctc, caseUpi],
}
