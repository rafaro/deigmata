<template>
  <q-page class="rag-new-page q-pa-lg">
    <div class="row q-col-gutter-lg">
      <div class="col-12">
        <q-card class="rag-hero-card q-pa-lg">
          <div class="row items-center q-col-gutter-md">
            <div class="col">
              <div class="text-h5 text-white">{{ t('rag.newRunMenu') }}</div>
              <div class="text-body1 text-white rag-hero-subtitle">
                {{ t('rag.newRunSubtitle') }}
              </div>
              <div class="row q-col-gutter-sm q-mt-sm">
                <div class="col-auto">
                  <q-chip color="white" text-color="primary" icon="layers" outline>
                    {{ t('rag.projectFromApi') }}
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-chip color="white" text-color="primary" icon="tune" outline>
                    {{ t('rag.tuning') }}
                  </q-chip>
                </div>
              </div>
            </div>
            <div class="col-auto">
              <div class="q-gutter-sm">
                <q-btn
                  color="white"
                  text-color="primary"
                  icon="history"
                  :label="t('rag.historyMenu')"
                  :to="{ name: 'rag/history' }"
                />
                <q-btn flat color="white" icon="forum" :label="t('rag.title')" :to="{ name: 'rag' }" />
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <div class="col-12 col-lg-8">
        <q-card class="glass-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm">
            <div>
              <div class="text-subtitle1">{{ t('rag.newRunMenu') }}</div>
              <div class="text-caption text-grey-7">{{ t('rag.selectProjectHint') }}</div>
            </div>
            <q-btn
              dense
              flat
              color="primary"
              icon="refresh"
              :label="t('update')"
              @click="fetchProjects"
            />
          </div>

          <q-form @submit.prevent="createRun" class="q-gutter-md">
            <q-input
              v-model="form.runName"
              outlined
              dense
              :label="t('rag.runName')"
              :rules="[(val) => !!val || t('requiredField')]"
            />
            <q-select
              v-model="selectedProject"
              :options="projectOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              dense
              :loading="loadingProjects"
              :label="t('rag.selectProject')"
              :rules="[(val) => !!val || t('rag.projectRequired')]"
            >
              <template #prepend>
                <q-icon name="folder_open" />
              </template>
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey-7">
                    {{ loadingProjects ? t('loading') : t('rag.projectLoadError') }}
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-input
              v-model="form.seedQuestion"
              type="textarea"
              autogrow
              outlined
              :label="t('rag.seedQuestion')"
              :placeholder="t('rag.askPlaceholder')"
            />

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-select
                  v-model="form.mode"
                  :options="modeOptions"
                  dense
                  outlined
                  emit-value
                  map-options
                  :label="t('rag.mode')"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="form.nucleusSampling"
                  :options="nucleusSamplingOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  dense
                  outlined
                  :label="t('rag.nucleusSampling')"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-toggle v-model="form.rerank" :label="t('rag.rerank')" color="primary" />
              </div>
              <div class="col-12 col-md-6">
                <q-toggle v-model="form.guardrails" :label="t('rag.guardrails')" color="secondary" />
              </div>
            </div>

            <div>
              <div class="text-caption text-grey-7">{{ t('rag.creativity') }}</div>
              <q-slider
                v-model="form.temperature"
                color="primary"
                :step="0.1"
                :min="0"
                :max="1"
                markers
              />
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-auto">
                <q-btn color="primary" icon="play_arrow" type="submit" :label="t('rag.startRun')" />
              </div>
              <div class="col-auto">
                <q-btn
                  outline
                  color="primary"
                  icon="history"
                  :label="t('rag.runsList')"
                  :to="{ name: 'rag/history' }"
                />
              </div>
            </div>
          </q-form>
          <q-inner-loading :showing="loadingProjects">
            <q-spinner color="primary" size="32px" />
          </q-inner-loading>
        </q-card>
      </div>

      <div class="col-12 col-lg-4">
        <q-card class="glass-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle2">{{ t('rag.preview') }}</div>
            <q-badge color="primary" outline>
              {{ form.nucleusSampling.toFixed(1) }} {{ t('rag.nucleusSampling') }}
            </q-badge>
          </div>
          <q-list dense>
            <q-item>
              <q-item-section avatar>
                <q-icon name="folder_open" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ selectedProjectLabel }}</q-item-label>
                <q-item-label caption>{{ t('rag.projectFromApi') }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="insights" color="secondary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ runModeLabel }}</q-item-label>
                <q-item-label caption>{{ t('rag.playbook') }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="tune" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ t('rag.creativity') }}: {{ form.temperature }}</q-item-label>
                <q-item-label caption>
                  {{ form.rerank ? t('rag.rerank') : t('rag.creativity') }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-separator spaced />
            <q-item>
              <q-item-section avatar>
                <q-icon name="notes" color="grey-7" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ form.runName || t('rag.runName') }}</q-item-label>
                <q-item-label caption class="ellipsis">{{ form.seedQuestion }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { api } from 'boot/axios'
  import { service } from 'boot/service'
  import { useProjectStore } from 'stores/project'

  const { t } = useI18n()
  const router = useRouter()
  const projectStore = useProjectStore()

  const loadingProjects = ref(true)
  const projectOptions = ref([])
  const selectedProject = ref(null)

  const form = ref({
    runName: 'Execução monitorada',
    seedQuestion: 'Como o grafo representa dependências críticas entre releases?',
    mode: 'qa',
    nucleusSampling: 0.9,
    rerank: true,
    guardrails: true,
    temperature: 0.2,
  })

  const modeOptions = computed(() => [
    { label: t('rag.modeDiscovery'), value: 'discovery' },
    { label: t('rag.modeQa'), value: 'qa' },
    { label: t('rag.modeEvaluation'), value: 'evaluation' },
  ])
  const nucleusSamplingOptions = Array.from({ length: 10 }, (_, index) => {
    const value = Number(((index + 1) / 10).toFixed(1))
    return { label: value.toFixed(1), value }
  })

  const runModeLabel = computed(
    () => modeOptions.value.find((opt) => opt.value === form.value.mode)?.label || ''
  )

  const selectedProjectLabel = computed(
    () => projectOptions.value.find((opt) => opt.value === selectedProject.value)?.label || '—'
  )

  const fetchProjects = async () => {
    loadingProjects.value = true
    try {
      const { data } = await api.get('project')
      projectOptions.value = data.map((project) => ({
        label: project.name,
        value: project.id,
        layout: project.layout || '',
      }))
    } catch (error) {
      service.msgError(t('rag.projectLoadError'))
    } finally {
      loadingProjects.value = false
    }
  }

  const createRun = () => {
    if (!selectedProject.value) {
      service.msgError(t('rag.projectRequired'))
      return
    }
    const project = projectOptions.value.find((opt) => opt.value === selectedProject.value)
    projectStore.setProject({
      id: project.value,
      name: project.label,
      layout: project.layout || '',
    })
    service.msgGreen(t('rag.runReady'))
    router.push({ name: 'rag', query: { prompt: form.value.seedQuestion || '' } })
  }

  onMounted(fetchProjects)
</script>

<style scoped>
  .rag-new-page {
    background: radial-gradient(circle at 20% 20%, rgba(13, 71, 161, 0.12), transparent 25%),
      radial-gradient(circle at 80% 0%, rgba(79, 195, 247, 0.12), transparent 20%),
      #f6f8fb;
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
