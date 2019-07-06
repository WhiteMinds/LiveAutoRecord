<template>
  <div class="lar-page">
    <Card :dis-hover="true">
      <h3 slot="title">{{ isNew ? '添加新录播' : '编辑指定录播' }}</h3>
      <Form ref="form" :model="form" :rules="isNew ? rules : null" :label-width="100">
        <FormItem label="平台">
          <i-select v-model="form.platform" @on-change="onPlatformChange" :disabled="!isNew">
            <Option v-for="(val, key) in PlatformList" :value="val" :key="key">{{ Platform[val] }}</Option>
          </i-select>
        </FormItem>
        <FormItem label="直播间" prop="address">
          <i-input v-model="form.address" placeholder="直播间ID (复制直播间地址到此处将自动解析)" :disabled="!isNew || parsing"
                   @on-blur="onAddressChange" @on-enter="onAddressChange"></i-input>
        </FormItem>
        <FormItem label="别称">
          <i-input v-model="form.alias" placeholder="别称"></i-input>
        </FormItem>
        <FormItem label="画质">
          <i-select v-model="form.quality">
            <Option v-for="(val, key) in platformObj.qualities" :value="key" :key="key">{{ val }}</Option>
          </i-select>
        </FormItem>
        <FormItem label="线路">
          <i-select v-model="form.circuit">
            <Option v-for="(val, key) in platformObj.circuits" :value="key" :key="key">{{ val }}</Option>
          </i-select>
        </FormItem>
        <FormItem label="录制弹幕">
          <i-switch v-model="form.barrage" size="large"></i-switch>
        </FormItem>
        <FormItem label="录播后自动处理">
          <i-switch v-model="form.autoProcess" size="large"></i-switch>
        </FormItem>
        <FormItem class="buttons">
          <Button type="success" :loading="saving" @click="confirm">确认</Button>
          <Button :disabled="saving" @click="$router.back()">取消</Button>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>

<script>
  import _ from 'lodash'
  import db from '@/db'
  import platforms from '@/platforms'
  import recorder from '@/modules/recorder'
  import config from '@/modules/config'
  import { noticeError } from '@/helper'
  import { Route, Platform, PlatformList, ChannelStatus } from 'const'

  export default {
    name: 'record-edit',
    data () {
      return {
        Platform,
        PlatformList,

        model: null,
        form: {},
        rules: {
          address: [ { required: true, message: '无效的地址', trigger: 'blur', validator: this.addressValidator } ]
        },
        parsing: false,
        saving: false
      }
    },
    computed: {
      isNew () {
        return this.$route.name === Route.RecordAdd
      },
      platformObj () {
        return platforms[this.form.platform || Platform.DouYu]
      }
    },
    async mounted () {
      try {
        await this.initModel()
      } catch (err) {
        noticeError(err, '初始化模型失败')
      }
    },
    methods: {
      async initModel () {
        if (this.isNew) {
          this.model = await db.Channel.build()
          this.onPlatformChange()
          this.form = this.model
        } else {
          this.model = this.$store.channels.find(channel => channel.id === Number(this.$route.params.id))
          if (!this.model) throw new Error('Cant find target channel')
          // 不直接使用model.toJSON, 因为后面会直接将form给assign到model上, 使用pick防止status等属性的覆盖
          this.form = _.pick(this.model, ['platform', 'address', 'alias', 'quality', 'circuit', 'barrage', 'autoProcess'])
        }
      },
      addressValidator (...args) {
        let [, , callback] = args
        // 正在解析地址, 暂不检测
        if (this.parsing) return callback()
        // 无验证器
        if (!this.platformObj.addressValidator) return callback()
        return this.platformObj.addressValidator(...args)
      },

      // Event listeners
      // =============================================================================

      async onPlatformChange () {
        this.model.quality = this.platformObj.preferred.quality
        this.model.circuit = this.platformObj.preferred.circuit
      },
      async onAddressChange () {
        if (!this.form.address) return
        if (this.parsing) return
        this.parsing = true

        let platform = Object.values(platforms).find(platform => platform.canParse && platform.canParse(this.form.address))
        if (platform) {
          let close = this.$Message.loading('正在解析地址')
          try {
            let result = await platform.parseAddress(this.form.address)
            if (result) {
              Object.assign(this.form, result)
              this.$refs.form.validate()
            } else {
              this.$Message.warning('解析失败, 不支持的地址')
            }
          } catch (err) {
            noticeError(err, '解析失败')
          }
          close()
        }

        this.parsing = false
      },

      // Actions
      // =============================================================================

      async confirm () {
        this.saving = true

        try {
          if (this.parsing) {
            // 等待解析完成后才继续
            await new Promise((resolve, reject) => {
              let unwatch = this.$watch('parsing', () => {
                if (this.parsing) return
                unwatch()
                resolve()
              })
              setTimeout(() => reject(new Error('地址解析超时')), 10e3)
            })
          }

          let valid = await this.$refs.form.validate()
          if (!valid) {
            this.saving = false
            return
          }

          if (this.isNew) {
            let existed = await db.Channel.findBy({ platform: this.form.platform, address: this.form.address })
            await this.model.save()
            this.$store.channels.push(this.model)
            this.$Message.success('保存成功')
            if (existed) this.$Message.warning(`频道 ${this.model.profile} 存在复数个`)
            if (config.record.autoCheck) recorder.checkChannel(this.model, true).catch(noticeError)
          } else {
            Object.assign(this.model, this.form)
            await this.model.save()
            this.$Message.success('设置成功, 改动将于下一次录制时生效')

            if (this.model.getStatus(ChannelStatus.Recording)) {
              this.$Modal.confirm({
                title: '提示',
                content: `<p>频道 ${this.model.profile} 的设置已更改</p><p>是否重新开始录制来应用新的设置?</p>`,
                onOk: () => {
                  this.model.stopRecord()
                  recorder.checkChannel(this.model, true).catch(noticeError)
                }
              })
            }
          }

          // 此处不将saving改回false, 因为back的执行时间不确定, 这样可以防止闪烁
          this.$router.back()
        } catch (err) {
          noticeError(err, '保存录播配置失败')
          this.saving = false
        }
      }
    }
  }
</script>

<style scoped>
  .ivu-select {
    width: 200px;
  }
</style>
