<template>
  <v-card>
    <v-card-title>
      {{ recorder.remarks || `${providerName} ${recorder.channelId}` }}
    </v-card-title>

    <v-card-text>
      <div>平台：{{ providerName }}</div>
      <div>
        频道：
        <a :href="recorder.channelURL" target="_blank" class="hover:underline">
          {{ recorder.channelId }}
        </a>
      </div>
      <div>备注：{{ recorder.remarks }}</div>
      <div>
        <span>状态：</span>
        <v-tooltip text="点击查看录制参数" :disabled="!ffmpegArgsDialogAvailable">
          <template v-slot:activator="{ props }">
            <span
              :class="ffmpegArgsDialogAvailable ? ['hover:underline cursor-pointer'] : null"
              @click="ffmpegArgsDialogAvailable && (ffmpegArgsDialogVisible = true)"
              v-bind="props"
            >
              {{ stateText }}
            </span>
          </template>
        </v-tooltip>

        <v-dialog v-model="ffmpegArgsDialogVisible" scrollable>
          <v-card location="center">
            <v-card-title>FFMPEG 录制参数</v-card-title>
            <v-card-text class="h-48">
              {{ recorder.recordHandle?.ffmpegArgs?.join(' ') }}
            </v-card-text>
          </v-card>
        </v-dialog>
      </div>
    </v-card-text>

    <v-card-actions class="border-t justify-end">
      <v-btn v-if="recorder.state === 'idle'" @click="startRecord" :loading="requesting" size="small">刷新</v-btn>
      <v-btn
        v-else
        @click="stopRecord"
        :loading="requesting"
        :disabled="recorder.state === 'stopping-record'"
        size="small"
      >
        终止
      </v-btn>

      <router-link :to="{ name: RouteNames.RecorderRecords, params: { id: recorder.id } }" tabindex="-1">
        <v-btn size="small">历史</v-btn>
      </router-link>

      <router-link :to="{ name: RouteNames.RecorderEdit, params: { id: recorder.id } }" tabindex="-1">
        <v-btn size="small">设置</v-btn>
      </router-link>
      <!-- TODO: 删除做到右上角 hover 时的 x -->
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { ClientRecorder } from '@autorecord/http-server'
import { computed, ref } from 'vue'
import { RouteNames } from '../../router'
import { RecorderService } from '../../services/RecorderService'

const { recorder } = defineProps<{ recorder: ClientRecorder }>()
const ffmpegArgsDialogVisible = ref(false)
const ffmpegArgsDialogAvailable = computed(() => recorder.recordHandle?.ffmpegArgs != null)

// TODO: 这个应该是从服务器拉取一个支持的 providers 列表，临时手写下
const providers = [
  { id: 'DouYu', name: '斗鱼' },
  { id: 'Bilibili', name: 'Bilibili' },
  { id: 'HuYa', name: '虎牙' },
  { id: 'DouYin', name: '抖音' },
]

const requesting = ref(false)

const providerName = computed(() => providers.find((p) => p.id === recorder.providerId)?.name ?? '未知')

const stateText = computed(() =>
  recorder.state === 'recording'
    ? recorder.usedSource
      ? `正在录制 ${recorder.usedSource} / ${recorder.usedStream}`
      : '正在录制'
    : recorder.state,
)

const startRecord = async () => {
  requesting.value = true
  try {
    await RecorderService.startRecord(recorder.id)
  } finally {
    requesting.value = false
  }
}

const stopRecord = async () => {
  requesting.value = true
  try {
    await RecorderService.stopRecord(recorder.id)
  } finally {
    requesting.value = false
  }
}
</script>
