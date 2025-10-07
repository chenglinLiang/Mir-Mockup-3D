<template>
  <aside
    class="card bg-base-100 shadow-sm absolute top-16 right-4 max-w-md w-full z-50"
    style="max-height: calc(100vh - 8rem); overflow: auto"
  >
    <div class="p-5 flex flex-col gap-3">
      <h3 class="text-2xl font-bold mb-5">Contrôles Caméra</h3>
      <section>
        <h4>Vues prédéfinies</h4>
        <div class="grid grid-cols-2 gap-2">
          <button
            class="btn btn-primary btn-outline btn-sm"
            v-for="preset in positionsPresets"
            :key="preset.name"
            @click="applyPreset(preset)"
          >
            {{ preset.name }}
          </button>
        </div>
      </section>

      <div class="divider"></div>

      <section>
        <h4>Position</h4>
        <div class="flex flex-col gap-1">
          <AppSlider
            v-model.number="cameraSettings.position.x"
            label="X:"
            min="0"
            max="100"
            step="0.1"
            :optional="cameraSettings.position.x.toFixed(1)"
          />
          <AppSlider
            v-model.number="cameraSettings.position.y"
            label="Y:"
            min="0"
            max="100"
            step="0.1"
            :optional="cameraSettings.position.y.toFixed(1)"
          />
          <AppSlider
            v-model.number="cameraSettings.position.z"
            label="Z:"
            min="5"
            max="30"
            step="0.1"
            :optional="cameraSettings.position.z.toFixed(1)"
          />
        </div>
      </section>

      <div class="divider"></div>

      <section>
        <h4>Cible</h4>
        <div class="flex flex-col gap-1">
          <AppSlider
            v-model.number="cameraSettings.target.x"
            label="X:"
            min="-2"
            max="2"
            step="0.1"
            :optional="cameraSettings.target.x.toFixed(1)"
          />

          <AppSlider
            v-model.number="cameraSettings.target.y"
            label="Y:"
            min="-2"
            max="2"
            step="0.1"
            :optional="cameraSettings.target.y.toFixed(1)"
          />

          <AppSlider
            v-model.number="cameraSettings.target.z"
            label="Z:"
            min="-2"
            max="2"
            step="0.1"
            :optional="cameraSettings.target.z.toFixed(1)"
          />
        </div>
      </section>

      <div class="divider"></div>

      <section>
        <h4>Champ de vision</h4>
        <div class="flex flex-col gap-1">
          <AppSlider
            v-model.number="cameraSettings.fov"
            type="range"
            min="10"
            max="120"
            step="1"
            :optional="cameraSettings.fov + '°'"
          />
        </div>
      </section>

      <div class="divider"></div>

      <section>
        <AppCheckbox
          v-model="cameraSettings.autoRotate"
          label="Rotation automatique"
          class="mb-5"
        />

        <div v-if="cameraSettings.autoRotate">
          <AppSlider
            v-model.number="cameraSettings.autoRotateSpeed"
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            :optional="cameraSettings.autoRotateSpeed"
          />
        </div>
      </section>

      <div class="divider"></div>

      <section>
        <h4>Limites de zoom</h4>
        <div class="flex flex-col gap-1">
          <AppSlider
            v-model.number="cameraSettings.minDistance"
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            label="Min:"
            :optional="cameraSettings.minDistance.toFixed(1)"
          />

          <AppSlider
            v-model.number="cameraSettings.maxDistance"
            type="range"
            min="5"
            max="50"
            step="1"
            label="Max:"
            :optional="cameraSettings.maxDistance.toFixed(1)"
          />
        </div>
      </section>

      <div class="divider"></div>

      <section>
        <h4>Interactions</h4>
        <div class="flex flex-col gap-2">
          <AppCheckbox v-model="cameraSettings.enableZoom" label="Zoom" />

          <AppCheckbox v-model="cameraSettings.enablePan" label="Panoramique" />

          <AppCheckbox v-model="cameraSettings.enableRotate" label="Rotation" />
        </div>
      </section>
      <div class="divider"></div>

      <section class="flex flex-col gap-3">
        <!-- Bouton Reset -->
        <button @click="resetCamera" class="btn w-full btn-outline btn-primary">
          🔄 Réinitialiser
        </button>

        <!-- Bouton pour afficher les contrôles d'éclairage -->
        <button @click="toggleLightingControls" class="btn w-full btn-secondary btn-outline">
          {{ showLightingControls ? '💡 Masquer Éclairage' : '💡 Contrôles Éclairage' }}
        </button>

        <!-- Bouton pour afficher les contrôles de crop -->
        <button @click="toggleCropControls" class="btn w-full btn-accent btn-outline">
          {{ showCropControls ? '✂️ Masquer Crop' : '✂️ Contrôles Crop' }}
        </button>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import AppSlider from '@/components/AppSlider.vue'
import AppCheckbox from '@/components/AppCheckbox.vue'
import { cameraSettings } from '@/states/camera-settings-state.js'
import { panelSettings } from '@/states/panel-settings-state.js'

const positionsPresets = [
  { name: 'Vue par défaut', position: { x: 0.6, y: 0.5, z: 20 }, target: { x: 0, y: 0.1, z: 0 } },
  { name: 'Vue de face', position: { x: 0, y: 0.1, z: 20 }, target: { x: 0, y: 0.1, z: 0 } },
  { name: 'Vue de côté', position: { x: 2, y: 0.1, z: 0 }, target: { x: 0, y: 0.1, z: 0 } },
  { name: 'Vue du dessus', position: { x: 0, y: 3, z: 0 }, target: { x: 0, y: 0, z: 0 } },
  { name: 'Vue en plongée', position: { x: -1, y: 1.5, z: 1.5 }, target: { x: 0, y: 0.1, z: 0 } },
]

function applyPreset(preset) {
  cameraSettings.position.x = preset.position.x
  cameraSettings.position.y = preset.position.y
  cameraSettings.position.z = preset.position.z
  cameraSettings.target.x = preset.target.x
  cameraSettings.target.y = preset.target.y
  cameraSettings.target.z = preset.target.z
}

function resetCamera() {
  const defaultPreset = positionsPresets[0]
  applyPreset(defaultPreset)
}

function toggleCropControls() {
  panelSettings.crop = !panelSettings.crop
}

function toggleLightingControls() {
  panelSettings.lighting = !panelSettings.lighting
}
</script>
