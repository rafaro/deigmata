<template>
  <q-card flat bordered class="q-mt-md">
    <q-card-section class="q-pb-sm">
      <div class="row items-center q-col-gutter-sm">
        <div class="col">
          <div class="text-subtitle2">{{ sectionTitle }}</div>
          <div class="text-caption text-grey-7">{{ sectionHint }}</div>
        </div>
        <div class="col-auto" v-if="showRemove">
          <q-btn flat round dense color="negative" icon="delete" @click="$emit('remove')" />
        </div>
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <div class="row q-col-gutter-sm">
        <template v-if="!isLiteral">
          <div class="col-12 col-md-2">
            <q-input outlined dense v-model="node.title" :label="t('csvKg.nodeTitle')" />
          </div>
          <div class="col-12 col-md-2">
            <q-input outlined dense v-model="node.type" :label="t('csvKg.nodeType')" />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              outlined
              dense
              emit-value
              map-options
              v-model="node.subjectSource.mode"
              :options="subjectModeOptions"
              :label="t('csvKg.subjectMode')"
            />
          </div>
          <div class="col-12 col-md-5" v-if="node.subjectSource.mode !== 'blank'">
            <q-select
              v-if="node.subjectSource.mode === 'column'"
              outlined
              dense
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              v-model="node.subjectSource.value"
              :options="headers"
              :label="t('csvKg.subjectColumn')"
            />
            <q-input
              v-else
              outlined
              dense
              v-model="node.subjectSource.value"
              :label="t('csvKg.subjectFixedValue')"
            />
          </div>

          <div class="col-12 col-md-3">
            <q-select
              outlined
              dense
              emit-value
              map-options
              v-model="node.labelSource.mode"
              :options="labelModeOptions"
              :label="t('csvKg.labelMode')"
            />
          </div>
          <div class="col-12 col-md-5">
            <q-select
              v-if="node.labelSource.mode === 'column'"
              outlined
              dense
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              v-model="node.labelSource.value"
              :options="headers"
              :label="t('csvKg.labelColumn')"
            />
            <q-input
              v-else
              outlined
              dense
              v-model="node.labelSource.value"
              :label="t('csvKg.labelFixedValue')"
            />
          </div>
        </template>

        <template v-else>
          <div class="col-12 col-md-3">
            <q-select
              outlined
              dense
              emit-value
              map-options
              v-model="node.valueSource.mode"
              :options="valueModeOptions"
              :label="t('csvKg.objectMode')"
            />
          </div>
          <div class="col-12 col-md-5">
            <q-select
              v-if="node.valueSource.mode === 'column'"
              outlined
              dense
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              v-model="node.valueSource.value"
              :options="headers"
              :label="t('csvKg.objectColumn')"
            />
            <q-input
              v-else
              outlined
              dense
              v-model="node.valueSource.value"
              :label="t('csvKg.objectFixedValue')"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input outlined dense v-model="node.datatype" :label="t('csvKg.literalType')" />
          </div>

          <div class="col-12 col-md-3">
            <q-select
              outlined
              dense
              emit-value
              map-options
              v-model="node.labelSource.mode"
              :options="labelModeOptions"
              :label="t('csvKg.labelMode')"
            />
          </div>
          <div class="col-12 col-md-5">
            <q-select
              v-if="node.labelSource.mode === 'column'"
              outlined
              dense
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              v-model="node.labelSource.value"
              :options="headers"
              :label="t('csvKg.labelColumn')"
            />
            <q-input
              v-else
              outlined
              dense
              v-model="node.labelSource.value"
              :label="t('csvKg.labelFixedValue')"
            />
          </div>
        </template>

        <div class="col-12" v-if="headers.length > 0">
          <div class="text-caption text-grey-7 q-mb-xs">{{ t('csvKg.availableColumns') }}</div>
          <div class="row q-col-gutter-xs">
            <div v-for="header in headers" :key="header" class="col-auto">
              <q-chip dense square color="blue-1" text-color="primary">
                {{ header }}
              </q-chip>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!isLiteral" class="q-mt-md">
        <div class="row items-center q-col-gutter-sm q-mb-sm">
          <div class="col">
            <div class="text-subtitle2">{{ t('csvKg.triples') }}</div>
            <div class="text-caption text-grey-7">{{ t('csvKg.triplesHint') }}</div>
          </div>
          <div class="col-auto">
            <q-btn
              outline
              dense
              color="primary"
              icon="add_link"
              :label="t('csvKg.addLiteralTriple')"
              @click="addTriple('literal')"
            />
          </div>
          <div class="col-auto">
            <q-btn
              outline
              dense
              color="secondary"
              icon="account_tree"
              :label="t('csvKg.addResourceTriple')"
              @click="addTriple('resource')"
            />
          </div>
        </div>

        <div v-if="node.triples.length === 0" class="text-caption text-grey-7">
          {{ t('csvKg.noTriples') }}
        </div>

        <q-card
          v-for="(triple, index) in node.triples"
          :key="index"
          flat
          bordered
          class="q-mb-md bg-grey-1"
        >
          <q-card-section>
            <div class="text-caption text-grey-7 q-mb-sm">
              {{ t('csvKg.tripleLabel', { index: index + 1 }) }}
            </div>
            <div class="row q-col-gutter-sm items-start">
              <div class="col-12 col-md-3">
                <q-select
                  outlined
                  dense
                  emit-value
                  map-options
                  v-model="triple.predicateSource.mode"
                  :options="predicateModeOptions"
                  :label="t('csvKg.predicateMode')"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-if="triple.predicateSource.mode === 'column'"
                  outlined
                  dense
                  use-input
                  fill-input
                  hide-selected
                  input-debounce="0"
                  v-model="triple.predicateSource.value"
                  :options="headers"
                  :label="t('csvKg.predicateColumn')"
                />
                <q-input
                  v-else
                  outlined
                  dense
                  v-model="triple.predicateSource.value"
                  :label="t('csvKg.predicateFixedValue')"
                />
              </div>
              <div class="col-12 col-md-3">
                <q-select
                  outlined
                  dense
                  emit-value
                  map-options
                  v-model="triple.object.kind"
                  :options="objectKindOptions"
                  :label="t('csvKg.objectKind')"
                  @update:model-value="(value) => changeObjectKind(index, value)"
                />
              </div>
              <div class="col-auto">
                <q-btn flat round dense color="negative" icon="delete" @click="removeTriple(index)" />
              </div>
            </div>

            <CsvKgNodeEditor class="q-mt-sm" :model-value="triple.object" :headers="headers" />
          </q-card-section>
        </q-card>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { createLiteralNode, createResourceNode, createTriple } from 'src/utils/csvKgMapping'

  defineOptions({
    name: 'CsvKgNodeEditor',
  })

  const props = defineProps({
    modelValue: {
      type: Object,
      required: true,
    },
    headers: {
      type: Array,
      default: () => [],
    },
    isRoot: {
      type: Boolean,
      default: false,
    },
    showRemove: {
      type: Boolean,
      default: false,
    },
  })

  defineEmits(['remove'])

  const { t } = useI18n()
  const node = computed(() => props.modelValue)
  const isLiteral = computed(() => node.value?.kind === 'literal')

  const sectionTitle = computed(() => {
    if (isLiteral.value) {
      return t('csvKg.objectLiteral')
    }

    return props.isRoot ? t('csvKg.subjectRoot') : t('csvKg.objectResource')
  })

  const sectionHint = computed(() => {
    if (isLiteral.value) {
      return t('csvKg.objectLiteralHint')
    }

    return props.isRoot ? t('csvKg.subjectRootHint') : t('csvKg.objectResourceHint')
  })

  const subjectModeOptions = computed(() => {
    const options = [
      { label: t('csvKg.sourceModeFixed'), value: 'fixed' },
      { label: t('csvKg.sourceModeColumn'), value: 'column' },
    ]

    if (!props.isRoot) {
      options.push({ label: t('csvKg.sourceModeBlank'), value: 'blank' })
    }

    return options
  })

  const labelModeOptions = computed(() => [
    { label: t('csvKg.sourceModeFixed'), value: 'fixed' },
    { label: t('csvKg.sourceModeColumn'), value: 'column' },
  ])

  const valueModeOptions = computed(() => [
    { label: t('csvKg.sourceModeFixed'), value: 'fixed' },
    { label: t('csvKg.sourceModeColumn'), value: 'column' },
  ])

  const predicateModeOptions = computed(() => [
    { label: t('csvKg.sourceModeFixed'), value: 'fixed' },
    { label: t('csvKg.sourceModeColumn'), value: 'column' },
  ])

  const objectKindOptions = computed(() => [
    { label: t('csvKg.objectLiteral'), value: 'literal' },
    { label: t('csvKg.objectResource'), value: 'resource' },
  ])

  const addTriple = (kind) => {
    if (!Array.isArray(node.value.triples)) {
      node.value.triples = []
    }

    node.value.triples.push(createTriple(kind))
  }

  const removeTriple = (index) => {
    node.value.triples.splice(index, 1)
  }

  const changeObjectKind = (index, kind) => {
    node.value.triples[index].object = kind === 'resource' ? createResourceNode() : createLiteralNode()
  }
</script>
