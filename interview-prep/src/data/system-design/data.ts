import { apiStyles } from './lessons/api-styles'
import { acid } from './lessons/acid'
import { capQuorum } from './lessons/cap-quorum'
import { replication } from './lessons/replication'
import { sharding } from './lessons/sharding'
import { sqlVsNosql } from './lessons/sql-vs-nosql'
import { writeStrategies } from './lessons/write-strategies'
import type { SdModule } from './types'

export const data: SdModule = {
  id: 'data-and-apis',
  title: 'APIs and data at scale',
  blurb: 'How programs talk to each other, and how databases are chosen, split and copied once one machine is not enough.',
  color: '#10b981',
  lessons: [apiStyles, sqlVsNosql, replication, sharding, capQuorum, acid, writeStrategies],
}
