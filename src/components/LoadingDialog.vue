<template>
  <div v-if="model">
    <div class="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-80">
      <div class="card bg-base-100 rounded-lg shadow-lg p-6 max-w-md w-full">
        <div class="flex flex-col items-center">
          <h2 class="text-2xl font-bold mb-4">{{ t('loading.title') }}</h2>
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const model = defineModel({
  type: Boolean,
  required: true,
})
</script>
