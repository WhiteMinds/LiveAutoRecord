<template>
  <div class="bg-white shadow rounded p-4">
    <p>平台：{{ recorder.providerName }}</p>
    <p>
      频道：
      <a :href="recorder.channelURL" target="_blank">
        {{ recorder.channelId }}
      </a>
    </p>
    <p>备注：{{ recorder.remarks }}</p>
    <p>状态：{{ stateText }}</p>
    <div class="flex flex-wrap gap-2 mt-3">
      <Button v-if="recorder.state === 'idle'" @click="startRecord">
        刷新
      </Button>
      <Button
        v-else
        @click="stopRecord"
        :disabled="recorder.state === 'stopping-record'"
      >
        终止
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
import { computed } from 'vue'
import Button from '../../components/Button/index.vue'
import { RouteNames } from '../../router'
import { LARServerService } from '../../services/LARServerService'

const props = defineProps<{ modelValue: ClientRecorder }>()
const emit = defineEmits(['update:modelValue'])

const recorder = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const stateText = computed(() =>
  recorder.value.state === 'recording'
    ? `正在录制 ${recorder.value.usedSource} / ${recorder.value.usedStream}`
    : recorder.value.state
)

const startRecord = async () => {
  const res = await LARServerService.startRecord({
    id: recorder.value.id,
  })
  recorder.value = res
}

const stopRecord = async () => {
  const res = await LARServerService.stopRecord({
    id: recorder.value.id,
  })
  recorder.value = res
}
</script>
