<template>
  <v-card class="mx-auto my-4 max-w-2xl">
    <v-card-title>录播全局设置</v-card-title>

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

    <v-card-title>应用设置</v-card-title>

    <v-card-item>
      <div v-if="!settings" class="text-center p-4">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-form v-else>
        <v-checkbox
          v-if="isClient"
          label="关闭时进入托盘"
          v-model="settings.notExitOnAllWindowsClosed"
        />

        <!-- TODO: 从产品逻辑上应该放在自动录播的设置里，不过这里为了降低开发的复杂度，先按模块设计来了 -->
        <v-checkbox
          label="录播开始时发出通知"
          v-model="settings.noticeOnRecordStart"
        />
      </v-form>
    </v-card-item>

    <v-card-actions class="border-t justify-end">
      <v-btn @click="apply">应用</v-btn>
      <v-btn @click="$router.back">取消</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { API } from '@autorecord/http-server'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LARServerService } from '../../services/LARServerService'
import { ClientService } from '../../services/ClientService'
import { RecordService } from '../../services/RecordService'

const isClient = ClientService.isClientMode()
const router = useRouter()
const manager = ref<API.getManager.Resp>()
const settings = ref<API.getSettings.Resp>()

onMounted(async () => {
  manager.value = await LARServerService.getManager({})
  settings.value = await LARServerService.getSettings({})
})

const apply = async () => {
  if (!manager.value) return
  await LARServerService.updateManager(manager.value)
  router.back()

  if (!settings.value) return
  const newSettings = await LARServerService.setSettings(settings.value)
  // TODO: 前端目前只有 RecordService 用到了 settings，为了降低开发复杂度，这里先直接赋值
  RecordService.noticeOnRecordStart = newSettings.noticeOnRecordStart
}
</script>
