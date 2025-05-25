// src/stores/user.js
import { defineStore, acceptHMRUpdate } from 'pinia'
import { jwtDecode } from 'jwt-decode'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: null,
    name: '',
    email: '',
    role: '',
  }),
  getters: {
    isLoggedIn: (state) => !!state.id,
    isAdmin: (state) => state.role === 'admin',
    getUser: (state) => {
      return { id: state.id, name: state.name, email: state.email, role: state.role }
    },
  },
  actions: {
    initUser() {
      const token = window.sessionStorage.getItem('token')
      if (token) {
        const user = { ...jwtDecode(token) }
        this.id = user.id
        this.name = user.name
        this.email = user.email
        this.role = user.role
      }
    },
    setUser({ id, name, email, role }) {
      this.id = id
      this.name = name
      this.email = email
      this.role = role
    },
    clearUser() {
      this.id = null
      this.name = ''
      this.email = ''
      this.role = ''
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
