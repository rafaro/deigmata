<template>
  <div class="import-data-component">
    <div class="row q-gutter-sm q-mb-md">
      <q-btn
        outline
        color="primary"
        icon="content_paste"
        :label="label || t('importData')"
        @click="importFromClipboard"
      />
      <q-btn
        outline
        color="primary"
        icon="upload_file"
        :label="t('importFromFile')"
        @click="$refs.fileInput.click()"
      />
      <input
        ref="fileInput"
        type="file"
        :accept="acceptedFormats"
        style="display: none"
        @change="handleFileUpload"
      />
    </div>

    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ t('previewImportedData') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            outlined
            v-model="importedText"
            :label="t('importedData')"
            type="textarea"
            rows="10"
            :hint="formatHint"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="t('cancel')" color="grey-7" @click="cancelImport" />
          <q-btn :label="t('import')" color="primary" @click="processImportedData" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { service } from 'boot/service'

  export default {
    name: 'ImportData',

    props: {
      label: {
        type: String,
        default: '',
      },
      acceptedFormats: {
        type: String,
        default: '.txt,.json',
      },
      formatHint: {
        type: String,
        default: 'JSON ou texto simples',
      },
      parseFunction: {
        type: Function,
        default: null,
      },
    },

    emits: ['data-imported'],

    setup(props, { emit }) {
      const { t } = useI18n()
      const importedText = ref('')
      const showDialog = ref(false)

      const importFromClipboard = async () => {
        try {
          const text = await navigator.clipboard.readText()
          if (text.trim()) {
            importedText.value = text
            showDialog.value = true
            service.msgGreen(t('clipboardReadSuccess'))
          } else {
            service.msgYellow(t('clipboardEmpty'))
          }
        } catch (error) {
          service.msgYellow(t('clipboardReadError'))
          console.error('Erro ao ler clipboard:', error)
        }
      }

      const handleFileUpload = (event) => {
        const file = event.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
          importedText.value = e.target.result
          showDialog.value = true
          service.msgGreen(t('fileLoadedSuccess'))
        }
        reader.onerror = () => {
          service.msgRed(t('fileReadError'))
        }
        reader.readAsText(file)

        // Limpa o input para permitir upload do mesmo arquivo novamente
        event.target.value = ''
      }

      const defaultParser = (text) => {
        // Tenta fazer parse como JSON primeiro
        try {
          return JSON.parse(text)
        } catch (error) {
          // Se não for JSON, processa como texto simples
          const lines = text.trim().split('\n')
          const data = {}

          if (lines.length > 0) {
            data.name = lines[0].trim()

            if (lines.length > 1) {
              data.description = lines.slice(1).join('\n').trim()
            }
          }

          return data
        }
      }

      const processImportedData = () => {
        try {
          const parser = props.parseFunction || defaultParser
          const parsedData = parser(importedText.value)

          emit('data-imported', parsedData)

          service.msgGreen(t('dataImportedSuccess'))

          showDialog.value = false
          importedText.value = ''
        } catch (error) {
          service.msgRed(t('invalidDataFormat') + ': ' + error.message)
        }
      }

      const cancelImport = () => {
        importedText.value = ''
        showDialog.value = false
      }

      return {
        t,
        importedText,
        showDialog,
        importFromClipboard,
        handleFileUpload,
        processImportedData,
        cancelImport,
      }
    },
  }
</script>
