<template>
  <div class="relative">
    <div class="h-screen overflow-auto bg-[#EFF3F4]">
      <div class="sticky left-0 top-0 p-4 bg-inherit shadow flex">
        <div class="flex-auto">sort / filter</div>

        <div class="flex gap-4">
          <router-link :to="{ name: RouteNames.NewRecorder }">
            <Button class="bg-gray-200">+ 新增</Button>
          </router-link>
          <router-link :to="{ name: RouteNames.Records }">
            <Button class="bg-gray-200">录制历史</Button>
          </router-link>
          <router-link :to="{ name: RouteNames.RecordersSetting }">
            <Button class="bg-gray-200">录制设置</Button>
          </router-link>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 p-4">
        <RecorderCard
          v-for="(r, i) in recorders"
          v-model="recorders[i]"
          class="flex-shrink-0 flex-grow basis-48"
        />
      </div>
    </div>

    <!-- 这个嵌套路由的设计是为了在子页支持路由的情况下，从管理页切换到其他子页时保持管理页的状态（直接上 KeepAlive 感觉会比较 dirty） -->
    <!-- TODO: 这样设计有个缺陷，在子页刷新时，父路由也会在后台加载与请求，可以优化 -->
    <router-view v-slot="{ Component, route }">
      <!-- showViewIfRouteParentIsRecordersManage -->
      <div
        v-if="
          route.matched.length >= 2 &&
          route.matched[route.matched.length - 2].name ===
            RouteNames.RecordersManage
        "
        class="absolute inset-0 h-screen overflow-auto bg-[#EFF3F4]"
      >
        <component :is="Component" />
      </div>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { ClientRecorder } from '@autorecord/http-server'
import { LARServerService } from '../../services/LARServerService'
import RecorderCard from './RecorderCard.vue'
import Button from '../../components/Button/index.vue'
// TODO: 这个引用会造成 HMR 时循环引用报错，暂时不处理，之后可以把 names 和 routes 拆开
import { RouteNames } from '../../router'

const recorders = ref<ClientRecorder[]>([])

onMounted(async () => {
  // TODO: 虽然 API 设计了分页，但考虑到要结合实时性的复杂度，目前先全量取。
  // TODO: 这些数据应该可以全局缓存而不是每次重新请求。
  const res = await LARServerService.getRecorders({ page: 1, pageSize: 9999 })
  recorders.value = res.items
})
</script>
