---
'@autorecord/manager': minor
'@autorecord/douyin-recorder': minor
'@autorecord/electron': minor
---

新增抖音平台检查频率限制，同一平台的多个直播间在自动检查时会强制保持至少 1 秒的间隔，避免因请求过于密集而被抖音封禁 IP。
