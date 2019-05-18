import { Platform } from 'const'

const platforms = {
  [Platform.DouYu]: require('./douyu'),
  [Platform.BiliBili]: require('./bilibili')
}

export default platforms
