<template>
  <label class="flex items-center gap-2 cursor-pointer select-none">
    <input
      v-model="model"
      type="checkbox"
      checked="checked"
      class="checkbox checkbox-xs checkbox-primary"
      @change="emit('change')"
    />
    <span
      :class="{
        'text-xs': textSize === 'xs',
        'text-sm': textSize === 'sm',
        'text-md': textSize === 'md',
        'text-lg': textSize === 'lg',
        'text-xl': textSize === 'xl',
      }"
      >{{ label }}</span
    >
  </label>
</template>

<script setup>
const model = defineModel({
  type: Number,
  required: true,
})

defineProps({
  label: {
    type: String,
  },
  textSize: {
    type: String,
    default: 'xs',
  },
})

const emit = defineEmits(['change'])
</script>
