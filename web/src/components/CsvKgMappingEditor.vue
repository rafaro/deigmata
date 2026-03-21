<template>
  <div class="q-mt-md">
    <div class="row q-col-gutter-sm">
      <div class="col-12 col-md-4">
        <q-input
          outlined
          dense
          v-model="localMapping.baseIri"
          :label="t('csvKg.baseIri')"
          :hint="t('csvKg.baseIriHint')"
        />
      </div>
      <div class="col-12 col-md-2">
        <q-select
          outlined
          dense
          emit-value
          map-options
          v-model="localMapping.delimiter"
          :options="delimiterOptions"
          :label="t('csvKg.delimiter')"
        />
      </div>
    </div>

    <q-card flat bordered class="q-mt-md">
      <q-card-section>
        <div class="row items-center q-col-gutter-sm q-mb-sm">
          <div class="col">
            <div class="text-subtitle2">{{ t('csvKg.namespaces') }}</div>
            <div class="text-caption text-grey-7">{{ t('csvKg.namespacesHint') }}</div>
          </div>
          <div class="col-auto">
            <q-btn
              outline
              dense
              color="primary"
              icon="add"
              :label="t('csvKg.addNamespace')"
              @click="addNamespace"
            />
          </div>
        </div>

        <div v-if="localMapping.namespaces.length === 0" class="text-caption text-grey-7">
          {{ t('csvKg.noNamespaces') }}
        </div>

        <div
          v-for="(namespace, index) in localMapping.namespaces"
          :key="index"
          class="row q-col-gutter-sm q-mb-sm"
        >
          <div class="col-12 col-md-3">
            <q-input outlined dense v-model="namespace.prefix" :label="t('csvKg.prefix')" />
          </div>
          <div class="col-12 col-md-8">
            <q-input outlined dense v-model="namespace.iri" :label="t('csvKg.namespaceIri')" />
          </div>
          <div class="col-auto">
            <q-btn flat round dense color="negative" icon="delete" @click="removeNamespace(index)" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="q-mt-md">
      <div class="row items-center q-col-gutter-sm q-mb-sm">
        <div class="col">
          <div class="text-subtitle1">{{ t('csvKg.roots') }}</div>
          <div class="text-caption text-grey-7">{{ t('csvKg.mappingHelp') }}</div>
        </div>
        <div class="col-auto">
          <q-btn color="primary" icon="add_circle" :label="t('csvKg.addRoot')" @click="addRoot" />
        </div>
      </div>

      <CsvKgNodeEditor
        v-for="(root, index) in localMapping.roots"
        :key="`root-${index}`"
        :model-value="root"
        :headers="headers"
        is-root
        :show-remove="localMapping.roots.length > 1"
        @remove="removeRoot(index)"
      />
    </div>
  </div>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import CsvKgNodeEditor from 'components/CsvKgNodeEditor.vue'
  import { createResourceNode, normalizeCsvMapping } from 'src/utils/csvKgMapping'

  const props = defineProps({
    modelValue: {
      type: Object,
      default: () => ({}),
    },
    headers: {
      type: Array,
      default: () => [],
    },
  })

  const emit = defineEmits(['update:modelValue'])
  const { t } = useI18n()
  const localMapping = ref(normalizeCsvMapping(props.modelValue))
  const delimiterOptions = computed(() => [
    { label: ',', value: ',' },
    { label: ';', value: ';' },
    { label: 'TAB', value: '\t' },
    { label: '|', value: '|' },
  ])
  let skipNextEmit = false

  const clone = (value) => JSON.parse(JSON.stringify(value))

  watch(
    () => props.modelValue,
    (value) => {
      skipNextEmit = true
      localMapping.value = normalizeCsvMapping(value)
    },
    { deep: true, immediate: true },
  )

  watch(
    localMapping,
    (value) => {
      if (skipNextEmit) {
        skipNextEmit = false
        return
      }

      emit('update:modelValue', clone(value))
    },
    { deep: true },
  )

  const addNamespace = () => {
    localMapping.value.namespaces.push({ prefix: '', iri: '' })
  }

  const removeNamespace = (index) => {
    localMapping.value.namespaces.splice(index, 1)
  }

  const addRoot = () => {
    localMapping.value.roots.push(
      createResourceNode({
        title: `${t('csvKg.rootLabel')} ${localMapping.value.roots.length + 1}`,
      }),
    )
  }

  const removeRoot = (index) => {
    localMapping.value.roots.splice(index, 1)
  }
</script>
