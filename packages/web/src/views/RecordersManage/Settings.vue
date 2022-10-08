<template>
  <template v-if="!manager">
    <p>loading</p>
  </template>

  <div v-else class="p-4 bg-[#EFF3F4]">
    <p>录播全局设置</p>

    <div>
      保存路径规则：
      <input v-model="manager.savePathRule" />
    </div>

    <div>
      自动检查并录制：
      <input type="checkbox" v-model="manager.autoCheckLiveStatusAndRecord" />
    </div>

    <div>
      <Button @click="apply">应用</Button>
      <Button @click="$router.back">取消</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { API } from '@autorecord/http-server'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LARServerService } from '../../services/LARServerService'
import Button from '../../components/Button/index.vue'

const router = useRouter()
const manager = ref<API.getManager.Resp>()

onMounted(async () => {
  const res = await LARServerService.getManager({})
  manager.value = res
})

const apply = async () => {
  if (!manager.value) return
  await LARServerService.updateManager(manager.value)
  router.back()
}
</script>
