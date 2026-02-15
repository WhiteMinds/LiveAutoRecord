import { createI18n } from 'vue-i18n'
import { LARServerService } from './services/LARServerService'
import zhMessages from './messages/zh'
import ruMessages from './messages/ru'
import enMessages from './messages/en'
import { en as vuetifyEN, zhHans as vuetifyZHHans, ru as vuetifyRU } from 'vuetify/locale'
import { enUS as dateEN, zhCN as dateZH, ru as dateRU } from 'date-fns/locale'
import { format, formatDuration } from 'date-fns'

// TODO: 先简单点，直接在这里调 getSettings，没有本地缓存
const { locale = navigator.language } = await LARServerService.getSettings({})

export const i18nOpts = {
  legacy: false,
  locale,
  // 系统语言没匹配到的话大概率不是中文使用者，所以默认英文
  fallbackLocale: 'en',
  messages: {
    zh: { $vuetify: vuetifyZHHans, ...zhMessages },
    ru: { $vuetify: vuetifyRU, ...ruMessages },
    en: { $vuetify: vuetifyEN, ...enMessages },
  },
} as const

export const i18n = createI18n(i18nOpts)

const dateLocaleMap = {
  en: dateEN,
  zh: dateZH,
  ru: dateRU,
} as const

export function useDateFNS() {
  const i18nLocale = i18n.global.locale.value

  function wrapFormatFN<T extends (...args: any[]) => any>(fn: T): T {
    return function (...args: Parameters<T>) {
      return fn(...args, { locale: dateLocaleMap[i18nLocale] })
    } as T
  }

  return {
    format: wrapFormatFN(format),
    formatDuration: wrapFormatFN(formatDuration),
  }
}
