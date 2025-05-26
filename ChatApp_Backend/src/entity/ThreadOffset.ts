import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Conversation } from './Conversations'
import { User } from './User'
import { Message } from './Message'
@Entity({ name: 'thread_offset' })
export class ThreadOffset {
  @PrimaryColumn({ name: 'thread_id', type: 'uuid' })
  threadId!: string

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string

  @ManyToOne(() => Conversation, (c) => c.threadOffsets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'thread_id' })
  thread!: Conversation

  @ManyToOne(() => User, (u) => u.threadOffsets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @ManyToOne(() => Message, (m) => m.threadOffsets, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'last_read_msg' })
  lastReadMsg!: Message

  @UpdateDateColumn({
    name: 'last_offset_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastOffsetAt!: Date
}
