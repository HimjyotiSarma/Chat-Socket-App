import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from './User'

@Entity({ name: 'websocket_session' })
@Index('usr_skt_index', ['user.id', 'socketId'], { unique: true })
export class WebsocketSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => User, (user) => user.sockets)
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({ name: 'socket_id', type: 'varchar', length: 255 })
  socketId!: string

  @CreateDateColumn({ name: 'connected_at', type: 'timestamptz' })
  connectedAt?: Date

  @Column({ name: 'disconnected_at', type: 'timestamptz', nullable: true })
  disconnectedAt?: Date
}
