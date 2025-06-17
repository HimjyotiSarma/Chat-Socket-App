import { Domain_Events, Event_Aggregate_Type } from '../Enums'

export interface EventInfoDTO {
  id: bigint
  aggregateType: Event_Aggregate_Type
  aggregateId: string
  eventType: Domain_Events
  payload: Record<string, any>
  created_at: Date
}
