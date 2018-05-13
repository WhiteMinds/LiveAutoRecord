<template>
    <div class="wrapper">
        <header class="main-header">
            <nav class="navbar navbar-static-top">
                <div class="container">
                    <div class="navbar-header">
                        <a class="navbar-brand">AutoLiveRecord</a>
                        <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar-collapse">
                            <i class="fa fa-bars"></i>
                        </button>
                    </div>
                </div>
            </nav>
        </header>

        <div class="content-wrapper">
            <div class="container">
                <section class="content">
                    <div class="callout callout-danger">
                        <h4>缺少了必须的运行环境: StreamLink</h4>

                        <p>下方将列出可选的几个下载地址, <br>请在下载安装后重新启动本软件.</p>
                    </div>
                    <div class="box box-default">
                        <div class="box-header with-border">
                            <h3 class="box-title">StreamLink 下载</h3>
                        </div>
                        <div class="box-body">
                            <p><a href="#" onclick="openUrl('https://github.com/streamlink/streamlink/releases')">源: Github</a></p>
                            <p><a href="#" onclick="openUrl('https://pan.baidu.com/s/1H5ngjfrqrV-leU1uJL5Fwg#list/path=%2F%E8%BD%AC%E5%82%A8%2FStreamLink')">转储: 百度网盘</a></p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
        <footer class="main-footer">
            <div class="container">
                <div class="pull-right hidden-xs">
                    <b>Version</b> {{ package.version }}
                </div>
                <strong>LAR.</strong>
            </div>
        </footer>
    </div>
</template>

<script>
  export default {
    name: 'runtime'
  }
</script>

<style scoped>

</style>
