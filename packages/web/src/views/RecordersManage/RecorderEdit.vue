<template>
  <div class="p-4 bg-[#EFF3F4]">
    <template v-if="isCreating">正在添加新录制频道</template>
    <template v-else>正在编辑录制频道 {{ recorderId }}</template>
    <p>loading:{{ loading }}</p>

    <div v-if="!isCreating">平台：{{ providerName }}</div>
    <div v-else>
      平台：
      <select v-model="recorder.providerId">
        <option v-for="provider in providers" :value="provider.id">
          {{ provider.name }}
        </option>
      </select>
    </div>

    <div>
      频道：
      <template v-if="isCreating">
        <input v-model="recorder.channelId" />
      </template>
      <template v-else>{{ recorder.channelId }}</template>
    </div>

    <div>
      备注：
      <input v-model="recorder.remarks" />
    </div>

    <p v-if="recorder.state === 'recording'">
      正在录制 {{ recorder.usedSource }} / {{ recorder.usedStream }}
    </p>

    <div>
      录制画质：
      <select v-model="recorder.quality">
        <option v-for="quality in Qualities" :value="quality">
          {{ quality }}
        </option>
      </select>
    </div>

    <div>
      视频流优先级（设置后忽略画质设置）：
      <select multiple v-model="recorder.streamPriorities">
        <option v-for="stream in recorder.availableStreams" :value="stream">
          {{ stream }}
        </option>
      </select>
    </div>

    <div>
      视频源优先级：
      <select multiple v-model="recorder.sourcePriorities">
        <option v-for="source in recorder.availableSources" :value="source">
          {{ source }}
        </option>
      </select>
    </div>

    <div>
      禁用自动录制：
      <input type="checkbox" v-model="recorder.disableAutoCheck" />
    </div>

    <div>
      <Button @click="applyOrAddRecorder">
        {{ isCreating ? '添加' : '应用' }}
      </Button>
      <Button v-if="!isCreating" @click="removeRecorder">删除</Button>
      <Button @click="$router.back">取消</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { API, ClientRecorder } from '@autorecord/http-server'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouteNames } from '../../router'
import { LARServerService } from '../../services/LARServerService'
import Button from '../../components/Button/index.vue'

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

const providerName = computed(
  () => providers.find((p) => p.id === recorder.providerId)?.name ?? '未知'
)

onMounted(async () => {
  if (isCreating) return

  const res = await LARServerService.getRecorder({ id: recorderId })
  Object.assign(recorder, res)
  loading.value = false
})

const applyOrAddRecorder = async () => {
  if (isCreating) {
    await LARServerService.addRecorder(recorder)
  } else {
    await LARServerService.updateRecorder({
      ...recorder,
      id: recorderId,
    })
  }
  router.back()
  // TODO: 应该更新下列表页的内容，或者基于推送、本地缓存等
}

const removeRecorder = async () => {
  await LARServerService.removeRecorder({
    id: recorderId,
  })
  router.back()
  // TODO: 应该更新下列表页的内容，或者基于推送、本地缓存等
}
</script>
