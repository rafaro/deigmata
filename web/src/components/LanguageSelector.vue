<template>
  <q-btn-dropdown
    flat
    dense
    :icon="`img:https://flagcdn.com/28x21/${currentLocaleData.flag}.png`"
    :label="currentLocaleData.nativeName"
    dropdown-icon="language"
  >
    <q-list>
      <q-item
        v-for="locale in availableLocales"
        :key="locale.value"
        clickable
        v-close-popup
        @click="changeLocale(locale.value)"
        :active="currentLocale === locale.value"
        active-class="bg-blue-1 text-primary"
      >
        <q-item-section avatar>
          <q-avatar size="24px">
            <img :src="`https://flagcdn.com/28x21/${locale.flag}.png`" :alt="locale.label" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ locale.nativeName }}</q-item-label>
          <q-item-label caption>{{ locale.label }}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="currentLocale === locale.value">
          <q-icon name="check" color="primary" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script>
  import { defineComponent, computed } from 'vue'
  import { useLocaleStore } from 'stores/locale'
  import { useQuasar } from 'quasar'
  import { useI18n } from 'vue-i18n'

  export default defineComponent({
    name: 'LanguageSelector',

    setup() {
      const localeStore = useLocaleStore()
      const $q = useQuasar()
      const { t } = useI18n()

      const currentLocale = computed(() => localeStore.getCurrentLocale)
      const availableLocales = computed(() => localeStore.getAvailableLocales)
      const currentLocaleData = computed(() => localeStore.getCurrentLocaleData)

      const changeLocale = (locale) => {
        localeStore.setLocale(locale)
        $q.notify({
          color: 'positive',
          message: t('languageChangedSuccessfully'),
          icon: 'language',
          position: 'top',
        })
      }

      return {
        currentLocale,
        availableLocales,
        currentLocaleData,
        changeLocale,
      }
    },
  })
</script>
