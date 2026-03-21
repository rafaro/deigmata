<template>
  <div>
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-auto">
        <q-btn
          outline
          color="primary"
          icon="content_paste"
          :label="t('csvKg.importFromClipboard')"
          @click="importFromClipboard"
        />
      </div>
      <div class="col-auto">
        <q-btn
          outline
          color="primary"
          icon="upload_file"
          :label="t('csvKg.importFromFile')"
          @click="$refs.fileInput.click()"
        />
        <input
          ref="fileInput"
          type="file"
          accept=".csv,.txt"
          style="display: none"
          @change="handleFileUpload"
        />
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="hub"
          :label="t('csvKg.transformAndSave')"
          :disable="!csvContent.trim() || !projectId"
          :loading="transforming"
          @click="transformCsv"
        />
      </div>
    </div>

    <q-input
      outlined
      autogrow
      v-model="csvContent"
      type="textarea"
      :rows="6"
      :label="t('csvKg.csvContent')"
      :hint="t('csvKg.csvContentHint')"
    />

    <div class="q-mt-sm" v-if="headers.length > 0">
      <div class="text-caption text-grey-7 q-mb-xs">{{ t('csvKg.detectedColumns') }}</div>
      <div class="row q-col-gutter-xs">
        <div v-for="header in headers" :key="header" class="col-auto">
          <q-chip dense square color="grey-3" text-color="dark">
            {{ header }}
          </q-chip>
        </div>
      </div>
    </div>

    <CsvKgMappingEditor v-model="localMapping" :headers="headers" />

    <q-banner v-if="previewStats" rounded class="bg-blue-1 text-primary q-mt-md">
      {{ t('csvKg.previewReady', previewStats) }}
    </q-banner>
  </div>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { api } from 'boot/axios'
  import { service } from 'boot/service'
  import CsvKgMappingEditor from 'components/CsvKgMappingEditor.vue'
  import { normalizeCsvMapping, parseCsvHeaders } from 'src/utils/csvKgMapping'

  const props = defineProps({
    modelValue: {
      type: Object,
      default: null,
    },
    csvMapping: {
      type: Object,
      default: () => ({}),
    },
    projectId: {
      type: [Number, String],
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue', 'update:csvMapping'])
  const { t } = useI18n()

  const csvContent = ref('')
  const localMapping = ref(normalizeCsvMapping(props.csvMapping))
  const transforming = ref(false)
  let skipNextMappingEmit = false

  const clone = (value) => JSON.parse(JSON.stringify(value))

  const headers = computed(() => parseCsvHeaders(csvContent.value, localMapping.value.delimiter))
  const previewStats = computed(() => {
    const graph = props.modelValue

    if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
      return null
    }

    return {
      nodes: graph.nodes.length,
      edges: graph.edges.length,
    }
  })

  watch(
    () => props.csvMapping,
    (value) => {
      skipNextMappingEmit = true
      localMapping.value = normalizeCsvMapping(value)
    },
    { deep: true, immediate: true },
  )

  watch(
    localMapping,
    (value) => {
      if (skipNextMappingEmit) {
        skipNextMappingEmit = false
        return
      }

      emit('update:csvMapping', clone(value))
    },
    { deep: true },
  )

  const importFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        service.msgYellow(t('csvKg.clipboardEmpty'))
        return
      }

      csvContent.value = text
      service.msgGreen(t('csvKg.clipboardReadSuccess'))
    } catch (error) {
      service.msgRed(t('csvKg.clipboardReadError'))
      console.error('Erro ao ler CSV da área de transferência:', error)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      csvContent.value = loadEvent.target?.result || ''
      service.msgGreen(t('csvKg.fileLoadedSuccess'))
    }
    reader.onerror = () => {
      service.msgRed(t('csvKg.fileReadError'))
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const transformCsv = async () => {
    if (!props.projectId) {
      service.msgError(t('csvKg.projectRequired'))
      return
    }

    transforming.value = true

    try {
      const payload = {
        csvContent: csvContent.value,
        delimiter: localMapping.value.delimiter,
        mapping: localMapping.value,
      }
      const response = await api.post(`project/${props.projectId}/transform-csv`, payload)

      emit('update:modelValue', response.data)
      emit('update:csvMapping', clone(localMapping.value))
      service.msgGreen(t('csvKg.transformSuccess'))
    } catch (error) {
      service.msgError(error.response?.data?.message || t('serverError'))
    } finally {
      transforming.value = false
    }
  }
</script>
