import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { valuesToMapWithKVEqual } from '../utils'
import RecordersManage from '../views/RecordersManage/index.vue'
import RecorderEdit from '../views/RecordersManage/RecorderEdit.vue'
import RecordProcessing from '../views/RecordProcessing/index.vue'
import ApplicationSettings from '../views/ApplicationSettings/index.vue'
import RecordersManageSettings from '../views/RecordersManage/Settings.vue'
import Records from '../views/Records/index.vue'

export const RouteNames = valuesToMapWithKVEqual([
  'Root',
  'RecordersManage',
  'RecordersSetting',
  'NewRecorder',
  'RecorderEdit',
  'RecorderRecords',
  'Records',
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
        component: RecordersManageSettings,
      },
      {
        name: RouteNames.Records,
        path: 'history',
        component: Records,
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
        name: RouteNames.RecorderRecords,
        path: ':id/history',
        component: Records,
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
