<template>
  <div class="player">
    <div class="left">
      <div ref="container" class="container"></div>
      <div class="bottom">
        <div class="info">{{recordFileName}}</div>
        <div class="control">
          <!-- 一些设置 -->
        </div>
      </div>
    </div>

    <div class="right">
      <div class="chat-control">
        <div class="chat-control-left">
          <Dropdown trigger="click" placement="bottom-start" class="metro">
            <div ripple>
              {{ChatContent[chatContent]}}
              <Icon type="md-arrow-dropdown" size="20" />
            </div>
            <DropdownMenu slot="list">
              <DropdownItem v-for="val in ChatContentList">
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
      <div class="chat-container">
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
  import DM3 from '@/db-dm3'
  import log from '@/modules/log'
  import { ChatContent, ChatContentList, ChatContentTip } from 'const'
  import { noticeError } from '@/helper'

  const DanmakuReadInterval = 30e3

  export default {
    name: 'player',
    data () {
      return {
        ChatContent,
        ChatContentList,
        ChatContentTip,

        recordFilePath: '',
        dp: null,
        db: null,
        chatContent: ChatContent.All,
        danmaku: {
          loading: false,
          startTime: -1,
          endTime: -1,
          list: []
        }
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
    watch: {
      recordFilePath () {
        document.title = `LAR 弹幕播放器 - ${this.recordFilePath}`
        this.dp.switchVideo({ url: this.recordFilePath })
        // autoplay选项有bug, 所以这里主动调用play
        this.dp.play()
      },
      danmakuFilePath () {
        this.db = null
        if (!this.danmakuFilePath) return

        DM3(this.danmakuFilePath)
          .then(db => {
            this.db = db
          })
          .catch(err => {
            noticeError(err, 'dm3数据加载失败')
          })
      }
    },
    mounted () {
      this.initDPlayer()
      this.recordFilePath = argv['record-file']

      requestAnimationFrame(this.tick)
      console.log(this)
    },
    methods: {
      initDPlayer () {
        this.dp = new DPlayer({
          container: this.$refs.container,
          danmaku: true,
          apiBackend: {
            read: ({ success }) => success()
          }
        })
      },
      async tick () {
        if (!this.dp.video.paused) {
          let time = this.dp.video.currentTime * 1e3

          if (!this.danmaku.loading && this.db) {
            if (time < this.danmaku.startTime || time > this.danmaku.endTime) {
              // 读取
              this.danmaku.loading = true
              this.danmaku.startTime = time
              this.danmaku.endTime = time + DanmakuReadInterval
              try {
                this.danmaku.list = await this.db.Data.findMessagesByPeriod(this.danmaku.startTime, this.danmaku.endTime)
              } catch (err) {
                log.error('Danmaku read error', err)
                this.dp.notice('弹幕读取失败')
              }
              this.danmaku.loading = false
            }
          }

          // 实时发送弹幕
          for (let data of this.danmaku.list) {
            // 遇到时间较后的弹幕, 停止循环
            if (data.relativeTime > time) break
            // 从弹幕列表中移除, 准备发送弹幕
            this.danmaku.list.shift()
            this.danmaku.startTime = data.relativeTime + 1
            // 只有和当前时间相差不到一定时间的才发送 (因为可能会出现跳转后time迅速变化, 所以不能全部发送)
            if (data.relativeTime < time - 100) continue

            let msg = data.value
            console.log('send msg', msg)
            if (msg.type === 'chat') {
              this.dp.danmaku.draw({
                text: msg.text,
                color: msg.color,
                type: 'right'
              })
            }
            // todo 发送到右侧, 同时还要对gift做处理
          }
        }

        requestAnimationFrame(this.tick)
      }
    }
  }
</script>

<style lang="scss" scoped>
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

        &-bottom {
          height: 32px;
          background: rgba(#eee, .4);
        }
      }
    }
  }
</style>
