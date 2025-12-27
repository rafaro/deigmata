<template>
  <q-page class="flex flex-center"> Init data</q-page>
</template>

<script setup>
  import { api } from 'boot/axios'
  api.post('project/init')
  api.post('user/init')
</script>
