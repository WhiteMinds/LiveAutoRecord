import { createRouter as vueCreateRouter, createWebHashHistory, createWebHistory, RouteRecordRaw } from 'vue-router'
import { valuesToMapWithKVEqual } from '../utils'
import RecordersManage from '../views/RecordersManage/index.vue'
import RecorderEdit from '../views/RecordersManage/RecorderEdit.vue'
import Player from '../views/Player/index.vue'
import RecordersManageSettings from '../views/RecordersManage/Settings.vue'
import Records from '../views/Records/index.vue'
import { ClientService } from '../services/ClientService'

export const RouteNames = valuesToMapWithKVEqual([
  'Root',
  'RecordersManage',
  'RecordersSetting',
  'NewRecorder',
  'RecorderEdit',
  'RecorderRecords',
  'Records',
  'Player',
])

// 为了避免 HMR 时的 vue 文件与 router 出现循环引用的问题，这里不直接在 moduleEnv 中
// 创建 router，而是导出一个 factor。
export function createRouter() {
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
      name: RouteNames.Player,
      path: '/player',
      component: Player,
    },
  ]

  return vueCreateRouter({
    history: ClientService.isClientMode() ? createWebHashHistory() : createWebHistory(),
    routes,
  })
}
