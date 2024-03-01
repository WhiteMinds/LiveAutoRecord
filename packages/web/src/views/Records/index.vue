<template>
  <v-card class="m-4" flat>
    <v-card-title class="my-2 flex items-center justify-between gap-4">
      <div class="flex items-center">
        <v-icon icon="mdi-arrow-left" size="24" class="mr-2" @click="$router.back" />
        <span>录像历史</span>
        <v-btn class="ml-4" size="small" variant="tonal" @click="clearInvalidWarnVisible = true">清理无效记录</v-btn>

        <v-dialog v-model="clearInvalidWarnVisible">
          <v-card title="注意" text="这将移除所有视频文件已被删除的记录，包括搜索过滤之前的文件。">
            <template v-slot:actions>
              <v-spacer></v-spacer>

              <v-btn v-if="!requestingClearInvalid" @click="clearInvalidWarnVisible = false">取消</v-btn>
              <v-btn @click="clearInvalid" :loading="requestingClearInvalid">确认</v-btn>
            </template>
          </v-card>
        </v-dialog>
      </div>

      <v-text-field
        class="w-96 flex-none"
        v-model="search"
        label="搜索"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        hide-details
        density="compact"
      />
    </v-card-title>

    <v-alert class="m-4" type="success" v-model="alert" :text="alert" closable></v-alert>

    <div v-if="loading" class="text-center p-4">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-data-table
      v-else
      item-key="id"
      items-per-page="25"
      :items="records"
      :headers="[
        {
          title: '录制开始时间',
          key: 'startTimestamp',
          value: (record) => format(record.startTimestamp, 'yyyy/MM/dd HH:mm:ss'),
          sortable: true,
          width: 160,
        },
        {
          title: '录制终止时间',
          key: 'stopTimestamp',
          value: (record) => (record.stopTimestamp ? format(record.stopTimestamp, 'yyyy/MM/dd HH:mm:ss') : '/'),
          sortable: true,
          width: 160,
        },
        {
          title: '录制时长',
          key: 'totalTime',
          value: (record) => (record.stopTimestamp ? formatInterval(record) : '/'),
          sortable: true,
          width: 144,
        },
        {
          title: '路径',
          value: 'savePath',
          sortable: false,
        },
        {
          title: '操作',
          key: 'actions',
          value: (record) => record,
          sortable: false,
          width: 256,
        },
      ]"
      :search="search"
    >
      <template v-slot:header.actions="{ column }">
        <span class="pl-3">{{ column.title }}</span>
      </template>

      <template v-slot:item.actions="{ value: record }">
        <div class="flex gap-0">
          <component
            :is="!record.isFileExists ? 'span' : 'router-link'"
            :to="{ name: RouteNames.Player, query: { id: record.id } }"
            target="_blank"
            tabindex="-1"
            :title="!record.isFileExists ? '文件不存在' : ''"
          >
            <v-btn size="small" variant="text" :disabled="!record.isFileExists">播放</v-btn>
          </component>

          <span :title="!record.isFileExists ? '文件不存在' : ''">
            <v-btn
              @click="genSRT(record)"
              size="small"
              variant="text"
              :loading="record.generatingSRT"
              :disabled="!record.isFileExists"
            >
              生成 srt 字幕
            </v-btn>
          </span>
        </div>
      </template>
    </v-data-table>
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
const clearInvalidWarnVisible = ref(false)
const requestingClearInvalid = ref(false)
const alert = ref<false | string>(false)
const search = ref('')

useEffectInLifecycle(() => {
  return InteractionService.onEscapeWhenBody(() => router.back())
})

const refreshRecords = async () => {
  loading.value = true
  const res = await LARServerService.getRecords({
    recorderId,
    page: 1,
    // TODO: 暂时全部拉下来做本地分页
    pageSize: 1e10,
  })
  loading.value = false
  records.value = [...res.items].reverse()
}

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

const clearInvalid = async () => {
  requestingClearInvalid.value = true
  try {
    const count = await LARServerService.clearInvalidRecords({ recorderId })
    alert.value = `共 ${count} 条无效记录被移除`
  } finally {
    requestingClearInvalid.value = false
  }
  clearInvalidWarnVisible.value = false
  refreshRecords()
}

onMounted(refreshRecords)

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
