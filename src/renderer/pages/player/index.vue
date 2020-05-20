<template>
  <div class="player">
    <div class="left">
      <div ref="container" class="container"></div>
      <div class="bottom">
        <div class="info">{{title}}</div>
        <div class="control">
          <!-- 一些设置 -->
        </div>
      </div>
    </div>

    <div class="right">
      <div class="chat-control">
        <div class="chat-control-left">
          <Dropdown trigger="click" placement="bottom-start" class="metro" @on-click="switchChatContent">
            <div ripple>
              {{ChatContent[chatContent]}}
              <Icon type="md-arrow-dropdown" size="20" />
            </div>
            <DropdownMenu slot="list">
              <DropdownItem v-for="val in ChatContentList" :name="val">
                <p class="title">{{ChatContent[val]}}</p>
                <p class="desc">{{ChatContentTip[val]}}</p>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
        <div class="chat-control-right">
          <Dropdown trigger="click" placement="bottom-end" class="metro">
            <Icon type="md-more" size="24" ripple />
            <DropdownMenu slot="list">
              <DropdownItem>
                <p class="title">
                  <Icon type="md-time" size="24" />
                  开/关时间戳
                </p>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
      <div ref="chatContainer" class="chat-container">
        <div class="chat-content" :class="[content.type]" v-for="content in contentList">
          <div class="chat-content-left">
            <img class="avatar" v-if="content.avatar" :src="content.avatar" @error="onContentAvatarError(content)" />
          </div>
          <div class="chat-content-right">
            <template v-if="content.type === 'chat'">
              <span class="sender">{{content.sender}}</span>
              <span class="text">{{content.text}}</span>
            </template>

            <template v-if="content.type === 'gift'">
              <span class="sender">{{content.sender}}</span>
              <span class="gift-text">
                赠送给主播
                <img v-if="content.gift.img" :src="content.gift.img" />
                {{content.gift.name}} x{{content.count}}
                <template v-if="content.combo > 1 && content.combo !== content.count">(连击x{{content.combo}})</template>
              </span>
            </template>
          </div>
        </div>
      </div>
      <div class="chat-bottom">
        <!-- 弹幕延迟: <i-input></i-input> -->
      </div>
    </div>
  </div>
</template>

<script>
  import path from 'path'
  import DPlayer from 'dplayer'
  import { argv } from 'argh'
  import express from 'express'
  import cors from 'cors'
  import DM3 from '@/db-dm3'
  import messageManage from './message_manage'
  import { ChatContent, ChatContentList, ChatContentTip } from 'const'
  import { noticeError } from '@/helper'

  export default {
    name: 'player',
    data () {
      return {
        ChatContent,
        ChatContentList,
        ChatContentTip,

        recordFilePath: '',
        serverPort: 0,
        dp: null,
        db: null,
        chatContent: ChatContent.All,
        danmaku: {
          loading: false,
          startTime: -1,
          endTime: -1,
          list: []
        },
        contentList: [],
        contentMax: 200
      }
    },
    computed: {
      recordFileName () {
        return path.parse(this.recordFilePath).name
      },
      danmakuFilePath () {
        if (!this.recordFilePath) return
        return path.join(path.parse(this.recordFilePath).dir, this.recordFileName + '.dm3')
      },
      title () {
        return messageManage.recordInfo ? messageManage.recordInfo.title : this.recordFileName
      }
    },
    watch: {
      recordFilePath () {
        document.title = `LAR 弹幕播放器 - ${this.recordFilePath}`
        this.dp.switchVideo({ url: `http://localhost:${this.serverPort}/video.flv` })
        // autoplay选项有bug, 所以这里主动调用play
        this.dp.play()
      },
      async danmakuFilePath () {
        if (this.db) {
          await this.db.sequelize.close()
          this.db = null
          messageManage.reset()
        }
        if (!this.danmakuFilePath) return

        try {
          this.db = await DM3(this.danmakuFilePath)
          await messageManage.load(this.db)
        } catch (err) {
          noticeError(err, 'dm3文件打开失败')
        }
      }
    },
    mounted () {
      this.initExpress().then(() => {
        this.recordFilePath = argv['record-file']
      })
      this.initDPlayer()
    },
    methods: {
      // flvjs 使用的是 fetch，无法访问 file 协议，所以用一个临时 server 来中转
      initExpress () {
        return new Promise(resolve => {
          const server = express()
          server.use(cors())
          // 访问任何路径都返回录像文件
          server.use((req, res, next) => res.download(this.recordFilePath))
          const listener = server.listen(0, () => {
            this.serverPort = listener.address().port
            resolve()
          })
        })
      },
      initDPlayer () {
        this.dp = new DPlayer({
          container: this.$refs.container,
          danmaku: true,
          apiBackend: {
            read: ({ success }) => success([{ time: 0, text: '' }])
          }
        })

        messageManage.init(this.dp)
        messageManage.$on('msg', this.onMsg)
        messageManage.$on('seek', this.onSeek)
      },
      onMsg (msg) {
        if (msg.type === 'chat') {
          // 发送弹幕
          this.dp.danmaku.draw({
            text: msg.text,
            color: msg.color,
            type: 'right'
          })
        }

        // 发送到右侧
        if (this.checkContent(msg)) {
          this.contentList.push(msg)
          if (this.contentList.length > this.contentMax) this.contentList.shift()
          this.$nextTick(() => this.scrollChatToBottom())
        }
      },
      onContentAvatarError (content) {
        // 替换成1x1的透明gif
        content.avatar = 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg=='
      },
      switchChatContent (value) {
        this.chatContent = value
        this.onSeek()
      },
      checkContent (content) {
        if (this.chatContent === ChatContent.All) return true
        if (this.chatContent === ChatContent.Chat && content.type === 'chat') return true
      },
      onSeek () {
        this.contentList = []

        let offset = messageManage.offset - 1
        while (offset >= 0 && this.contentList.length < this.contentMax) {
          const msg = messageManage.list[offset--]
          if (this.checkContent(msg)) {
            this.contentList.unshift(msg)
          }
        }
        this.$nextTick(() => this.scrollChatToBottom(true))
      },
      scrollChatToBottom (force) {
        const elm = this.$refs.chatContainer
        let bottom = elm.scrollHeight - elm.clientHeight
        let dist = bottom - elm.scrollTop
        if (force || dist <= 64) {
          elm.scrollTop = bottom
        }
      }
    }
  }
