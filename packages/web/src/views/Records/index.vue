<template>
  <v-card class="m-4">
    <v-card-title class="flex items-center">
      <v-icon icon="mdi-arrow-left" size="24" class="mr-2" @click="$router.back" />
      录像历史
    </v-card-title>

    <div v-if="loading" class="text-center p-4">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!--
      TODO: 3.0.1 的 vuetify 还不支持 data-table，所以要手动实现 sort 的功能，
      不过为了省事，还是先等等它的开发进度看看。
      https://github.com/vuetifyjs/vuetify/issues/13479
    -->
    <v-table v-else>
      <thead>
        <tr>
          <th class="text-left w-40">录制开始时间</th>
          <th class="text-left w-40">录制终止时间</th>
          <th class="text-left w-36">录制时长</th>
          <th class="text-left">路径</th>
          <th class="text-left w-64 pl-7">操作</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="record in records" :key="record.id">
          <td>
            {{ format(record.startTimestamp, 'yyyy/MM/dd HH:mm:ss') }}
          </td>
          <td>
            {{ record.stopTimestamp ? format(record.stopTimestamp, 'yyyy/MM/dd HH:mm:ss') : '/' }}
          </td>
          <td>
            {{ record.stopTimestamp ? formatInterval(record) : '/' }}
          </td>
          <td>{{ record.savePath }}</td>
          <td>
            <div class="flex gap-0">
              <router-link :to="{ name: RouteNames.Player, query: { id: record.id } }" target="_blank" tabindex="-1">
                <v-btn size="small" variant="text">播放</v-btn>
              </router-link>
              <v-btn @click="genSRT(record)" size="small" variant="text" :loading="record.generatingSRT">
                生成 srt 字幕
              </v-btn>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ClientRecord } from '@autorecord/http-server'
import { format, formatDuration, intervalToDuration } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RouteNames } from '../../router'
import { LARServerService } from '../../services/LARServerService'
import { useEffectInLifecycle } from '../../hooks'
import { InteractionService } from '../../services/InteractionService'

const route = useRoute()
const router = useRouter()
// TODO: 这里写的有点和路由层耦合了，应该把 query -> state 的处理放到路由层去
const recorderId = route.name === RouteNames.RecorderRecords ? String(route.params.id) : undefined

type Record = ClientRecord & { generatingSRT?: boolean }
const records = ref<Record[]>([])
const loading = ref(true)

useEffectInLifecycle(() => {
  return InteractionService.onEscapeWhenBody(() => router.back())
})

onMounted(async () => {
  const res = await LARServerService.getRecords({
    recorderId,
    page: 1,
    pageSize: 9999,
  })
  loading.value = false
  records.value = [...res.items].reverse()
})

const genSRT = async (record: Record) => {
  if (record.generatingSRT) return
  record.generatingSRT = true
  try {
    const file = await LARServerService.createRecordSRT({ id: record.id })
    // TODO: 通知
  } finally {
    record.generatingSRT = false
  }
}

function formatInterval(record: ClientRecord) {
  const stopTimestamp = record.stopTimestamp ?? record.startTimestamp
  const time = stopTimestamp - record.startTimestamp

  const duration = intervalToDuration({
    start: record.startTimestamp,
    // formatDuration 无法处理小于 1s 的情况
    end: Math.max(record.startTimestamp + 1000, record.stopTimestamp ?? 0),
  })
  if (time >= 60e3) {
    duration.seconds = 0
  }

  return formatDuration(duration, { locale: zhCN })
}
</script>
