<template>
  <div class="p-4 bg-[#EFF3F4]">
    <v-card title="录播全局设置" class="mx-auto my-4 max-w-2xl">
      <v-card-item>
        <div v-if="!manager" class="text-center p-4">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <v-form v-else>
          <v-text-field label="保存路径规则" v-model="manager.savePathRule" />

          <v-checkbox
            label="自动检查并录制"
            v-model="manager.autoCheckLiveStatusAndRecord"
          />
        </v-form>
      </v-card-item>

      <v-card-actions class="border-t justify-end">
        <v-btn @click="apply">应用</v-btn>
        <v-btn @click="$router.back">取消</v-btn>
      </v-card-actions>
    </v-card>
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
