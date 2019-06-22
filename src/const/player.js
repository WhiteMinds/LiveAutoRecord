export const ChatContent = {
  All: 1,
  Chat: 2
}

export const ChatContentList = Object.values(ChatContent)

Object.assign(ChatContent, {
  [ChatContent.All]: '全部信息',
  [ChatContent.Chat]: '聊天信息'
})

export const ChatContentTip = {
  [ChatContent.All]: '显示所有消息 (聊天, 礼物, ...)',
  [ChatContent.Chat]: '仅显示聊天信息'
}
