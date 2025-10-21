<template>
  <div style="width: 100vw; height: 100vh">
    <WelcomeDialog v-model="dialog.welcome.show" />
    <LoadingDialog v-model="dialog.loading.show" />
    <div ref="container" style="width: 100%; height: 100%; position: relative; overflow: hidden">
      <div class="absolute bottom-3 left-3 z-10">
        <TheRecordingAction />
      </div>

      <div
        v-if="cropSettings.enabled"
        :class="[
          'absolute',
          'border-2',
          'border-[#ff6b35]',
          'pointer-events-none',
          'z-10',
          'shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]',
        ]"
        :style="{
          left: cropSettings.x + 'px',
          top: cropSettings.y + 'px',
          width: cropSettings.width + 'px',
          height: cropSettings.height + 'px',
        }"
      >
        <div
          class="absolute -top-8 left-0 bg-[#ff6b35] text-white px-2 py-1 rounded font-bold text-xs whitespace-nowrap"
        >
          {{ $t('crop.title') }} {{ cropSettings.width }}×{{ cropSettings.height }}
        </div>
      </div>

      <!-- Dynamic panels -->
      <template v-for="(panel, idx) in panelsOuverts" :key="panel.key">
        <component
          :is="panel.component"
          class="absolute top-5 z-50 max-w-sm w-full"
          :class="idx === 0 ? 'right-4' : 'left-4'"
          style="max-height: calc(100vh - 5rem); overflow: auto"
        />
      </template>

      <div class="absolute bottom-3 left-1/2 -translate-x-1/2 z-40">
        <TheMenu />
      </div>

      <div class="absolute bottom-3 right-3 z-40">
        <div class="flex flex-col gap-3">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, useTemplateRef, computed, reactive, watch, ref } from 'vue'
import * as THREE from 'three'
import { GLTFLoader, OrbitControls } from 'three-stdlib'

import { globalSettings } from '@/states/global-settings-state.js'
import { cameraSettings } from '@/states/camera-settings-state.js'
import { cropSettings } from '@/states/crop-settings-state.js'
import { panelSettings } from '@/states/panel-settings-state.js'
import { useLightingAmbient } from '@/composables/useLightingAmbient.js'
import TheLightingSettingsPanel from '@/components/TheLightingSettingsPanel.vue'
import { useLightingDirectional } from '@/composables/useLightingDirectional.js'
import { useLightingPoint } from '@/composables/useLightingPoint.js'
import { useLightingSpot } from '@/composables/useLightingSpot.js'
import { useBackground } from '@/composables/useBackground.js'
import TheCameraSettingsPanel from '@/components/TheCameraSettingsPanel.vue'
import { useCropDimensions } from '@/composables/useCropDimensions.js'
import { useCameraPosition } from '@/composables/useCameraPosition.js'
import { useCameraFOV } from '@/composables/useCameraFOV.js'
import { useCameraControls } from '@/composables/useCameraControls.js'
import TheRecordingAction from '@/components/TheRecordingAction.vue'
import TheCropSettingsPanel from '@/components/TheCropSettingsPanel.vue'
import { useTheme } from '@/composables/useTheme.js'
import TheBackgroundSettingsPanel from '@/components/TheBackgroundSettingsPanel.vue'
import TheMenu from '@/components/TheMenu.vue'
import WelcomeDialog from '@/components/WelcomeDialog.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import TheMediaSettingsPanel from '@/components/TheMediaSettingsPanel.vue'
import { useMedia } from '@/composables/useMedia.js'
import LoadingDialog from '@/components/LoadingDialog.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const { init: initLightingAmbient } = useLightingAmbient()
const { init: initLightingDirectional } = useLightingDirectional()
const { init: initLightingPoint } = useLightingPoint()
const { init: initLightingSpot } = useLightingSpot()
const { init: initBackground } = useBackground()
const { init: initSource } = useMedia()

useCropDimensions()
useCameraPosition()
useCameraFOV()
useCameraControls()

const { init: initTheme } = useTheme()

onMounted(initTheme)

globalSettings.container = useTemplateRef('container')

const dialog = reactive({
  welcome: {
    show: false,
  },
  loading: {
    show: false,
  },
})

watch(
  () => dialog.welcome.show,
  (newVal) => {
    if (newVal) {
      localStorage.setItem(
        'welcomeDialogShown',
        JSON.stringify({
          done: newVal,
          date: new Date().toISOString(),
        }),
      )
    }
  },
)

