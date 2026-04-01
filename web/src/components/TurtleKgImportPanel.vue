<template>
  <div>
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-auto">
        <q-btn
          outline
          color="primary"
          icon="content_paste"
          :label="t('turtleKg.importFromClipboard')"
          @click="importFromClipboard"
        />
      </div>
      <div class="col-auto">
        <q-btn
          outline
          color="primary"
          icon="upload_file"
          :label="t('turtleKg.importFromFile')"
          @click="$refs.fileInput.click()"
        />
        <input
          ref="fileInput"
          type="file"
          accept=".ttl,.turtle,.txt,.rdf"
          style="display: none"
          @change="handleFileUpload"
        />
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="hub"
          :label="t('turtleKg.transformAndSave')"
          :disable="!turtleContent.trim() || !projectId"
          :loading="transforming"
          @click="transformTurtle"
        />
      </div>
    </div>

    <q-card flat bordered>
      <q-expansion-item
        default-opened
        expand-separator
        icon="description"
        :label="t('turtleKg.turtleContent')"
        :caption="t('turtleKg.turtleContentHint')"
      >
        <q-card-section>
          <q-input outlined autogrow v-model="turtleContent" type="textarea" :rows="10" />
        </q-card-section>
      </q-expansion-item>
    </q-card>

    <q-banner v-if="previewStats" rounded class="bg-blue-1 text-primary q-mt-md">
      {{ t('turtleKg.previewReady', previewStats) }}
    </q-banner>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { api } from 'boot/axios'
  import { service } from 'boot/service'

  const props = defineProps({
    modelValue: {
      type: Object,
      default: null,
    },
    projectId: {
      type: [Number, String],
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue'])
  const { t } = useI18n()

  const turtleContent = ref('')
  const transforming = ref(false)

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

  const importFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        service.msgYellow(t('turtleKg.clipboardEmpty'))
        return
      }

      turtleContent.value = text
      service.msgGreen(t('turtleKg.clipboardReadSuccess'))
    } catch (error) {
      service.msgRed(t('turtleKg.clipboardReadError'))
      console.error('Erro ao ler Turtle da área de transferência:', error)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      turtleContent.value = loadEvent.target?.result || ''
      service.msgGreen(t('turtleKg.fileLoadedSuccess'))
    }
    reader.onerror = () => {
      service.msgRed(t('turtleKg.fileReadError'))
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const transformTurtle = async () => {
    if (!props.projectId) {
      service.msgError(t('turtleKg.projectRequired'))
      return
    }

    transforming.value = true

    try {
      const response = await api.post(`project/${props.projectId}/transform-turtle`, {
        turtleContent: turtleContent.value,
      })

      emit('update:modelValue', response.data)
      service.msgGreen(t('turtleKg.transformSuccess'))
    } catch (error) {
      service.msgError(error.response?.data?.message || t('serverError'))
    } finally {
      transforming.value = false
    }
  }
</script>
