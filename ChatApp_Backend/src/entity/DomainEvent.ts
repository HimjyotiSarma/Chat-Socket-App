import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Domain_Events, Event_Aggregate_Type } from '../Types/Enums'
import { DeliveryStatus } from './DeliveryStatus'

@Entity({ name: 'domain_events' })
@Index('aggregate_type_id_idx', ['aggregateId', 'aggregateType'])
export class DomainEvent {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: bigint

  @Column({ name: 'aggregate_type', type: 'enum', enum: Event_Aggregate_Type })
  aggregateType!: Event_Aggregate_Type

  @Column({ name: 'aggregate_id', type: 'uuid' })
  aggregateId!: string

  @Column({ name: 'event_type', type: 'enum', enum: Domain_Events })
  eventType!: Domain_Events

  @Column({ type: 'jsonb', default: () => "'{}'" })
  payload!: Record<string, any>

  @Column({ type: 'boolean', default: false })
  published!: boolean

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @OneToMany(
    () => DeliveryStatus,
    (deliveryStatus) => deliveryStatus.domainEvent,
    { nullable: true }
  )
  deliveryStatus?: DeliveryStatus[]
}
