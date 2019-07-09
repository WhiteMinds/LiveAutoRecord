<template>
  <div class="lar-page">
    <Card :dis-hover="true">
      <h3 slot="title">录播设置</h3>
      <!-- todo 可以考虑这里制作一些提示 (左侧label给问号, 或者右上角给问号弹窗) -->
      <Form ref="form" :model="form" :rules="rules" :label-width="120">
        <FormItem label="录播时通知">
          <i-switch v-model="form.notice" size="large" />
        </FormItem>
        <FormItem label="自动检查">
          <i-switch v-model="form.autoCheck" size="large" />
        </FormItem>
        <FormItem label="多线检查">
          <i-switch v-model="form.multiCheck" size="large" />
        </FormItem>
        <FormItem label="开播检查间隔 (秒)" prop="checkInterval">
          <InputNumber v-model="form.checkInterval" />
        </FormItem>
        <FormItem label="自动分段 (分钟)" prop="segment">
          <InputNumber v-model="form.segment" />
        </FormItem>
        <FormItem label="录像保存路径" prop="saveFolder">
          <input ref="saveFolderSelector" type="file" webkitdirectory @change="onSaveFolderSelect" />
          <i-input v-model="form.saveFolder">
            <Icon type="md-folder" slot="suffix" @click="$refs.saveFolderSelector.click()" />
          </i-input>
        </FormItem>
        <FormItem label="录像文件名" prop="saveName">
          <i-input v-model="form.saveName" />
        </FormItem>
        <FormItem label="录像保存格式">
          <i-select v-model="form.saveFormat">
            <Option v-for="(val, key) in RecordFormat" :value="val" :key="key">{{ key }}</Option>
          </i-select>
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
  import path from 'path'
  import config from '@/modules/config'
  import { noticeError } from '@/helper'
  import { RecordFormat } from 'const'

  export default {
    name: 'record-setting',
    data () {
      return {
        RecordFormat,

        form: Object.assign({}, config.record),
        rules: {
          checkInterval: [ { required: true, type: 'number', message: '开播检查间隔不能为空', trigger: 'blur' } ],
          segment: [ { required: true, type: 'number', message: '自动分段不能为空', trigger: 'blur' } ],
          saveFolder: [ { required: true, message: '录像保存路径不能为空', trigger: 'blur' } ],
          saveName: [ { required: true, message: '录像文件名不能为空', trigger: 'blur' } ]
        },
        saving: false
      }
    },
    watch: {
      'form.saveFormat' () {
        if (this.form.saveFormat !== RecordFormat.FLV) {
          this.$Message.warning({
            content: '使用非FLV的格式录制将不支持一些特殊情况 (如语音直播)',
            duration: 5,
            closable: true
          })
        }
      }
    },
    mounted () {
      this.initRules()
    },
    methods: {
      initRules () {
        let regex
        switch (process.platform) {
          case 'win32':
            regex = /^(?:[a-z]:)?[/\\]{0,2}(?:[./\\ ](?![./\\\n])|[^<>:"|?*./\\ \n])+$/gi
            break
          case 'linux':
            regex = /^[^\0.]+$/gi
            break
          case 'darwin':
            regex = /^[^\0:]+$/gi
            break
        }
        if (regex) {
          this.rules.saveFolder.push({ pattern: regex, message: '不支持的路径格式', trigger: 'blur' })
          this.rules.saveName.push({ pattern: regex, message: '不支持的文件名格式', trigger: 'blur' })
        }
      },
      onSaveFolderSelect (e) {
        let file = e.target.files[0]
        if (!file) return
        this.form.saveFolder = path.join(file.path, '{platform}\\{owner}')
      },
      async confirm () {
        this.saving = true
        let valid = await this.$refs.form.validate()
        if (!valid) {
          this.saving = false
          return
        }

        try {
          Object.assign(config.record, this.form)
          config.save()
          this.$router.back()
        } catch (err) {
          noticeError(err, '保存录播设置失败')
        }
      }
    }
  }
</script>

<style lang="scss" scoped>
  input[type=file] {
    display: none;
  }

  .ivu-select {
    width: 100px;
  }

  .ivu-input-wrapper {
    width: 500px;

    .ivu-icon {
      cursor: pointer;

      &:hover {
        color: #2d8cf0;
      }
    }
  }
</style>
