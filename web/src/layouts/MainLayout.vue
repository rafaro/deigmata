<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn rounded dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>Deigmata</q-toolbar-title>

        <div v-if="user.id">
          <span class="prj-label" :class="{ 'prj-label--changed': prjChanged }">
            {{ prjLabel }}
          </span>
          <q-icon name="perm_identity" size="sm" /> {{ userLabel }}
        </div>
        <!-- <div>{{user.id}} </div> -->
        <LanguageSelector />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-1">
      <q-list v-for="(item, index) in menuFiltered" :key="index" bordered>
        <q-expansion-item
          expand-separator
          :icon="item.icon"
          :label="item.label"
          default-opened
          v-if="item.show && item.item"
        >
          <div v-for="(sItem, sIndex) in item.item" :key="sIndex">
            <q-item
              clickable
              v-ripple
              :to="sItem.to"
              v-if="sItem.show"
              :inset-level="0.2"
              @click="handleMenuAction(sItem, $event)"
            >
              <q-item-section avatar>
                <q-icon :name="sItem.icon" />
              </q-item-section>
              <q-item-section>
                {{ sItem.label }}
              </q-item-section>
            </q-item>
          </div>
        </q-expansion-item>
        <q-item
          clickable
          v-ripple
          :to="item.to"
          v-if="item.show && !item.item"
          @click="handleMenuAction(item, $event)"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>
            {{ item.label }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <!-- <div class="q-pa-md q-gutter-sm" v-if="user.id && !user.confirmedemail">
        <q-banner rounded class="bg-warning">
          Seu email não foi confirmado. Verifique a caixa de entrada do seu email. Ou solicite uma
          nova confirmação.

          <template v-slot:action>
            <q-btn
              flat
              color="white"
              label="Reenviar confirmação"
              :to="{ name: 'auth/email/resend' }"
            />
          </template>
        </q-banner>
      </div> -->
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
  // https://next.quasar.dev/quasar-cli/prefetch-feature
  import { defineComponent, ref, computed, onMounted, watch } from 'vue'
  import { service } from 'boot/service'
  import { useI18n } from 'vue-i18n'
  import { useUserStore } from 'stores/user'
  import { useProjectStore } from 'stores/project'
  import { useLocaleStore } from 'stores/locale'
  import { api } from 'boot/axios'
  import { useRouter } from 'vue-router'
  import LanguageSelector from 'components/LanguageSelector.vue'
  export default defineComponent({
    name: 'MainLayout',
    components: {
      LanguageSelector,
    },
    setup() {
      const leftDrawerOpen = ref(false)
      const { t } = useI18n()
      const usrStore = useUserStore()
      const prjStore = useProjectStore()
      const localeStore = useLocaleStore()
      const router = useRouter()

      onMounted(() => {
        localeStore.initLocale()
      })

      usrStore.initUser()
      const user = computed({
        get: () => usrStore.getUser, // usrStore.getters['user/user'] // usrStore.state.user.user
      })
      const prj = computed({
        get: () => prjStore.getProject, // usrStore.getters['user/user'] // usrStore.state.user.user
      })
      const prjChanged = ref(false)
      let prjChangedTimer = null
      const onNewRunMenu = () => {
        api
          .post('rag', { projectId: prjStore.getProject.id || null })
          .then((response) => {
            const ragId = response?.data?.id
            service.msgGreen(t('success'))
            const params = ragId ? { id: String(ragId) } : undefined
            router.push({ name: 'rag/run', params })
          })
          .catch((e) => {
            service.msgError(e.response.data.message)
          })
      }
      const menuFiltered = computed({
        get: () => {
          const menu = [
            {
              label: t('project'),
              to: '',
              icon: 'admin_panel_settings',
              separator: false,
              show: user.value.id,
              item: [
                {
                  label: t('project'),
                  to: '/project',
                  icon: 'task',
                  separator: false,
                  show: user.value.id,
                },
              ],
            },
            {
              label: 'KG',
              to: '',
              icon: 'insights',
              separator: false,
              show: user.value.id,
              item: [
                {
                  label: t('view'),
                  to: '/kg',
                  icon: 'layers',
                  separator: false,
                  show: user.value.id,
                },
              ],
            },
            {
              label: t('rag.title'),
              to: '',
              icon: 'psychology',
              separator: false,
              show: user.value.id,
              item: [
                {
                  label: t('rag.historyMenu'),
                  to: '/rag/history',
                  icon: 'history',
                  separator: false,
                  show: user.value.id,
                },
                {
                  label: t('rag.newRunMenu'),
                  icon: 'play_circle',
                  separator: false,
                  show: user.value.id,
                  action: onNewRunMenu,
                },
              ],
            },
            {
              label: 'Admin',
              to: '',
              icon: 'admin_panel_settings',
              separator: false,
              show: user.value.id && user.value.isSuper,
              item: [
                {
                  label: t('users'),
                  to: '/user',
                  icon: 'perm_identity',
                  separator: false,
                  show: user.value.id && user.value.isSuper,
                },
              ],
            },
            {
              label: t('login'),
              to: '/auth/login',
              icon: 'login',
              separator: false,
              show: !user.value.id,
            },
            {
              label: t('register'),
              to: '/auth/register',
              icon: 'how_to_reg',
              separator: false,
              show: !user.value.id,
            },
            {
              label: t('changePassword'),
              to: '/profile/changepwd',
              icon: 'perm_identity',
              separator: false,
              show: user.value.id,
            },
            {
              label: t('logout'),
              to: '/auth/logout',
              icon: 'logout',
              separator: false,
              show: user.value.id,
            },
          ]
          return menu.filter((i) => i.show)
        },
      })
      const prjLabel = computed({
        get: () => {
          return prj.value.id
            ? `${t('project')} ${t('selected')}: ${prj.value.id} - ${prj.value.name} |`
            : ''
        },
      })
      const userLabel = computed({
        get: () => {
          const role = service
            .fetchGlobalData()
            .role.filter((s) => s.value === user.value.role)[0]?.label
          return (user.value.isSuper ? `${user.value.id} > ${role} |` : '') + user.value.name
        },
      })

      watch(
        () => [prj.value.id, prj.value.name],
        (next, prev) => {
          if (!prev) return
          if (next[0] === prev[0] && next[1] === prev[1]) return
          prjChanged.value = true
          if (prjChangedTimer) clearTimeout(prjChangedTimer)
          prjChangedTimer = setTimeout(() => {
            prjChanged.value = false
            prjChangedTimer = null
          }, 1800)
        }
      )
      const handleMenuAction = (item, event) => {
        if (typeof item?.action === 'function') {
          item.action(event)
        }
      }

      return {
        user,
        userLabel,
        prjLabel,
        prjChanged,
        menuFiltered,
        onNewRunMenu,
        handleMenuAction,
        leftDrawerOpen,
        toggleLeftDrawer() {
          leftDrawerOpen.value = !leftDrawerOpen.value
        },
      }
    },
  })
</script>

<style scoped>
  .prj-label {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 8px;
    transition:
      background-color 0.3s ease,
      color 0.3s ease,
      box-shadow 0.3s ease;
  }

  .prj-label--changed {
    background: #27bfca;
    color: #fff;
    box-shadow: 0 0 0 2px rgba(15, 118, 110, 0.32);
    animation: prj-flash 1.2s ease-out;
  }

  @keyframes prj-flash {
    0% {
      transform: scale(1);
    }
    35% {
      transform: scale(1.03);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
