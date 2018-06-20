import Vue from 'vue'
import * as Router from 'vue-router'

import LAR from '../pages/LAR'
import RunTime from '../pages/RunTime'
import VideoKit from '../pages/VideoKit'
import Test from '../pages/Test'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'lar',
      component: LAR
    },
    {
      path: '/runtime',
      name: 'runtime',
      component: RunTime,
      meta: { bodyClass: 'hold-transition skin-blue layout-top-nav' }
    },
    {
      path: '/video-kit',
      name: 'video-kit',
      component: VideoKit
    },
    {
      path: '/test',
      name: 'test',
      component: Test
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
