<template>
  <q-select
    outlined
    dense
    :options="opt"
    options-dense
    label="Status"
    emit-value
    map-options
    v-bind="$attrs"
  />
</template>

<script>
export default {
  name: 'SelectStatus',
  setup() {
    const opt = [
      { label: 'Ativo', value: 'A' },
      { label: 'Inativo', value: 'I' }
    ]
    return { opt }
  }
}
</script>