onMounted(() => {
  const shown = localStorage.getItem('welcomeDialogShown')
  if (!shown) {
    dialog.welcome.show = true
    return
  }

  const data = JSON.parse(shown)

  if (!data.done) {
    dialog.welcome.show = true
    return
  }

  init()
})

watch(
  () => dialog.welcome.show,
  (value) => {
    if (!value) init()
  },
)

let rafId = 0

async function init() {
  if (!globalSettings.container.value) return

  dialog.loading.show = true

  // Renderer
  globalSettings.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  globalSettings.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  globalSettings.renderer.setSize(
    globalSettings.container.value.clientWidth,
    globalSettings.container.value.clientHeight,
  )
  globalSettings.renderer.toneMapping = THREE.ACESFilmicToneMapping
  globalSettings.renderer.toneMappingExposure = 1
  globalSettings.renderer.outputColorSpace = THREE.SRGBColorSpace
  globalSettings.container.value.appendChild(globalSettings.renderer.domElement)

  // Scene & camera
  globalSettings.scene = new THREE.Scene()
  globalSettings.camera = new THREE.PerspectiveCamera(
    35,
    globalSettings.container.value.clientWidth / globalSettings.container.value.clientHeight,
    0.1,
    100,
  )
  globalSettings.camera.position.set(0.6, 0.5, 20)

  // Controls
  globalSettings.controls = new OrbitControls(
    globalSettings.camera,
    globalSettings.renderer.domElement,
  )
  globalSettings.controls.enableDamping = true
  globalSettings.controls.target.set(
    cameraSettings.target.x,
    cameraSettings.target.y,
    cameraSettings.target.z,
  )
  globalSettings.controls.autoRotate = cameraSettings.autoRotate
  globalSettings.controls.autoRotateSpeed = cameraSettings.autoRotateSpeed
  globalSettings.controls.enableZoom = cameraSettings.enableZoom
  globalSettings.controls.enablePan = cameraSettings.enablePan
  globalSettings.controls.enableRotate = cameraSettings.enableRotate
  globalSettings.controls.minDistance = cameraSettings.minDistance
  globalSettings.controls.maxDistance = cameraSettings.maxDistance
  globalSettings.controls.minPolarAngle = cameraSettings.minPolarAngle
  globalSettings.controls.maxPolarAngle = cameraSettings.maxPolarAngle

  // Initial light configuration
  initializeLights()

  // iPhone model (GLB)
  const gltf = await new GLTFLoader().loadAsync('/models/iphone.glb')
  const phone = gltf.scene
  phone.traverse((obj) => {
    const m = obj
    if (!m.isMesh) return
    m.castShadow = false
    m.receiveShadow = false
    if (m.material && m.material.map) {
      const mat = m.material
      if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace
    }
  })

  globalSettings.phone = phone

  initSource()

  // Phone scale/position
  phone.scale.set(0.9, 0.9, 0.9)
  globalSettings.scene.add(phone)

  // Pause/Resume based on visibility
  document.addEventListener('visibilitychange', () => {
    if (!globalSettings.videoEl) return
    if (document.hidden) globalSettings.videoEl.pause()
    else globalSettings.videoEl.play().catch(() => {})
  })

  // Render loop
  const tick = () => {
    globalSettings.controls.update()
    globalSettings.renderer.render(globalSettings.scene, globalSettings.camera)
    rafId = requestAnimationFrame(tick)
  }
  tick()

  // Resize
  const onResize = () => {
    if (!globalSettings.container.value) return
    const { clientWidth: w, clientHeight: h } = globalSettings.container.value
    globalSettings.renderer.setSize(w, h)
    globalSettings.camera.aspect = w / h
    globalSettings.camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', onResize)

  dialog.loading.show = false
}

function initializeLights() {
  if (!globalSettings.scene) return

  initLightingAmbient()
  initLightingDirectional()
  initLightingPoint()
  initLightingSpot()
  initBackground()
}

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', () => {})
  if (globalSettings.videoEl) {
    globalSettings.videoEl.pause()
    globalSettings.videoEl.src = ''
    globalSettings.videoEl.load()
  }
  globalSettings.renderer?.dispose()
})

// List of panels and their components
const panelsList = [
  { key: 'camera', component: TheCameraSettingsPanel },
  { key: 'lighting', component: TheLightingSettingsPanel },
  { key: 'crop', component: TheCropSettingsPanel },
  { key: 'background', component: TheBackgroundSettingsPanel },
  { key: 'media', component: TheMediaSettingsPanel },
]

// Open panels
const panelsOuverts = computed(() => {
  return panelsList.filter((p) => panelSettings[p.key])
})
</script>