</script>

<style lang="scss" scoped>
  /deep/ {
    .dplayer-danmaku .dplayer-danmaku-move {
      animation: danmaku 10s linear;
      animation-play-state: paused;
    }

    .dplayer-playing .dplayer-danmaku .dplayer-danmaku-move {
      animation-play-state: running;
    }
  }

  .player {
    display: flex;
    width: 100%;
    height: 100%;
    padding: 32px;
    background: #fff;

    .left {
      flex-grow: 1;
      display: flex;
      flex-direction: column;

      .container {
        width: 100%;
        height: 100%;

        &.dplayer-fulled {
          width: 100%;
          height: 100%;
        }
      }

      .bottom {
        display: flex;
        justify-content: space-between;
        padding: 20px 0 8px 0;
        border-bottom: 1px solid rgba(0, 0, 0, .1);

        .info {
          font-size: 18px;
        }
      }
    }

    .right {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      width: 400px;
      margin-left: 24px;

      .chat {
        &-control {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 48px;
          background: rgba(#eee, .4);

          &-left {
            display: flex;
            margin-left: 16px;
            color: #111;
            font-size: 16px;

            /deep/ {
              .ivu-select-dropdown {
                margin-top: -24px;
              }

              .ivu-dropdown-rel {
                cursor: pointer;

                & > div {
                  display: flex;
                  align-items: center;
                  padding: 0 8px;

                  .ivu-icon {
                    margin-left: 4px;
                  }
                }
              }
            }
          }

          &-right {
            margin-right: 8px;

            /deep/ {
              .ivu-dropdown-rel {
                color: #909090;
                cursor: pointer;

                &:hover {
                  color: #606060;
                }

                .ivu-icon {
                  padding: 8px;
                  border-radius: 50%;
                }
              }

              .ivu-dropdown-item {
                padding: 0 36px 0 16px;

                .title {
                  display: flex;
                  align-items: center;
                  line-height: 36px;

                  .ivu-icon {
                    margin-right: 16px;
                    color: #909090;
                  }
                }
              }
            }
          }
        }

        &-container {
          flex-grow: 1;
          overflow-y: scroll;

          &::-webkit-scrollbar {
            width: 14px;
            background: #fcfcfc;
          }

          &::-webkit-scrollbar-thumb {
            background-color: #e2e2e2;

            &:hover {
              background-color: #ddd;
            }
          }
        }

        &-content {
          display: flex;
          min-height: 32px;
          padding: 4px 24px;

          &-left {
            display: flex;
            margin-right: 16px;

            .avatar {
              width: 24px;
              height: 24px;
              border-radius: 100%;
            }
          }

          &-right {
            align-self: center;
            line-height: 16px;

            .sender {
              margin-right: 8px;
              color: rgba(#111, .6);
            }

            .text {
              word-break: break-word;
            }

            .gift-text {
              word-break: break-all;
              color: #888;

              img {
                vertical-align: bottom;
                width: 24px;
                height: 24px;
                margin: 0 8px;
              }
            }
          }

          &.chat {
            .sender {
              float: left;
            }
          }

          &.gift {
            .chat-content-right {
              line-height: 24px;
            }
          }
        }

        &-bottom {
          height: 32px;
          background: rgba(#eee, .4);
        }
      }
    }
  }
</style>
