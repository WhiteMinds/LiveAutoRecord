<template>
  <Layout id="app">
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
  </Layout>
</template>

<script>
  import { Route } from 'const'

  export default {
    name: 'App',
    data () {
      return {
        Route,
        siderWidth: 200
      }
    },
    methods: {
      onMenuSelect (name) {
        this.$router.push({ name })
      }
    }
  }
</script>

<style lang="scss">
  html, body {
    height: 100%;
  }

  #app {
    height: 100%;
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
