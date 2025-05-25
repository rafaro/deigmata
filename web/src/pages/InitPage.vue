<template>
  <q-page class="flex flex-center"> Init data</q-page>
</template>

<script>
  import { api } from 'boot/axios'
  export default {
    setup() {
      api.post('project/init')
      api.post('user/init')
    },
  }
</script>
