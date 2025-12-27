<template>
  <q-page padding>
    <!-- content -->
    <div class="shadow-2 rounded-borders q-pa-sm q-mt-sm">
      <q-form @submit="submit">
        <div class="row q-gutter-sm">
          <div class="col-sm-12">
            <p class="text-h5">{{ t('create') }} {{ t('project') }}</p>
          </div>

          <!-- Botões de Importação -->
          <div class="col-sm-12">
            <div class="row q-gutter-sm">
              <q-btn
                outline
                color="primary"
                icon="content_paste"
                :label="t('import_from_clipboard')"
                @click="importFromClipboard"
              />
              <q-btn
                outline
                color="primary"
                icon="upload_file"
                :label="t('import_from_file')"
                @click="$refs.fileInput.click()"
              />
              <input
                ref="fileInput"
                type="file"
                accept=".txt,.json"
                style="display: none"
                @change="handleFileUpload"
              />
            </div>
          </div>

          <!-- Área de texto para visualizar/editar dados importados -->
          <div class="col-sm-12" v-if="showImportData">
            <q-input
              outlined
              dense
              v-model="importedText"
              :label="t('imported_data')"
              type="textarea"
              rows="5"
              hint="JSON ou texto simples"
            />
            <div class="q-mt-sm">
              <q-btn
                color="primary"
                :label="t('process_data')"
                @click="processImportedData"
                size="sm"
              />
              <q-btn flat :label="t('cancel')" @click="cancelImport" size="sm" class="q-ml-sm" />
            </div>
          </div>

          <!-- Formulário Principal -->
          <div class="col-sm-5">
            <q-input outlined dense v-model="data.name" :label="t('name')" />
          </div>

          <!-- Campos adicionais podem ser adicionados aqui -->
          <div class="col-sm-5" v-if="data.description">
            <q-input outlined dense v-model="data.description" :label="t('description')" />
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

<script setup>
  import { ref } from 'vue'
  import { api } from 'boot/axios'
  import { service } from 'boot/service'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { useQuasar } from 'quasar'

  const data = ref({})
  const router = useRouter()
  const { t } = useI18n()
  const $q = useQuasar()
  const importedText = ref('')
  const showImportData = ref(false)

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

  const importFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        importedText.value = text
        showImportData.value = true
        $q.notify({
          color: 'positive',
          message: t('clipboard_read_success'),
          icon: 'check',
        })
      } else {
        $q.notify({
          color: 'warning',
          message: t('clipboard_empty'),
          icon: 'warning',
        })
      }
    } catch (error) {
      $q.notify({
        color: 'negative',
        message: t('clipboard_read_error'),
        icon: 'error',
      })
      console.error('Erro ao ler clipboard:', error)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      importedText.value = e.target.result
      showImportData.value = true
      $q.notify({
        color: 'positive',
        message: t('file_loaded_success'),
        icon: 'check',
      })
    }
    reader.onerror = () => {
      $q.notify({
        color: 'negative',
        message: t('file_read_error'),
        icon: 'error',
      })
    }
    reader.readAsText(file)
  }

  const processImportedData = () => {
    try {
      // Tenta fazer parse como JSON primeiro
      const parsed = JSON.parse(importedText.value)
      data.value = { ...data.value, ...parsed }

      $q.notify({
        color: 'positive',
        message: t('data_imported_success'),
        icon: 'check',
      })
      showImportData.value = false
    } catch (error) {
      // Se não for JSON, tenta processar como texto simples
      // Assume que a primeira linha é o nome do projeto
      const lines = importedText.value.trim().split('\n')
      if (lines.length > 0) {
        data.value.name = lines[0].trim()

        // Se houver segunda linha, usa como descrição
        if (lines.length > 1) {
          data.value.description = lines.slice(1).join('\n').trim()
        }

        $q.notify({
          color: 'positive',
          message: t('data_imported_success'),
          icon: 'check',
        })
        showImportData.value = false
      } else {
        $q.notify({
          color: 'warning',
          message: t('invalid_data_format'),
          icon: 'warning',
        })
      }
    }
  }

  const cancelImport = () => {
    importedText.value = ''
    showImportData.value = false
  }
</script>
