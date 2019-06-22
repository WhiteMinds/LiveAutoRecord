import flvjs from 'flv.js'
import Vue from 'vue'
import iView from 'iview'
import 'iview/dist/styles/iview.css'
import 'dplayer/dist/DPlayer.min.css'

import App from '@/App'
import VueRippler from '@/components/vue-rippler'
import BetterTable from '@/components/better-table'
import ModalColumnsSetting from '@/components/modal-columns-setting'
import store from '@/modules/store'
import router from '@/router'

window.flvjs = flvjs

Vue.use(iView)
Vue.use(VueRippler)
Vue.component(BetterTable.name, BetterTable)
Vue.component(ModalColumnsSetting.name, ModalColumnsSetting)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false
Vue.prototype.$store = store

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  template: '<App/>'
}).$mount('#app')
