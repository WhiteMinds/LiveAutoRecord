<template>
  <div class="relative">
    <div class="h-screen overflow-auto bg-[#EFF3F4]">
      <div class="sticky left-0 top-0 p-4 bg-inherit shadow flex">
        <div class="flex-auto">
          排序：
          <select v-model="sortModeId">
            <option v-for="sortMode in sortModes" :value="sortMode.id">
              {{ sortMode.name }}
            </option>
          </select>
          过滤：
          <input v-model="filterText" />
        </div>

        <div class="flex gap-4">
          <router-link :to="{ name: RouteNames.NewRecorder }">
            <Button class="bg-gray-200">+ 新增</Button>
          </router-link>
          <router-link :to="{ name: RouteNames.Records }">
            <Button class="bg-gray-200">录制历史</Button>
          </router-link>
          <router-link :to="{ name: RouteNames.RecordersSetting }">
            <Button class="bg-gray-200">录制设置</Button>
          </router-link>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 p-4">
        <RecorderCard
          v-for="recorder in displayingRecorders"
          :key="recorder.id"
          :recorder="recorder"
          class="flex-shrink-0 flex-grow basis-48"
        />
      </div>
    </div>

    <!-- 这个嵌套路由的设计是为了在子页支持路由的情况下，从管理页切换到其他子页时保持管理页的状态（直接上 KeepAlive 感觉会比较 dirty） -->
    <!-- TODO: 这样设计有个缺陷，在子页刷新时，父路由也会在后台加载与请求，可以优化 -->
    <router-view v-slot="{ Component, route }">
      <!-- showViewIfRouteParentIsRecordersManage -->
      <div
        v-if="
          route.matched.length >= 2 &&
          route.matched[route.matched.length - 2].name ===
            RouteNames.RecordersManage
        "
        class="absolute inset-0 h-screen overflow-auto bg-[#EFF3F4]"
      >
        <component :is="Component" />
      </div>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { ClientRecorder } from '@autorecord/http-server'
import { RecorderService } from '../../services/RecorderService'
import RecorderCard from './RecorderCard.vue'
import Button from '../../components/Button/index.vue'
// TODO: 这个引用会造成 HMR 时循环引用报错，暂时不处理，之后可以把 names 和 routes 拆开
import { RouteNames } from '../../router'
import { computed } from '@vue/reactivity'
import { assert } from '../../utils'

const recorders = ref<ClientRecorder[]>([])

const sortModes: {
  id: string
  name: string
  resolver: (recorder: ClientRecorder) => string | number | null
}[] = [
  {
    id: 'create',
    name: '添加时间',
    resolver: (recorder) => recorder.extra.createTimestamp ?? 0,
  },
  {
    id: 'provider',
    name: '平台',
    resolver: (recorder) => recorder.providerId,
  },
  {
    id: 'channel',
    name: '频道',
    resolver: (recorder) => recorder.channelId,
  },
]
const sortModeId = ref<string>(sortModes[0].id)
const sortMode = computed(() =>
  sortModes.find((mode) => mode.id === sortModeId.value)
)
const filterText = ref<string>('')

const displayingRecorders = computed(() => {
  const fields: (keyof ClientRecorder)[] = ['remarks', 'channelId']
  const result = recorders.value.filter((recorder) =>
    fields.some((field) =>
      recorder[field]?.toString().includes(filterText.value)
    )
  )

  assert(sortMode.value)
  const resolver = sortMode.value.resolver
  result.sort((a, b) => {
    const valA = resolver(a)
    const valB = resolver(b)

    // 空值与非空值同时存在，则非空值排序靠前，如果都为空则顺序不变
    if (valA == null || valB == null) {
      if (valA != null) return 1
      if (valB != null) return -1
      return 0
    }

    // 不同类型的值同时存在，则 number 类型的排序靠前
    if (typeof valA === 'number' && typeof valB === 'string') return -1
    if (typeof valA === 'string' && typeof valB === 'number') return 1

    // 正常排序
    if (typeof valA === 'string' && typeof valB === 'string') {
      return valA.localeCompare(valB)
    }
    if (typeof valA === 'number' && typeof valB === 'number') {
      return valA - valB
    }

    return 0
  })

  return result
})

onMounted(async () => {
  const items = await RecorderService.getReactiveRecorders()
  recorders.value = items
})
</script>
