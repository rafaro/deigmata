<template>
  <q-page class="rag-page q-pa-lg">
    <div class="row q-col-gutter-lg">
      <div class="col-12">
        <q-card class="rag-hero-card q-pa-lg">
          <div class="row items-center q-col-gutter-md">
            <div class="col">
              <div class="text-h5 text-white q-mb-xs">
                <q-chip v-if="ragId" color="white" text-color="primary" icon="badge" outline>
                  Run #{{ ragId }}
                </q-chip>
                {{ t('rag.workspaceTitle') }}
              </div>
              <div class="text-body1 text-white rag-hero-subtitle">
                {{ t('rag.workspaceSubtitle') }}
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

      <div class="col-5 col-lg-4">
        <div class="column q-gutter-md">
          <q-card class="glass-card">
            <q-expansion-item
              v-model="tuningExpanded"
              expand-separator
              dense
              header-class="rag-tuning-header"
              expand-icon="keyboard_arrow_down"
            >
              <template #header>
                <q-item-section>
                  <q-item-label class="text-subtitle2">{{ t('rag.tuning') }}</q-item-label>
                  <q-item-label caption>{{ t('rag.playbook') }}</q-item-label>
                </q-item-section>
              </template>

              <div class="q-pa-md">
                <div class="column q-gutter-md q-mb-sm">
                  <div class="col-12">
                    <div class="text-caption text-grey-7">{{ t('rag.creativity') }}</div>
                    <q-slider
                      v-model="temperature"
                      color="primary"
                      :step="0.1"
                      :min="0.1"
                      :max="2"
                    />
                    <div class="rag-temp-footer">
                      <div class="rag-temp-pill">
                        <div class="rag-temp-value">{{ temperature.toFixed(1) }}</div>
                        <div class="rag-temp-label">{{ temperatureLabel }}</div>
                      </div>
                      <div class="rag-temp-scale">
                        <span>{{ t('rag.temperatureExtraction') }}</span>
                        <span>{{ t('rag.temperatureTechnical') }}</span>
                        <span>{{ t('rag.temperatureExplanatory') }}</span>
                        <span>{{ t('rag.temperatureCreative') }}</span>
                        <span>{{ t('rag.temperatureExperimental') }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="text-caption text-grey-7">{{ t('rag.nucleusSampling') }}</div>
                    <q-slider
                      v-model="nucleusSampling"
                      color="primary"
                      :step="0.1"
                      :min="0.1"
                      :max="1"
                    />
                    <div class="rag-temp-footer">
                      <div class="rag-temp-pill">
                        <div class="rag-temp-value">{{ nucleusSampling.toFixed(1) }}</div>
                        <div class="rag-temp-label">{{ nucleusSamplingLabel }}</div>
                      </div>
                      <div class="rag-temp-scale">
                        <span>{{ t('rag.temperaturePrecise') }}</span>
                        <span>{{ t('rag.temperatureBalanced') }}</span>
                        <span>{{ t('rag.temperatureLoose') }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </q-expansion-item>
          </q-card>

          <q-card class="glass-card q-pa-md rag-composer-card">
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
          </q-card>
        </div>
      </div>

      <div class="col-7 col-lg-8 q-gutter-md column">
        <q-card class="glass-card q-pa-md">
          <div class="row items-center justify-between q-mb-md">
            <div>
              <div class="text-subtitle1">{{ t('rag.conversation') }}</div>
              <div class="text-caption text-grey-7">
                {{ t('rag.conversationHint') }}
              </div>
            </div>
          </div>

          <q-scroll-area class="rag-chat-window">
            <div class="q-px-xs q-pt-sm">
              <q-chat-message
                v-for="message in conversation"
                :key="message.id"
                :sent="message.from === 'user'"
                :bg-color="message.from === 'user' ? 'primary' : 'grey-1'"
                :text-color="message.from === 'user' ? 'white' : 'dark'"
                :name="message.from === 'user' ? t('rag.chatUser') : t('rag.chatAssistant')"
                :stamp="message.stamp"
              >
                <template v-if="message.loading">
                  <q-spinner-dots color="primary" size="24px" />
                  <div class="text-caption text-grey-7 q-mt-xs">
                    {{ t('rag.drafting') }}
                  </div>
                </template>
                <template v-else>
                  <div class="rag-message text-body2" v-html="renderMarkdown(message.text)"></div>
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
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { useProjectStore } from 'stores/project'
  import { useI18n } from 'vue-i18n'
  import { service } from 'boot/service'
  import { api } from 'boot/axios'
  import MarkdownIt from 'markdown-it'

  const { t } = useI18n()

  const props = defineProps(['id'])
  const ragId = computed(() => props.id)
  const data = ref({})
  const loading = ref(true)
  const prjStore = useProjectStore()
  const conversation = ref([])

  const prompt = ref('')
  const isThinking = ref(false)

  const temperature = ref(0.2)
  const nucleusSampling = ref(0.2)
  const nucleusSamplingLabel = computed(() => {
    if (nucleusSampling.value < 0.3) return t('rag.temperaturePrecise')
    if (nucleusSampling.value < 0.7) return t('rag.temperatureBalanced')
    return t('rag.temperatureLoose')
  })
  const temperatureLabel = computed(() => {
    if (temperature.value <= 0.3) return t('rag.temperatureExtraction')
    if (temperature.value <= 0.5) return t('rag.temperatureTechnical')
    if (temperature.value <= 0.8) return t('rag.temperatureExplanatory')
    if (temperature.value <= 1.2) return t('rag.temperatureCreative')
    return t('rag.temperatureExperimental')
  })
  const tuningExpanded = ref(false)
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
  })

  const createStamp = (value = new Date()) => new Date(value).toLocaleString()
  const createMessage = ({ id, from, text, stamp, loading }) => ({
    id,
    from,
    text,
    stamp,
    citations: [],
    loading,
  })
  const formatSamplingValue = (value) => {
    if (value === null || value === undefined || value === '') return null
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric.toFixed(2)
    return String(value)
  }
  const buildStampWithSampling = (message) => {
    const parts = []
    const temperatureValue = formatSamplingValue(message.temperature)
    const topPValue = formatSamplingValue(message.topp ?? message.topP)

    if (temperatureValue) parts.push(`temperature: ${temperatureValue}`)
    if (topPValue) parts.push(`${t('rag.nucleusSampling')}: ${topPValue}`)

    const baseStamp = createStamp(message.createdat)
    if (!parts.length) return baseStamp
    return `${baseStamp} | ${parts.join(' | ')}`
  }
  const buildStampWithSamplingValues = (temperatureValue, topPValue, stampValue = new Date()) => {
    const parts = []
    const formattedTemperature = formatSamplingValue(temperatureValue)
    const formattedTopP = formatSamplingValue(topPValue)

    if (formattedTemperature) parts.push(`temperature: ${formattedTemperature}`)
    if (formattedTopP) parts.push(`${t('rag.nucleusSampling')}: ${formattedTopP}`)

    const baseStamp = createStamp(stampValue)
    if (!parts.length) return baseStamp
    return `${baseStamp} | ${parts.join(' | ')}`
  }
  const buildConversationFromHistory = (messages = []) =>
    messages.flatMap((msg) => {
      const stamp = buildStampWithSampling(msg)
      const items = []

      if (msg.question?.trim()) {
        items.push(
          createMessage({
            id: `${msg.id}-question`,
            from: 'user',
            text: msg.question,
            loading: false,
          })
        )
      }

      if (msg.answer?.trim()) {
        items.push(
          createMessage({
            id: `${msg.id}-answer`,
            from: 'assistant',
            text: msg.answer,
            stamp,
            loading: false,
          })
        )
      }

      return items
    })
  const loadConversation = async () => {
    loading.value = true
    conversation.value = []
    try {
      if (!props.id) {
        data.value = {}
        loading.value = false
        return
      }
      const response = await api.get(`rag/message/${props.id}`)
      data.value = response.data

      conversation.value = buildConversationFromHistory(data.value?.ragmessages ?? [])
    } catch {
      // keep silent; errors handled via loading state
    } finally {
      loading.value = false
    }
  }

  const sendMessage = async () => {
    const trimmedPrompt = prompt.value.trim()
    if (!trimmedPrompt) return

    const stamp = buildStampWithSamplingValues(temperature.value, nucleusSampling.value)
    const messageId = Date.now()
    const pendingAnswerId = `${messageId}-answer`

    const questionMessage = createMessage({
      id: `${messageId}-question`,
      from: 'user',
      text: trimmedPrompt,
      loading: false,
    })

    const pendingAnswer = createMessage({
      id: pendingAnswerId,
      from: 'assistant',
      text: '',
      stamp,
      loading: true,
    })
    conversation.value.unshift(questionMessage, pendingAnswer)
    const updatePendingAnswer = (patch) => updateConversationMessage(pendingAnswerId, patch)

    prompt.value = ''
    isThinking.value = true
    try {
      const response = await api.post('rag/message/query', {
        ragId: ragId.value,
        question: trimmedPrompt,
        temperature: temperature.value,
        topP: nucleusSampling.value,
        projectId: prjStore.getProject.id,
      })
      updatePendingAnswer({
        text: response.data?.answer ?? '',
        loading: false,
      })
    } catch (e) {
      updatePendingAnswer({ loading: false })
      service.msgError(e?.response?.data?.message ?? 'Erro ao enviar mensagem.')
    } finally {
      isThinking.value = false
    }
  }

  const updateConversationMessage = (messageId, patch) => {
    const index = conversation.value.findIndex((message) => message.id === messageId)
    if (index === -1) return
    conversation.value.splice(index, 1, { ...conversation.value[index], ...patch })
  }

  const renderMarkdown = (value = '') => markdown.render(String(value))

  watch(
    () => props.id,
    () => {
      prompt.value = ''
      isThinking.value = false
      loadConversation()
    },
    { immediate: true }
  )
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
    height: 520px;
    max-height: 520px;
  }

  .rag-tuning-header {
    padding: 16px;
  }

  .rag-composer-card {
    position: sticky;
    bottom: 16px;
    z-index: 1;
  }

  .rag-temp-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 6px;
  }

  .rag-temp-pill {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    background: linear-gradient(120deg, rgba(25, 55, 109, 0.12), rgba(87, 108, 188, 0.2));
    border: 1px solid rgba(25, 55, 109, 0.18);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  .rag-temp-value {
    font-weight: 600;
    color: #19376d;
    font-size: 0.95rem;
  }

  .rag-temp-label {
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #576cbc;
  }

  .rag-temp-scale {
    display: inline-flex;
    gap: 10px;
    font-size: 0.7rem;
    color: #7a869a;
  }

  .rag-temp-scale span {
    position: relative;
    padding-top: 8px;
  }

  .rag-temp-scale span::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: rgba(25, 55, 109, 0.35);
  }

  @media (max-width: 1024px) {
    .rag-composer-card {
      position: static;
    }
  }

  .rag-message {
    line-height: 1.5;
  }

  .rag-message :deep(p) {
    margin: 0 0 0.6rem;
  }

  .rag-message :deep(p:last-child) {
    margin-bottom: 0;
  }

  .rag-message :deep(ul),
  .rag-message :deep(ol) {
    margin: 0 0 0.6rem;
    padding-left: 1.1rem;
  }

  .rag-message :deep(pre) {
    margin: 0.4rem 0 0.6rem;
    padding: 0.75rem 0.9rem;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.08);
    overflow-x: auto;
  }

  .rag-message :deep(code) {
    font-family: 'SFMono-Regular', 'JetBrains Mono', Menlo, monospace;
    font-size: 0.85em;
  }

  .rag-message :deep(blockquote) {
    margin: 0 0 0.6rem;
    padding-left: 0.75rem;
    border-left: 3px solid rgba(25, 55, 109, 0.3);
    color: #5f6f86;
  }

  .rag-message :deep(a) {
    color: #1f6feb;
    text-decoration: underline;
  }
</style>
