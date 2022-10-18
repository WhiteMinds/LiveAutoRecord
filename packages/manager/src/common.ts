export type ChannelId = string

export const Qualities = ['lowest', 'low', 'medium', 'high', 'highest'] as const
export type Quality = typeof Qualities[number]

export interface MessageSender {
  uid?: string
  name: string
  avatar?: string
  extra?: Record<string, unknown>
}

export interface Comment {
  type: 'comment'
  timestamp: number
  text: string
  color?: string
  sender?: MessageSender
  extra?: Record<string, unknown>
}

export interface GiveGift {
  type: 'give_gift'
  timestamp: number
  name: string
  count: number
  cost?: number
  sender?: MessageSender
  extra?: Record<string, unknown>
}

// TODO: Message 还有 SuperChat（或许算 Comment 的 Extra）之类的
export type Message = Comment | GiveGift
