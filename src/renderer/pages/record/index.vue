<template>
  <div class="lar-page">
    <div class="lar-control">
      <router-link :to="{ name: Route.RecordAdd }">
        <Button type="primary" icon="md-add">新增</Button>
      </router-link>
      <Button type="primary" icon="md-options" @click="showColumnsSetting = true">
        表头配置
      </Button>
      <router-link :to="{ name: Route.RecordSetting }">
        <Button type="primary" icon="md-settings">录播设置</Button>
      </router-link>
    </div>

    <BetterTable ref="betterTable" :columns="tableColumns" :actions="actions" :data="tableData" />

    <modal-columns-setting :uniqueId="$route.name" v-model="showColumnsSetting" :columns="columns" />
  </div>
</template>

<script>
  import path from 'path'
  import _ from 'lodash'
  import config from '@/modules/config'
  import recorder from '@/modules/recorder'
  import { noticeError } from '@/helper'
  import { Route, Platform, ChannelStatus } from 'const'

  export default {
    name: 'record',
    data () {
      return {
        Route,

        showColumnsSetting: false,

        columns: [
          {
            title: '平台',
            key: 'platformCN',
            width: 80,
            sortable: true,
            render: (h, params) => this.genLinkTag(h, params, Platform[params.row.platform], params.row.getModel().url.origin)
          },
          {
            title: '地址',
            key: 'address',
            minWidth: 100,
            sortable: true,
            render: (h, params) => this.genLinkTag(h, params, params.row.address, params.row.getModel().url.href)
          },
          {
            title: '别称',
            key: 'alias',
            minWidth: 150,
            sortable: true,
            editable: true
          },
          {
            title: '状态',
            key: 'statusCN',
            width: 100,
            sortable: true
          },
          {
            title: '使用画质',
            key: 'usingQuality',
            width: 120,
            sortable: true
          },
          {
            title: '使用线路',
            key: 'usingCircuit',
            width: 120,
            sortable: true
          },
          {
            title: '操作',
            key: 'actions',
            minWidth: 200
          }
        ],
        actions: [
          {
            attrs: { title: '立即检查' },
            props: { icon: 'md-sync' },
            show: ({ row }) => !row.getStatus(ChannelStatus.Recording),
            click: this.refreshChannel
          },
          {
            attrs: { title: '终止录制' },
            props: { type: 'error', icon: 'md-power' },
            show: ({ row }) => row.getStatus(ChannelStatus.Recording),
            click: this.stopRecord
          },
          {
            attrs: { title: '打开录制文件夹' },
            props: { icon: 'ios-folder-open' },
            click: this.openSaveFolder
          },
          {
            attrs: { title: '查看录制历史' },
            props: { icon: 'md-time' },
            click: ({ row }) => this.$router.push({ name: Route.RecordHistory, params: _.pick(row, ['platform', 'address']) })
          },
          {
            attrs: { title: '设置' },
            props: { icon: 'md-settings' },
            click: ({ row }) => this.$router.push({ name: Route.RecordEdit, params: _.pick(row, 'id') })
          },
          {
            attrs: { title: '移除' },
            props: { type: 'error', icon: 'md-trash' },
            loading: ({ row }) => row.getStatus(ChannelStatus.Removing),
            click: this.removeChannel
          }
        ]
      }
    },
    computed: {
      tableColumns () {
        return this.columns.filter(column => !config.hiddenColumns[this.$route.name].includes(column.key))
      },
      tableData () {
        return this.$store.channels.map(channel => {
          let data = channel.toJSON()
          data.getModel = () => channel
          data.getStatus = channel.getStatus
          if (channel.record) {
            data.usingQuality = channel.qualities[channel.record.streamInfo.quality]
            data.usingCircuit = channel.circuits[channel.record.streamInfo.circuit]
          }
          return data
        })
      }
    },
    mounted () {
      this.$refs.betterTable.$on('on-save-edit', this.onSaveEdit)
    },
    beforeDestroy () {
      this.$refs.betterTable.$off('on-save-edit', this.onSaveEdit)
    },
    methods: {
      onSaveEdit ({ row, column }, value, oldValue) {
        let channel = row.getModel()
        channel[column.key] = value
        channel.save().catch(noticeError)
      },
      genLinkTag (h, params, text, href) {
        return h('a', {
          on: {
            click: () => this.$electron.shell.openExternal(href)
          }
        }, text)
      },
      refreshChannel ({ row }) {
        recorder.checkChannel(row.getModel(), true).catch(noticeError)
      },
      stopRecord ({ row }) {
        row.getModel().stopRecord()
      },
      openSaveFolder ({ row }) {
        let fullPath = row.getModel().genRecordPath()
        this.$electron.shell.openItem(path.dirname(fullPath))
      },
      removeChannel ({ row }) {
        let channel = row.getModel()
        this.$Modal.confirm({
          title: '警告',
          content: `<p>该操作不可逆</p><p>是否确认移除 ${channel.profile}?</p>`,
          onOk: async () => {
            channel.setStatus(ChannelStatus.Removing, true)
            try {
              if (channel.getStatus(ChannelStatus.Recording)) channel.stopRecord()
              await channel.destroy()
              _.remove(this.$store.channels, channel)
            } catch (err) {
              noticeError(err, '移除录播失败')
            }
            channel.setStatus(ChannelStatus.Removing, false)
          }
        })
      }
    }
  }
</script>

<style scoped>
  .better-table {
    height: calc(100% - 48px);
  }
</style>
