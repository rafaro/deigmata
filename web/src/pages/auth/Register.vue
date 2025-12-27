<template>
  <q-page padding>
    <!-- content -->
    <div class="row">
      <div class="shadow-2 rounded-borders q-pa-sm q-mt-sm col-sm-6">
        <q-form @submit="submit">
          <div class="col-sm-10">
            <p class="text-h5">{{ t('title') }}</p>
          </div>
          <div class="row q-gutter-sm">
            <div class="col-sm-10">
              <q-input
                outlined
                dense
                v-model="data.name"
                :label="t('name')"
                :rules="[(val) => (val && val.length > 6) || t('nameRequired')]"
              ></q-input>
            </div>

            <div class="col-sm-10">
              <InputEmail
                outlined
                dense
                v-model="data.email"
                label="Email"
                @update:model-value="
                  (val) => {
                    data.email = val.replace(/\s+/g, '')
                  }
                "
              />
            </div>
            <div class="col-sm-10">
              <q-input
                outlined
                dense
                v-model.trim="data.confirmemail"
                :label="t('confirmEmail')"
                type="email"
                lazy-rules
                @paste.prevent
                @update:model-value="
                  (val) => {
                    data.confirmemail = val.replace(/\s+/g, '')
                  }
                "
                :rules="[(val) => (val && val == data.email) || t('emailMismatch')]"
              >
                <template v-slot:prepend>
                  <q-icon name="mail" />
                </template>
              </q-input>
            </div>
            <div class="col-sm-10">
              <q-input
                v-model="data.password"
                outlined
                dense
                :type="isPwd ? 'password' : 'text'"
                :label="t('enterPassword')"
                lazy-rules
                @paste.prevent
                :rules="[(val) => (val && val.length >= 6) || t('passwordMinLength')]"
              />
            </div>
            <div class="col-sm-10">
              <q-input
                v-model="data.confirmpassword"
                outlined
                dense
                :type="isPwd ? 'password' : 'text'"
                :label="t('confirmPassword')"
                lazy-rules
                @paste.prevent
                :rules="[(val) => (val && val == data.password) || t('passwordMismatch')]"
              />
            </div>
            <div class="col-sm-10">
              <div class="row">
                <div class="col-sm-4">
                  <q-btn
                    type="submit"
                    :label="t('save')"
                    color="green"
                    size="md"
                    :loading="loadingSubmitting"
                  />
                </div>
                <div class="col-sm-2">
                  <q-btn :label="t('back')" color="grey-6" size="md" @click="router.back()" />
                </div>
              </div>
            </div>
          </div>
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup>
  import { ref } from 'vue'
  import { api } from 'boot/axios'
  import { service } from 'boot/service'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import InputEmail from 'components/InputEmail.vue'

  const data = ref({
    name: null,
    password: null,
    confirmpassword: null,
    email: null,
    confirmemail: null,
  })
  const loadingSubmitting = ref(false)
  const router = useRouter()
  const isPwd = ref(true)
  const { t } = useI18n()

  const submit = () => {
    api
      .post('user', data.value)
      .then(() => {
        service.msgGreen('Cadastro realizado com sucesso.')
        router.push({ name: 'auth/login' })
      })
      .catch((e) => {
        service.msgError(e.response.data.message)
        router.push({ name: 'auth/login' })
      })
  }
</script>
