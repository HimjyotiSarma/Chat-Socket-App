export enum Thread_Roles {
  MEMBER = 'member',
  ADMIN = 'admin',
}

export enum Thread_Types {
  DM = 'direct_message',
  GROUP = 'group',
}
// Used AttachMent Types Instead of FileTypes Name
export enum AttachmentTypes {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  OTHER = 'other',
}
export enum Event_Aggregate_Type {
  MESSAGE = 'message',
  CONVERSATION = 'conversation',
  USER = 'user',
}
export enum Domain_Events {
  MESSAGE_CREATED = 'message_created',
  MESSAGE_UPDATED = 'message_updated',
  MESSAGE_DELETED = 'message_deleted',
  MESSAGE_ACKNOWLEDGED = 'message_acknowledged',
  BULK_MESSAGE_DELETED = 'bulk_message_deleted',
  DM_CONVERSATION_CREATED = 'dm_conversation_created',
  GROUP_CONVERSATION_CREATED = 'group_conversation_created',
  GROUP_CONVERSATION_UPDATED = 'group_conversation_updated',
  GROUP_CONVERSATION_UPDATED_ACKNOWLEDGED = 'group_conversation_updated_acknowledged',
  CONVERSATION_DELETED = 'conversation_deleted',
  CONVERSATION_DELETED_ACKNOWLEDGED = 'conversation_deleted_acknowledged',
  CONVERSATION_CREATED_ACKNOWLEDGED = 'conversation_created_acknowledged',
  PARTICIPANT_ADDED = 'participant_added',
  PARTICIPANT_REMOVED = 'participant_removed',
  MULTIPLE_PARTICIPANT_ADDED = 'multiple_participant_added',
  PARTICIPANT_ADDED_ACKNOWLEDGED = 'participant_added_acknowledged',
  PARTICIPANT_REMOVED_ACKNOWLEDGED = 'participant_removed_acknowledged',
  MULTIPLE_PARTICIPANT_ADDED_ACKNOWLEDGED = 'multiple_participant_added_acknowledged',
  MARK_THREAD_READ = 'mark_thread_read',
  MARK_THREAD_READ_ACKNOWLEDGED = 'mark_thread_read_acknowledged',
  REACTION_ADDED = 'reaction_added',
  REACTION_REMOVED = 'reaction_removed',
  ATTACHMENT_ADDED = 'attachment_added',
  ATTACHMENT_REMOVED = 'attachment_removed',
  USER_PROFILE_UPDATED = 'user_profile_updated',
  JOIN_THREAD = 'joined_thread',
  LEAVE_THREAD = 'leave_thread',
  JOIN_THREAD_ACKNOWLEDGED = 'join_thread_acknowledged',
  LEAVE_THREAD_ACKNOWLEDGED = 'leave_thread_acknowledged',
  ERROR = 'error',
  // Add more events as needed
}
