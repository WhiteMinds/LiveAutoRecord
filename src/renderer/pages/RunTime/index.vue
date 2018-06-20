<template>
  <div class="wrapper">
    <Alert type="error" show-icon>
      缺少了必须的运行环境: StreamLink
      <span slot="desc">下方将列出可选的几个下载地址, 请在下载安装后重新启动本软件.</span>
    </Alert>
    <Card :dis-hover="true" class="buttons">
      <p slot="title">StreamLink 下载 (任选其一)</p>
      <Button type="primary" icon="social-github" @click="openExternal('https://github.com/streamlink/streamlink/releases')">Github</Button>
      <Button type="primary" icon="ios-cloud-download" @click="openExternal('https://pan.baidu.com/s/1H5ngjfrqrV-leU1uJL5Fwg#list/path=%2F%E8%BD%AC%E5%82%A8%2FStreamLink')">百度网盘</Button>
    </Card>
  </div>
</template>

<script>
  export default {
    mounted () {
      this.App.SiderWidth = 0
    },
    methods: {
      openExternal (...args) {
        this.$electron.shell.openExternal(...args)
      }
    }
  }
</script>

<style lang="scss" scoped>
  .buttons {
    font-size: 0;

    button:not(:first-child) {
      margin-left: 8px;
    }
  }
</style>
