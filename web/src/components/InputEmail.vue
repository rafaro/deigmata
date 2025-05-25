<template>
  <q-input
    outlined
    dense
    label="E-mail"
    lazy-rules
    :rules="[validEmail]"
    v-bind="$attrs"
    @paste.prevent
  >
    <!--:value="email" v-bind="$attrs" v-lowercasetrim v-on="$listeners"//@paste.native.prevent -->
    <template v-slot:prepend>
      <q-icon name="mail" />
    </template>
  </q-input>
</template>

<script>
export default {
  name: 'InputEmail',
  // props: ['email'],
  setup() {
    const validEmail = async (val) => {
      const re =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      return (
        (val && val.length > 0 && re.test(val)) || 'Insira um e-mail válido'
      )
    }
    return { validEmail }
  }
  // methods: {
  //   async validEmail(val) {
  //     const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  //     return (val && val.length > 0 && re.test(val)) || 'Insira um e-mail válido'
  //   }
  // }
}
</script>
