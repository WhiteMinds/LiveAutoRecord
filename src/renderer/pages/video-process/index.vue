<template>
  <div class="lar-page">
    <Upload type="drag" action :before-upload="handleUpload">
        <div style="padding: 16px 0">
            <Icon type="ios-cloud-upload" size="48" style="color: #3399ff"></Icon>
            <p>{{this.recordFilePath ? this.recordFilePath : '点击选择或拖拽要处理的录播到此处'}}</p>
        </div>
    </Upload>
    <div class="lar-control">
      <Button type="primary" icon="md-play" @click="play">
        播放
      </Button>
      <Button type="primary" icon="md-share-alt" @click="exportDanmaku">
        导出弹幕为 ASS
      </Button>
    </div>
  </div>
</template>

<script>
  import path from 'path'
  import { ipcRenderer as ipc } from 'electron-better-ipc'
  import { IPCMsg } from 'const'

  export default {
    name: 'video-process',
    data () {
      return {
        recordFilePath: ''
      }
    },
    computed: {
      recordFileName () {
        return path.parse(this.recordFilePath).name
      },
      danmakuFilePath () {
        if (!this.recordFilePath) return
        return path.join(path.parse(this.recordFilePath).dir, this.recordFileName + '.dm3')
      }
    },
    methods: {
      handleUpload (file) {
        this.recordFilePath = file.path
        return false
      },
      play () {
        ipc.callMain(IPCMsg.CreatePlayer, this.recordFilePath)
      },
      exportDanmaku () {
        // TODO: check file exist
        console.log(this.danmakuFilePath)
        // ... codes ...
      }
    }
  }
</script>

<style lang="scss" scoped>
  /deep/ {
    .ivu-upload {
      margin-bottom: 16px;

      .ivu-upload-dragOver {
        border-width: 1px;
      }
    }
  }
</style>
