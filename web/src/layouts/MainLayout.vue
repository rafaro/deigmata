<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn rounded dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>Deigmata</q-toolbar-title>

        <div v-if="user.id">
          {{ prjLabel }} <q-icon name="perm_identity" size="sm" /> {{ userLabel }}
        </div>
        <!-- <div>{{user.id}} </div> -->
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
            <q-item clickable v-ripple :to="sItem.to" v-if="sItem.show" :inset-level="0.2">
              <q-item-section avatar>
                <q-icon :name="sItem.icon" />
              </q-item-section>
              <q-item-section>
                {{ sItem.label }}
              </q-item-section>
            </q-item>
          </div>
        </q-expansion-item>
        <q-item clickable v-ripple :to="item.to" v-if="item.show && !item.item">
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
  import { defineComponent, ref, computed } from 'vue'
  import { service } from 'boot/service'
  import { useI18n } from 'vue-i18n'
  import { useUserStore } from 'stores/user'
  import { useProjectStore } from 'stores/project'
  export default defineComponent({
    name: 'MainLayout',
    setup() {
      const leftDrawerOpen = ref(false)
      const { t } = useI18n()
      const usrStore = useUserStore()
      const prjStore = useProjectStore()
      usrStore.initUser()
      const user = computed({
        get: () => usrStore.getUser, // usrStore.getters['user/user'] // usrStore.state.user.user
      })
      const prj = computed({
        get: () => prjStore.getProject, // usrStore.getters['user/user'] // usrStore.state.user.user
      })
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
                  label: 'view',
                  to: '/kg',
                  icon: 'layers',
                  separator: false,
                  show: user.value.id,
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

      return {
        user,
        userLabel,
        prjLabel,
        menuFiltered,
        leftDrawerOpen,
        toggleLeftDrawer() {
          leftDrawerOpen.value = !leftDrawerOpen.value
        },
      }
    },
  })
</script>
