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
  BULK_MESSAGE_DELETED = 'bulk_message_deleted',
  CONVERSATION_CREATED = 'conversation_created',
  CONVERSATION_UPDATED = 'conversation_updated',
  CONVERSATION_DELETED = 'conversation_deleted',
  PARTICIPANT_ADDED = 'participant_added',
  PARTICIPANT_REMOVED = 'participant_removed',
  MULTIPLE_PARTICIPANT_ADDED = 'multiple_participant_added',
  MARK_THREAD_READ = 'mark_thread_read',
  REACTION_ADDED = 'reaction_added',
  REACTION_REMOVED = 'reaction_removed',
  ATTACHMENT_ADDED = 'attachment_added',
  ATTACHMENT_REMOVED = 'attachment_removed',
  USER_PROFILE_UPDATED = 'user_profile_updated',
  // Add more events as needed
}
