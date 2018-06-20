<template>
  <Layout id="app">
    <app-sider></app-sider>
    <Layout class="content" :style="{marginLeft: App.SiderWidth + 'px'}">
      <router-view></router-view>
    </Layout>
  </Layout>
</template>

<script>
  import appSider from '@/components/app-sider'

  export default {
    components: {
      appSider
    }
  }
</script>

<style>
  html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  #app {
    height: 100%;
  }

  .content {
    height: 100%;
    padding: 16px;
  }
</style>
