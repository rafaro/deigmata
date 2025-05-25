import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'
const i18n = createI18n({
  locale: 'en-US',
  globalInjection: true,
  messages,
})
export default defineBoot(({ app }) => {
  // Set i18n instance on app
  app.use(i18n)
})

export { i18n }
