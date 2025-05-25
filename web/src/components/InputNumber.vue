<template>
  <q-input
    :value="value"
    v-bind="$attrs"
    @focus="focus"
    ref="self"
    @keyup.enter="updated"
    @blur="updated"
    @input="hasChanged"
    @keydown.enter.prevent="updated"
    outlined
    dense
    fill-mask="0"
    reverse-fill-mask
    input-class="text-right"
  />
  <!-- @keydown.meta.83.prevent="updated" -->
  <!-- v-on="$listeners" -->
</template>

<script>
import { ref } from 'vue'
export default {
  name: 'InputNumber',
  props: ['value'],
  emits: ['save'],
  setup(props, { emit }) {
    const self = ref(null)
    const changed = ref(false)
    const focus = () => {
      self.value.focus()
    }
    const hasChanged = () => {
      changed.value = true
    }
    const updated = () => {
      if (changed.value) {
        emit('save')
        changed.value = false
      }
    }
    return { self, focus, hasChanged, updated }
  }
}
</script>
