// src/stores/project.js
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useProjectStore = defineStore('project', {
  state: () => ({
    id: null,
    name: '',
    layout: '',
  }),
  getters: {
    getProject: (state) => {
      return { id: state.id, name: state.name, layout: state.layout }
    },
  },
  actions: {
    setProject({ id, name, layout }) {
      this.id = id
      this.name = name
      this.layout = layout
    },
    setLayout({ layout }) {
      this.layout = layout
    },
    clearProject() {
      this.id = null
      this.name = ''
      this.layout = ''
    },
  },
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProjectStore, import.meta.hot))
}
