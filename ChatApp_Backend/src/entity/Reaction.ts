import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Message } from './Message'
import { User } from './User'

@Entity()
@Index('msg_user_idx', ['message.id', 'user.id'], { unique: true })
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Message, (message) => message.reactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message!: Message

  @ManyToOne(() => User, (user) => user.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  // Store Code like 1f389 and get the emoji from e.g -> https://www.emoji.family/api/emojis/1f389
  @Column({ name: 'emoji_hex', type: 'varchar', length: 100 })
  emojiHex!: string

  @CreateDateColumn({ name: 'reacted_at', type: 'timestamptz' })
  reactedAt?: Date
}
