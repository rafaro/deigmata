<template>
  <q-page padding>
    <!-- content -->
    <div class="shadow-2 rounded-borders q-pa-sm q-mt-sm">
      <q-form @submit="submit">
        <div class="row q-gutter-sm">
          <div class="col-sm-12">
            <p class="text-h5">{{ t('create') }} {{ t('assign') }}</p>
          </div>
          <div class="col-sm-5">
            <q-input outlined dense v-model="data.name" :label="t('name')" />
          </div>
          <div class="col-sm-12">
            <div class="row">
              <div class="col-sm-2">
                <q-btn type="submit" :label="t('save')" color="green" size="md" />
              </div>
              <div class="col-sm-2">
                <q-btn :label="t('back')" color="grey-6" size="md" @click="router.back()" />
              </div>
            </div>
          </div>
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script>
  import { ref } from 'vue'
  import { api } from 'boot/axios'
  import { service } from 'boot/service'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'

  export default {
    setup() {
      const data = ref({})
      const router = useRouter()
      const { t } = useI18n()

      const submit = () => {
        api
          .post('assign', data.value)
          .then(() => {
            service.msgGreen(t('success'))
            router.push({ name: 'assign' })
          })
          .catch((e) => {
            service.msgError(e.response.data.message)
          })
      }
      return { data, submit, router, t }
    },
  }
</script>
