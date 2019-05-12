<template>
  <Layout id="app">
    <template v-if="starting">
      <!-- 这里不直接使用Alert组件是因为它有无法取消的transition -->
      <div v-if="startSlow" class="ivu-alert ivu-alert-info ivu-alert-with-icon starting">
        <span class="ivu-alert-icon">
          <Icon type="ios-loading" class="starting-icon" slot="icon"></Icon>
        </span>
        <span class="ivu-alert-message">启动中...</span>
      </div>
    </template>

    <template v-else-if="startFailed">
      <Alert class="start-failed" type="error" show-icon>
        启动失败
        <span slot="desc">
          {{startFailed.message}}
        </span>
      </Alert>
    </template>

    <template v-else>
      <Sider :width="siderWidth" class="layout-sider">
        <Menu theme="dark" width="auto" :activeName="Route.Record" @on-select="onMenuSelect">
          <img src="@/assets/logo.png" class="layout-sider-logo" />
          <MenuItem :name="Route.Record">
            <Icon type="md-videocam"></Icon>
            自动录播
          </MenuItem>
          <MenuItem :name="Route.VideoDownload">
            <Icon type="md-cloud-download"></Icon>
            视频下载
          </MenuItem>
          <MenuItem :name="Route.VideoProcess">
            <Icon type="md-film"></Icon>
            录播处理
          </MenuItem>
          <MenuItem :name="Route.About">
            <Icon type="md-school"></Icon>
            关于作者
          </MenuItem>
        </Menu>
      </Sider>

      <Layout class="layout-content" :style="{marginLeft: siderWidth + 'px'}">
        <router-view></router-view>
      </Layout>
    </template>
  </Layout>
</template>

<script>
  import config from '@/modules/config'
  import db from '@/db'
  import log from '@/modules/log'
  import { Route } from 'const'

  export default {
    name: 'App',
    data () {
      return {
        Route,
        starting: true,
        startSlow: false,
        startFailed: false,
        siderWidth: 200
      }
    },
    async mounted () {
      // 超过一定时间未加载完成, 才显示启动画面, 否则会造成启动界面闪烁
      setTimeout(() => {
        if (this.starting) {
          this.startSlow = true
        }
      }, 500)

      try {
        await this.init()
      } catch (err) {
        log.error(err)
        this.starting = false
        this.startFailed = err
      }
    },
    methods: {
      async init () {
        log.info('Initializing config module...')
        config.init()

        log.info('Initializing database module...')
        await db.init()

        log.info('Loading channels...')
        this.$store.channels.splice(0)
        Array.prototype.push.apply(this.$store.channels, await db.Channel.findAll())

        // todo 在这里启动recorder等其他模块

        this.starting = false
      },
      onMenuSelect (name) {
        this.$router.push({ name })
      }
    }
  }
</script>

<style lang="scss">
  @import "~@/styles/global";

  html, body {
    height: 100%;
  }

  #app {
    height: 100%;
  }

  .starting, .start-failed {
    margin: 16px;
  }

  .starting-icon {
    animation: icon-loading 1s linear infinite;
  }

  .layout-sider {
    /*
      使用fixed而不是Layout默认的flex模式是因为, flex模式下在sider较长时会引发渲染bug.
      复现过程如下:
        1.移除fixed和content的marginLeft
        2.content必须有足够的长度(出现滚动条), 将content滚动至最底部
        3.将窗口缩短至比sider短, 然后再拉大
        4.此时content底部已出现渲染bug
    */
    position: fixed;
    /* 200vh是为了防止拉伸过快时渲染较慢出现白块 */
    height: 200vh;
    left: 0;
    overflow-y: auto;

    &-logo {
      margin: 20px;
      width: calc(100% - 40px);
      padding: 10px;
      background: rgba(0, 0, 0, .1);
      border-radius: 5px;
    }
  }
</style>
