# Live auto record v4

> 多平台直播自动录制工具

#### Old Version

- [3.x](https://github.com/WhiteMinds/LiveAutoRecord/tree/3.x)

#### Features

相较于 v3 版本，该版本主要的变化：

- 对于使用者（包括基于模块的开发者）

1. 不只能作为客户端使用，还可以服务端部署，或作为 node 模块引入。
1. 支持以插件的方式扩展支持的直播平台。
1. 规范了 electron 下的设计，一些逻辑从渲染进程挪到了主进程，这会解决之前的一些 bug。
1. 不再使用 sqlite 作为 meta / comments 的存储格式，现在使用 json，并且支持从 json 中提取 comments 转换为 srt 字幕文件。
1. 支持画质的模糊配置、源 / 流的优先级配置。
1. 默认使用 fmp4 格式进行录制，这会减少一些 mp4、flv 格式录制时造成的问题。
1. UI 重新设计。

- 开发层面

1. 完全重构，并尽量使用 ts
1. 基于 lerna + yarn 的 monorepo
1. 基于 ts + vue3 + vuetify + tailwindcss 的 web

#### Road Map

- Github actions build & release
- Recorder Id 改为数字自增
- 完善弹幕播放器的 UI
- 完善错误处理
- 处理一些代码中的 TODO 项
- 提供文档

#### Build Setup

```bash
# install dependencies
yarn

# build client dep packages
cd packages/shared && yarn build
cd packages/manager && yarn build

# dev electron
yarn app:dev

# build electron application for production
yarn app:build
```

## Screenshot

#### 新增录播任务

![](/readme-assets/5.png)

#### 录播任务列表

![](/readme-assets/1.png)

#### 录播历史

![](/readme-assets/2.png)

<!-- #### 录播播放器 -->

<!-- ![](/readme-assets/3.png) -->

#### 录播播放器-网页全屏

![](/readme-assets/4.png)

#### 全局录播配置

![](/readme-assets/6.png)
