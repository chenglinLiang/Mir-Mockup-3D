<template>
  <fieldset class="fieldset w-full p-0">
    <legend v-if="label" class="fieldset-legend">{{ label }}</legend>
    <input
      v-model="model"
      type="range"
      :min="min"
      :max="max"
      class="range range-xs w-full range-primary"
      :step="step"
      @input="emit('input')"
    />
    <p class="label text-right">{{ optional }}</p>
  </fieldset>
</template>

<script setup>
defineProps({
  label: {
    type: String,
  },
  min: {
    type: String,
    default: '0',
  },
  max: {
    type: String,
    default: '100',
  },
  step: {
    type: String,
    default: '1',
  },
  optional: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['input'])

const model = defineModel({
  type: Number,
  required: true,
})
</script>
