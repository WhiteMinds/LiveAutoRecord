<template>
  <Card :dis-hover="true">
    <h3 slot="title">添加录播</h3>
    <Form ref="form" :model="form" :rules="validateRule" :label-width="100">
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
        },
        validateRule: {
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
