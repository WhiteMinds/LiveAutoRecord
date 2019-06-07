export const Platform = {
  DouYu: 1,
  BiliBili: 2
}

// todo delete in beta
delete Platform.BiliBili

export const PlatformList = Object.values(Platform)

Object.assign(Platform, {
  [Platform.DouYu]: '斗鱼TV',
  [Platform.BiliBili]: '哔哩哔哩直播'
})
