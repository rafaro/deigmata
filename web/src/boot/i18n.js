import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'

const savedLocale = localStorage.getItem('locale') || 'en-US'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  globalInjection: true,
  messages,
})

export default defineBoot(({ app }) => {
  app.use(i18n)
})

export { i18n }
