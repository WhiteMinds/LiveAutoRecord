<template>
  <div class="bg-[#EFF3F4] min-h-full p-4">
    应用设置页面

    <template v-if="settings">
      <div v-if="isClient">
        关闭时进入托盘：
        <input type="checkbox" v-model="settings.notExitOnAllWindowsClosed" />
      </div>

      <div>
        <!-- TODO: 从产品逻辑上应该放在自动录播的设置里，不过这里为了降低开发的复杂度，先按模块设计来了 -->
        录播开始时发出通知：
        <input type="checkbox" v-model="settings.noticeOnRecordStart" />
      </div>

      <div>
        <Button @click="apply">应用</Button>
        <Button @click="$router.back">取消</Button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { API } from '@autorecord/http-server'
import { onMounted, ref } from 'vue'
import { LARServerService } from '../../services/LARServerService'
import { RecordService } from '../../services/RecordService'
import Button from '../../components/Button/index.vue'
import { ClientService } from '../../services/ClientService'

const settings = ref<API.getSettings.Resp>()
const isClient = ClientService.isClientMode()

onMounted(async () => {
  const res = await LARServerService.getSettings({})
  settings.value = res
})

const apply = async () => {
  if (!settings.value) return
  const newSettings = await LARServerService.setSettings(settings.value)
  // TODO: 前端目前只有 RecordService 用到了 settings，为了降低开发复杂度，这里先直接赋值
  RecordService.noticeOnRecordStart = newSettings.noticeOnRecordStart
}
</script>
