<template>
  <q-page padding>
    <div class="q-pa-sm">
      <p class="text-h5">assigns</p>
      <q-btn size="md" class="q-mb-sm" color="blue" :to="{ name: 'assign/new' }">
        {{ t('new') }}
      </q-btn>
      <q-table
        :rows="data"
        :columns="cols"
        :loading="loading"
        :pagination="{ rowsPerPage: 20 }"
        :no-data-label="t('noData')"
        :rows-per-page-label="t('rowsPerPage')"
        :pagination-label="(start, end, total) => `${start} - ${end} > ${total}`"
        row-key="id"
        dense
      >
        <template v-slot:loading>
          <q-inner-loading showing color="primary" />
        </template>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td auto-width>
              <q-btn
                class="q-mx-sm"
                size="md"
                color="blue"
                round
                dense
                icon="edit"
                :to="{
                  name: 'assign/edit',
                  params: { id: props.row.id },
                }"
              />
              <q-btn
                class="q-mx-sm"
                size="md"
                color="red"
                round
                dense
                icon="delete"
                :to="{
                  name: 'assign/delete',
                  params: { id: props.row.id },
                }"
              />
              <q-btn
                class="q-mx-sm"
                size="md"
                color="green"
                round
                dense
                icon="check"
                @click="select(props.row.id, props.row.name)"
              />
            </q-td>
            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              {{ col.value }}
            </q-td>
          </q-tr>
        </template>
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th auto-width />
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script>
  import { ref } from 'vue'
  import { api } from 'boot/axios'
  import { useI18n } from 'vue-i18n'
  export default {
    setup() {
      const { t } = useI18n()

      const cols = [
        { name: 'id', field: 'id', label: 'ID', align: 'left', sortable: true },
        {
          name: 'name',
          field: 'name',
          label: t('name'),
          align: 'left',
          sortable: true,
        },
      ]

      const data = ref([])
      const loading = ref(true)

      api
        .get('assign')
        .then((response) => {
          data.value = response.data
          loading.value = false
        })
        .catch(() => {
          loading.value = false
        })
      return { data, cols, loading, t }
    },
  }
</script>
