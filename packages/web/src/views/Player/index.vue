<template>
  <div class="h-full p-4">
    <div ref="container" class="max-h-full max-w-full"></div>
  </div>
</template>

<script setup lang="ts">
import DPlayer from 'dplayer'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { assert } from '../../utils'
import { LARServerService } from '../../services/LARServerService'

const container = ref<HTMLDivElement>()

const route = useRoute()
const id = typeof route.query.id === 'string' ? route.query.id : null

onMounted(async () => {
  if (id === null) return
  assert(container.value)
  const videoURL = await LARServerService.getRecordVideoURL({ id })
  // 浏览器会缓存 fmp4 的 duration，需要加个 query 来 bypass 缓存
  const videoURLWithBypassCache = `${videoURL}?_=${Date.now()}`
  const dp = new DPlayer({
    container: container.value,
    autoplay: true,
    video: {
      url: videoURLWithBypassCache,
      type: 'mp4',
    },
    danmaku: {
      // 下面通过 apiBackend 去 hack 实现，所以这里字段随便填了。
      id: '',
      api: '',
    },
    // DPlayer 设计的 API 常规使用方式无法满足我的使用需求，所以下面用稍微 hack 点的方式来完成目标。
    apiBackend: {
      async read({ success }) {
        const res = await LARServerService.getRecordExtraData({ id })

        const start = res.meta.recordStartTimestamp
        const comments = res.messages
          .filter(
            (msg): msg is typeof msg & { type: 'comment' } =>
              msg.type === 'comment'
          )
          .map((msg) => ({
            time: (msg.timestamp - start) / 1e3,
            text: msg.text,
          }))
        success(comments)
      },
      send() {},
    },
  })
  // TODO: 不知道为啥没效果，之后调查看看。
  dp.play()
  dp.fullScreen.request('web')
})
</script>
