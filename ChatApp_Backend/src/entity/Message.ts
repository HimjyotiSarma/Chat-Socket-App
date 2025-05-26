import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Conversation } from './Conversations'
import { User } from './User'
import { Attachment } from './Attachment'
import { Reaction } from './Reaction'
import { ThreadOffset } from './ThreadOffset'

@Entity()
@Index('recent_msg_indx', ['conversation.id', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'thread_id' })
  conversation!: Conversation

  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User

  @Column({ type: 'jsonb' })
  content!: Record<string, any>

  @ManyToOne(() => Message, (message) => message.repliedFromMessages, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'reply_to_msg_id' })
  repliedToMessage?: Message

  @OneToMany(() => Message, (message) => message.repliedToMessage)
  repliedFromMessages?: Message[]

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt?: Date

  @Column({ type: 'timestamptz', nullable: true, name: 'edited_at' })
  editedAt?: Date

  @OneToMany(() => Attachment, (attachment) => attachment.message, {
    nullable: true,
  })
  attachments?: Attachment[]

  @OneToMany(() => Reaction, (reaction) => reaction.message, { nullable: true })
  reactions?: Reaction[]

  @OneToMany(() => ThreadOffset, (threadOffset) => threadOffset.lastReadMsg, {
    nullable: true,
  })
  threadOffsets?: ThreadOffset[]
}
