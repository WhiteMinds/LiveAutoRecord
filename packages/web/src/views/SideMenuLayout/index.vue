<template>
  <div class="flex min-h-screen">
    <div
      class="flex-shrink-0 w-48 p-2 bg-[#EFF3F4] space-y-1 border-r border-r-[#E3E5E6]"
    >
      <MenuItem :route-name="RouteNames.RecordersManage">
        <template #icon="{ svgProps }">
          <IconRecorder v-bind="svgProps" />
        </template>
        自动录播
      </MenuItem>
      <MenuItem :route-name="RouteNames.RecordProcessing">
        <template #icon="{ svgProps }">
          <IconVideo v-bind="svgProps" />
        </template>
        录播处理
      </MenuItem>
      <MenuItem :route-name="RouteNames.Settings">
        <template #icon="{ svgProps }">
          <IconSettings v-bind="svgProps" />
        </template>
        设置
      </MenuItem>
    </div>

    <div class="flex-grow">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouteNames } from '../../router'
import MenuItem from './MenuItem.vue'
import IconRecorder from './recorder.svg'
import IconVideo from './video.svg'
import IconSettings from './settings.svg'
</script>
