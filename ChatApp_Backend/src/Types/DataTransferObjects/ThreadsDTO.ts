import { Thread_Roles, Thread_Types } from '../Enums'
import { MessageInfoDTO } from './MessageDTO'
import { UserInfoDTO } from './UsersDTO'

export interface CreateGrpThreadDTO {
  name: string
  avatarUrl?: string
}

export interface UpdateThreadMetadataDTO {
  threadId: string
  rename?: string
  avatarUrl?: string
}

export interface ThreadInfoDTO {
  id: string
  name?: string
  type: Thread_Types
  avatarUrl?: string
  created_by: UserInfoDTO
}

export interface ThreadParticipantGeneralInfoDTO {
  thread_id: string
  user_id: string
  username: string
  role: Thread_Roles
}

export interface ThreadParticipantDetailDTO {
  thread: ThreadInfoDTO
  user: UserInfoDTO
  role: Thread_Roles
}

export interface ThreadOffsetInfoDTO {
  thread_id: string
  user_id: string
  last_read_msg: MessageInfoDTO
  last_offset_at: Date
}

export interface ThreadIdDTO {
  thread_id: string
}
