import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Conversation } from './Conversations'
import { ThreadParticipant } from './ThreadParticipants'
import { Message } from './Message'
import { Reaction } from './Reaction'
import { WebsocketSession } from './WebsocketSession'
import { DeliveryStatus } from './DeliveryStatus'
import { ThreadOffset } from './ThreadOffset'
import { Attachment } from './Attachment'

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string

  @Column({ type: 'varchar', length: 250, unique: true })
  email!: string

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string

  @Column({ name: 'display_name', type: 'varchar', length: 100 })
  displayName!: string

  @Column({
    type: 'varchar',
    name: 'avatar_url',
    length: 255,
    default:
      'https://cdn1.iconfinder.com/data/icons/user-pictures/100/unknown-1024.png',
  })
  avatarUrl?: string

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt?: Date

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt?: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt?: Date

  @OneToMany(() => Conversation, (conversation) => conversation.createdBy, {
    nullable: true,
  })
  conversations?: Conversation[]

  @OneToMany(
    () => ThreadParticipant,
    (threadParticipant) => threadParticipant.user,
    { nullable: true }
  )
  threads?: ThreadParticipant[]

  @OneToMany(() => Message, (message) => message.sender, { nullable: true })
  messages?: Message[]

  @OneToMany(() => Reaction, (reaction) => reaction.user, { nullable: true })
  reactions?: Reaction[]

  @OneToMany(() => WebsocketSession, (socket) => socket.user, {
    nullable: true,
  })
  sockets?: WebsocketSession[]

  @OneToMany(() => DeliveryStatus, (deliveryStatus) => deliveryStatus.user, {
    nullable: true,
  })
  deliveryStatus?: DeliveryStatus[]

  @OneToMany(() => ThreadOffset, (threadOffset) => threadOffset.user, {
    nullable: true,
  })
  @OneToMany(() => Attachment, (attachment) => attachment.user)
  attachments?: Attachment[]
}
