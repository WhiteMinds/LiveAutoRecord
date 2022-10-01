import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { valuesToMapWithKVEqual } from '../utils'
import RecordersManage from '../views/RecordersManage/index.vue'
import RecordProcessing from '../views/RecordProcessing/index.vue'
import ApplicationSettings from '../views/ApplicationSettings/index.vue'

export const RouteNames = valuesToMapWithKVEqual([
  'Root',
  'RecordersManage',
  'RecordersSetting',
  'RecorderEdit',
  'RecordHistory',
  'RecordProcessing',
  'Settings',
  'Player',
])

const routes: RouteRecordRaw[] = [
  {
    name: RouteNames.Root,
    path: '/',
    redirect: { name: RouteNames.RecordersManage },
  },
  {
    name: RouteNames.RecordersManage,
    path: '/recorders-manage',
    component: RecordersManage,
  },
  {
    name: RouteNames.RecordHistory,
    path: '/recorders-manage/history',
    component: RecordersManage,
  },
  {
    name: RouteNames.RecordersSetting,
    path: '/recorders-manage/settings',
    component: RecordersManage,
  },
  {
    name: RouteNames.RecorderEdit,
    path: '/recorders-manage/:id',
    component: RecordersManage,
  },
  {
    name: RouteNames.RecordHistory,
    path: '/recorders-manage/:id/history',
    component: RecordersManage,
  },
  {
    name: RouteNames.RecordProcessing,
    path: '/record-processing',
    component: RecordProcessing,
  },
  {
    name: RouteNames.Settings,
    path: '/settings',
    component: ApplicationSettings,
  },
  {
    name: RouteNames.Player,
    path: '/player',
    component: RecordersManage,
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
