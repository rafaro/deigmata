import { defineStore } from 'pinia'
import { i18n } from 'boot/i18n'
import { Cookies } from 'quasar'

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    currentLocale: 'en-US',
    availableLocales: [
      { value: 'en-US', label: 'English', flag: 'us', nativeName: 'English' },
      { value: 'pt-BR', label: 'Português', flag: 'br', nativeName: 'Português' },
    ],
  }),

  getters: {
    getCurrentLocale: (state) => state.currentLocale,
    getAvailableLocales: (state) => state.availableLocales,
    getCurrentLocaleData: (state) => {
      return state.availableLocales.find((l) => l.value === state.currentLocale)
    },
  },

  actions: {
    setLocale(locale) {
      if (this.availableLocales.find((l) => l.value === locale)) {
        this.currentLocale = locale
        //i18n.global.locale = locale
        i18n.global.locale.value = locale
        Cookies.set('locale', locale, { expires: 365 })

        localStorage.setItem('locale', locale)
      }
    },

    initLocale() {
      // Tenta recuperar do cookie primeiro
      let savedLocale = Cookies.get('locale')

      // Se não encontrar no cookie, tenta localStorage
      if (!savedLocale) {
        savedLocale = localStorage.getItem('locale')
      }

      // Se não encontrar em nenhum lugar, usa o idioma do navegador
      if (!savedLocale) {
        const browserLocale = navigator.language
        const matchedLocale = this.availableLocales.find(
          (l) => l.value === browserLocale || l.value.split('-')[0] === browserLocale.split('-')[0]
        )
        savedLocale = matchedLocale ? matchedLocale.value : 'en-US'
      }

      this.setLocale(savedLocale)
    },
  },
})
