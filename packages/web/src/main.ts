import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { initStore } from './store'

const app = createApp(App)
initStore(app)
app.use(router)
app.mount('#app')
