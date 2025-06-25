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
import { AttachmentTypes } from '../Types/Enums'
import { User } from './User'

@Entity()
@Index('IDX_attachment_message', ['message'])
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Message, (message) => message.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message!: Message

  @Column({
    name: 'file_format',
    type: 'enum',
    enum: AttachmentTypes,
    default: AttachmentTypes.OTHER,
  })
  fileFormat!: AttachmentTypes

  @Column({ name: 'file_type', type: 'varchar', length: 255, nullable: true })
  fileType!: string

  @Column({ type: 'varchar', length: 2048 })
  url!: string

  @Column({ type: 'varchar', length: 2048, nullable: true })
  thumbnail_url?: string

  @ManyToOne(() => User, (user) => user.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date
}
