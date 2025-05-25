<template>
  <q-page padding>
    <!-- content -->
    <div class="shadow-2 rounded-borders q-pa-md q-mt-md">
      <p class="text-h4">Deseja excluir o {{ desc }}?</p>
      <!-- content -->
      <q-btn class="q-ma-md" :label="t('yes')" color="negative" @click="del(true)" />
      <q-btn class="q-ma-md" :label="t('no')" color="positive" @click="del(false)" />
    </div>
  </q-page>
</template>

<script>
  import { ref } from 'vue'
  import { api } from 'boot/axios'
  import { useRouter } from 'vue-router'
  import { service } from 'boot/service'
  import { useI18n } from 'vue-i18n'
  export default {
    // name: 'PageName',
    props: ['id'],
    setup(props) {
      const desc = ref('')
      const router = useRouter()
      const { t } = useI18n()
      const del = (deleteConfirm) => {
        if (deleteConfirm) {
          api
            .delete(`project/${props.id}`)
            .then(() => {
              service.msgGreen(t('success'))
            })
            .catch((error) => {
              service.msgError(error.response.data.message)
            })
        } else {
          service.msgRed(t('failed'))
        }
        router.back()
      }
      api
        .get(`project/${props.id}`)
        .then((response) => {
          desc.value = `Project ${props.id} - ${response.data.name}`
        })
        .catch((error) => {
          router.back()
          service.msgError(error.response.data.message)
        })
      return { desc, del, t }
    },
  }
</script>
