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
import { onUnmounted } from 'vue'

// 这里手动暴露一个 dplayer 未声明类型导出的属性
declare module 'dplayer' {
  export default interface DPlayer {
    focus: boolean
  }
}

const container = ref<HTMLDivElement>()
const dPlayer = ref<DPlayer>()

const route = useRoute()
const id = typeof route.query.id === 'string' ? route.query.id : null

onMounted(async () => {
  if (id === null) return
  assert(container.value)
  const record = await LARServerService.getRecord({ id })
  document.title = record.savePath
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
        if (res.meta.title != null) document.title = `${res.meta.title} - ${record.savePath}`

        const start = res.meta.recordStartTimestamp
        const comments = res.messages
          .filter((msg): msg is typeof msg & { type: 'comment' } => msg.type === 'comment')
          .map((msg) => ({
            time: (msg.timestamp - start) / 1e3,
            text: msg.text,
          }))
        success(comments)
      },
      send() {},
    },
  })
  dPlayer.value = dp
  // TODO: 不知道为啥没效果，之后调查看看。
  dp.play()
  dp.fullScreen.request('web')

  document.addEventListener('keydown', keyHandler)
})

onUnmounted(() => {
  document.removeEventListener('keydown', keyHandler)
})

// 部分逻辑参考自 https://github.com/DIYgod/DPlayer/blob/f00e304ca364656fa07a9c3624093e66b6db015e/src/js/hotkey.js
function keyHandler(event: KeyboardEvent) {
  const dp = dPlayer.value
  if (dp == null || !dp.focus) return

  const tag = document.activeElement?.tagName.toUpperCase()
  const editable = document.activeElement?.getAttribute('contenteditable')
  if (!(tag !== 'INPUT' && tag !== 'TEXTAREA' && editable !== '' && editable !== 'true')) return

  console.log('event.keyCode', event.key, event.code, dp.video.playbackRate)
  const speedList = [0.5, 0.75, 1, 1.25, 1.5, 2]
  switch (event.key) {
    case '[': {
      let idx = speedList.indexOf(dp.video.playbackRate)
      idx -= 1
      if (idx <= 0) idx = 0
      dp.video.playbackRate = speedList[idx]
      dp.notice(`Speed ${dp.video.playbackRate.toFixed(2)}`, 2e3, 0.8)
      break
    }

    case ']': {
      let idx = speedList.indexOf(dp.video.playbackRate)
      idx += 1
      if (idx >= speedList.length) idx = speedList.length - 1
      dp.video.playbackRate = speedList[idx]
      dp.notice(`Speed ${dp.video.playbackRate.toFixed(2)}`, 2e3, 0.8)
      break
    }
  }
}
</script>
