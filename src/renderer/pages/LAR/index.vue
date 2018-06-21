<template>
  <div>
    <div class="actions">
      <router-link :to="{ name: 'lar-add' }"><Button type="primary" icon="android-add">新增</Button></router-link>
      <router-link :to="{ name: 'lar-setting' }"><Button type="primary" icon="android-settings">设置</Button></router-link>
    </div>
    <Table ref="table" :columns="columns" :data="tableData" stripe border :height="tableHeight"></Table>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        columns: [
          {
            title: '平台',
            key: 'platform',
            width: 100,
            sortable: true
          },
          {
            title: '直播间',
            key: 'room',
            width: 120,
            sortable: true
          },
          {
            title: '状态',
            key: 'status',
            sortable: true
          },
          {
            title: '弹幕录制',
            key: 'danmaku',
            width: 90,
            render: (h, params) => {
              return h('div', [
                h('i-switch', {
                  props: {
                    value: params.row.danmaku
                  },
                  on: {
                    input (val) { params.row.danmaku = val }
                  }
                })
              ])
            }
          },
          {
            title: '操作',
            key: 'actions',
            render: (h, params) => {
              let btnTemplates = []
              for (let i = 0; i < this.actions.length; i++) {
                let action = this.actions[i]
                if (action.show && !action.show(params)) continue
                btnTemplates.push(h('Button', {
                  props: Object.assign({ type: 'primary', size: 'small' }, action.props),
                  style: Object.assign({ marginRight: '8px' }, action.style),
                  on: { click: () => action.click(params) }
                }, action.text))
              }
              return h('div', btnTemplates)
            }
          }
        ],
        actions: [
          {
            text: '设置',
            props: { type: 'success' },
            click: ({ row }) => {}
          },
          {
            text: '终止',
            props: { type: 'warning' },
            show: ({ row }) => row.status === '录制中',
            click: ({ row }) => {}
          },
          {
            text: '移除',
            props: { type: 'error' },
            click: () => {}
          }
        ],
        liveRooms: []
      }
    },
    computed: {
      tableData () {
        let data = [{
          platform: '斗鱼',
          room: '196',
          status: '等待开播',
          danmaku: true
        }]
        for (let i = 0; i < 5; i++) data = data.concat(data)
        data[0] = {
          platform: '斗鱼',
          room: '196',
          status: '录制中',
          danmaku: true
        }
        return data
      },
      tableHeight () {
        return document.documentElement.clientHeight - 80
      }
    },
    mounted () {
      // this.liveRooms = ipc.remoteData
    }
  }
</script>

<style lang="scss" scoped>
  .title {
    line-height: 32px;
    margin-bottom: 16px;
    text-align: center;
  }

  .actions {
    margin-bottom: 16px;
    font-size: 0;

    a:not(:first-child) {
      margin-left: 8px;
    }
  }
</style>
