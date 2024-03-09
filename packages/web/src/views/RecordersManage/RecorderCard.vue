<template>
  <v-card class="flex flex-col overflow-visible">
    <v-badge :model-value="recorder.state === 'recording'" color="green" bordered location="left top">
      <v-card-title class="flex items-center">
        {{ recorder.remarks || `${$t(`platform_name.${recorder.providerId}`)} ${recorder.channelId}` }}
      </v-card-title>
    </v-badge>

    <v-card-text class="pt-0 grid grid-cols-[auto_1fr] items-center gap-x-1 flex-grow">
      <span>{{ $t('recorder.platform') }}:</span>
      <span>{{ $t(`platform_name.${recorder.providerId}`) }}</span>

      <span>{{ $t('recorder.channel') }}:</span>
      <div>
        <a :href="recorder.channelURL" target="_blank" class="hover:underline">
          {{ recorder.channelId }}
        </a>
      </div>

      <span>{{ $t('recorder.remarks') }}:</span>
      <span>{{ recorder.remarks }}</span>

      <span>{{ $t('recorder.state') }}:</span>
      <div>
        <v-tooltip :text="$t('recorder.ffmpeg_args_tip')" :disabled="!ffmpegArgsDialogAvailable">
          <template v-slot:activator="{ props }">
            <span
              :class="normalizeClass([ffmpegArgsDialogAvailable && 'hover:underline cursor-pointer'])"
              @click="ffmpegArgsDialogAvailable && (ffmpegArgsDialogVisible = true)"
              v-bind="props"
            >
              {{ stateText }}
            </span>
          </template>
        </v-tooltip>

        <v-dialog v-model="ffmpegArgsDialogVisible" scrollable>
          <v-card location="center">
            <v-card-title>{{ $t('recorder.ffmpeg_args') }}</v-card-title>
            <v-card-text class="h-48">
              {{ recorder.recordHandle?.ffmpegArgs?.join(' ') }}
            </v-card-text>
          </v-card>
        </v-dialog>
      </div>

      <span :title="$t('recorder.disable_auto_check')">{{ $t('recorder.disable') }}:</span>
      <v-switch
        class="small-switch"
        color="#880000"
        hide-details
        inset
        v-model="recorder.disableAutoCheck"
        :loading="requestingDisableAutoCheck"
      />
    </v-card-text>

    <v-card-actions class="border-t justify-end">
      <v-btn v-if="recorder.state === 'idle'" @click="startRecord" :loading="requestingRecord" size="small">
        {{ $t('recorder.refresh') }}
      </v-btn>
      <v-btn
        v-else
        @click="stopRecord"
        :loading="requestingRecord"
        :disabled="recorder.state === 'stopping-record'"
        size="small"
      >
        {{ $t('recorder.stop') }}
      </v-btn>

      <router-link :to="{ name: RouteNames.RecorderRecords, params: { id: recorder.id } }" tabindex="-1">
        <v-btn size="small">
          {{ $t('recorder.history') }}
        </v-btn>
      </router-link>

      <router-link :to="{ name: RouteNames.RecorderEdit, params: { id: recorder.id } }" tabindex="-1">
        <v-btn size="small">
          {{ $t('common.settings') }}
        </v-btn>
      </router-link>
      <!-- TODO: 删除做到右上角 hover 时的 x -->
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { ClientRecorder } from '@autorecord/http-server'
import { computed, normalizeClass, ref, watch } from 'vue'
import { RouteNames } from '../../router'
import { RecorderService } from '../../services/RecorderService'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { recorder } = defineProps<{ recorder: ClientRecorder }>()
const ffmpegArgsDialogVisible = ref(false)
const ffmpegArgsDialogAvailable = computed(() => recorder.recordHandle?.ffmpegArgs != null)

const requestingRecord = ref(false)
const requestingDisableAutoCheck = ref(false)

const stateText = computed(
  () =>
    t(`recorder.state_${recorder.state}`) +
    (recorder.state === 'recording' && recorder.usedSource ? ` ${recorder.usedSource} / ${recorder.usedStream}` : ''),
)

const startRecord = async () => {
  requestingRecord.value = true
  try {
    await RecorderService.startRecord(recorder.id)
  } finally {
    requestingRecord.value = false
  }
}

const stopRecord = async () => {
  requestingRecord.value = true
  try {
    await RecorderService.stopRecord(recorder.id)
  } finally {
    requestingRecord.value = false
  }
}

const setDisableAutoCheck = async (value: boolean) => {
  requestingDisableAutoCheck.value = true
  try {
    await RecorderService.updateRecorder({
      ...recorder,
      disableAutoCheck: value,
    })
  } finally {
    requestingDisableAutoCheck.value = false
  }
}

watch(
  () => recorder.disableAutoCheck,
  (newVal) => {
    if (newVal == null) return
    setDisableAutoCheck(newVal)
  },
)
</script>

<style scoped>
.small-switch {
  :deep(&.v-switch .v-selection-control) {
    min-height: auto;
  }

  :deep(.v-selection-control__wrapper) {
    height: auto;
    transform: scale(0.5);
    transform-origin: left;
  }
}
</style>
