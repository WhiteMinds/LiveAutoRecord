import Vue from 'vue'
import * as Router from 'vue-router'

import LAR from '@/pages/LAR'
import LARAdd from '@/pages/LAR/add'
import LARSetting from '@/pages/LAR/setting'
import RunTime from '@/pages/RunTime'
import VideoKit from '@/pages/VideoKit'
import About from '@/pages/About'
import Test from '@/pages/Test'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'lar',
      component: LAR
    },
    {
      path: '/lar-setting',
      name: 'lar-setting',
      component: LARSetting
    },
    {
      path: '/lar-add',
      name: 'lar-add',
      component: LARAdd
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
      path: '/about',
      name: 'about',
      component: About
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
