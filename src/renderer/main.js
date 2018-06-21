import Vue from 'vue'
import axios from 'axios'
import bodyClass from 'vue-body-class'
import iView from 'iview'
import 'iview/dist/styles/iview.css'

import App from '@/App'
import router from '@/router'
import store from '@/store'
import ipc from '@/ipc'

import { isStreamLinkInstalled } from '@/../util'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.use(bodyClass, router)
Vue.use(iView)
require('./mixin')
ipc.init()

if (!isStreamLinkInstalled()) router.push('/runtime')

new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
