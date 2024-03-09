<template>
  <v-card class="mx-auto my-4 max-w-2xl">
    <v-card-title class="flex gap-3 items-center">
      {{ t('settings.global_recording_settings') }}
      <v-btn v-if="isChanged" size="small" variant="tonal" @click="reset">
        {{ t('common.reset') }}
      </v-btn>
    </v-card-title>

    <v-card-item>
      <div v-if="!manager" class="text-center p-4">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-form v-else>
        <v-text-field
          :label="t('settings.save_path_rule')"
          v-model="manager.savePathRule"
          append-inner-icon="mdi-help-circle"
          @click:append-inner="savePathRuleAlertVisible = !savePathRuleAlertVisible"
        />
        <v-alert v-model="savePathRuleAlertVisible" closable>
          <v-alert-title>{{ t('settings.spr_alert_title') }}</v-alert-title>
          <p class="text-subtitle-1 m-2">{{ t('settings.spr_alert_subtitle') }}</p>
          <v-table>
            <thead>
              <tr>
                <th class="text-left">{{ t('settings.filed_name') }}</th>
                <th class="text-left">{{ t('settings.filed_value') }}</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>platform</td>
                <td>{{ t('settings.field_platform_hint') }}</td>
              </tr>
              <tr>
                <td>channelId</td>
                <td>{{ t('settings.field_channel_hint') }}</td>
              </tr>
              <tr>
                <td>title</td>
                <td>{{ t('settings.field_title_hint') }}</td>
              </tr>
              <tr>
                <td>owner</td>
                <td>{{ t('settings.field_owner_hint') }}</td>
              </tr>
              <tr>
                <td>remarks</td>
                <td>{{ t('settings.field_remarks_hint') }}</td>
              </tr>
              <tr>
                <td>year</td>
                <td>{{ t('settings.field_year_hint') }}</td>
              </tr>
              <tr>
                <td>month</td>
                <td>{{ t('settings.field_month_hint') }}</td>
              </tr>
              <tr>
                <td>date</td>
                <td>{{ t('settings.field_date_hint') }}</td>
              </tr>
              <tr>
                <td>hour</td>
                <td>{{ t('settings.field_hour_hint') }}</td>
              </tr>
              <tr>
                <td>min</td>
                <td>{{ t('settings.field_min_hint') }}</td>
              </tr>
              <tr>
                <td>sec</td>
                <td>{{ t('settings.field_sec_hint') }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-alert>

        <v-text-field :label="t('settings.ffmpeg_output_args')" v-model="manager.ffmpegOutputArgs" />

        <v-checkbox
          :label="t('settings.auto_check_and_record')"
          v-model="manager.autoCheckLiveStatusAndRecord"
          hide-details
        />

        <v-text-field
          v-if="manager.autoCheckLiveStatusAndRecord"
          :label="t('settings.check_interval')"
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

        <v-checkbox
          v-if="isClient"
          :label="t('settings.close_to_tray')"
          v-model="settings.notExitOnAllWindowsClosed"
          hide-details
        />

        <v-checkbox
          :label="t('settings.auto_generate_srt')"
          v-model="settings.autoGenerateSRTOnRecordStop"
          hide-details
        />

        <v-checkbox
          :label="t('settings.auto_remove_empty_record')"
          v-model="settings.autoRemoveRecordWhenTinySize"
          hide-details
        />

        <v-checkbox
          :label="t('settings.notify_when_record_start')"
          v-model="settings.noticeOnRecordStart"
          hide-details
        />

        <v-text-field
          v-if="settings.noticeOnRecordStart"
          :label="t('settings.notice_format')"
          v-model="settings.noticeFormat"
          persistent-placeholder
          :placeholder="t('settings.default_notice_format')"
          append-inner-icon="mdi-help-circle"
          @click:append-inner="noticeFormatAlertVisible = !noticeFormatAlertVisible"
        />
        <v-alert v-model="noticeFormatAlertVisible" closable>
          <v-alert-title>{{ t('settings.nf_alert_title') }}</v-alert-title>
          <p class="text-subtitle-1 m-2">{{ t('settings.nf_alert_subtitle') }}</p>
          <v-table>
            <thead>
              <tr>
                <th class="text-left">{{ t('settings.filed_name') }}</th>
                <th class="text-left">{{ t('settings.filed_value') }}</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>platform</td>
                <td>{{ t('settings.field_platform_hint') }}</td>
              </tr>
              <tr>
                <td>channelId</td>
                <td>{{ t('settings.field_channel_hint') }}</td>
              </tr>
              <tr>
                <td>remarks</td>
                <td>{{ t('settings.field_remarks_hint') }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-alert>

        <v-checkbox :label="t('settings.debug_mode')" v-model="settings.debugMode" hide-details />
      </v-form>
    </v-card-item>

    <v-card-title>{{ t('settings.about') }}</v-card-title>

    <v-card-item>
      <v-table>
        <tbody>
          <tr>
            <td>{{ t('settings.version') }}</td>
            <td>v{{ version }}</td>
          </tr>
          <tr>
            <td>{{ t('settings.open_source') }}</td>
            <td>
              <a href="https://github.com/WhiteMinds/LiveAutoRecord" target="_blank">
                https://github.com/WhiteMinds/LiveAutoRecord
              </a>
            </td>
          </tr>
          <tr>
            <td>{{ t('settings.feedback') }}</td>
            <td>
              <a href="https://github.com/WhiteMinds/LiveAutoRecord/issues" target="_blank">
                https://github.com/WhiteMinds/LiveAutoRecord/issues
              </a>
            </td>
          </tr>
          <tr>
            <td>{{ t('settings.author') }}</td>
            <td>
              <a href="https://space.bilibili.com/23505769" target="_blank">WhiteMind</a>
            </td>
          </tr>
          <tr>
            <td>{{ t('settings.email') }}</td>
            <td>whitemind@qq.com</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-item>

    <v-card-actions class="border-t justify-end">
      <v-btn @click="apply">{{ t('common.apply') }}</v-btn>
      <v-btn @click="$router.back">{{ t('common.cancel') }}</v-btn>
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
import { i18nOpts } from '../../i18n'

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
const { t, locale: innerLocale } = useI18n({ ...i18nOpts, locale: appLocale.value })

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
  settings.value.locale = innerLocale.value
  const newSettings = await LARServerService.setSettings(settings.value)
  // TODO: 前端目前只有 RecordService 用到了 settings，为了降低开发复杂度，这里先直接赋值
  RecordService.noticeOnRecordStart = newSettings.noticeOnRecordStart
  RecordService.noticeFormat = newSettings.noticeFormat ?? ''
  appLocale.value = newSettings.locale ?? navigator.language
}

const reset = async () => {
  manager.value = { ...managerDefault.value }
}

const isChanged = computed(() => JSON.stringify(manager.value) !== JSON.stringify(managerDefault.value))
</script>
