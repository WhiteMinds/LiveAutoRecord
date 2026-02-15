import { createPinia, defineStore } from 'pinia'
import type { ClientRecorder } from '@autorecord/http-server'
import { App } from 'vue'
import { RecorderService } from '../services/RecorderService'

export function initStore(app: App) {
  const pinia = createPinia()
  app.use(pinia)

  // TODO: 这个函数在这里调用挺奇怪的，设计有点问题。
  RecorderService.startUpdateStoreOnServerMessage()
}

export interface Store {
  recorders: ClientRecorder[]
}

/**
 * 目前 store 没有太多繁重的任务，考虑到 vue 不像 react 那样 immutable object，
 * 直接修改 state 会造成的问题不会太多，牺牲的只是 state 操作源的唯一性，上 action 的话
 * 感觉复杂度的提升有点划不来，所以目前先由各个使用处自行修改 state 内容。
 */
export const useStore = defineStore<'main', Store>('main', {
  state: () => ({
    recorders: [],
  }),
})
