import { buildingBlockLessons } from './lessons-index'
import type { SdModule } from './types'

export const fundamentals: SdModule = {
  id: 'building-blocks',
  title: 'Building blocks',
  blurb: 'The parts that almost every large system is made of. Learn each one with a picture, a real example, working code and a simulator.',
  color: '#0ea5e9',
  lessons: buildingBlockLessons,
}
