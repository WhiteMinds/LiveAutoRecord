<template>
  <v-card class="mx-auto my-4 max-w-xl">
    <v-card-title>
      <template v-if="isCreating">正在添加新录制任务</template>
      <template v-else>正在编辑录制任务 {{ recorderId }}</template>
    </v-card-title>

    <v-card-item>
      <div v-if="loading" class="text-center p-4">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-form v-else>
        <v-select
          label="平台"
          v-model="recorder.providerId"
          :items="providers"
          item-title="name"
          item-value="id"
          required
          :disabled="!isCreating"
        />

        <v-text-field
          label="频道"
          class="mb-4"
          v-model="recorder.channelId"
          @input="onChannelIdInputting"
          @keydown.enter="onChannelIdInputEnd"
          @blur="onChannelIdInputEnd"
          required
          :disabled="!isCreating"
          :loading="parsing"
          persistent-hint
          :hint="
            parseState ??
            '输入频道的 ID 或完整 URL，检测到 URL 时会自动解析为频道 ID'
          "
        />

        <v-text-field label="备注" v-model="recorder.remarks" />

        <v-select
          label="录制画质"
          class="mb-4"
          v-model="recorder.quality"
          :items="Qualities"
          required
          persistent-hint
          hint="根据设定的画质，自动选择合适的视频流"
        />

        <v-select
          label="视频流优先级"
          class="mb-4"
          multiple
          v-model="recorder.streamPriorities"
          :items="recorder.availableStreams"
          clearable
          persistent-hint
          hint="录制时将按前后顺序尝试选择指定流，成功时将忽略画质设置"
        />

        <v-select
          label="视频源优先级"
          class="mb-4"
          multiple
          v-model="recorder.sourcePriorities"
          :items="recorder.availableSources"
          clearable
          persistent-hint
          hint="录制时将按前后顺序尝试选择指定源"
        />

        <v-checkbox label="禁用自动录制" v-model="recorder.disableAutoCheck" />
      </v-form>
    </v-card-item>

    <v-card-actions class="border-t justify-end">
      <v-btn @click="applyOrAddRecorder" :loading="operating || parsing">
        {{ parsing ? '等待解析' : isCreating ? '添加' : '应用' }}
      </v-btn>
      <v-btn v-if="!isCreating" @click="removeRecorder" :loading="operating">
        删除
      </v-btn>
      <v-btn @click="$router.back" :disabled="operating">取消</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { API, ClientRecorder } from '@autorecord/http-server'
import { debounce } from 'lodash-es'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouteNames } from '../../router'
import { LARServerService } from '../../services/LARServerService'
import { RecorderService } from '../../services/RecorderService'

// TODO: manager 现在引入了 ffmpeg-static，不适合直接被 web 引入，需要重构调整，
// 这里先直接手动定义一个一样的。
// import { Qualities } from '@autorecord/manager'
const Qualities = ['lowest', 'low', 'medium', 'high', 'highest'] as const
// TODO: 这个应该是从服务器拉取一个支持的 providers 列表，临时手写下
const providers = [
  { id: 'DouYu', name: '斗鱼' },
  { id: 'Bilibili', name: 'Bilibili' },
]
const defaultProviderId = providers[0].id

const route = useRoute()
const router = useRouter()
const recorderId = String(route.params.id)
const isCreating = route.name === RouteNames.NewRecorder
const loading = ref(!isCreating)
const recorder = reactive<
  Partial<ClientRecorder> & API.addRecorder.Args & API.updateRecorder.Args
>({
  // TODO: 看起来应该把这两个字段整合成 providerInfo / provider？
  providerId: defaultProviderId,
  channelId: '',
  quality: 'low',
  streamPriorities: [],
  sourcePriorities: [],
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

  parseState.value = `正在解析 ${raw}`
  parsing.value = true
  // TODO: 切入新的 parse 时，要抛弃掉旧的请求
  const res = await LARServerService.resolveChannel({ channelURL: raw })
  parsing.value = false
  if (!res) {
    parseState.value = `没有该 URL 能匹配的平台：${raw}`
    return
  }
  parseState.value = `解析完成：${res.providerId} / ${res.channelId} / ${res.owner}`

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
