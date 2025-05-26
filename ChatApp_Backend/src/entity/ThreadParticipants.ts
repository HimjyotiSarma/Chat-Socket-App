import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { Thread_Roles } from '../Types/Enums'
import { Conversation } from './Conversations'
import { User } from './User'

@Entity({ name: 'thread_participants' })
export class ThreadParticipant {
  @PrimaryColumn({ name: 'thread_id', type: 'uuid' })
  threadId!: string

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string

  @ManyToOne(() => Conversation, (c) => c.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thread_id' })
  thread!: Conversation

  @ManyToOne(() => User, (u) => u.threads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({
    type: 'enum',
    enum: Thread_Roles,
    default: Thread_Roles.MEMBER,
  })
  role!: Thread_Roles
}
