<template>
  <v-card class="m-4" flat>
    <v-card-title class="my-2 flex items-center justify-between gap-4">
      <div class="flex items-center">
        <v-icon icon="mdi-arrow-left" size="24" class="mr-2" @click="$router.back" />
        <span>{{ $t('records.record_history') }}</span>
        <v-btn class="ml-4" size="small" variant="tonal" @click="clearInvalidWarnVisible = true">
          {{ $t('records.clean_invalid_record') }}
        </v-btn>

        <v-dialog v-model="clearInvalidWarnVisible">
          <v-card :title="$t('records.note')" :text="$t('records.clean_invalid_record_tip')">
            <template v-slot:actions>
              <v-spacer></v-spacer>

              <v-btn v-if="!requestingClearInvalid" @click="clearInvalidWarnVisible = false">
                {{ $t('common.cancel') }}
              </v-btn>
              <v-btn @click="clearInvalid" :loading="requestingClearInvalid">{{ $t('common.confirm') }}</v-btn>
            </template>
          </v-card>
        </v-dialog>
      </div>

      <v-text-field
        class="w-96 flex-none"
        v-model="search"
        :label="$t('records.search')"
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
          title: $t('records.field_start_time'),
          key: 'startTimestamp',
          value: (record) => format(record.startTimestamp, 'yyyy/MM/dd HH:mm:ss'),
          sortable: true,
          width: $i18n.locale.startsWith('zh') ? 160 : 200,
        },
        {
          title: $t('records.field_end_time'),
          key: 'stopTimestamp',
          value: (record) => (record.stopTimestamp ? format(record.stopTimestamp, 'yyyy/MM/dd HH:mm:ss') : '/'),
          sortable: true,
          width: $i18n.locale.startsWith('zh') ? 160 : 200,
        },
        {
          title: $t('records.field_duration'),
          key: 'totalTime',
          value: (record) => (record.stopTimestamp ? formatInterval(record) : '/'),
          sortable: true,
          width: 144,
        },
        {
          title: $t('records.field_path'),
          value: 'savePath',
          sortable: false,
        },
        {
          title: $t('records.field_action'),
          key: 'actions',
          value: (record) => record,
          sortable: false,
          width: $i18n.locale.startsWith('zh') ? 256 : 320,
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
            :title="!record.isFileExists ? $t('records.file_not_exists') : ''"
          >
            <v-btn size="small" variant="text" :disabled="!record.isFileExists">{{ $t('records.play') }}</v-btn>
          </component>

          <span :title="!record.isFileExists ? $t('records.file_not_exists') : ''">
            <v-btn
              @click="genSRT(record)"
              size="small"
              variant="text"
              :loading="record.generatingSRT"
              :disabled="!record.isFileExists"
            >
              {{ $t('records.generate_srt') }}
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
import { intervalToDuration } from 'date-fns'
import { RouteNames } from '../../router'
import { LARServerService } from '../../services/LARServerService'
import { useEffectInLifecycle } from '../../hooks'
import { InteractionService } from '../../services/InteractionService'
import { useI18n } from 'vue-i18n'
import { useDateFNS } from '../../i18n'

const { t } = useI18n()
const { format, formatDuration } = useDateFNS()
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
    alert.value = t('records.invalid_record_removed', { count })
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

  return formatDuration(duration)
}
</script>
