export interface ForumCategory {
  id: string
  name: string
  description: string | null
  order: number
}

export interface TopicAuthor {
  id: string
  firstName: string
  lastName: string
}

export interface Topic {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  lastReplyAt: string
  categoryId: string
  authorId: string
  author: TopicAuthor
  category?: ForumCategory
  _count?: {
    replies: number
  }
  replies?: Reply[]
  isUnread?: boolean
  unreadRepliesCount?: number
}

export interface Reply {
  id: string
  content: string
  isEdited?: boolean
  editedAt?: string | null
  createdAt: string
  topicId: string
  authorId: string
  author: TopicAuthor
  quotedReplyId: string | null
  quotedReply?: {
    id: string
    content: string
    author: {
      id: string
      firstName: string
    }
  } | null
}

export interface ReplyHistory {
  id: string
  content: string
  editedAt: string
  replyId: string
}

export interface TopicFormData {
  title: string
  content: string
}

export interface ReplyFormData {
  content: string
  quotedReplyId?: string
}
