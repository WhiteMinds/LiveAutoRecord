<template>
  <div class="bg-[#EFF3F4] min-h-full p-4">
    <div>sticky fixed top: sort / filter, history / settings</div>
    <div class="flex gap-2">
      <RecorderCard
        v-for="recorder in recorders"
        :recorder="recorder"
        class="flex-gap"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { ClientRecorder } from '@autorecord/http-server'
import { LARServerService } from '../../services/LARServerService'
import RecorderCard from './RecorderCard.vue'

const recorders = ref<ClientRecorder[]>([])

onMounted(async () => {
  // TODO: 虽然 API 设计了分页，但考虑到要结合实时性的复杂度，目前先全量取。
  // TODO: 这些数据应该可以全局缓存而不是每次重新请求。
  const res = await LARServerService.getRecorders({ page: 1, pageSize: 9999 })
  recorders.value = res.items
})
</script>
