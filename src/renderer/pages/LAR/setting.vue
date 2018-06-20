<template>
  <Card :dis-hover="true">
    <h3 slot="title">录播设置</h3>
    <Form ref="form" :model="form" :rules="validateRule" :label-width="100">
      <FormItem label="录播时通知">
        <i-switch v-model="form.notice"></i-switch>
      </FormItem>
      <FormItem label="开播检查间隔" prop="interval">
        <InputNumber v-model="form.interval"></InputNumber>
      </FormItem>
      <FormItem label="自动分段" prop="section">
        <InputNumber v-model="form.section"></InputNumber>
      </FormItem>
      <FormItem label="录像保存路径" prop="savePath">
        <i-input v-model="form.savePath"></i-input>
      </FormItem>
      <FormItem class="buttons">
        <Button type="success" @click="confirm">确认</Button>
        <Button type="ghost" @click="$router.back()">取消</Button>
      </FormItem>
    </Form>
  </Card>
</template>

<script>
  export default {
    data () {
      return {
        form: {
          notice: true,
          interval: 10,
          section: -1,
          savePath: 'C:\\'
        },
        validateRule: {
          interval: [ { required: true, type: 'number', message: '开播检查间隔不能为空', trigger: 'blur' } ],
          section: [ { required: true, type: 'number', message: '自动分段不能为空', trigger: 'blur' } ],
          savePath: [ { required: true, message: '录像保存路径不能为空', trigger: 'blur' } ]
        }
      }
    },
    methods: {
      async confirm () {
        let vaild = await this.$refs.form.validate()
        if (!vaild) return

        // ... codes ...
        console.log('confirm')
      }
    }
  }
</script>

<style lang="scss" scoped>
  .buttons {
    font-size: 0;

    button:not(:first-child) {
      margin-left: 8px;
    }
  }
</style>
