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
              @update:model-value="changeLayout"
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
                  @update:model-value="queueFilterGraph"
                  @keyup.enter="applyFilterGraph"
                >
                  <template v-if="filterText" #append>
                    <q-btn
                      flat
                      round
                      dense
                      icon="close"
                      :aria-label="t('clearFilter')"
                      @click.stop="clearFilterText"
                    >
                      <q-tooltip>{{ t('clearFilter') }}</q-tooltip>
                    </q-btn>
                  </template>
                </q-input>
              </div>
              <div id="filterDistance" class="col-12 q-mb-md">
                <div class="row items-center justify-between q-mb-xs">
                  <span class="text-caption text-grey-7">{{ t('filterDistance') }}</span>
                  <q-badge color="primary">
                    {{ filterDistance }}
                    {{ t(filterDistance === 1 ? 'filterDistanceStep' : 'filterDistanceSteps') }}
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
                  @update:model-value="queueFilterGraph"
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
                <q-btn @click="undo" icon="undo" class="col-4 q-mx-md" :disable="!canUndo">
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
                <q-btn @click="() => kgview.expand(cy)" icon="add" class="col-4 q-mx-md">
                  {{ t('expand') }}
                </q-btn>
                <q-btn @click="() => kgview.collapse(cy)" icon="remove" class="col-4 q-mx-md">
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

            <q-expansion-item id="tour" expand-separator icon="help" :label="t('tour')">
              <div class="col-10 q-py-md">
                <q-btn class="col-4 q-mx-md" @click="startTour">{{ t('start') }}</q-btn>
              </div>
            </q-expansion-item>
          </q-list>
        </div>
      </div>
    </q-drawer>

    <!-- Main page -->
    <q-page-container>
      <q-page class="q-pa-md">
        <!-- Central panel (graph) -->
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
                v-for="btn in zoomButtons"
                :key="btn.icon"
                flat
                round
                dense
                :icon="btn.icon"
                :aria-label="t(btn.label)"
                :disable="!hasGraph"
                @click="btn.action"
              >
                <q-tooltip>{{ t(btn.label) }}</q-tooltip>
              </q-btn>
            </div>
          </div>

          <!-- Floating button in the right corner -->
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
  import { onBeforeUnmount, onMounted, ref, reactive, computed } from 'vue'
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

  // ---- Constants ----
  const MIN_ZOOM = 0.2
  const MAX_ZOOM = 3
  const ZOOM_STEP = 0.1
  const LAYOUT_PADDING = 56
  const LAYOUT_MAX_AUTO_ZOOM = 1
  const LAYOUT_SPACING_FACTOR = 0.85
  const FILTER_DEBOUNCE_MS = 300
  const PERSIST_DEBOUNCE_MS = 800
  const MAX_HISTORY_STATES = 10

  // Layout-specific overrides, kept outside the function so they are not
  // recreated on each getLayoutOptions() call.
  const LAYOUT_OVERRIDES = {
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
    circle: { spacingFactor: 0.78 },
    concentric: { minNodeSpacing: 34, spacingFactor: 0.8 },
    random: { spacingFactor: 0.75 },
  }

  // ---- Composables / store ----
  const { t } = useI18n()
  const prjStore = useProjectStore()
  const optLayout = kgview.getOptLayout()

  // ---- State ----
  const cyContainer = ref(null)
  const cy = ref(null)
  const rightDrawerOpen = ref(false)
  const zoomLevel = ref(1)
  const elements = ref([])
  const selectedElement = ref(null)
  const filterText = ref('')
  const filterDistance = ref(1)
  const listElements = ref([])
  const history = ref([])
  const creatingProject = ref(false)
  let activeLayout = null
  let graphIndex = createEmptyGraphIndex()
  let filterTimer = null
  let persistTimer = null
  let pendingPersistElements = null

  const metrics = reactive({
    nodes: 0,
    edges: 0,
    avgDegree: 0,
    maxDegree: 0,
    minDegree: 0,
    density: 0,
  })

  const selectedElements = reactive({ nodes: [], edges: [] })

  const prj = computed(() => prjStore.getProject)
  const selectedLayout = ref(prj.value.layout || 'cose')

  // ---- Derived computeds ----
  const canUndo = computed(() => history.value.length > 0)
  const hasGraph = computed(() => Boolean(cy.value))
  const zoomLevelLabel = computed(() => `${Math.round(zoomLevel.value * 100)}%`)

  // Zoom buttons to the right of the slider
  // (zoom_out stays fixed on the left in the template)
  const zoomButtons = [
    { icon: 'zoom_in', label: 'zoomIn', action: zoomIn },
    { icon: 'fit_screen', label: 'zoomFit', action: fitGraph },
    { icon: 'restart_alt', label: 'zoomReset', action: resetZoom },
  ]

  onMounted(() => {
    renderGraph()
  })

  onBeforeUnmount(() => {
    clearFilterTimer()
    flushPendingKgPersist()
    stopActiveLayout()
    if (cy.value) {
      cy.value.destroy()
      cy.value = null
    }
  })

  async function renderGraph() {
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
        hideEdgesOnViewport: true,
        textureOnViewport: true,
        motionBlur: true,
      })
      graphIndex = buildCyGraphIndex()

      cy.value.lassoSelectionEnabled(true)
      cy.value.on('zoom', syncZoomLevel)
      cy.value.on('tap', 'node, edge', (event) => getDetail(event.target))

      cy.value.cxtmenu({
        menuRadius: 80,
        selector: 'node',
        commands: [
          { content: '🔍 Detalhes', select: (ele) => getDetail(ele) },
          { content: '🎨 Mudar cor', select: (ele) => ele.style('background-color', '#f00') },
          { content: '✏️ Criar grupo', select: (ele) => kgview.createGroup(cy, ele) },
        ],
      })

      cy.value.on('select unselect lassoend', updateSelection)
      cy.value.on('grab', 'node', pushHistoryState)
      cy.value.on('free', 'node', (e) => {
        kgview.setGroup(e, cy)
        saveState({ recordHistory: false })
      })

      cy.value.resize()
      syncZoomLevel()
      cy.value.elements().unselect()
      history.value = []
    } catch (error) {
      console.error('Erro ao carregar dados do projeto:', error)
    }
  }

  function updateSelection() {
    selectedElements.nodes = cy.value.$('node:selected').map((ele) => ele.data())
    selectedElements.edges = cy.value.$('edge:selected').map((ele) => ele.data())
  }

  function getDetail(e) {
    selectedElement.value = kgview.getDetail(e)
  }

  function getVisibleElements() {
    if (!cy.value) return null
    return cy.value.elements().filter((element) => element.visible())
  }

  function getVisibleNodes() {
    if (!cy.value) return null
    return cy.value.nodes().filter((node) => node.visible())
  }

  function getVisibleEdges() {
    if (!cy.value) return null
    return cy.value.edges().filter((edge) => edge.visible())
  }

  // ---- Zoom ----
  function clampZoom(value) {
    const parsed = Number(value)
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number.isFinite(parsed) ? parsed : 1))
  }

  function normalizeZoom(value) {
    return Number(clampZoom(value).toFixed(2))
  }

  function getRenderedCenter() {
    const { width = 0, height = 0 } = cyContainer.value?.getBoundingClientRect() || {}
    return { x: width / 2, y: height / 2 }
  }

  function syncZoomLevel() {
    if (cy.value) zoomLevel.value = normalizeZoom(cy.value.zoom())
  }

  function setZoom(value) {
    if (!cy.value) return
    zoomLevel.value = normalizeZoom(value)
    cy.value.zoom({ level: zoomLevel.value, renderedPosition: getRenderedCenter() })
  }

  function stepZoom(delta) {
    setZoom(zoomLevel.value + delta)
  }

  function zoomIn() {
    stepZoom(ZOOM_STEP)
  }

  function zoomOut() {
    stepZoom(-ZOOM_STEP)
  }

  function resetZoom() {
    if (!cy.value) return
    const visible = getVisibleElements()
    if (!visible || visible.empty()) return
    setZoom(1)
    cy.value.center(visible)
  }

  function fitGraph() {
    if (!cy.value) return
    const visible = getVisibleElements()
    if (!visible || visible.empty()) return
    cy.value.fit(visible, 48)
    syncZoomLevel()
  }

  // ---- Layout ----
  function getLayoutOptions(layoutName, overrides = {}) {
    return {
      name: layoutName,
      fit: false,
      padding: LAYOUT_PADDING,
      animate: false,
      spacingFactor: LAYOUT_SPACING_FACTOR,
      nodeDimensionsIncludeLabels: false,
      ...(LAYOUT_OVERRIDES[layoutName] || {}),
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
    const visible = getVisibleElements()
    if (!visible || visible.empty()) return

    cy.value.fit(visible, LAYOUT_PADDING)
    if (cy.value.zoom() > LAYOUT_MAX_AUTO_ZOOM) {
      cy.value.zoom(LAYOUT_MAX_AUTO_ZOOM)
      cy.value.center(visible)
    }
    syncZoomLevel()
  }

  function refreshLayout() {
    if (!cy.value) return
    stopActiveLayout()
    cy.value.resize()
    const visible = getVisibleElements()
    if (!visible || visible.empty()) return

    const nextLayout = visible.layout(
      getLayoutOptions(selectedLayout.value, {
        stop: () => {
          fitLayoutView()
          if (activeLayout === nextLayout) activeLayout = null
        },
      })
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

  // ---- Filter ----
  function clearFilterTimer() {
    if (!filterTimer) return
    window.clearTimeout(filterTimer)
    filterTimer = null
  }

  function queueFilterGraph() {
    clearFilterTimer()
    filterTimer = window.setTimeout(() => {
      filterTimer = null
      applyFilterGraph()
    }, FILTER_DEBOUNCE_MS)
  }

  function clearFilterText() {
    filterText.value = ''
    applyFilterGraph()
  }

  function applyFilterGraph() {
    if (!cy.value) return

    clearFilterTimer()
    stopActiveLayout()

    const needle = normalizeSearchText(filterText.value)
    cy.value.batch(() => {
      if (!needle) {
        cy.value.elements().show()
        return
      }

      const keepIds = getFilteredElementIds(needle, Math.max(0, Number(filterDistance.value) || 0))
      cy.value.elements().hide()
      keepIds.forEach((id) => cy.value.getElementById(id).show())
    })

    fitGraph()
  }

  function normalizeSearchText(value) {
    return (value || '').toString().trim().toLowerCase()
  }

  function getFilteredElementIds(needle, maxDistance) {
    const keepNodeIds = new Set()
    const keepEdgeIds = new Set()
    let frontierNodeIds = new Set()

    graphIndex.nodeLabelsById.forEach((label, nodeId) => {
      if (label.includes(needle)) {
        keepNodeIds.add(nodeId)
        frontierNodeIds.add(nodeId)
      }
    })

    for (let distance = 0; distance < maxDistance && frontierNodeIds.size > 0; distance += 1) {
      const nextFrontierNodeIds = new Set()

      frontierNodeIds.forEach((nodeId) => {
        const edgeIds = graphIndex.edgeIdsByNodeId.get(nodeId)
        if (!edgeIds) return

        edgeIds.forEach((edgeId) => {
          const endpoints = graphIndex.edgeEndpointsById.get(edgeId)
          if (!endpoints) return

          keepEdgeIds.add(edgeId)

          endpoints.forEach((endpointId) => {
            if (!keepNodeIds.has(endpointId)) {
              keepNodeIds.add(endpointId)
              nextFrontierNodeIds.add(endpointId)
            }
          })
        })
      })

      frontierNodeIds = nextFrontierNodeIds
    }

    includeParentNodeIds(keepNodeIds)
    return new Set([...keepNodeIds, ...keepEdgeIds])
  }

  function includeParentNodeIds(nodeIds) {
    Array.from(nodeIds).forEach((nodeId) => {
      let parentId = graphIndex.parentIdsByNodeId.get(nodeId)
      while (parentId && !nodeIds.has(parentId)) {
        nodeIds.add(parentId)
        parentId = graphIndex.parentIdsByNodeId.get(parentId)
      }
    })
  }

  function createEmptyGraphIndex() {
    return {
      nodeLabelsById: new Map(),
      edgeIdsByNodeId: new Map(),
      edgeEndpointsById: new Map(),
      parentIdsByNodeId: new Map(),
    }
  }

  function getGraphElementGroups(graph = {}) {
    if (Array.isArray(graph)) {
      return graph.reduce(
        (acc, item) => {
          const data = getElementData(item)
          if (data.source && data.target) {
            acc.edges.push(item)
          } else {
            acc.nodes.push(item)
          }
          return acc
        },
        { nodes: [], edges: [] }
      )
    }

    return {
      nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
      edges: Array.isArray(graph.edges) ? graph.edges : [],
    }
  }

  function getElementData(item = {}) {
    return item.data || {}
  }

  function ensureIndexNode(index, nodeId) {
    if (!index.edgeIdsByNodeId.has(nodeId)) index.edgeIdsByNodeId.set(nodeId, new Set())
  }

  function buildGraphIndex(graph = {}) {
    const index = createEmptyGraphIndex()
    const { nodes, edges } = getGraphElementGroups(graph)

    nodes.forEach((node) => {
      const data = getElementData(node)
      const nodeId = data.id
      if (!nodeId) return

      index.nodeLabelsById.set(nodeId, normalizeSearchText(data.label || nodeId))
      if (data.parent) index.parentIdsByNodeId.set(nodeId, data.parent)
      ensureIndexNode(index, nodeId)
    })

    edges.forEach((edge) => {
      const data = getElementData(edge)
      const edgeId = data.id
      const source = data.source
      const target = data.target
      if (!edgeId || !source || !target) return

      index.edgeEndpointsById.set(edgeId, [source, target])
      ensureIndexNode(index, source)
      ensureIndexNode(index, target)
      index.edgeIdsByNodeId.get(source).add(edgeId)
      index.edgeIdsByNodeId.get(target).add(edgeId)
    })

    return index
  }

  function buildCyGraphIndex() {
    const index = createEmptyGraphIndex()
    if (!cy.value) return index

    cy.value.nodes().forEach((node) => {
      const nodeId = node.id()
      if (!nodeId) return

      const parent = node.parent()
      index.nodeLabelsById.set(nodeId, normalizeSearchText(node.data('label') || nodeId))
      if (parent.length > 0) index.parentIdsByNodeId.set(nodeId, parent.id())
      ensureIndexNode(index, nodeId)
    })

    cy.value.edges().forEach((edge) => {
      const edgeId = edge.id()
      const source = edge.source().id()
      const target = edge.target().id()
      if (!edgeId || !source || !target) return

      index.edgeEndpointsById.set(edgeId, [source, target])
      ensureIndexNode(index, source)
      ensureIndexNode(index, target)
      index.edgeIdsByNodeId.get(source).add(edgeId)
      index.edgeIdsByNodeId.get(target).add(edgeId)
    })

    return index
  }

  function stripTransientVisibility(item) {
    if (!item || !item.style) return item

    const style = { ...item.style }
    delete style.display
    delete style.visibility

    const cleanItem = { ...item }
    if (Object.keys(style).length > 0) {
      cleanItem.style = style
    } else {
      delete cleanItem.style
    }

    return cleanItem
  }

  function cloneGraphElements(graph = {}) {
    const { nodes, edges } = getGraphElementGroups(graph)
    return JSON.parse(
      JSON.stringify({
        nodes: nodes.map(stripTransientVisibility),
        edges: edges.map(stripTransientVisibility),
      })
    )
  }

  function getVisibleElementsSnapshot() {
    const nodes = getVisibleNodes()
    const edges = getVisibleEdges()

    return cloneGraphElements({
      nodes: nodes ? nodes.map((node) => node.json()) : [],
      edges: edges ? edges.map((edge) => edge.json()) : [],
    })
  }

  function mergeElementsById(fullItems, visibleItems) {
    const visibleById = new Map()
    const knownIds = new Set()

    visibleItems.forEach((item) => {
      const id = item?.data?.id
      if (id) visibleById.set(id, item)
    })

    const merged = fullItems.map((item) => {
      const id = item?.data?.id
      if (!id) return item

      knownIds.add(id)
      return visibleById.get(id) || item
    })

    visibleItems.forEach((item) => {
      const id = item?.data?.id
      if (id && !knownIds.has(id)) {
        knownIds.add(id)
        merged.push(item)
      }
    })

    return merged
  }

  function getFullGraphSnapshot(visibleElements) {
    const full = cloneGraphElements(elements.value)
    const visible = cloneGraphElements(visibleElements)

    return {
      nodes: mergeElementsById(full.nodes, visible.nodes),
      edges: mergeElementsById(full.edges, visible.edges),
    }
  }

  async function createProjectFromFilteredGraph() {
    if (!cy.value) return

    const snapshot = getVisibleElementsSnapshot()
    if (snapshot.nodes.length + snapshot.edges.length === 0) {
      service.msgYellow(t('createProjectFromFilterEmpty'))
      return
    }

    const baseName = prj.value?.name || t('project')
    const defaultName = filterText.value
      ? `${baseName} - ${filterText.value}`
      : `${baseName} - ${t('filter')}`

    const name = window.prompt(t('createProjectFromFilterPrompt'), defaultName)
    if (!name) return

    creatingProject.value = true
    try {
      await api.post('project', { name, layout: selectedLayout.value, kg: snapshot })
      service.msgGreen(t('createProjectFromFilterSuccess'))
    } catch (error) {
      service.msgError(error?.response?.data?.message || error?.message || t('failed'))
    } finally {
      creatingProject.value = false
    }
  }

  // ---- Topological list ----
  function getList() {
    const visited = new Set()
    const result = []
    const visibleNodes = getVisibleNodes()
    if (!visibleNodes) return
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id()))

    function visit(node) {
      if (visited.has(node.id())) return
      visited.add(node.id())
      node
        .outgoers('edge')
        .filter((edge) => edge.visible())
        .targets()
        .filter((target) => visibleNodeIds.has(target.id()))
        .forEach(visit)
      result.unshift(node.id())
    }

    visibleNodes.forEach(visit)
    listElements.value = result
  }

  // ---- History ----
  function pushHistoryState() {
    if (!cy.value) return

    history.value.push(JSON.parse(JSON.stringify(cy.value.json())))
    if (history.value.length > MAX_HISTORY_STATES) history.value.shift()
  }

  function scheduleKgPersist(fullElements) {
    pendingPersistElements = fullElements
    if (persistTimer) window.clearTimeout(persistTimer)

    persistTimer = window.setTimeout(() => {
      persistTimer = null
      flushPendingKgPersist()
    }, PERSIST_DEBOUNCE_MS)
  }

  function flushPendingKgPersist() {
    if (persistTimer) {
      window.clearTimeout(persistTimer)
      persistTimer = null
    }

    if (!pendingPersistElements) return
    const fullElements = pendingPersistElements
    pendingPersistElements = null
    kgview
      .updateKg(prj.value.id, JSON.stringify(fullElements))
      .catch((error) => console.error('Erro ao salvar KG:', error))
  }

  function saveState({ persist = true, recordHistory = true } = {}) {
    const json = cy.value.json()
    const fullElements = getFullGraphSnapshot(json.elements)

    elements.value = fullElements
    graphIndex = cy.value ? buildCyGraphIndex() : buildGraphIndex(fullElements)

    if (persist) scheduleKgPersist(fullElements)
    if (recordHistory) history.value.push(JSON.parse(JSON.stringify(json)))
  }

  function undo() {
    if (!history.value.length) return
    stopActiveLayout()
    cy.value.json(history.value.pop())
    cy.value.resize()
    saveState({ recordHistory: false })
    fitGraph()
  }

  // ---- Metrics ----
  function calculateMetrics() {
    const nodes = getVisibleNodes()
    const edges = getVisibleEdges()
    if (!nodes || !edges) return
    const degreesByNodeId = new Map(nodes.map((node) => [node.id(), 0]))

    edges.forEach((edge) => {
      const sourceId = edge.source().id()
      const targetId = edge.target().id()
      if (degreesByNodeId.has(sourceId))
        degreesByNodeId.set(sourceId, degreesByNodeId.get(sourceId) + 1)
      if (degreesByNodeId.has(targetId))
        degreesByNodeId.set(targetId, degreesByNodeId.get(targetId) + 1)
    })

    const degrees = Array.from(degreesByNodeId.values())
    const totalNodes = nodes.length
    const totalEdges = edges.length

    metrics.nodes = totalNodes
    metrics.edges = totalEdges
    metrics.avgDegree = totalNodes ? degrees.reduce((a, b) => a + b, 0) / totalNodes : 0
    metrics.maxDegree = Math.max(...degrees, 0)
    metrics.minDegree = Math.min(...degrees, 0)
    metrics.density = totalNodes > 1 ? (2 * totalEdges) / (totalNodes * (totalNodes - 1)) : 0
  }

  // ---- Guided tour ----
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
