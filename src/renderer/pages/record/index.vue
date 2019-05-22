<template>
  <div class="lar-page">
    <div class="lar-control">
      <router-link :to="{ name: Route.RecordAdd }">
        <Button type="primary" icon="md-add">新增</Button>
      </router-link>
      <router-link :to="{ name: Route.RecordSetting }">
        <Button type="primary" icon="md-settings">设置</Button>
      </router-link>
    </div>

    <BetterTable ref="betterTable" :columns="columns" :actions="actions" :data="tableData" />
  </div>
</template>

<script>
  import _ from 'lodash'
  import recorder from '@/modules/recorder'
  import { noticeError } from '@/helper'
  import { Route, Platform, ChannelStatus } from 'const'

  export default {
    name: 'record',
    data () {
      return {
        Route,

        columns: [
          {
            title: '平台',
            key: 'platformCN',
            width: 120,
            sortable: true,
            render: (h, params) => this.genLinkTag(h, params, Platform[params.row.platform], params.row.getModel().url.origin)
          },
          {
            title: '别称',
            key: 'alias',
            minWidth: 150,
            sortable: true,
            editable: true
          },
          {
            title: '地址',
            key: 'address',
            minWidth: 100,
            sortable: true,
            render: (h, params) => this.genLinkTag(h, params, params.row.address, params.row.getModel().url.href)
          },
          {
            title: '状态',
            key: 'statusCN',
            width: 120,
            sortable: true
          },
          {
            key: 'actions',
            minWidth: 220
          }
        ],
        actions: [
          {
            text: '刷新',
            props: { icon: 'md-sync' },
            show: ({ row }) => !row.getStatus(ChannelStatus.Recording),
            click: this.refreshChannel
          },
          {
            text: '终止',
            props: { type: 'error', icon: 'md-power' },
            show: ({ row }) => row.getStatus(ChannelStatus.Recording),
            click: this.stopRecord
          },
          {
            text: '设置',
            props: { icon: 'md-options' },
            click: ({ row }) => this.$router.push({ name: Route.RecordEdit, params: row })
          },
          {
            text: '',
            props: { type: 'error', icon: 'md-trash' },
            loading: ({ row }) => row.getStatus(ChannelStatus.Removing),
            click: this.removeChannel
          }
        ]
      }
    },
    computed: {
      tableData () {
        return this.$store.channels.map(channel => {
          let data = channel.toJSON()
          data.getModel = () => channel
          data.getStatus = channel.getStatus
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
        recorder.checkChannel(row.getModel()).catch(noticeError)
      },
      stopRecord ({ row }) {
        row.getModel().stopRecord()
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
