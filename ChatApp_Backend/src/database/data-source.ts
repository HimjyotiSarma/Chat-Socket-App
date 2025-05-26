import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Attachment } from '../entity/Attachment'
import { Conversation } from '../entity/Conversations'
import { DeliveryStatus } from '../entity/DeliveryStatus'
import { DomainEvent } from '../entity/DomainEvent'
import { Message } from '../entity/Message'
import { Reaction } from '../entity/Reaction'
import { ThreadOffset } from '../entity/ThreadOffset'
import { ThreadParticipant } from '../entity/ThreadParticipants'
import { User } from '../entity/User'
import { WebsocketSession } from '../entity/WebsocketSession'
// Import all your entities here

export const AppDataSource = new DataSource({
  type: 'postgres', // Your database type (e.g., postgres, mysql)
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'Him_Postgre_DB',
  database: 'chatapp_node',
  synchronize: true, // Set to false in production
  logging: true,
  entities: ['src/entity/**/*.ts'], // Path to your entities
  // entities: [
  //   Attachment,
  //   Conversation,
  //   DeliveryStatus,
  //   DomainEvent,
  //   Message,
  //   Reaction,
  //   ThreadOffset,
  //   ThreadParticipants,
  //   User,
  //   WebsocketSession,
  // ], // Path to your entities
  migrations: ['src/database/migrations/**/*.ts'], // Path to your migrations
  subscribers: [],
})
