import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { initStore } from './store'
import { RecordService } from './services/RecordService'

// TODO: 先简单点，不做初始化的 loading 之类的，出问题顶多 B/S 模式下的通知出问题
void RecordService.init()

const app = createApp(App)
initStore(app)
app.use(router)
app.mount('#app')
