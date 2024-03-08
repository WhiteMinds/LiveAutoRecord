import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import App from './App.vue'
import { createRouter } from './router'
import { initStore } from './store'
import { RecordService } from './services/RecordService'
import { InteractionService } from './services/InteractionService'
import zhMessages from './messages/zh'
import ruMessages from './messages/ru'
import enMessages from './messages/en'
// 这个必须放在下面，权重才能比 vuetify 高
import './style.css'
import { LARServerService } from './services/LARServerService'

// TODO: 先简单点，不做初始化的 loading 之类的，出问题顶多 B/S 模式下的通知出问题
void RecordService.init()
InteractionService.blurSomeElementOnPressEscape = true

// TODO: 先简单点，直接在这里调 getSettings，没有本地缓存
const { locale = navigator.language } = await LARServerService.getSettings({})

const i18n = createI18n({
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

const vuetify = createVuetify({
  components,
  directives,
})

const app = createApp(App)
initStore(app)
app.use(i18n)
app.use(vuetify)
app.use(createRouter())
app.mount('#app')
