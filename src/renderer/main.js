import Vue from 'vue'
import iView from 'iview'
import 'iview/dist/styles/iview.css'

import App from '@/App'
import store from '@/modules/store'
import router from '@/router'

Vue.use(iView)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false
Vue.prototype.$store = store

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  template: '<App/>'
}).$mount('#app')
