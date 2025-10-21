<template>
  <aside class="card bg-base-100 shadow-sm">
    <div class="p-5 flex flex-col gap-3">
      <section>
        <h4>{{ t('crop.title') }}</h4>

        <AppCheckbox
          v-model="cropSettings.enabled"
          :label="t('crop.enable')"
          class="mt-5"
          text-size="lg"
        />
      </section>
      <div class="divider"></div>

      <section :class="{ 'opacity-50 pointer-events-none': !cropSettings.enabled }">
        <h4>{{ t('crop.presets') }}</h4>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="preset in dimensionPresets.slice(0, 6)"
            :key="preset.name"
            @click="applyDimensionPreset(preset)"
            class="btn btn-primary btn-outline btn-sm"
          >
            {{ preset.name }}
          </button>
        </div>
      </section>
      <div class="divider"></div>

      <section :class="{ 'opacity-50 pointer-events-none': !cropSettings.enabled }">
        <h4>{{ t('crop.dimensions') }}</h4>
        <div class="flex flex-col gap-1">
          <div class="grid grid-cols-[60px_1fr] gap-2 items-center mb-1">
            <label style="font-size: 0.8rem">{{ t('crop.width') }}</label>
            <input
              v-model.number="cropSettings.width"
              type="number"
              min="100"
              max="4000"
              step="10"
              class="input"
            />
          </div>
          <div
            style="display: grid; grid-template-columns: 60px 1fr; gap: 0.5rem; align-items: center"
          >
            <label style="font-size: 0.8rem">{{ t('crop.height') }}</label>
            <input
              v-model.number="cropSettings.height"
              type="number"
              min="100"
              max="4000"
              step="10"
              :disabled="!cropSettings.customAspectRatio"
              class="input"
            />
          </div>

          <AppCheckbox
            v-model="cropSettings.customAspectRatio"
            :label="t('crop.customRatio')"
            class="mt-3"
          />
        </div>
      </section>
      <div class="divider"></div>

      <section :class="{ 'opacity-50 pointer-events-none': !cropSettings.enabled }">
        <h4>{{ t('crop.position') }}</h4>
        <div class="flex flex-col gap-1">
          <AppSlider
            v-model.number="cropSettings.x"
            type="range"
            min="0"
            :max="
              globalSettings.container
                ? globalSettings.container.clientWidth - cropSettings.width
                : 1920
            "
            step="10"
            label="X:"
            :optional="cropSettings.x"
          />

          <AppSlider
            v-model.number="cropSettings.y"
            type="range"
            min="0"
            :max="
              globalSettings.container
                ? globalSettings.container.clientHeight - cropSettings.height
                : 1080
            "
            step="10"
            label="Y:"
            :optional="cropSettings.y"
          />
        </div>
      </section>
      <div class="divider"></div>

      <section
        :class="{ 'opacity-50 pointer-events-none': !cropSettings.enabled }"
        class="text-xs text-gray-600 p-2 border border-gray-200 rounded-md bg-gray-50 space-y-2"
      >
        <p>📐 {{ cropSettings.width }}x{{ cropSettings.height }}p</p>
        <p>📍 Position: ({{ cropSettings.x }}, {{ cropSettings.y }})</p>
        <p>
          🎬 Fichier: mockup-3d-recording-{{ cropSettings.width }}x{{
            cropSettings.height
          }}-[timestamp].webm
        </p>
      </section>
    </div>
  </aside>
</template>

<script setup>
import { cropSettings } from '@/states/crop-settings-state.js'
import { globalSettings } from '@/states/global-settings-state.js'
import AppCheckbox from '@/components/AppCheckbox.vue'
import AppSlider from '@/components/AppSlider.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const dimensionPresets = [
  { name: '1920x1080 (16:9)', width: 1920, height: 1080, aspectRatio: '16:9' },
  { name: '1280x720 (16:9)', width: 1280, height: 720, aspectRatio: '16:9' },
  { name: '1080x1080 (1:1)', width: 1080, height: 1080, aspectRatio: '1:1' },
  { name: '1080x1350 (4:5)', width: 1080, height: 1350, aspectRatio: '4:5' },
  { name: '1080x1920 (9:16)', width: 1080, height: 1920, aspectRatio: '9:16' },
  { name: '854x480 (16:9)', width: 854, height: 480, aspectRatio: '16:9' },
  { name: 'Custom', width: 1920, height: 1080, aspectRatio: 'custom' },
]

function applyDimensionPreset(preset) {
  cropSettings.width = preset.width
  cropSettings.height = preset.height
  cropSettings.aspectRatio = preset.aspectRatio
  cropSettings.customAspectRatio = preset.aspectRatio === 'custom'

  // Center the crop in the current canvas
  if (globalSettings.renderer && globalSettings.container.value) {
    const canvasWidth = globalSettings.container.value.clientWidth
    const canvasHeight = globalSettings.container.value.clientHeight
    cropSettings.x = Math.max(0, (canvasWidth - cropSettings.width) / 2)
    cropSettings.y = Math.max(0, (canvasHeight - cropSettings.height) / 2)
  }
}
</script>
