import { createI18n } from 'vue-i18n'
import { LARServerService } from './services/LARServerService'
import zhMessages from './messages/zh'
import ruMessages from './messages/ru'
import enMessages from './messages/en'

// TODO: 先简单点，直接在这里调 getSettings，没有本地缓存
const { locale = navigator.language } = await LARServerService.getSettings({})

export const i18n = createI18n({
  legacy: false,
  locale,
  // 系统语言没匹配到的话大概率不是中文使用者，所以默认英文
  fallbackLocale: 'en',
  messages: {
    zh: zhMessages,
    ru: ruMessages,
    en: enMessages,
  },
})
