import Vue from 'vue'
import axios from 'axios'
import bodyClass from 'vue-body-class'

import App from './App'
import router from './router'
import store from './store'

import { isStreamLinkInstalled } from './util'

import '../../bower_components/bootstrap/dist/css/bootstrap.min.css'
import '../../bower_components/admin-lte/dist/css/AdminLTE.min.css'
import '../../bower_components/admin-lte/dist/css/skins/_all-skins.min.css'

import '../../bower_components/jquery/dist/jquery.min.js'
import '../../bower_components/admin-lte/dist/js/adminlte.min.js'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.use(bodyClass, router)
require('./mixin')

if (!isStreamLinkInstalled()) router.push('/runtime')

new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
