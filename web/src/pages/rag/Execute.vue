<template>
  <q-page class="rag-page q-pa-lg">
    <div class="row q-col-gutter-lg">
      <div class="col-12">
        <q-card class="rag-hero-card q-pa-lg">
          <div class="row items-center q-col-gutter-md">
            <div class="col">
              <div class="text-h5 text-white q-mb-xs">
                {{ t('rag.workspaceTitle') }}
              </div>
              <div class="text-body1 text-white rag-hero-subtitle">
                {{ t('rag.workspaceSubtitle') }}
              </div>
              <div class="row q-col-gutter-sm q-mt-sm">
                <div class="col-auto">
                  <q-chip color="white" text-color="primary" icon="scatter_plot" outline>
                    Hybrid BM25 + Embeddings
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-chip color="white" text-color="primary" icon="workspace_premium" outline>
                    Guardrails &amp; Eval-on-save
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-chip color="white" text-color="primary" icon="bolt" outline>
                    {{ t('rag.liveCitations') }}
                  </q-chip>
                </div>
              </div>
            </div>
            <div class="col-auto">
              <div class="q-gutter-sm">
                <q-btn
                  flat
                  color="white"
                  icon="history"
                  :label="t('rag.historyMenu')"
                  :to="{ name: 'rag/history' }"
                />
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <div class="col-12 col-lg-8">
        <q-card class="glass-card q-pa-md">
          <div class="row items-center justify-between q-mb-md">
            <div>
              <div class="text-subtitle1">{{ t('rag.conversation') }}</div>
              <div class="text-caption text-grey-7">
                {{ t('rag.conversationHint') }}
              </div>
            </div>
            <div class="row items-center q-gutter-sm">
              <q-badge color="primary" outline> Top-k {{ topK }} </q-badge>
              <q-badge color="green-7" outline>
                rerank: {{ rerankEnabled ? 'ON' : 'OFF' }}
              </q-badge>
              <q-badge color="deep-orange-6" outline>
                {{ guardrailsEnabled ? 'Guardrails' : 'Exploratório' }}
              </q-badge>
            </div>
          </div>

          <q-scroll-area class="rag-chat-window q-mb-md">
            <div class="q-px-xs q-pt-sm">
              <q-chat-message
                v-for="message in conversation"
                :key="message.id"
                :sent="message.from === 'user'"
                :bg-color="message.from === 'user' ? 'primary' : 'grey-1'"
                :text-color="message.from === 'user' ? 'white' : 'dark'"
                :name="message.from === 'user' ? 'Você' : 'Deigmata RAG'"
                :stamp="message.stamp"
              >
                <template v-if="message.loading">
                  <q-spinner-dots color="primary" size="24px" />
                  <div class="text-caption text-grey-7 q-mt-xs">
                    {{ t('rag.drafting') }}
                  </div>
                </template>
                <template v-else>
                  <div class="rag-message text-body2" v-html="message.text"></div>
                  <div v-if="message.citations?.length" class="q-mt-sm flex items-center wrap">
                    <q-chip
                      v-for="citation in message.citations"
                      :key="citation.id"
                      outline
                      color="primary"
                      text-color="primary"
                      class="q-mr-sm q-mb-sm"
                      size="sm"
                    >
                      <q-icon name="link" size="16px" class="q-mr-xs" />
                      {{ citation.title }}
                    </q-chip>
                  </div>
                </template>
              </q-chat-message>
            </div>
          </q-scroll-area>

          <q-linear-progress v-if="isThinking" indeterminate color="primary" class="q-mb-sm" />

          <q-input
            v-model="prompt"
            type="textarea"
            autogrow
            :label="t('rag.askPlaceholder')"
            filled
            class="q-mb-sm"
            @keyup.enter.exact.prevent="sendMessage"
          >
            <template #prepend>
              <q-icon name="chat" />
            </template>
            <template #after>
              <q-btn
                color="primary"
                round
                icon="send"
                :disable="!prompt.trim()"
                :loading="isThinking"
                @click="sendMessage"
              />
            </template>
          </q-input>

          <div class="row q-col-gutter-sm q-mt-xs">
            <div class="col-12 col-md">
              <div class="text-caption text-grey-7 q-mb-xs">{{ t('rag.suggestions') }}</div>
              <div class="row q-col-gutter-sm">
                <div v-for="intent in followUps" :key="intent.title" class="col-auto">
                  <q-chip
                    clickable
                    outline
                    color="primary"
                    icon="bolt"
                    @click="applyFollowUp(intent)"
                  >
                    {{ intent.title }}
                  </q-chip>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-auto">
              <div class="text-caption text-grey-7 q-mb-xs">{{ t('rag.liveCitations') }}</div>
              <div class="row q-col-gutter-sm">
                <div v-for="tag in contextFocus" :key="tag" class="col-auto">
                  <q-chip color="secondary" text-color="white" dense>{{ tag }}</q-chip>
                </div>
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <div class="col-12 col-lg-4 q-gutter-md column">
        <q-card class="glass-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle2">{{ t('rag.retrievedSources') }}</div>
            <q-badge color="primary" outline
              >{{ retrievedSources.length }} {{ t('rag.sources') }}</q-badge
            >
          </div>
          <q-list separator>
            <q-item
              v-for="source in retrievedSources"
              :key="source.id"
              dense
              class="rounded-borders q-mb-sm"
            >
              <q-item-section avatar>
                <q-avatar size="34px" color="primary" text-color="white">
                  {{ source.icon }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">{{ source.title }}</q-item-label>
                <q-item-label caption class="text-grey-7">{{ source.snippet }}</q-item-label>
                <div class="row items-center q-gutter-xs q-mt-xs">
                  <q-badge color="primary" outline>{{ source.score }} score</q-badge>
                  <q-badge color="green-6" outline>{{ source.recency }}</q-badge>
                  <q-badge v-if="source.type" color="secondary" outline>{{ source.type }}</q-badge>
                </div>
              </q-item-section>
              <q-item-section side top>
                <q-btn dense round flat icon="open_in_new" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <q-card class="glass-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle2">{{ t('rag.tuning') }}</div>
            <q-badge color="grey-7" outline>{{ t('rag.playbook') }}</q-badge>
          </div>
          <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-6">
              <q-select
                v-model="selectedPlaybook"
                :options="playbooks"
                dense
                filled
                emit-value
                map-options
                :label="t('rag.mode')"
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="topK"
                :options="[3, 5, 8, 12]"
                dense
                filled
                :label="t('rag.topK')"
              />
            </div>
          </div>
          <q-toggle v-model="rerankEnabled" color="primary" :label="t('rag.rerank')" />
          <q-toggle v-model="guardrailsEnabled" color="secondary" :label="t('rag.guardrails')" />
          <div class="q-mt-sm">
            <div class="text-caption text-grey-7">{{ t('rag.creativity') }}</div>
            <q-slider v-model="temperature" color="primary" :step="0.1" :min="0" :max="1" />
          </div>
          <div class="q-mt-sm">
            <div class="text-caption text-grey-7">{{ t('rag.context') }}</div>
            <div class="row q-col-gutter-xs">
              <div v-for="item in contextFocus" :key="item" class="col-auto">
                <q-chip dense outline color="primary">{{ item }}</q-chip>
              </div>
            </div>
          </div>
        </q-card>

        <q-card class="glass-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle2">{{ t('rag.trace') }}</div>
            <q-badge color="green-6" outline>{{ t('rag.observability') }}</q-badge>
          </div>
          <q-timeline color="primary" layout="comfortable">
            <q-timeline-entry
              v-for="step in retrievalTrace"
              :key="step.id"
              :title="step.title"
              :subtitle="step.metric"
              :icon="step.icon"
              :color="step.color"
            >
              <div class="text-body2">{{ step.detail }}</div>
            </q-timeline-entry>
          </q-timeline>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const prompt = ref('Como o grafo representa dependências críticas entre releases?')
  const isThinking = ref(false)
  const rerankEnabled = ref(true)
  const guardrailsEnabled = ref(true)
  const temperature = ref(0.2)
  const topK = ref(5)
  const selectedPlaybook = ref('summary')

  const followUps = ref([
    {
      title: 'Resumo executivo de riscos',
      prompt: 'Resuma os 3 principais riscos e cite as fontes.',
    },
    { title: 'Checklist acionável', prompt: 'Crie um checklist com passos e donos por squad.' },
    {
      title: 'Explicar para novatos',
      prompt: 'Explique o contexto para alguém novo no time em 5 bullets.',
    },
  ])

  const contextFocus = ref(['design system', 'arquitetura', 'roadmap'])

  const playbooks = ref([
    { label: 'Resumo estratégico', value: 'summary' },
    { label: 'Investigação profunda', value: 'deep' },
    { label: 'QA e validação', value: 'qa' },
  ])

  const retrievedSources = ref([
    {
      id: 1,
      title: 'ADR-042: Orquestração de releases',
      snippet: 'Fluxo de deploy com gates e dependências explícitas entre serviços.',
      score: 0.92,
      recency: '2d',
      type: 'ADR',
      icon: 'A',
    },
    {
      id: 2,
      title: 'Confluence: Playbook de rollback',
      snippet: 'Checklist de rollback com owners e SLA de decisão.',
      score: 0.88,
      recency: '5d',
      type: 'Confluence',
      icon: 'C',
    },
    {
      id: 3,
      title: 'Postmortem #218',
      snippet: 'Dependência não mapeada entre serviço de billing e autenticação.',
      score: 0.82,
      recency: '1h',
      type: 'Postmortem',
      icon: 'P',
    },
    {
      id: 4,
      title: 'Reunião de arquitetura 12/07',
      snippet: 'Decisão de consolidar feature flags em único provedor.',
      score: 0.79,
      recency: '12h',
      type: 'Notas',
      icon: 'N',
    },
  ])

  const retrievalTrace = ref([
    {
      id: 'rewrite',
      title: 'Reescrita semântica',
      detail: 'Expandiu a pergunta com termos de release e nomes de squads.',
      metric: '14ms • k=24',
      color: 'primary',
      icon: 'auto_awesome',
    },
    {
      id: 'vector',
      title: 'Busca vetorial',
      detail: 'Top 24 chunks em OpenSearch + sim híbrida.',
      metric: '47ms',
      color: 'blue-6',
      icon: 'scatter_plot',
    },
    {
      id: 'rerank',
      title: 'Re-ranker cross-encoder',
      detail: 'Reordenação pelos critérios de relevância e frescor.',
      metric: '32ms',
      color: 'indigo-6',
      icon: 'stacked_bar_chart',
    },
    {
      id: 'guard',
      title: 'Guardrails & citações',
      detail: 'Checagem de alucinação, políticas e formatação citada.',
      metric: 'OK',
      color: 'green-6',
      icon: 'verified',
    },
  ])

  const conversation = ref([
    {
      id: 1,
      from: 'ai',
      text: 'Pronto para testar o fluxo de RAG. Combine consultas, ajuste o reranker e acompanhe as citações em tempo real.',
      stamp: 'agora',
      citations: retrievedSources.value.slice(0, 2),
    },
  ])

  const sendMessage = () => {
    if (!prompt.value.trim()) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    conversation.value.push({
      id: Date.now(),
      from: 'user',
      text: prompt.value,
      stamp: now,
    })

    const pendingId = Date.now() + 1
    conversation.value.push({
      id: pendingId,
      from: 'ai',
      text: '',
      stamp: now,
      loading: true,
      citations: [],
    })

    isThinking.value = true
    const userPrompt = prompt.value
    prompt.value = ''

    window.setTimeout(() => {
      const answer = [
        'Identifiquei 3 pontos críticos no grafo: dependências entre billing → auth, o gate de feature flags e o rollback padronizado.',
        'Sugiro congelar deploys dos serviços dependentes, comunicar owners e acompanhar o runbook de rollback.',
        'As citações abaixo trazem links para ADRs e postmortems usados na resposta.',
      ].join(' ')

      const idx = conversation.value.findIndex((m) => m.id === pendingId)
      if (idx >= 0) {
        conversation.value[idx] = {
          id: pendingId,
          from: 'ai',
          text: `<strong>${userPrompt}</strong><br/>${answer}`,
          stamp: now,
          citations: retrievedSources.value.slice(0, 3),
        }
      }
      isThinking.value = false
    }, 900)
  }

  const applyFollowUp = (intent) => {
    prompt.value = intent.prompt
  }
</script>

<style scoped>
  .rag-page {
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

  .rag-chat-window {
    max-height: 520px;
  }

  .rag-message {
    line-height: 1.5;
  }
</style>
