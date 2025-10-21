<template>
  <aside class="card bg-base-100 shadow-sm">
    <div class="p-5 flex flex-col gap-3">
      <h3 class="text-2xl font-bold mb-5">{{ t('media.title') }}</h3>
      <div class="mb-3 text-sm space-y-3">
        <p>{{ t('media.intro') }}</p>
        <a class="font-bold flex items-center gap-2" href="https://habits-hero.fr/">
          <img src="/habits-hero-icon.png" class="size-6 rounded" alt="Habits Hero Logo" />
          {{ t('media.habitsHero') }}</a
        >
        <p>{{ t('media.story') }}</p>
      </div>
      <label class="input">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>

        <input
          type="text"
          class="grow"
          :placeholder="t('media.videoPlaceholder')"
          :value="currentFileSelected"
          @click="onClickFileInput"
        />
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          accept="video/*"
          @change="onVideoSelected"
        />
      </label>
      <small>{{ t('media.recommendedFormat') }}</small>
    </div>
  </aside>
</template>

<script setup>
import { ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { mediaSettings } from '@/states/media-settings-state.js'

const { t } = useI18n()

const fileInput = useTemplateRef('fileInput')
const currentFileSelected = ref('')

const onClickFileInput = () => {
  if (!fileInput.value) return

  fileInput.value.click()
}

const onVideoSelected = () => {
  if (!fileInput.value || !fileInput.value.files) return

  const file = fileInput.value.files[0]
  if (!file) return

  currentFileSelected.value = file.name

  const reader = new FileReader()
  reader.onload = (e) => {
    if (e.target && e.target.result) {
      mediaSettings.video = e.target.result
    }
  }
  reader.readAsDataURL(file)
}
</script>
