import { AttachmentTypes } from '../Enums'
import { ThreadInfoDTO } from './ThreadsDTO'
import { UserInfoDTO } from './UsersDTO'

export interface MessageInfoDTO {
  id: string
  thread: ThreadInfoDTO
  sender: UserInfoDTO
  content: Record<string, any>
  attachments: AttachmentResponseDTO[] | null
  repliedToMessage?: MessageInfoDTO
  reactions?: ReactionResponseGeneralDTO[] | null
  created_at: Date
  edited_at?: Date
}

export interface AttachmentInput {
  message_id: string
  file_type: AttachmentTypes
  url?: string
  thumbnail_url?: string
}

export interface AttachmentResponseDTO {
  id: string
  message_id: string
  file_type: AttachmentTypes
  url?: string
  thumbnail_url?: string | null
  created_at: Date
}
// Get the sender info from the Token
export interface CreateMessageDTO {
  thread_id: string
  content: Record<string, any>
  reply_to_msg_id?: string
  created_at: Date
}

export interface CreateReactionDTO {
  message_id: string
  emojiHex: string
}

export interface UpdateMessageDTO {
  thread_id: string
  message_id: string
  content: Record<string, any>
}

export interface DeleteMessageDTO {
  thread_id: string
  message_id: string
}

export interface SingleReactionResponseDTO {
  id: string
  message: MessageInfoDTO
  user: UserInfoDTO
  emojiHex: string
  reacted_at: Date
}

export interface SearchMessageDTO {
  keyword: string
}

// export interface SearMessageResponseDTO {
//   data: MessageInfoDTO[]
// }

export interface ReactionResponseGeneralDTO {
  id: string
  message_id: string
  user_id: string
  emojiHex: string
  reacted_at: Date | null
}

// Add Delete Message Reaction DTO if needed

export interface MessageBulkDTO {
  thread_id: string
  messageIds: string[]
}

export interface MessageReactionCountResponseDTO {
  emojiHex: string
  count: number
}
