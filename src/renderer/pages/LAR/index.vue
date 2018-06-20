<template>
  <div>
    <!--<h2 class="title">录播列表</h2>-->
    <div class="actions">
      <Button type="primary" icon="android-add">新增</Button>
      <Button type="primary" icon="android-settings">设置</Button>
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
            key: 'platform'
          },
          {
            title: '直播间',
            key: 'room'
          },
          {
            title: '状态',
            key: 'status'
          },
          {
            title: '弹幕录制',
            key: 'danmaku'
          },
          {
            title: '操作',
            key: 'actions'
          }
        ],
        actions: [
          {
            text: '终止',
            click: ({ row }) => {}
          },
          {
            text: '删除',
            props: { type: 'error' },
            click: () => {}
          }
        ]
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
        return data
      },
      tableHeight () {
        // return document.documentElement.clientHeight - 128
        return document.documentElement.clientHeight - 80
      }
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

    button:not(:first-child) {
      margin-left: 8px;
    }
  }
</style>
