<template>
  <v-card class="mx-auto my-4 max-w-xl">
    <v-card-title>
      <template v-if="isCreating">正在添加新录制频道</template>
      <template v-else>正在编辑录制频道 {{ recorderId }}</template>
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
          v-model="recorder.channelId"
          required
          :disabled="!isCreating"
        />

        <v-text-field label="备注" v-model="recorder.remarks" />

        <v-select
          label="录制画质"
          v-model="recorder.quality"
          :items="Qualities"
          required
        />

        <v-select
          label="视频流优先级（设置后忽略画质设置）"
          multiple
          v-model="recorder.streamPriorities"
          :items="recorder.availableStreams"
        />

        <v-select
          label="视频源优先级"
          multiple
          v-model="recorder.sourcePriorities"
          :items="recorder.availableSources"
        />

        <v-checkbox label="禁用自动录制" v-model="recorder.disableAutoCheck" />
      </v-form>
    </v-card-item>

    <v-card-actions class="border-t justify-end">
      <v-btn @click="applyOrAddRecorder">
        {{ isCreating ? '添加' : '应用' }}
      </v-btn>
      <v-btn v-if="!isCreating" @click="removeRecorder">删除</v-btn>
      <v-btn @click="$router.back">取消</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { API, ClientRecorder } from '@autorecord/http-server'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouteNames } from '../../router'
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

const applyOrAddRecorder = async () => {
  if (isCreating) {
    await RecorderService.addRecorder(recorder)
  } else {
    await RecorderService.updateRecorder({
      ...recorder,
      id: recorderId,
    })
  }
  router.back()
  // TODO: 应该更新下列表页的内容，或者基于推送、本地缓存等
}

const removeRecorder = async () => {
  await RecorderService.removeRecorder(recorderId)
  router.back()
  // TODO: 应该更新下列表页的内容，或者基于推送、本地缓存等
}
</script>
