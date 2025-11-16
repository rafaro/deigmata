import { api } from 'src/boot/axios'
class MyKgView {
  createGroup(cy, ele) {
    const groupName = prompt('Digite um novo rótulo:', ele.data('label'))
    const groupId = `group_${groupName}`
    if (!cy.value.getElementById(groupId).empty()) return
    cy.value.add({ data: { id: groupId, label: groupName } })
    ele.move({ parent: groupId })
  }

  filterElements(cy) {
    const res = cy.value.filter('node[label > "COVID-19"]')
    console.log(res)
    return res
  }

  collapse(cy) {
    const ec = cy.value.expandCollapse({
      fisheye: false,
      animate: true,
      undoable: true,
    })

    ec.collapseAll()
    ec.collapseAllEdges()
  }

  expand(cy) {
    const ec = cy.value.expandCollapse({
      fisheye: false,
      animate: true,
      undoable: true,
    })
    ec.expandAllEdges()
    ec.expandAll()
  }
  setGroup(e, cy) {
    const node = e.target
    if (node.isParent()) return

    const bb = node.renderedBoundingBox()
    const parents = cy.value.nodes(':parent')

    parents.forEach((parent) => {
      const pbb = parent.renderedBoundingBox()
      const inside = bb.x1 >= pbb.x1 && bb.x2 <= pbb.x2 && bb.y1 >= pbb.y1 && bb.y2 <= pbb.y2

      if (inside && node.parent().id() !== parent.id()) {
        node.move({ parent: parent.id() })
      }
    })
  }

  async updateKg(id, kg) {
    const response = await api.patch(`project/kg/${id}`, { kg })
    return response
  }

  async updateLayout(id, layout) {
    const response = await api.put(`project/${id}`, { layout })
    return response
  }

  async getElements(id) {
    const response = await api.get(`project/kg/${id}`)
    const kg = response.data.kg
    return kg
  }

  addStep(tour, t) {
    tour.addStep({
      id: 'zoomLevelStep',
      text: t('tourstep.zoomInfo'),
      attachTo: {
        element: '#zoomLevel',
        on: 'bottom',
      },
      title: 'Passo 1',
      buttons: [
        {
          text: t('next'),
          action: () => tour.next(),
        },
        {
          text: t('cancel'),
          action: () => tour.cancel(),
        },
      ],
    })

    tour.addStep({
      id: 'filterTextStep',
      text: t('tourstep.filterElements'),
      attachTo: {
        element: '#filterText',
        on: 'bottom',
      },
      title: t('step') + ' 2',
      buttons: [
        {
          text: t('next'),
          action: () => tour.next(),
        },
        {
          text: t('cancel'),
          action: () => tour.cancel(),
        },
      ],
    })

    tour.addStep({
      id: 'historyStep',
      text: t('tourstep.editHistory'),
      attachTo: {
        element: '#history',
        on: 'bottom',
      },
      title: t('step') + ' 3',
      buttons: [
        {
          text: t('next'),
          action: () => tour.next(),
        },
        {
          text: t('cancel'),
          action: () => tour.cancel(),
        },
      ],
    })
    tour.addStep({
      id: 'expandStep',
      text: t('tourstep.expandCollapse'),
      attachTo: {
        element: '#expand',
        on: 'bottom',
      },
      title: t('step') + ' 4',
      buttons: [
        {
          text: t('next'),
          action: () => tour.next(),
        },
        {
          text: t('cancel'),
          action: () => tour.cancel(),
        },
      ],
    })
    tour.addStep({
      id: 'infoStep',
      text: t('tourstep.elementInfo'),
      attachTo: {
        element: '#info',
        on: 'bottom',
      },
      title: t('step') + ' 5',
      buttons: [
        {
          text: t('next'),
          action: () => tour.next(),
        },
        {
          text: t('cancel'),
          action: () => tour.cancel(),
        },
      ],
    })
    tour.addStep({
      id: 'metricsStep',
      text: t('tourstep.datasetMetrics'),
      attachTo: {
        element: '#metrics',
        on: 'bottom',
      },
      title: t('step') + ' 6',
      buttons: [
        {
          text: t('next'),
          action: () => tour.next(),
        },
        {
          text: t('cancel'),
          action: () => tour.cancel(),
        },
      ],
    })
    tour.addStep({
      id: 'listStep',
      text: t('tourstep.elementList'),
      attachTo: {
        element: '#list',
        on: 'bottom',
      },
      title: t('step') + ' 7',
      buttons: [
        {
          text: t('back'),
          action: () => tour.back(),
        },
        {
          text: t('done'),
          action: () => tour.complete(),
        },
      ],
    })

    // tour.addStep({
    //   id: 'tourStep',
    //   text: 'Apresenta o Este botão serve para salvar os dados.',
    //   attachTo: {
    //     element: '#tour',
    //     on: 'top',
    //   },
    //   title: t('step') + ' 8',
    //   buttons: [
    //     {
    //       text: t('back'),
    //       action: () => tour.back(),
    //     },
    //     {
    //       text: t('done'),
    //       action: () => tour.complete(),
    //     },
    //   ],
    // })
  }

  getDetail(e) {
    return {
      type: e.isNode() ? 'node' : 'edge',
      id: e.id(),
      source: e.isEdge() ? e.source().id() : null,
      target: e.isEdge() ? e.target().id() : null,
      label: e.data('label'),
      position: e.isNode() ? e.position() : null,
    }
  }
  getOptLayout() {
    return [
      { value: 'grid', label: 'Grid' },
      { value: 'circle', label: 'Circle' },
      { value: 'concentric', label: 'Concentric' },
      { value: 'cose', label: 'Cose' },
      { value: 'cose-bilkent', label: 'Cose-Bilkent' },
      { value: 'breadthfirst', label: 'Breadthfirst' },
      { value: 'random', label: 'Random' },
      { value: 'preset', label: 'Preset' },
    ]
  }
  getStyle() {
    return [
      {
        selector: 'node',
        style: {
          label: 'data(id)',
          'text-valign': 'center',
          'text-halign': 'center',
          'background-color': '#3498db',
          color: '#000',
          'text-outline-width': 2,
          'text-outline-color': '#fff',
          'font-size': '12px',
        },
      },
      {
        selector: 'edge[label]',
        style: {
          label: 'data(label)',
          width: 2,
          color: '#000',
          'line-color': '#888',
          'target-arrow-color': '#888',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'font-size': 10,
          'text-rotation': 'autorotate',
          'text-background-color': '#fff',
          'text-background-opacity': 1,
          'text-background-padding': '3px',
          'text-background-shape': 'roundrectangle',
        },
      },
      {
        selector: ':parent',
        style: {
          'background-color': '#f0f8ff',
          'border-color': '#007bff',
          'border-width': 2,
          shape: 'roundrectangle',
          padding: '20px',
          label: 'data(label)',
          'font-size': '14px',
          'font-weight': 'bold',
          'text-valign': 'top',
        },
      },
    ]
  }
  parseElement(str) {
    if (!str) return
    const obj = {}
    str.split(',').forEach((pair) => {
      const [key, value] = pair.split(':').map((s) => s.trim().replace(/^'|'$/g, ''))
      obj[key] = this.isNumeric(value) ? value * 1 : value
    })
    return obj
  }

  isNumeric(num) {
    return (
      (typeof num === 'number' || (typeof num === 'string' && num.trim() !== '')) && !isNaN(num)
    )
  }
}
const kgview = new MyKgView()

export { kgview }
