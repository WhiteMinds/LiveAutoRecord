<template>
  <div class="relative">
    <div class="h-screen overflow-auto" :class="{ hidden: currentRouteParentIsRecordersManage }">
      <div class="sticky left-0 top-0 p-4 shadow flex bg-[#F0F0F0] z-[1]">
        <div class="flex flex-auto gap-4">
          <v-select
            :label="$t('recorders.sort')"
            class="basis-64 shrink-0 grow-0"
            v-model="sortMode"
            :items="sortModes"
            :item-title="(item: SortMode) => $t(item.name)"
            :item-value="(item: SortMode) => item"
            hide-details="auto"
          />

          <v-text-field :label="$t('recorders.filter')" class="flex-auto" v-model="filterText" hide-details="auto" />

          <div class="flex gap-2 items-center">
            <router-link class="h-full" :to="{ name: RouteNames.NewRecorder }" tabindex="-1">
              <v-btn class="!h-full" stacked prepend-icon="mdi-plus" :rounded="0" size="small">
                {{ $t('recorders.add_channel') }}
              </v-btn>
            </router-link>
            <router-link class="h-full" :to="{ name: RouteNames.Records }" tabindex="-1">
              <v-btn class="!h-full" stacked prepend-icon="mdi-history" :rounded="0" size="small">
                {{ $t('common.record_history') }}
              </v-btn>
            </router-link>
            <router-link class="h-full" :to="{ name: RouteNames.RecordersSetting }" tabindex="-1">
              <v-btn class="!h-full" stacked prepend-icon="mdi-cog" :rounded="0" size="small">
                {{ $t('common.settings') }}
              </v-btn>
            </router-link>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 p-4">
        <RecorderCard
          v-for="recorder in displayingRecorders"
          :key="recorder.id"
          :recorder="recorder"
          :class="normalizeClass(['flex-shrink-0 flex-grow', locale.startsWith('zh') ? 'basis-60' : 'basis-80'])"
        />
      </div>
    </div>

    <!-- 这个嵌套路由的设计是为了在子页支持路由的情况下，从管理页切换到其他子页时保持管理页的状态（直接上 KeepAlive 感觉会比较 dirty） -->
    <!-- TODO: 这样设计有个缺陷，在子页刷新时，父路由也会在后台加载与请求，可以优化 -->
    <router-view v-slot="{ Component }">
      <!-- showViewIfRouteParentIsRecordersManage -->
      <div v-if="currentRouteParentIsRecordersManage" class="absolute inset-0 h-screen overflow-auto bg-[#F0F0F0]">
        <component :is="Component" />
      </div>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, normalizeClass, watch } from 'vue'
import type { ClientRecorder } from '@autorecord/http-server'
import { RecorderService } from '../../services/RecorderService'
import RecorderCard from './RecorderCard.vue'
import { RouteNames } from '../../router'
import { assert } from '../../utils'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { LARServerService } from '../../services/LARServerService'

const { t, locale } = useI18n()
const route = useRoute()
const currentRouteParentIsRecordersManage = computed(
  () => route.matched.length >= 2 && route.matched[route.matched.length - 2].name === RouteNames.RecordersManage,
)

const recorders = ref<ClientRecorder[]>([])

type SortMode = {
  id: string
  name: string
  resolver: (recorder: ClientRecorder) => string | number | null
}

const sortModes: SortMode[] = [
  {
    id: 'create',
    name: 'recorders.added_time',
    resolver: (recorder) => recorder.extra.createTimestamp ?? 0,
  },
  {
    id: 'provider',
    name: 'recorder.platform',
    resolver: (recorder) => recorder.providerId,
  },
  {
    id: 'channel',
    name: 'recorder.channel',
    resolver: (recorder) => recorder.channelId,
  },
  {
    id: 'state',
    name: 'recorder.state',
    resolver: (recorder) => {
      return ['recording', 'stopping-record', 'idle'].indexOf(recorder.state)
    },
  },
  {
    id: 'remarks',
    name: 'recorder.remarks',
    resolver: (recorder) => {
      if (recorder.remarks === '') return null
      return recorder.remarks ?? null
    },
  },
]
const sortMode = ref(sortModes[0])
const filterText = ref<string>('')

// TODO: 不知道为啥直接 await 会白屏，先简单实现
LARServerService.getSettings({}).then((settings) => {
  sortMode.value = sortModes.find((mode) => mode.id === settings.sortMode) ?? sortModes[0]
})
watch(sortMode, async ({ id }) => {
  const settings = await LARServerService.getSettings({})
  await LARServerService.setSettings({ ...settings, sortMode: id })
})

const displayingRecorders = computed(() => {
  const fields: (keyof ClientRecorder)[] = ['remarks', 'channelId']
  const result = recorders.value.filter((recorder) =>
    fields.some((field) => recorder[field]?.toString().includes(filterText.value)),
  )

  assert(sortMode.value)
  const resolver = sortMode.value.resolver
  result.sort((a, b) => {
    const valA = resolver(a)
    const valB = resolver(b)

    // 空值与非空值同时存在，则非空值排序靠前，如果都为空则顺序不变
    if (valA == null || valB == null) {
      if (valA != null) return -1
      if (valB != null) return 1
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
