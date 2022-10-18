<template>
  <div class="bg-[#EFF3F4] min-h-full p-4">
    <!-- Player -->
    <div ref="container"></div>
  </div>
</template>

<script setup lang="ts">
import flvjs from 'flv.js'
import DPlayer from 'dplayer'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { assert } from '../../utils'
import { LARServerService } from '../../services/LARServerService'

provideFLVSupportToDPlayer()

const container = ref<HTMLDivElement>()

const route = useRoute()
const id = String(route.query.id) || 'd785eb23-7018-41f7-a03e-1f65fa7b3913'
const videoURL = 'http://localhost:8085/api' + `/records/${id}/video`

onMounted(async () => {
  assert(container.value)
  const dp = new DPlayer({
    container: container.value,
    autoplay: true,
    video: {
      url: videoURL,
      type: 'flv',
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
})

function provideFLVSupportToDPlayer() {
  // 看起来 DPlayer 是从 window 上拿这个对象的，不知道有没有其他方式，暂时先这样实现了。
  ;(window as any).flvjs = flvjs
}
</script>
