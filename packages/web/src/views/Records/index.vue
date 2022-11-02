<template>
  <div>
    录像历史：
    <div v-for="record in records" class="flex">
      <div class="flex-auto truncate" :title="record.savePath">
        {{ record.savePath }}
      </div>
      <div class="flex-shrink-0 px-2 space-x-2">
        <router-link
          :to="{ name: RouteNames.Player, query: { id: record.id } }"
        >
          <button>play</button>
        </router-link>
        <button @click="genSRT(record.id)">生成 srt 字幕</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { ClientRecord } from '@autorecord/http-server'
import { RouteNames } from '../../router'
import { LARServerService } from '../../services/LARServerService'

const route = useRoute()
// TODO: 这里写的有点和路由层耦合了，应该把 query -> state 的处理放到路由层去
const recorderId =
  route.name === RouteNames.RecorderRecords
    ? String(route.params.id)
    : undefined
const records = ref<ClientRecord[]>([])

onMounted(async () => {
  const res = await LARServerService.getRecords({
    recorderId,
    page: 1,
    pageSize: 9999,
  })
  console.log(res)
  records.value = res.items
})

const genSRT = async (id: string) => {
  const file = await LARServerService.createRecordSRT({ id })
  console.log('gen SRT successful', file)
}
</script>
