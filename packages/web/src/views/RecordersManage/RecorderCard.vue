<template>
  <div class="bg-white shadow rounded p-2">
    <p>平台：{{ recorder.providerName }}</p>
    <p>
      频道：
      <a :href="recorder.channelURL" target="_blank">
        {{ recorder.channelId }}
      </a>
    </p>
    <p>备注：{{ recorder.remarks }}</p>
    <p>状态：{{ recorder.state }}</p>
  </div>
</template>

<script setup lang="ts">
import { ClientRecorder } from '@autorecord/http-server'

defineProps<{ recorder: ClientRecorder }>()
</script>
