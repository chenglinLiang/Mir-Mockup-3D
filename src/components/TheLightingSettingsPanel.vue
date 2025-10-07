<template>
  <aside
    class="card bg-base-100 shadow-sm absolute top-16 left-4 max-w-sm w-full z-50"
    style="max-height: calc(100vh - 6rem); overflow-y: auto"
  >
    <div class="p-5 flex flex-col gap-3">
      <h3 class="text-2xl font-bold mb-5">💡 Contrôles Éclairage</h3>

      <section>
        <AppCheckbox v-model="lightingSettings.ambientEnabled" label="🌅 Lumière ambiante" />
        <div v-if="lightingSettings.ambientEnabled" class="flex flex-col gap-1 mt-5">
          <div class="grid grid-cols-[50px_1fr_50px] gap-2 items-center mb-2">
            <label style="font-size: 0.8rem">Couleur:</label>
            <input
              v-model="lightingSettings.ambientColor"
              type="color"
              style="width: 100%; height: 30px; border-radius: 0.3rem; border: 1px solid #ddd"
            />
            <span></span>
          </div>
          <AppSlider
            v-model.number="lightingSettings.ambientIntensity"
            type="range"
            min="0"
            max="2"
            step="0.05"
            label="Force:"
            :optional="lightingSettings.ambientIntensity.toFixed(2)"
          />
        </div>
      </section>

      <div class="divider"></div>

      <section>
        <AppCheckbox
          v-model="lightingSettings.directionalEnabled"
          label="☀️ Lumière directionnelle"
        />
        <div v-if="lightingSettings.directionalEnabled" class="flex flex-col gap-1 mt-5">
          <div class="flex items-center gap-3 mb-2">
            <label class="text-sm">Couleur:</label>
            <input
              v-model="lightingSettings.directionalColor"
              type="color"
              style="width: 100%; height: 30px; border-radius: 0.3rem; border: 1px solid #ddd"
            />
            <span></span>
          </div>
          <AppSlider
            v-model.number="lightingSettings.directionalIntensity"
            type="range"
            min="0"
            max="5"
            step="0.1"
            label="Force:"
            :optional="lightingSettings.directionalIntensity.toFixed(1)"
          />
          <p class="mt-3 text-sm">Position:</p>
          <div class="flex flex-col gap-1">
            <AppSlider
              v-model.number="lightingSettings.directionalPosition.x"
              type="range"
              min="-5"
              max="5"
              step="0.1"
              label="X:"
              :optional="lightingSettings.directionalPosition.x.toFixed(1)"
            />

            <AppSlider
              v-model.number="lightingSettings.directionalPosition.y"
              type="range"
              min="-5"
              max="5"
              step="0.1"
              label="Y:"
              :optional="lightingSettings.directionalPosition.y.toFixed(1)"
            />

            <AppSlider
              v-model.number="lightingSettings.directionalPosition.z"
              type="range"
              min="-5"
              max="5"
              step="0.1"
              label="Z:"
              :optional="lightingSettings.directionalPosition.z.toFixed(1)"
            />
          </div>
        </div>
      </section>

      <div class="divider"></div>

      <section>
        <AppCheckbox
          v-model="lightingSettings.pointEnabled"
          type="checkbox"
          label="💡 Lumière ponctuelle"
        />
        <div v-if="lightingSettings.pointEnabled" class="flex flex-col gap-1 mt-5">
          <div class="flex items-center gap-3 mb-2">
            <label class="text-sm">Couleur:</label>
            <input
              v-model="lightingSettings.pointColor"
              type="color"
              style="width: 100%; height: 30px; border-radius: 0.3rem; border: 1px solid #ddd"
            />
            <span></span>
          </div>
          <AppSlider
            v-model.number="lightingSettings.pointIntensity"
            type="range"
            min="0"
            max="10"
            step="0.1"
            label="Force:"
            :optional="lightingSettings.pointIntensity.toFixed(1)"
          />
          <AppSlider
            v-model.number="lightingSettings.pointDistance"
            type="range"
            min="1"
            max="50"
            step="1"
            label="Distance:"
            :optional="lightingSettings.pointDistance"
          />
          <p class="mt-3 text-sm">Position:</p>
          <div class="flex flex-col gap-1">
            <AppSlider
              v-model.number="lightingSettings.pointPosition.x"
              type="range"
              min="-5"
              max="5"
              step="0.1"
              label="X:"
              :optional="lightingSettings.pointPosition.x.toFixed(1)"
            />

            <AppSlider
              v-model.number="lightingSettings.pointPosition.y"
              type="range"
              min="-5"
              max="5"
              step="0.1"
              label="Y:"
              :optional="lightingSettings.pointPosition.y.toFixed(1)"
            />

            <AppSlider
              v-model.number="lightingSettings.pointPosition.z"
              type="range"
              min="-5"
              max="5"
              step="0.1"
              label="Z:"
              :optional="lightingSettings.pointPosition.z.toFixed(1)"
            />
          </div>
        </div>
      </section>

      <div class="divider"></div>

      <section>
        <AppCheckbox
          v-model="lightingSettings.spotEnabled"
          type="checkbox"
          label="🔦 Lumière spot"
        />
        <div v-if="lightingSettings.spotEnabled" class="flex flex-col gap-1 mt-5">
          <div class="flex items-center gap-3 mb-2">
            <label class="text-sm">Couleur:</label>
            <input
              v-model="lightingSettings.spotColor"
              type="color"
              style="width: 100%; height: 30px; border-radius: 0.3rem; border: 1px solid #ddd"
            />
            <span></span>
          </div>
          <AppSlider
            v-model.number="lightingSettings.spotIntensity"
            type="range"
            min="0"
            max="10"
            step="0.1"
            label="Force:"
            :optional="lightingSettings.spotIntensity.toFixed(1)"
          />

          <AppSlider
            v-model.number="lightingSettings.spotAngle"
            min="5"
            max="90"
            step="1"
            label="Angle:"
            :optional="lightingSettings.spotAngle + '°'"
          />

          <AppSlider
            v-model.number="lightingSettings.spotPenumbra"
            min="0"
            max="1"
            step="0.05"
            label="Flou:"
            :optional="lightingSettings.spotPenumbra.toFixed(2)"
          />
        </div>
      </section>

      <div class="divider"></div>

      <section>
        <h4 class="!mb-5">🌍 Éclairage global</h4>
        <div class="flex flex-col gap-1">
          <AppSlider
            v-model.number="lightingSettings.exposureCompensation"
            min="0.1"
            max="3"
            step="0.1"
            :optional="lightingSettings.exposureCompensation.toFixed(1)"
          />
          <AppSlider
            v-model.number="lightingSettings.backgroundBrightness"
            min="0.1"
            max="2"
            step="0.1"
            :optional="lightingSettings.backgroundBrightness.toFixed(1)"
          />
        </div>
      </section>

      <button @click="resetLighting" class="btn">🔄 Réinitialiser Éclairage</button>
    </div>
  </aside>
</template>

<script setup>
import AppSlider from '@/components/AppSlider.vue'
import AppCheckbox from '@/components/AppCheckbox.vue'

import { lightingSettings, resetLighting } from '@/states/lighting-settings-state.js'
</script>
