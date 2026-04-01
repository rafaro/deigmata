<template>
  <q-page padding>
    <div class="q-pa-sm">
      <p class="text-h5">
        {{ t('project') + 's' }}
      </p>
      <q-btn size="md" class="q-mb-sm" color="blue" :to="{ name: 'project/new' }">
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
                :aria-label="t('projectList.editProject')"
                :to="{
                  name: 'project/edit',
                  params: { id: props.row.id },
                }"
              >
                <q-tooltip>{{ t('projectList.editProject') }}</q-tooltip>
              </q-btn>
              <q-btn
                class="q-mx-sm"
                size="md"
                color="red"
                round
                dense
                icon="delete"
                :aria-label="t('projectList.deleteProject')"
                :to="{
                  name: 'project/delete',
                  params: { id: props.row.id },
                }"
              >
                <q-tooltip>{{ t('projectList.deleteProject') }}</q-tooltip>
              </q-btn>
              <q-btn
                class="q-mx-sm"
                size="md"
                color="green"
                round
                dense
                icon="check"
                :aria-label="t('projectList.selectProject')"
                @click="select(props.row.id, props.row.name, props.row.layout)"
              >
                <q-tooltip>{{ t('projectList.selectProject') }}</q-tooltip>
              </q-btn>
              <q-btn
                class="q-mx-sm"
                size="md"
                color="orange"
                round
                dense
                icon="account_tree"
                :aria-label="t('projectList.openCsvMapping')"
                :to="{
                  name: 'project/mapping',
                  params: { id: props.row.id },
                }"
              >
                <q-tooltip>{{ t('projectList.openCsvMapping') }}</q-tooltip>
              </q-btn>
              <q-btn
                class="q-mx-sm"
                size="md"
                color="teal"
                round
                dense
                icon="device_hub"
                :aria-label="t('projectList.openTurtleImport')"
                :to="{
                  name: 'project/turtle',
                  params: { id: props.row.id },
                }"
              >
                <q-tooltip>{{ t('projectList.openTurtleImport') }}</q-tooltip>
              </q-btn>
              <q-btn
                class="q-mx-sm"
                size="md"
                color="purple"
                round
                dense
                icon="visibility"
                :aria-label="t('projectList.openKg')"
                @click="goToKg(props.row)"
              >
                <q-tooltip>{{ t('projectList.openKg') }}</q-tooltip>
              </q-btn>
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

<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { api } from 'boot/axios'
  import { useI18n } from 'vue-i18n'
  import { useProjectStore } from 'stores/project'
  import { service } from 'boot/service'

  const { t } = useI18n()
  const store = useProjectStore()
  const router = useRouter()

  const cols = computed(() => [
    { name: 'id', field: 'id', label: 'ID', align: 'left', sortable: true },
    {
      name: 'name',
      field: 'name',
      label: t('name'),
      align: 'left',
      sortable: true,
    },
    {
      name: 'layout',
      field: 'layout',
      label: 'layout',
      sortable: true,
      align: 'left',
    },
  ])

  const data = ref([])
  const loading = ref(true)
  const select = (id, name, layout) => {
    store.setProject({ id, name, layout })
    service.msgGreen(t('projectSelectedSuccessfully'))
  }
  const goToKg = (row) => {
    select(row.id, row.name, row.layout)
    router.push({ name: 'kg' })
  }

  api
    .get('project')
    .then((response) => {
      data.value = response.data
      loading.value = false
    })
    .catch(() => {
      loading.value = false
    })
</script>
