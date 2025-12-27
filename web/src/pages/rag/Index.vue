<template>
  <q-page class="rag-history-page q-pa-lg">
    <div class="row q-col-gutter-lg">
      <div class="col-12">
        <q-card class="rag-hero-card q-pa-lg">
          <div class="row items-center q-col-gutter-md">
            <div class="col">
              <div class="text-h5 text-white">{{ t('rag.historyTitle') }}</div>
              <div class="text-body1 text-white rag-hero-subtitle">
                {{ t('rag.historySubtitle') }}
              </div>
            </div>
            <div class="col-auto">
              <div class="q-gutter-sm">
                <q-btn
                  color="white"
                  text-color="primary"
                  icon="play_circle"
                  :label="t('rag.newRunMenu')"
                  @click="newRun"
                />
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <div class="col-12">
        <q-card class="glass-card q-pa-md">
          <div class="row items-center justify-between q-mb-md">
            <div>
              <div class="text-subtitle1">{{ t('rag.runsList') }}</div>
              <div class="text-caption text-grey-7">{{ t('rag.historyFilters') }}</div>
            </div>
            <div class="row q-col-gutter-sm">
              <!-- <div class="col-12 col-sm-auto">
                <q-select
                  v-model="filterStatus"
                  :options="statusOptions"
                  dense
                  outlined
                  emit-value
                  map-options
                  :label="t('rag.statusFilter')"
                />
              </div> -->
              <div class="col-12 col-sm-auto">
                <q-select
                  v-model="filterProject"
                  :options="projectFilters"
                  dense
                  outlined
                  emit-value
                  map-options
                  :label="t('rag.projectFilter')"
                />
              </div>
            </div>
          </div>

          <q-table
            flat
            dense
            :rows="filteredRuns"
            :columns="columns"
            row-key="id"
            :rows-per-page-label="t('rowsPerPage')"
            :no-data-label="t('noData')"
          >
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-chip
                  dense
                  outline
                  :color="statusInfo(props.value).color"
                  :text-color="statusInfo(props.value).color"
                >
                  <q-icon :name="statusInfo(props.value).icon" size="16px" class="q-mr-xs" />
                  {{ statusInfo(props.value).label }}
                </q-chip>
              </q-td>
            </template>
            <template #body-cell-prompt="props">
              <q-td :props="props">
                <div class="text-body2 ellipsis">{{ props.value }}</div>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props">
                <div class="q-gutter-sm">
                  <q-btn
                    dense
                    color="primary"
                    icon="open_in_new"
                    flat
                    :label="t('rag.openRun')"
                    @click="openRun(props.row)"
                  />
                </div>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { useProjectStore } from 'stores/project'
  import { date } from 'quasar'
  import { service } from 'boot/service'
  import { api } from 'boot/axios'

  const { t } = useI18n()
  const router = useRouter()
  const prjStore = useProjectStore()
  const runs = ref([])
  const loading = ref(true)
  const newRun = () => {
    api
      .post('rag', { projectId: prjStore.getProject.id || null })
      .then((response) => {
        const ragId = response?.data?.id
        service.msgGreen(t('success'))
        const params = ragId ? { id: String(ragId) } : undefined
        router.push({ name: 'rag/run', params })
      })
      .catch((e) => {
        service.msgError(e.response.data.message)
      })
  }

  api
    .get('rag')
    .then((response) => {
      runs.value = response.data
      loading.value = false
    })
    .catch(() => {
      loading.value = false
    })

  const columns = computed(() => [
    { name: 'id', field: 'id', label: 'ID', align: 'left' },
    { name: 'project', field: (row) => row.project.name, label: t('project'), align: 'left' },
    { name: 'prompt', field: 'firstQuestion', label: t('rag.seedQuestion'), align: 'left' },
    {
      name: 'createdat',
      field: (row) => date.formatDate(row.createdat, 'YYYY-MM-DD HH:mm:ss'),
      label: t('rag.createdAt'),
      align: 'left',
    },
    { name: 'actions', field: 'actions', label: t('rag.actions'), align: 'right' },
  ])

  // const columns = [
  //   { name: 'id', field: 'id', label: 'ID', align: 'left' },
  //   { name: 'project', field: 'project', label: t('project'), align: 'left' },
  //   { name: 'status', field: 'status', label: t('rag.runStatus'), align: 'left' },
  //   { name: 'prompt', field: 'prompt', label: t('rag.seedQuestion'), align: 'left' },
  //   { name: 'score', field: 'score', label: 'Score', align: 'left', format: (v) => v?.toFixed(2) },
  //   { name: 'executedAt', field: 'executedAt', label: t('rag.executedAt'), align: 'left' },
  //   { name: 'duration', field: 'duration', label: t('rag.duration'), align: 'left' },
  //   { name: 'actions', field: 'actions', label: t('rag.actions'), align: 'right' },
  // ]

  const statusMeta = computed(() => ({
    done: { label: t('rag.statusDone'), color: 'green-7', icon: 'check_circle' },
    running: { label: t('rag.statusRunning'), color: 'blue-6', icon: 'play_circle' },
    failed: { label: t('rag.statusFailed'), color: 'red-5', icon: 'error' },
    queued: { label: t('rag.statusQueued'), color: 'grey-7', icon: 'schedule' },
  }))

  // const statusOptions = computed(() => [
  //   { label: t('rag.statusAll'), value: 'all' },
  //   { label: statusMeta.value.running?.label, value: 'running' },
  //   { label: statusMeta.value.done?.label, value: 'done' },
  //   { label: statusMeta.value.queued?.label, value: 'queued' },
  //   { label: statusMeta.value.failed?.label, value: 'failed' },
  // ])

  //const filterStatus = ref('all')
  const filterProject = ref('all')

  const projectFilters = computed(() => {
    const uniques = [...new Set(runs.value.map((run) => run.project.name))]
    const mapped = uniques.map((label) => ({ label, value: label }))
    return [{ label: t('rag.allProjects'), value: 'all' }, ...mapped]
  })

  const filteredRuns = computed(() =>
    runs.value.filter((run) => {
      //const matchesStatus = filterStatus.value === 'all' || run.status === filterStatus.value
      const matchesProject =
        filterProject.value === 'all' || run.project.name === filterProject.value
      //return matchesStatus && matchesProject
      return matchesProject
    })
  )

  const openRun = (row) => {
    if (row?.project?.id && row.project.id !== prjStore.getProject.id) {
      prjStore.setProject({
        id: row.project.id,
        name: row.project.name,
        layout: row.project.layout || '',
      })
      service.msgGreen(t('projectChangedSuccessfully'))
    }
    router.push({ name: 'rag/run', params: { id: row.id } })
  }

  const statusInfo = (status) =>
    statusMeta.value[status] || { label: status, color: 'grey-6', icon: 'help' }
</script>

<style scoped>
  .rag-history-page {
    background:
      radial-gradient(circle at 20% 20%, rgba(13, 71, 161, 0.12), transparent 25%),
      radial-gradient(circle at 80% 0%, rgba(79, 195, 247, 0.12), transparent 20%), #f6f8fb;
    min-height: calc(100vh - 56px);
  }

  .rag-hero-card {
    background: linear-gradient(120deg, #0b2447, #19376d 50%, #576cbc);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 20px 45px rgba(9, 26, 59, 0.35);
  }

  .rag-hero-subtitle {
    max-width: 720px;
  }

  .glass-card {
    border: 1px solid rgba(0, 43, 83, 0.05);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(8px);
  }
</style>
