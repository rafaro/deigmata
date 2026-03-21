<template>
  <q-page padding>
    <div class="shadow-2 rounded-borders q-pa-md">
      <div v-if="loading" class="row justify-center q-py-xl">
        <q-spinner color="primary" size="42px" />
      </div>

      <template v-else>
        <div class="row items-start q-col-gutter-md q-mb-md">
          <div class="col">
            <div class="text-h5">{{ t('csvKg.pageTitle') }}</div>
            <div class="text-subtitle2 text-grey-7">{{ project.name }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ t('csvKg.pageHint') }}
            </div>
          </div>
          <div class="col-auto">
            <div class="row q-gutter-sm">
              <q-btn
                outline
                color="primary"
                icon="save"
                :label="t('csvKg.saveMapping')"
                :loading="savingMapping"
                @click="saveMapping"
              />
              <q-btn
                color="positive"
                icon="visibility"
                :label="t('csvKg.openKg')"
                @click="goToKg"
              />
              <q-btn
                flat
                color="grey-7"
                icon="arrow_back"
                :label="t('back')"
                @click="router.back()"
              />
            </div>
          </div>
        </div>

        <q-banner rounded class="bg-blue-1 text-primary q-mb-md">
          {{ t('csvKg.pageBanner') }}
        </q-banner>

        <CsvKgImportPanel
          v-model="graph"
          v-model:csv-mapping="csvMapping"
          :project-id="project.id"
        />

        <q-banner v-if="graphStats" rounded class="bg-green-1 text-positive q-mt-md">
          {{ t('csvKg.graphSaved', graphStats) }}
        </q-banner>
      </template>
    </div>
  </q-page>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { api } from 'boot/axios'
  import { service } from 'boot/service'
  import { useProjectStore } from 'stores/project'
  import CsvKgImportPanel from 'components/CsvKgImportPanel.vue'
  import { normalizeCsvMapping } from 'src/utils/csvKgMapping'

  const props = defineProps(['id'])

  const { t } = useI18n()
  const router = useRouter()
  const projectStore = useProjectStore()

  const loading = ref(true)
  const savingMapping = ref(false)
  const graph = ref(null)
  const project = ref({
    id: Number(props.id),
    name: '',
    layout: '',
  })
  const csvMapping = ref(normalizeCsvMapping(null))

  const graphStats = computed(() => {
    if (!graph.value?.nodes || !graph.value?.edges) {
      return null
    }

    return {
      nodes: graph.value.nodes.length,
      edges: graph.value.edges.length,
    }
  })

  const loadProject = async () => {
    loading.value = true

    try {
      const response = await api.get(`project/${props.id}`)
      project.value = response.data
      csvMapping.value = normalizeCsvMapping(response.data.csvMapping)
    } catch (error) {
      service.msgError(error.response?.data?.message || t('serverError'))
      router.push({ name: 'project' })
    } finally {
      loading.value = false
    }
  }

  const saveMapping = async () => {
    savingMapping.value = true

    try {
      await api.patch(`project/csv-mapping/${props.id}`, {
        csvMapping: csvMapping.value,
      })
      service.msgGreen(t('csvKg.mappingSaved'))
    } catch (error) {
      service.msgError(error.response?.data?.message || t('serverError'))
    } finally {
      savingMapping.value = false
    }
  }

  const goToKg = () => {
    projectStore.setProject(project.value)
    router.push({ name: 'kg' })
  }

  loadProject()
</script>
