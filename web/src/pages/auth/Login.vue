<template>
  <q-page padding>
    <q-tab-panel
      name="login"
      class="shadow-2 rounded-borders"
      style="max-width: 500px; margin: auto"
    >
      <div class="text-h6 q-pa-lg">{{ t('login') }} Deigmata</div>
      <q-form @submit="auth" class="q-gutter-md">
        <!-- <q-input outlined dense v-model="login.email"
              label="E-mail"
              lazy-rules
              @paste.native.prevent
              @input="val => { login.email = val.toLowerCase() }"
              :rules="[ val => val && val.length > 0 && validaEmail(val) || 'Insira um e-mail válido' ]"
              >
              <template v-slot:prepend>
                <q-icon name="mail" />
              </template>
            </q-input> -->
        <InputEmail v-model="login.email" />
        <q-input
          v-model="login.password"
          outlined
          dense
          :type="isPwd ? 'password' : 'text'"
          :label="t('enterPassword')"
          lazy-rules
          :rules="[(val) => (val && val.length >= 1) || 'Insira uma senha de no mínimo 6 dígitos']"
        >
          <template v-slot:prepend>
            <q-icon
              :name="isPwd ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="isPwd = !isPwd"
            />
          </template>
        </q-input>
        <!-- <q-btn label="Esqueci minha senha" type="cancel" color="primary" flat class="q-ml-sm" :to="{name: 'autenticacao/solicitarnovasenha'}" /> -->
        <q-btn :label="t('login')" type="submit" color="primary" :loading="loadingSubmitting">
          <template v-slot:loading>
            <q-spinner />
          </template>
        </q-btn>
        <q-btn
          :label="t('forgotPassword')"
          type="cancel"
          color="primary"
          flat
          class="q-ml-sm"
          :to="{ name: 'auth/pwd/reset' }"
        />
      </q-form>
    </q-tab-panel>
    <div class="clearfix">&nbsp;</div>
    <q-tab-panel
      name="login"
      class="shadow-2 rounded-borders"
      style="max-width: 500px; margin: auto"
    >
      <div class="row justify-center q-gutter-md">
        <div class="col-auto">
          <p class="text-center">{{ $t('registerProfile') }}</p>
          <q-btn
            :label="t('signup')"
            color="green"
            size="md"
            :to="{ name: 'auth/register' }"
            class="q-mx-auto"
          />
        </div>
      </div>
    </q-tab-panel>
  </q-page>
</template>

<script setup>
  import InputEmail from 'components/InputEmail.vue'
  import { api } from 'boot/axios'
  import { service } from 'boot/service'
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from 'stores/user'
  import { useI18n } from 'vue-i18n'

  //const $q = useQuasar()
  const login = ref({ email: '', password: '' })
  const isPwd = ref(true)
  const loadingSubmitting = ref(false)
  const router = useRouter()
  const store = useUserStore()
  const { t } = useI18n()

  //const cookieToken = $q.cookies.get('token')
  const cookieToken = service.getToken()
  if (cookieToken) {
    store.initUser()
    loadingSubmitting.value = false
    router.push({ name: 'index' })
  }
  const auth = () => {
    loadingSubmitting.value = true
    api
      .post('auth', login.value)
      .then((res) => {
        service.saveToken(res.data.accessToken)
        //$q.cookies.set('token', res.data.accessToken)
        store.initUser()

        loadingSubmitting.value = false
        router.push({ name: 'index' })
      })
      .catch(() => {
        service.msgError(t('incorrectCredentials'))
        loadingSubmitting.value = false
      })
  }
</script>
