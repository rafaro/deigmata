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
              <div class="row q-col-gutter-sm q-mt-sm">
                <div class="col-auto">
                  <q-chip color="white" text-color="primary" icon="history" outline>
                    {{ t('rag.runsList') }}
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-chip color="white" text-color="primary" icon="bolt" outline>
                    rerank &amp; guardrails
                  </q-chip>
                </div>
              </div>
            </div>
            <div class="col-auto">
              <div class="q-gutter-sm">
                <q-btn
                  color="white"
                  text-color="primary"
                  icon="play_circle"
                  :label="t('rag.newRunMenu')"
                  :to="{ name: 'rag/execute' }"
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
              <div class="col-12 col-sm-auto">
                <q-select
                  v-model="filterStatus"
                  :options="statusOptions"
                  dense
                  outlined
                  emit-value
                  map-options
                  :label="t('rag.statusFilter')"
                />
              </div>
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
                  <q-btn
                    dense
                    color="secondary"
                    icon="play_arrow"
                    flat
                    :label="t('rag.duplicateRun')"
                    @click="openRun(props.row, true)"
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

  const { t } = useI18n()
  const router = useRouter()
  const projectStore = useProjectStore()

  const runs = ref([
    {
      id: 'RAG-2301',
      project: 'Grafo de Incidentes',
      projectId: 12,
      status: 'done',
      prompt: 'Resumo executivo de riscos e dependências críticas.',
      duration: '01:12',
      executedAt: '2024-05-18 10:22',
      topK: 5,
      rerank: true,
      score: 0.87,
    },
    {
      id: 'RAG-2302',
      project: 'Design System',
      projectId: 7,
      status: 'running',
      prompt: 'Checklist para rollout seguro do novo token set.',
      duration: '00:15',
      executedAt: '2024-05-18 14:09',
      topK: 8,
      rerank: true,
      score: 0.8,
    },
    {
      id: 'RAG-2303',
      project: 'FinOps Playbook',
      projectId: 4,
      status: 'queued',
      prompt: 'Como justificar aumento de custo no cluster de BI?',
      duration: '—',
      executedAt: '2024-05-19 09:41',
      topK: 3,
      rerank: false,
      score: 0.76,
    },
    {
      id: 'RAG-2304',
      project: 'Plataforma de Pagamentos',
      projectId: 9,
      status: 'failed',
      prompt: 'Roteiro de rollback para a versão 2.4 do billing.',
      duration: '00:03',
      executedAt: '2024-05-19 10:02',
      topK: 6,
      rerank: true,
      score: 0.0,
    },
  ])

  const columns = [
    { name: 'id', field: 'id', label: 'ID', align: 'left' },
    { name: 'project', field: 'project', label: t('project'), align: 'left' },
    { name: 'status', field: 'status', label: t('rag.runStatus'), align: 'left' },
    { name: 'prompt', field: 'prompt', label: t('rag.seedQuestion'), align: 'left' },
    { name: 'score', field: 'score', label: 'Score', align: 'left', format: (v) => v?.toFixed(2) },
    { name: 'executedAt', field: 'executedAt', label: t('rag.executedAt'), align: 'left' },
    { name: 'duration', field: 'duration', label: t('rag.duration'), align: 'left' },
    { name: 'actions', field: 'actions', label: t('rag.actions'), align: 'right' },
  ]

  const statusMeta = computed(() => ({
    done: { label: t('rag.statusDone'), color: 'green-7', icon: 'check_circle' },
    running: { label: t('rag.statusRunning'), color: 'blue-6', icon: 'play_circle' },
    failed: { label: t('rag.statusFailed'), color: 'red-5', icon: 'error' },
    queued: { label: t('rag.statusQueued'), color: 'grey-7', icon: 'schedule' },
  }))

  const statusOptions = computed(() => [
    { label: t('rag.statusAll'), value: 'all' },
    { label: statusMeta.value.running?.label, value: 'running' },
    { label: statusMeta.value.done?.label, value: 'done' },
    { label: statusMeta.value.queued?.label, value: 'queued' },
    { label: statusMeta.value.failed?.label, value: 'failed' },
  ])

  const filterStatus = ref('all')
  const filterProject = ref('all')

  const projectFilters = computed(() => {
    const uniques = [...new Set(runs.value.map((run) => run.project))]
    const mapped = uniques.map((label) => ({ label, value: label }))
    return [{ label: t('rag.allProjects'), value: 'all' }, ...mapped]
  })

  const filteredRuns = computed(() =>
    runs.value.filter((run) => {
      const matchesStatus = filterStatus.value === 'all' || run.status === filterStatus.value
      const matchesProject = filterProject.value === 'all' || run.project === filterProject.value
      return matchesStatus && matchesProject
    })
  )

  const openRun = (row, duplicate = false) => {
    if (row.projectId) {
      projectStore.setProject({ id: row.projectId, name: row.project, layout: row.layout || '' })
    }
    const query = duplicate ? { prompt: row.prompt, duplicate: row.id } : { prompt: row.prompt }
    router.push({ name: 'rag', query })
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
