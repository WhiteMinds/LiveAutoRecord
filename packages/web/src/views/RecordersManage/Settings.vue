<template>
  <v-card class="mx-auto my-4 max-w-2xl">
    <v-card-title>录制全局设置</v-card-title>

    <v-card-item>
      <div v-if="!manager" class="text-center p-4">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-form v-else>
        <v-text-field
          label="保存路径规则"
          v-model="manager.savePathRule"
          append-inner-icon="mdi-help-circle"
          @click:append-inner="
            savePathRuleAlertVisible = !savePathRuleAlertVisible
          "
        />
        <v-alert v-model="savePathRuleAlertVisible" closable>
          <v-alert-title>如何在保存路径中使用变量？</v-alert-title>
          <p class="text-subtitle-1 m-2">
            使用 `{}` 包裹住变量名即可，如 `/path/{platform}`
          </p>
          <v-table>
            <thead>
              <tr>
                <th class="text-left">变量名</th>
                <th class="text-left">变量值</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>platform</td>
                <td>录制的平台名，如 `Bilibili`</td>
              </tr>
              <tr>
                <td>channelId</td>
                <td>录制的频道 id，如 `196`</td>
              </tr>
              <tr>
                <td>title</td>
                <td>频道的标题，如 `晚上好呀~`</td>
              </tr>
              <tr>
                <td>owner</td>
                <td>频道主的名称，如 `小缘`</td>
              </tr>
              <tr>
                <td>sec</td>
                <td>录制开始时的秒数，如 `59`</td>
              </tr>
              <tr>
                <td>year</td>
                <td>录制开始时的年份，如 `2020`</td>
              </tr>
              <tr>
                <td>month</td>
                <td>录制开始时的月份，如 `01`</td>
              </tr>
              <tr>
                <td>date</td>
                <td>录制开始时的日子，如 `15`</td>
              </tr>
              <tr>
                <td>hour</td>
                <td>录制开始时的钟头，如 `23`</td>
              </tr>
              <tr>
                <td>min</td>
                <td>录制开始时的分钟，如 `30`</td>
              </tr>
              <tr>
                <td>sec</td>
                <td>录制开始时的秒数，如 `59`</td>
              </tr>
            </tbody>
          </v-table>
        </v-alert>

        <v-text-field
          label="FFMPEG 输出参数"
          v-model="manager.ffmpegOutputArgs"
        />

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

        <v-checkbox
          label="录制结束时自动生成 SRT 字幕文件"
          v-model="settings.autoGenerateSRTOnRecordStop"
        />

        <v-checkbox
          label="录制开始时发出通知"
          v-model="settings.noticeOnRecordStart"
        />
      </v-form>
    </v-card-item>

    <v-card-title>关于本软件</v-card-title>

    <v-card-item>
      <v-table>
        <tbody>
          <tr>
            <td>开源地址</td>
            <td>
              <a
                href="https://github.com/WhiteMinds/LiveAutoRecord"
                target="_blank"
              >
                https://github.com/WhiteMinds/LiveAutoRecord
              </a>
            </td>
          </tr>
          <tr>
            <td>BUG / 意见反馈</td>
            <td>
              <a
                href="https://github.com/WhiteMinds/LiveAutoRecord/issues"
                target="_blank"
              >
                https://github.com/WhiteMinds/LiveAutoRecord/issues
              </a>
            </td>
          </tr>
          <tr>
            <td>作者</td>
            <td>
              <a href="https://space.bilibili.com/23505769" target="_blank">
                WhiteMind
              </a>
            </td>
          </tr>
          <tr>
            <td>邮箱</td>
            <td>whitemind@qq.com</td>
          </tr>
        </tbody>
      </v-table>
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
const savePathRuleAlertVisible = ref(false)

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
