<template>
  <q-layout view="lHh Lpr lFf">
    <q-banner
      dense
      inline-actions
      class="text-white bg-red"
      v-if="!Array.isArray(elements.nodes) || elements.nodes.length <= 0"
    >
      {{ t('projectwithoutdata') }}
    </q-banner>

    <q-drawer
      side="right"
      v-model="rightDrawerOpen"
      show-if-above
      :width="350"
      bordered
      class="bg-grey-1"
    >
      <div class="q-pa-md">
        <div class="text-h6">{{ t('detail') }}</div>
        <div class="row">
          <div id="selectLayout" class="col-10 q-mb-sm">
            <q-select
              filled
              v-model="selectedLayout"
              :options="optLayout"
              label="Layout"
              stack-label
              dense
              options-dense
              emit-value
              @update:model-value="(val) => changeLayout(val)"
            />
          </div>

          <q-list bordered class="rounded-borders col-12">
            <q-expansion-item
              id="filterexpansion"
              expand-separator
              icon="filter_alt"
              :label="t('filter')"
            >
              <div id="filterText" class="col-7 q-mb-sm">
                <q-input
                  outlined
                  dense
                  v-model="filterText"
                  :label="t('filter')"
                  @update:model-value="(val) => filterGraph(val)"
                />
              </div>
              <div id="filterDistance" class="col-12 q-mb-md">
                <div class="row items-center justify-between q-mb-xs">
                  <span class="text-caption text-grey-7">{{ t('filterDistance') }}</span>
                  <q-badge color="primary">
                    {{ filterDistance }}
                    {{ filterDistance === 1 ? t('filterDistanceStep') : t('filterDistanceSteps') }}
                  </q-badge>
                </div>
                <q-slider
                  v-model="filterDistance"
                  color="primary"
                  :min="0"
                  :max="6"
                  :step="1"
                  snap
                  markers
                  @update:model-value="() => filterGraph(filterText)"
                />
              </div>
              <div class="col-12 q-mb-sm">
                <q-btn
                  color="primary"
                  icon="add_circle"
                  :loading="creatingProject"
                  @click="createProjectFromFilteredGraph"
                >
                  {{ t('createProjectFromFilter') }}
                </q-btn>
              </div>
            </q-expansion-item>
            <q-expansion-item id="history" expand-separator icon="history" :label="t('history')">
              <div class="col-10 q-py-md">
                <q-btn @click="undo" icon="undo" class="col-4 q-mx-md" :disabled="!canUndo">
                  {{ t('undo') }}
                </q-btn>
              </div>
            </q-expansion-item>
            <q-expansion-item
              id="expand"
              expand-separator
              icon="view_module"
              :label="`${t('expand')}/${t('collapse')}`"
            >
              <div class="col-10 q-py-md">
                <!-- <p class="text-h6 col-10">{{ t('node') }}</p> -->
                <q-btn @click="expand" icon="add" class="col-4 q-mx-md">{{ t('expand') }}</q-btn>
                <q-btn @click="collapse" icon="remove" class="col-4 q-mx-md">
                  {{ t('collapse') }}
                </q-btn>
              </div>
            </q-expansion-item>

            <q-expansion-item id="info" expand-separator icon="info" :label="t('info')">
              <strong>{{ t('info') }}:</strong> {{ selectedElement?.type }}
              <br />
              <strong>ID:</strong> {{ selectedElement?.id || selectedElement?.source }} →
              {{ selectedElement?.target || '' }}
              <br />
              <strong>{{ t('label') }}:</strong> {{ selectedElement?.label }}
              <p v-if="selectedElement?.position">
                <strong>{{ t('position') }}:</strong> <br />
                X: {{ selectedElement?.position.x }}, <br />
                Y: {{ selectedElement?.position.y }}
              </p>
            </q-expansion-item>

            <q-expansion-item
              id="metrics"
              expand-separator
              icon="insights"
              :label="t('metrics')"
              @show="calculateMetrics"
            >
              <ul>
                <li>{{ t('graph.totalNodes') }}: {{ metrics.nodes }}</li>
                <li>{{ t('graph.totalEdges') }}: {{ metrics.edges }}</li>
                <li>{{ t('graph.averageDegree') }}: {{ metrics.avgDegree.toFixed(2) }}</li>
                <li>{{ t('graph.maxDegree') }}: {{ metrics.maxDegree }}</li>
                <li>{{ t('graph.minDegree') }}: {{ metrics.minDegree }}</li>
                <li>{{ t('graph.density') }}: {{ metrics.density.toFixed(4) }}</li>
                <!-- <li>Componentes conectados: {{ metrics.components }}</li> -->
              </ul>
            </q-expansion-item>
            <q-expansion-item
              id="list"
              expand-separator
              icon="toc"
              @show="getList"
              :label="t('list')"
            >
              <q-list v-for="item in listElements" :key="item" bordered dense>
                <q-item dense>
                  <q-item-section>
                    <q-item-label>{{ item }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
            <q-expansion-item
              id="tour"
              expand-separator
              icon="help"
              @show="getList"
              :label="t('tour')"
            >
              <div class="col-10 q-py-md">
                <q-btn class="col-4 q-mx-md" @click="startTour">{{ t('start') }}</q-btn>
              </div>
            </q-expansion-item>
          </q-list>
        </div>
      </div>
    </q-drawer>

    <!-- Página Principal -->
    <q-page-container>
      <q-page class="q-pa-md">
        <!-- Painel central (grafo) -->
        <div class="kg-graph-panel q-pa-sm bg-grey-2 rounded-borders shadow-2 relative-position">
          <div ref="cyContainer" id="cytoscape-container" class="fit" />

          <div id="zoomLevel" class="kg-zoom-toolbar absolute-bottom-left q-ml-md q-mb-md">
            <div class="row items-center no-wrap q-gutter-xs">
              <q-btn
                flat
                round
                dense
                icon="zoom_out"
                :aria-label="t('zoomOut')"
                :disable="!hasGraph"
                @click="zoomOut"
              >
                <q-tooltip>{{ t('zoomOut') }}</q-tooltip>
              </q-btn>
              <q-slider
                v-model="zoomLevel"
                class="kg-zoom-toolbar__slider"
                color="primary"
                :min="MIN_ZOOM"
                :max="MAX_ZOOM"
                :step="ZOOM_STEP"
                :disable="!hasGraph"
                :label-value="zoomLevelLabel"
                label
                @update:model-value="setZoom"
              />
              <div class="kg-zoom-toolbar__value">{{ zoomLevelLabel }}</div>
              <q-btn
                flat
                round
                dense
                icon="zoom_in"
                :aria-label="t('zoomIn')"
                :disable="!hasGraph"
                @click="zoomIn"
              >
                <q-tooltip>{{ t('zoomIn') }}</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="fit_screen"
                :aria-label="t('zoomFit')"
                :disable="!hasGraph"
                @click="fitGraph"
              >
                <q-tooltip>{{ t('zoomFit') }}</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="restart_alt"
                :aria-label="t('zoomReset')"
                :disable="!hasGraph"
                @click="resetZoom"
              >
                <q-tooltip>{{ t('zoomReset') }}</q-tooltip>
              </q-btn>
            </div>
          </div>

          <!-- Botão flutuante no canto direito -->
          <q-btn
            :icon="rightDrawerOpen ? 'chevron_right' : 'chevron_left'"
            color="primary"
            round
            dense
            class="absolute-top-right q-mt-md q-mr-md"
            @click="rightDrawerOpen = !rightDrawerOpen"
          />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
  import { onMounted, ref, reactive, computed } from 'vue'
  import { useProjectStore } from 'src/stores/project'
  import { useI18n } from 'vue-i18n'
  import { kgview } from 'src/boot/kgview'
  import { api } from 'src/boot/axios'
  import { service } from 'src/boot/service'
  import cytoscape from 'cytoscape'
  import cxtmenu from 'cytoscape-cxtmenu'
  import coseBilkent from 'cytoscape-cose-bilkent'
  import cytoscapeLasso from 'cytoscape-lasso'
  import expandCollapse from 'cytoscape-expand-collapse'
  import Shepherd from 'shepherd.js'
  import 'shepherd.js/dist/css/shepherd.css'

  cytoscape.use(cytoscapeLasso)
  cytoscape.use(cxtmenu)
  cytoscape.use(coseBilkent)
  cytoscape.use(expandCollapse)

  const cyContainer = ref(null)
  const cy = ref(null)
  const rightDrawerOpen = ref(false)
  const zoomLevel = ref(1)
  const elements = ref([])
  const selectedElement = ref(null)
  const filterText = ref('')
  const prjStore = useProjectStore()
  const { t } = useI18n()
  const listElements = ref([])
  const history = ref([])
  const creatingProject = ref(false)
  const filterDistance = ref(1)
  const canUndo = computed(() => history.value.length > 0)
  const MIN_ZOOM = 0.2
  const MAX_ZOOM = 3
  const ZOOM_STEP = 0.1
  const LAYOUT_PADDING = 56
  const LAYOUT_MAX_AUTO_ZOOM = 1
  const LAYOUT_SPACING_FACTOR = 0.85
  const zoomLevelLabel = computed(() => `${Math.round(zoomLevel.value * 100)}%`)
  const hasGraph = computed(() => Boolean(cy.value))
  let activeLayout = null

  const metrics = reactive({
    nodes: 0,
    edges: 0,
    avgDegree: 0,
    maxDegree: 0,
    minDegree: 0,
    density: 0,
    components: 0,
  })
  const prj = computed({
    get: () => prjStore.getProject,
  })
  const selectedLayout = ref(prj.value.layout || 'cose')

  const selectedElements = reactive({
    nodes: [],
    edges: [],
  })

  const optLayout = kgview.getOptLayout()

  onMounted(() => {
    renderGraph()
  })

  const renderGraph = async () => {
    if (!cyContainer.value) {
      console.error('Container Cytoscape não encontrado')
      return
    }
    if (cy.value) {
      stopActiveLayout()
      cy.value.destroy()
    }

    try {
      elements.value = await kgview.getElements(prj.value.id)
      cy.value = cytoscape({
        container: cyContainer.value,
        style: kgview.getStyle(),
        elements: elements.value,
        layout: getLayoutOptions(selectedLayout.value, { fit: true }),
        zoom: 1,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        wheelSensitivity: 0.2,
      })

      cy.value.lassoSelectionEnabled(true)
      cy.value.on('zoom', syncZoomLevel)

      cy.value.on('tap', 'node, edge', (event) => {
        getDetail(event.target)
      })

      cy.value.cxtmenu({
        menuRadius: 80,
        selector: 'node',
        commands: [
          {
            content: '🔍 Detalhes',
            select: (ele) => {
              getDetail(ele)
            },
          },
          {
            content: '🎨 Mudar cor',
            select: (ele) => {
              ele.style('background-color', '#f00')
            },
          },
          {
            content: '✏️ Criar grupo',
            select: (ele) => {
              kgview.createGroup(cy, ele)
            },
          },
        ],
      })

      const updateSelection = () => {
        selectedElements.nodes = cy.value.$('node:selected').map((ele) => ele.data())
        selectedElements.edges = cy.value.$('edge:selected').map((ele) => ele.data())
      }

      cy.value.on('select unselect lassoend', updateSelection)

      cy.value.resize()
      cy.value.zoom(cy.value.zoom())
      syncZoomLevel()
      cy.value.elements().unselect()
      setupDragDrop()
      saveState()
    } catch (error) {
      console.error('Erro ao carregar dados do projeto:', error)
    }
  }

  function getDetail(e) {
    selectedElement.value = kgview.getDetail(e)
  }

  function clampZoom(value) {
    const parsedValue = Number(value)
    const nextZoom = Number.isFinite(parsedValue) ? parsedValue : 1
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
  }

  function normalizeZoom(value) {
    return Number(clampZoom(value).toFixed(2))
  }

  function getRenderedCenter() {
    const box = cyContainer.value?.getBoundingClientRect()
    return {
      x: box ? box.width / 2 : 0,
      y: box ? box.height / 2 : 0,
    }
  }

  function syncZoomLevel() {
    if (!cy.value) return
    zoomLevel.value = normalizeZoom(cy.value.zoom())
  }

  function setZoom(value) {
    if (!cy.value) return

    const nextZoom = normalizeZoom(value)
    zoomLevel.value = nextZoom
    cy.value.zoom({
      level: nextZoom,
      renderedPosition: getRenderedCenter(),
    })
  }

  function zoomIn() {
    setZoom(zoomLevel.value + ZOOM_STEP)
  }

  function zoomOut() {
    setZoom(zoomLevel.value - ZOOM_STEP)
  }

  function resetZoom() {
    if (!cy.value) return

    setZoom(1)
    cy.value.center(cy.value.elements())
  }

  function fitGraph() {
    if (!cy.value) return

    const visibleElements = cy.value.elements()
    if (visibleElements.empty()) return

    cy.value.fit(visibleElements, 48)
    syncZoomLevel()
  }

  function getLayoutOptions(layoutName, overrides = {}) {
    const baseOptions = {
      name: layoutName,
      fit: false,
      padding: LAYOUT_PADDING,
      animate: false,
      spacingFactor: LAYOUT_SPACING_FACTOR,
      nodeDimensionsIncludeLabels: false,
    }
    const optionsByLayout = {
      cose: {
        randomize: true,
        componentSpacing: 28,
        nodeRepulsion: 1500,
        nodeOverlap: 6,
        idealEdgeLength: 46,
        edgeElasticity: 64,
        gravity: 1.45,
        numIter: 750,
        initialTemp: 240,
        coolingFactor: 0.95,
      },
      'cose-bilkent': {
        quality: 'default',
        randomize: true,
        nodeRepulsion: 3000,
        idealEdgeLength: 48,
        edgeElasticity: 0.55,
        gravity: 0.45,
        gravityRange: 2.6,
        tilingPaddingVertical: 8,
        tilingPaddingHorizontal: 8,
        animationDuration: 0,
      },
      circle: {
        spacingFactor: 0.78,
      },
      concentric: {
        minNodeSpacing: 34,
        spacingFactor: 0.8,
      },
      random: {
        spacingFactor: 0.75,
      },
    }

    return {
      ...baseOptions,
      ...(optionsByLayout[layoutName] || {}),
      ...overrides,
    }
  }

  function stopActiveLayout() {
    if (!activeLayout) return

    const layout = activeLayout
    activeLayout = null
    layout.stop()
  }

  function fitLayoutView() {
    if (!cy.value) return

    const visibleElements = cy.value.elements()
    if (visibleElements.empty()) return

    cy.value.fit(visibleElements, LAYOUT_PADDING)

    if (cy.value.zoom() > LAYOUT_MAX_AUTO_ZOOM) {
      cy.value.zoom(LAYOUT_MAX_AUTO_ZOOM)
      cy.value.center(visibleElements)
    }

    syncZoomLevel()
  }

  function refreshLayout() {
    if (!cy.value) return

    stopActiveLayout()

    cy.value.resize()

    const nextLayout = cy.value.layout(
      getLayoutOptions(selectedLayout.value, {
        stop: () => {
          fitLayoutView()
          if (activeLayout === nextLayout) {
            activeLayout = null
          }
        },
      }),
    )

    activeLayout = nextLayout
    nextLayout.run()
  }

  function changeLayout(layout) {
    selectedLayout.value = layout
    refreshLayout()
    kgview.updateLayout(prj.value.id, layout)
    prjStore.setLayout({ layout })
  }

  function filterGraph(val) {
    if (!cy.value) return

    stopActiveLayout()
    cy.value.elements().remove()
    cy.value.add(elements.value)

    const needle = (val || '').toString().trim().toLowerCase()
    if (!needle) {
      refreshLayout()
      return
    }

    const matchedNodes = cy.value.nodes().filter((node) => {
      const label = (node.data('label') || '').toString().toLowerCase()
      return label.includes(needle)
    })

    const maxDistance = Math.max(0, Number(filterDistance.value) || 0)
    const keep = getElementsWithinDistance(matchedNodes, maxDistance)
    const remove = cy.value.elements().difference(keep)
    cy.value.remove(remove)
    refreshLayout()
  }

  function getElementsWithinDistance(nodes, maxDistance) {
    let keepNodes = nodes
    let keepEdges = cy.value.collection()
    let frontier = nodes

    for (let distance = 0; distance < maxDistance; distance += 1) {
      const nextEdges = frontier.connectedEdges().difference(keepEdges)
      const nextNodes = nextEdges.connectedNodes().difference(keepNodes)

      keepEdges = keepEdges.union(nextEdges)

      if (nextNodes.empty()) {
        break
      }

      keepNodes = keepNodes.union(nextNodes)
      frontier = nextNodes
    }

    return keepNodes.union(keepEdges)
  }

  async function createProjectFromFilteredGraph() {
    if (!cy.value) return

    const snapshot = cy.value.json().elements || { nodes: [], edges: [] }
    const totalElements = snapshot.nodes.length + snapshot.edges.length

    if (totalElements === 0) {
      service.msgYellow(t('createProjectFromFilterEmpty'))
      return
    }

    const baseName = prj.value?.name ? `${prj.value.name}` : t('project')
    const defaultName = filterText.value
      ? `${baseName} - ${filterText.value}`
      : `${baseName} - ${t('filter')}`

    const name = window.prompt(t('createProjectFromFilterPrompt'), defaultName)
    if (!name) return

    creatingProject.value = true
    try {
      await api.post('project', {
        name,
        layout: selectedLayout.value,
        kg: snapshot,
      })
      service.msgGreen(t('createProjectFromFilterSuccess'))
    } catch (error) {
      service.msgError(error?.response?.data?.message || error?.message || t('failed'))
    } finally {
      creatingProject.value = false
    }
  }

  function setupDragDrop() {
    cy.value.on('free', 'node', (e) => {
      kgview.setGroup(e, cy)
      //kgview.updateElement(e.target)
      saveState()
    })
  }
  function collapse() {
    kgview.collapse(cy)
  }

  function expand() {
    kgview.expand(cy)
  }

  function getList() {
    const nodes = cy.value.nodes()
    const visited = new Set()
    const result = []

    function visit(node) {
      if (visited.has(node.id())) return
      visited.add(node.id())

      // visit all outgoing edges' targets
      node.outgoers('edge').targets().forEach(visit)

      result.unshift(node.id()) // prepend
    }

    nodes.forEach((node) => visit(node))
    listElements.value = result
  }

  function saveState() {
    const json = cy.value.json()
    kgview.updateKg(prj.value.id, JSON.stringify(json.elements))
    history.value.push(JSON.parse(JSON.stringify(json)))
  }

  function undo() {
    if (history.value.length > 0) {
      const lastState = history.value.pop()
      cy.value.json(lastState)
      cy.value.resize()
      cy.value.run()
    }
  }

  function calculateMetrics() {
    const nodes = cy.value.nodes()
    const edges = cy.value.edges()

    const degrees = nodes.map((n) => n.degree())
    const totalNodes = nodes.length
    const totalEdges = edges.length

    metrics.nodes = totalNodes
    metrics.edges = totalEdges
    metrics.avgDegree = totalNodes ? degrees.reduce((a, b) => a + b, 0) / totalNodes : 0
    metrics.maxDegree = Math.max(...degrees, 0)
    metrics.minDegree = Math.min(...degrees, 0)

    metrics.density = totalNodes > 1 ? (2 * totalEdges) / (totalNodes * (totalNodes - 1)) : 0
  }

  function startTour() {
    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        scrollTo: true,
        cancelIcon: { enabled: true },
        classes: 'shadow-md bg-purple-50',
      },
    })

    kgview.addStep(tour, t)

    tour.start()
  }
</script>

<style scoped>
  .kg-graph-panel {
    height: 80vh;
    min-height: 420px;
    overflow: hidden;
  }

  #cytoscape-container {
    width: 100%;
    height: 100%;
    background-color: #ffffff;
  }

  .kg-zoom-toolbar {
    z-index: 2;
    width: min(360px, calc(100% - 32px));
    padding: 8px 10px;
    border: 1px solid rgba(32, 45, 64, 0.14);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 8px 24px rgba(32, 45, 64, 0.16);
    backdrop-filter: blur(6px);
  }

  .kg-zoom-toolbar__slider {
    flex: 1 1 128px;
    min-width: 96px;
  }

  .kg-zoom-toolbar__value {
    width: 44px;
    color: #344054;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    text-align: right;
  }

  @media (max-width: 599px) {
    .kg-graph-panel {
      height: calc(100vh - 112px);
      min-height: 360px;
    }

    .kg-zoom-toolbar {
      left: 12px;
      bottom: 12px;
      width: calc(100% - 24px);
      margin-left: 0 !important;
      margin-bottom: 0 !important;
    }

    .kg-zoom-toolbar__slider {
      min-width: 80px;
    }

    .kg-zoom-toolbar__value {
      display: none;
    }
  }
</style>
