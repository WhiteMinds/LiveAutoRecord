import Vue from 'vue'
import Router from 'vue-router'

import LAR from '../components/LAR'
import RunTime from '../components/RunTime'
import VideoKit from '../components/VideoKit'
import Test from '../components/Test'

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
