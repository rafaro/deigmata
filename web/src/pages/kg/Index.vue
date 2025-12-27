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
          <br />
          <div id="zoomLevel" class="col-10">📏 Zoom: {{ zoomLevel }}x</div>
          <div id="selectLayout" class="col-5">
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
          <div id="filterText" class="col-7">
            <q-input
              outlined
              dense
              v-model="filterText"
              :label="t('filter')"
              @update:model-value="(val) => filterGraph(val)"
            />
          </div>

          <q-list bordered class="rounded-borders col-12">
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
        <div
          class="q-pa-sm bg-grey-2 rounded-borders shadow-2 relative-position"
          style="height: 80vh"
        >
          <div ref="cyContainer" id="cytoscape-container" class="fit" />

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
  const canUndo = computed(() => history.value.length > 0)

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
      cy.value.destroy()
    }

    try {
      elements.value = await kgview.getElements(prj.value.id)
      cy.value = cytoscape({
        container: cyContainer.value,
        style: kgview.getStyle(),
        elements: elements.value,
        layout: { name: selectedLayout.value },
        zoom: 1,
      })

      cy.value.lassoSelectionEnabled(true)
      cy.value.on('zoom', () => {
        zoomLevel.value = cy.value.zoom().toFixed(2)
      })

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

      function changeLayout(layout) {
        if (cy.value) {
          cy.value.layout({ name: layout }).run()
        }
        kgview.updateLayout(prj.value.id, layout)
        prjStore.setLayout({ layout })
      }

      function filterGraph(val) {
        if (val) {
          const eles = cy.value.filter(`node[id !^= '${val.trim()}']`)
          cy.value.remove(eles)
        } else {
          cy.value.elements().remove()
          cy.value.add(elements.value)
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
  #cytoscape-container {
    width: 100%;
    height: 100%;
    background-color: #ffffff;
  }
</style>
