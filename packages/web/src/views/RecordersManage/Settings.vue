<template>
  <v-card class="mx-auto my-4 max-w-2xl">
    <v-card-title class="flex gap-3 items-center">
      录制全局设置
      <v-btn v-if="isChanged" size="small" variant="tonal" @click="reset">重置</v-btn>
    </v-card-title>

    <v-card-item>
      <div v-if="!manager" class="text-center p-4">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-form v-else>
        <v-text-field
          label="保存路径规则"
          v-model="manager.savePathRule"
          append-inner-icon="mdi-help-circle"
          @click:append-inner="savePathRuleAlertVisible = !savePathRuleAlertVisible"
        />
        <v-alert v-model="savePathRuleAlertVisible" closable>
          <v-alert-title>如何在保存路径中使用变量？</v-alert-title>
          <p class="text-subtitle-1 m-2">使用 `{}` 包裹住变量名即可，如 `/path/{platform}`</p>
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

        <v-text-field label="FFMPEG 输出参数" v-model="manager.ffmpegOutputArgs" />

        <v-checkbox label="自动检查并录制" v-model="manager.autoCheckLiveStatusAndRecord" hide-details />

        <v-text-field
          v-if="manager.autoCheckLiveStatusAndRecord"
          label="检查间隔（毫秒）"
          v-model="manager.autoCheckInterval"
          type="number"
        />
      </v-form>
    </v-card-item>

    <v-card-title>{{ t('settings.app_settings') }}</v-card-title>

    <v-card-item>
      <div v-if="!settings" class="text-center p-4">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-form v-else>
        <v-select
          label="语言 - Language"
          class="mb-2"
          v-model="innerLocale"
          density="comfortable"
          :items="[
            { name: '简体中文', value: 'zh' },
            { name: 'Русский язык', value: 'ru' },
            { name: 'English', value: 'en' },
          ]"
          item-title="name"
          item-value="value"
          hide-details="auto"
        />

        <v-checkbox v-if="isClient" label="关闭时进入托盘" v-model="settings.notExitOnAllWindowsClosed" hide-details />

        <v-checkbox
          label="录制结束时自动生成 SRT 字幕文件"
          v-model="settings.autoGenerateSRTOnRecordStop"
          hide-details
        />

        <v-checkbox label="自动移除 0kb 的录制记录" v-model="settings.autoRemoveRecordWhenTinySize" hide-details />

        <v-checkbox label="录制开始时发出通知" v-model="settings.noticeOnRecordStart" hide-details />

        <v-text-field
          v-if="settings.noticeOnRecordStart"
          label="通知内容格式"
          v-model="settings.noticeFormat"
          persistent-placeholder
          :placeholder="t('settings.default_notice_format')"
          append-inner-icon="mdi-help-circle"
          @click:append-inner="noticeFormatAlertVisible = !noticeFormatAlertVisible"
        />
        <v-alert v-model="noticeFormatAlertVisible" closable>
          <v-alert-title>如何在通知内容格式中使用变量？</v-alert-title>
          <p class="text-subtitle-1 m-2">使用 `{}` 包裹住变量名即可，如 `频道 {channelId} 开始录制`</p>
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
                <td>remarks</td>
                <td>频道的备注，为用户自定义的值</td>
              </tr>
            </tbody>
          </v-table>
        </v-alert>

        <v-checkbox label="调试模式" v-model="settings.debugMode" hide-details />
      </v-form>
    </v-card-item>

    <v-card-title>关于本软件</v-card-title>

    <v-card-item>
      <v-table>
        <tbody>
          <tr>
            <td>版本</td>
            <td>v{{ version }}</td>
          </tr>
          <tr>
            <td>开源地址</td>
            <td>
              <a href="https://github.com/WhiteMinds/LiveAutoRecord" target="_blank">
                https://github.com/WhiteMinds/LiveAutoRecord
              </a>
            </td>
          </tr>
          <tr>
            <td>BUG / 意见反馈</td>
            <td>
              <a href="https://github.com/WhiteMinds/LiveAutoRecord/issues" target="_blank">
                https://github.com/WhiteMinds/LiveAutoRecord/issues
              </a>
            </td>
          </tr>
          <tr>
            <td>作者</td>
            <td>
              <a href="https://space.bilibili.com/23505769" target="_blank">WhiteMind</a>
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
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { LARServerService } from '../../services/LARServerService'
import { ClientService } from '../../services/ClientService'
import { RecordService } from '../../services/RecordService'
import { useEffectInLifecycle } from '../../hooks'
import { InteractionService } from '../../services/InteractionService'

const isClient = ClientService.isClientMode()
const version = ClientService.getClientAPI()?.getVersion()
const router = useRouter()
const manager = ref<API.getManager.Resp>()
const managerDefault = ref<API.getManagerDefault.Resp>()
const settings = ref<API.getSettings.Resp>()
const savePathRuleAlertVisible = ref(false)
const noticeFormatAlertVisible = ref(false)

// 这里的实现方式是为了让设置页面内部可以预览语言更改后的效果
const { locale: appLocale } = useI18n()
const innerLocale = ref(appLocale.value)
const { t } = useI18n({ locale: innerLocale.value })

useEffectInLifecycle(() => {
  return InteractionService.onEscapeWhenBody(() => router.back())
})

onMounted(async () => {
  manager.value = await LARServerService.getManager({})
  managerDefault.value = await LARServerService.getManagerDefault({})
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
  RecordService.noticeFormat = newSettings.noticeFormat ?? ''
  appLocale.value = innerLocale.value
}

const reset = async () => {
  manager.value = { ...managerDefault.value }
}

const isChanged = computed(() => JSON.stringify(manager.value) !== JSON.stringify(managerDefault.value))
</script>
