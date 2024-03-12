<template>
  <v-card class="mx-auto my-4 max-w-xl">
    <v-card-title>
      <template v-if="isCreating">{{ $t('edit.create_title') }}</template>
      <template v-else>{{ $t('edit.edit_title') }} {{ recorderId }}</template>
    </v-card-title>

    <v-card-item>
      <div v-if="loading" class="text-center p-4">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-form v-else>
        <v-select
          :label="$t('recorder.platform')"
          v-model="recorder.providerId"
          :items="providers"
          :item-title="(item: ProviderInfo) => $t(`platform_name.${item.id}`)"
          item-value="id"
          required
          :disabled="!isCreating"
        />

        <v-text-field
          :label="$t('recorder.channel')"
          class="mb-4"
          v-model="recorder.channelId"
          @input="onChannelIdInputting"
          @keydown.enter="onChannelIdInputEnd"
          @blur="onChannelIdInputEnd"
          required
          :disabled="!isCreating"
          :loading="parsing"
          persistent-hint
          :hint="parseState ?? $t('edit.channel_input_hint')"
        />

        <v-text-field :label="$t('recorder.remarks')" v-model="recorder.remarks" />

        <v-select
          :label="$t('recorder.quality')"
          class="mb-4"
          v-model="recorder.quality"
          :items="Qualities"
          :item-title="(item: string) => $t(`quality.${item}`)"
          :item-value="(item: string) => item"
          required
          persistent-hint
          :hint="$t('edit.quality_input_hint')"
        />

        <v-select
          :label="$t('recorder.stream_priority')"
          class="mb-4"
          multiple
          v-model="recorder.streamPriorities"
          :items="recorder.availableStreams"
          clearable
          persistent-hint
          :hint="$t('edit.stream_priority_input_hint')"
        />

        <v-select
          :label="$t('recorder.source_priority')"
          class="mb-4"
          multiple
          v-model="recorder.sourcePriorities"
          :items="recorder.availableSources"
          clearable
          persistent-hint
          :hint="$t('edit.source_priority_input_hint')"
        />

        <v-checkbox :label="$t('recorder.disable_auto_check')" v-model="recorder.disableAutoCheck" />
      </v-form>
    </v-card-item>

    <v-card-actions class="border-t justify-end">
      <v-btn @click="applyOrAddRecorder" :loading="operating || parsing">
        {{ parsing ? $t('edit.waiting_for_parsing') : isCreating ? $t('common.add') : $t('common.apply') }}
      </v-btn>
      <v-btn v-if="!isCreating" @click="removeRecorder" :loading="operating">{{ $t('common.delete') }}</v-btn>
      <v-btn @click="$router.back" :disabled="operating">{{ $t('common.cancel') }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { API, ClientRecorder } from '@autorecord/http-server'
import { debounce } from 'lodash-es'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEffectInLifecycle } from '../../hooks'
import { RouteNames } from '../../router'
import { InteractionService } from '../../services/InteractionService'
import { LARServerService } from '../../services/LARServerService'
import { RecorderService } from '../../services/RecorderService'
import { useI18n } from 'vue-i18n'

// TODO: manager 现在引入了 ffmpeg-static，不适合直接被 web 引入，需要重构调整，
// 这里先直接手动定义一个一样的。
// import { Qualities } from '@autorecord/manager'
const Qualities = ['lowest', 'low', 'medium', 'high', 'highest'] as const
// TODO: 这个应该是从服务器拉取一个支持的 providers 列表，临时手写下
type ProviderInfo = { id: string }
const providers: ProviderInfo[] = [{ id: 'DouYu' }, { id: 'Bilibili' }, { id: 'HuYa' }, { id: 'DouYin' }]
const defaultProviderId = providers[0].id

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const recorderId = String(route.params.id)
const isCreating = route.name === RouteNames.NewRecorder
const loading = ref(!isCreating)
const recorder = reactive<Partial<ClientRecorder> & API.addRecorder.Args & API.updateRecorder.Args>({
  providerId: defaultProviderId,
  channelId: '',
  quality: 'medium',
  streamPriorities: [],
  sourcePriorities: [],
})

useEffectInLifecycle(() => {
  return InteractionService.onEscapeWhenBody(() => router.back())
})

onMounted(async () => {
  if (isCreating) return

  const res = await RecorderService.getReactiveRecorder(recorderId)
  Object.assign(recorder, res)
  loading.value = false
})

const parsing = ref(false)
const parseState = ref<string>()
const parseChannelURL = async (raw: string) => {
  raw = raw.trim()
  const isURL = raw.startsWith('http://') || raw.startsWith('https://')
  if (!isURL) {
    parsing.value = false
    parseState.value = undefined
    return
  }

  parseState.value = `${t('edit.parse_state_parsing')} ${raw}`
  parsing.value = true
  // TODO: 切入新的 parse 时，要抛弃掉旧的请求
  const res = await LARServerService.resolveChannel({ channelURL: raw })
  parsing.value = false
  if (!res) {
    parseState.value = `${t('edit.parse_state_error')}: ${raw}`
    return
  }
  parseState.value = `${t('edit.parse_state_parsed')}: ${res.providerId} / ${res.channelId} / ${res.owner}`

  recorder.providerId = res.providerId
  recorder.channelId = res.channelId
  if (recorder.remarks == null || !recorder.remarks.trim()) {
    recorder.remarks = res.owner
  }
}
const debouncedParseChannelURL = debounce(parseChannelURL, 500)

const onChannelIdInputting = () => {
  debouncedParseChannelURL(recorder.channelId)
}
const onChannelIdInputEnd = () => {
  debouncedParseChannelURL.flush()
}

const operating = ref(false)

const applyOrAddRecorder = async () => {
  operating.value = true
  if (isCreating) {
    await RecorderService.addRecorder(recorder)
  } else {
    await RecorderService.updateRecorder({
      ...recorder,
      id: recorderId,
    })
  }
  operating.value = false

  router.back()
}

const removeRecorder = async () => {
  operating.value = true
  await RecorderService.removeRecorder(recorderId)
  operating.value = false

  router.back()
}
</script>
