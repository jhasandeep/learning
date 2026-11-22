import { cdn } from './lessons/cdn'
import { proxy } from './lessons/proxy'
import { requestFlow } from './lessons/request-flow'
import { scaling } from './lessons/scaling'
import { tls } from './lessons/tls'
import type { SdModule } from './types'

export const web: SdModule = {
  id: 'web-basics',
  title: 'How the web works at scale',
  blurb: 'What happens when you open a website, how systems grow, and the pieces that sit between users and servers.',
  color: '#6366f1',
  lessons: [requestFlow, scaling, cdn, proxy, tls],
}
