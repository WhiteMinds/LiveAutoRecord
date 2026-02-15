<template>
  <div class="bg-[#F0F0F0] min-h-full">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ClientService } from './services/ClientService'

onMounted(() => {
  const clientAPI = ClientService.getClientAPI()
  if (clientAPI) {
    document.title = `LAR 直播自动录制 v${clientAPI.getVersion()}`
  }
})
</script>
