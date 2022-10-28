<template>
  <div class="bg-white shadow rounded p-4">
    <p>平台：{{ providerName }}</p>
    <p>
      频道：
      <a :href="recorder.channelURL" target="_blank">
        {{ recorder.channelId }}
      </a>
    </p>
    <p>备注：{{ recorder.remarks }}</p>
    <p>状态：{{ stateText }}</p>
    <div class="flex flex-wrap gap-2 mt-3">
      <Button
        v-if="recorder.state === 'idle'"
        @click="startRecord"
        :disabled="requesting"
      >
        刷新{{ requesting ? '中' : '' }}
      </Button>
      <Button
        v-else
        @click="stopRecord"
        :disabled="requesting || recorder.state === 'stopping-record'"
      >
        终止{{ requesting ? '中' : '' }}
      </Button>

      <router-link
        :to="{ name: RouteNames.RecorderRecords, params: { id: recorder.id } }"
      >
        <Button>历史</Button>
      </router-link>
      <router-link
        :to="{ name: RouteNames.RecorderEdit, params: { id: recorder.id } }"
      >
        <Button>设置</Button>
      </router-link>
      <!-- TODO: 删除做到右上角 hover 时的 x -->
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClientRecorder } from '@autorecord/http-server'
import { computed, ref } from 'vue'
import Button from '../../components/Button/index.vue'
import { RouteNames } from '../../router'
import { RecorderService } from '../../services/RecorderService'

const props = defineProps<{ modelValue: ClientRecorder }>()

// TODO: 这个应该是从服务器拉取一个支持的 providers 列表，临时手写下
const providers = [
  { id: 'DouYu', name: '斗鱼' },
  { id: 'Bilibili', name: 'Bilibili' },
]

const recorder = props.modelValue
const requesting = ref(false)

const providerName = computed(
  () => providers.find((p) => p.id === recorder.providerId)?.name ?? '未知'
)

const stateText = computed(() =>
  recorder.state === 'recording'
    ? `正在录制 ${recorder.usedSource} / ${recorder.usedStream}`
    : recorder.state
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
