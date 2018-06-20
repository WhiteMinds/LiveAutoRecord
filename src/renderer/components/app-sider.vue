<template>
  <Sider :width="App.SiderWidth" class="sider">
    <Menu theme="dark" width="auto" @on-select="onMenuSelect">
      <div class="logo-ph">Logo</div>
      <MenuItem name="lar">
        <Icon type="videocamera"></Icon>
        自动录播
      </MenuItem>
      <MenuItem name="video-kit">
        <Icon type="settings"></Icon>
        视频工具
      </MenuItem>
      <MenuItem name="about">
        <Icon type="outlet"></Icon>
        关于作者
      </MenuItem>
    </Menu>
  </Sider>
</template>

<script>
  export default {
    methods: {
      onMenuSelect (name) {
        this.$router.push({ name })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .sider {
    position: fixed;
    height: 100vh;
    left: 0;
    overflow: auto
  }

  .logo-ph {
    height: 50px;
    margin: 20px;
    background: rgba(255, 255, 255, .2);
    border-radius: 3px;

    line-height: 50px;
    text-align: center;
    color: rgba(255, 255, 255, .8);
  }

  /* 改变menu选中效果 */
  /*
  /deep/ .ivu-menu-dark.ivu-menu-vertical .ivu-menu-item-active {
    &, &:hover {
      color: #fff;
      background: #2d8cf0;
      border-right: none;
    }
  }
  */
</style>
