<template>
  <q-page padding>
    <q-tab-panel
      name="login"
      class="shadow-2 rounded-borders"
      style="max-width: 500px; margin: auto"
    >
      <div class="text-h6 q-pa-lg">Saindo do SISTEMA</div>
    </q-tab-panel>
  </q-page>
</template>

<script setup>
  import { service } from 'boot/service'
  import { useRouter } from 'vue-router'
  import { useUserStore } from 'stores/user'

  const store = useUserStore()
  const router = useRouter()
  if (service.getToken()) {
    service.saveToken('')
    service.signOut()
    store.clearUser()
  }
  router.push('/')
</script>
