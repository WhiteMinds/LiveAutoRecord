import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { valuesToMapWithKVEqual } from '../utils'
import RecordersManage from '../views/RecordersManage/index.vue'
import RecorderEdit from '../views/RecordersManage/RecorderEdit.vue'
import RecordProcessing from '../views/RecordProcessing/index.vue'
import ApplicationSettings from '../views/ApplicationSettings/index.vue'

export const RouteNames = valuesToMapWithKVEqual([
  'Root',
  'RecordersManage',
  'RecordersSetting',
  'NewRecorder',
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
    children: [
      {
        name: RouteNames.RecordersSetting,
        path: 'settings',
        component: RecordersManage,
      },
      {
        name: RouteNames.RecordHistory,
        path: 'history',
        component: RecordersManage,
      },
      {
        name: RouteNames.NewRecorder,
        path: 'new',
        component: RecorderEdit,
      },
      {
        name: RouteNames.RecorderEdit,
        path: ':id',
        component: RecorderEdit,
      },
      {
        name: RouteNames.RecordHistory,
        path: ':id/history',
        component: RecordersManage,
      },
    ],
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
