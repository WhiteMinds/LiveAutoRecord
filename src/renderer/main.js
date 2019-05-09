import Vue from 'vue'
import iView from 'iview'
import 'iview/dist/styles/iview.css'

import App from '@/App'
import router from '@/router'

Vue.use(iView)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  template: '<App/>'
}).$mount('#app')
