<template>
  <q-page padding>
    <!-- content -->
    <div class="shadow-2 rounded-borders q-pa-sm q-mt-sm">
      <q-form @submit="submit">
        <div class="row q-gutter-sm">
          <div class="col-sm-12">
            <p class="text-h5">{{ t('create') }} {{ t('project') }}</p>
          </div>
          <div class="col-sm-5">
            <q-input
              outlined
              dense
              v-model="data.name"
              :label="t('name')"
              :rules="[(val) => !!val || t('fieldRequired')]"
            />
          </div>
          <!-- Component -->
          <div class="col-sm-12">
            <q-separator class="q-mb-md" />
            <div class="text-subtitle2 q-mb-sm">{{ t('importSection') }}</div>
            <ImportData :label="t('importProjectData')" @data-imported="handleImportedData" />
            <q-separator class="q-mt-md" />
          </div>
          <!-- Action Buttons -->
          <div class="col-sm-12">
            <div class="row q-gutter-sm">
              <q-btn type="submit" :label="t('save')" color="green" size="md" icon="save" />
              <q-btn
                :label="t('back')"
                color="grey-6"
                size="md"
                icon="arrow_back"
                @click="router.back()"
              />
            </div>
          </div>
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script>
  import { ref } from 'vue'
  import ImportData from 'components/ImportData.vue'
  import { api } from 'boot/axios'
  import { service } from 'boot/service'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'

  export default {
    components: {
      ImportData,
    },
    setup() {
      const data = ref({})
      const router = useRouter()
      const { t } = useI18n()
      const handleImportedData = (importedData) => {
        // Mescla os dados importados com os dados existentes
        data.value.kg = importedData
      }
      const submit = () => {
        api
          .post('project', data.value)
          .then(() => {
            service.msgGreen(t('success'))
            router.push({ name: 'project' })
          })
          .catch((e) => {
            service.msgError(e.response.data.message)
          })
      }
      return { data, submit, router, t, handleImportedData }
    },
  }
</script>
