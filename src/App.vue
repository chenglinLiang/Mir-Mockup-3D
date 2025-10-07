<template>
  <div style="width: 100vw; height: 100vh">
    <div ref="container" style="width: 100%; height: 100%; position: relative; overflow: hidden">
      <TheRecordingAction />

      <button @click="toggleControls" class="btn absolute top-4 right-4 z-20">
        {{ panelSettings.camera ? '✕ Masquer' : '⚙️ Contrôles' }}
      </button>

      <TheCameraSettingsPanel v-if="panelSettings.camera" />

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
          Zone d'enregistrement {{ cropSettings.width }}×{{ cropSettings.height }}
        </div>
      </div>

      <TheLightingSettingsPanel v-if="panelSettings.camera && panelSettings.lighting" />

      <TheCropSettingsPanel v-if="panelSettings.camera && panelSettings.crop" />

      <ThemeSwitcher class="absolute bottom-3 right-3" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
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
import { useLightingGlobal } from '@/composables/useLightingGlobal.js'
import TheCameraSettingsPanel from '@/components/TheCameraSettingsPanel.vue'
import { useCropDimensions } from '@/composables/useCropDimensions.js'
import { useCameraPosition } from '@/composables/useCameraPosition.js'
import { useCameraFOV } from '@/composables/useCameraFOV.js'
import { useCameraControls } from '@/composables/useCameraControls.js'
import TheRecordingAction from '@/components/TheRecordingAction.vue'
import TheCropSettingsPanel from '@/components/TheCropSettingsPanel.vue'
import { useTheme } from '@/composables/useTheme.js'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

globalSettings.container = useTemplateRef('container')

let rafId = 0
let videoTex

function makeVideoTexture(src) {
  // Crée la balise vidéo en mémoire (nécessaire pour autoplay mobile)
  const v = document.createElement('video')
  v.src = src
  v.muted = true // autoplay policy
  v.loop = true
  v.playsInline = true // iOS
  v.crossOrigin = 'anonymous'
  // IMPORTANT : on ne lance play() qu’après un geste utilisateur (voir below)
  const tex = new THREE.VideoTexture(v)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.encoding = THREE.sRGBEncoding // compat anciennes dts
  tex.generateMipmaps = false
  return { v, tex }
}

async function init() {
  if (!globalSettings.container.value) return

  // Rendu
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

  // Scène & caméra
  globalSettings.scene = new THREE.Scene()
  globalSettings.camera = new THREE.PerspectiveCamera(
    35,
    globalSettings.container.value.clientWidth / globalSettings.container.value.clientHeight,
    0.1,
    100,
  )
  globalSettings.camera.position.set(0.6, 0.5, 20)

  // Contrôles
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

  // Créer un dégradé pour le fond de scène
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const context = canvas.getContext('2d')

  // Créer le dégradé linéaire (du haut vers le bas)
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#87CEEB') // Bleu ciel en haut
  gradient.addColorStop(1, '#FFF8DC') // Crème en bas

  // Remplir le canvas avec le dégradé
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  // Créer une texture à partir du canvas
  const gradientTexture = new THREE.CanvasTexture(canvas)
  globalSettings.scene.background = gradientTexture

  // Configuration initiale des lumières
  initializeLights()

  // Vidéo texture
  const { v, tex } = makeVideoTexture('/video/demo.mp4')
  globalSettings.videoEl = v
  videoTex = tex

  // Modèle iPhone (GLB)
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

  const screen = phone.getObjectByName('Screen')

  if (screen) {
    const screenMat = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      emissive: 0xffffff,
      emissiveMap: videoTex,
      emissiveIntensity: 1.0,
      metalness: 0.0,
      roughness: 0.9,
      transmission: 0.0,
      clearcoat: 0.0,
    })
    screen.material = screenMat
  } else {
    const screenGeo = new THREE.PlaneGeometry(0.62, 1.34) // ratio ~ iPhone
    const screenMat = new THREE.MeshBasicMaterial({ map: videoTex, toneMapped: false })
    const screenPlane = new THREE.Mesh(screenGeo, screenMat)
    screenPlane.position.set(0, 0.1, 0.03) // colle au dessus
    phone.add(screenPlane)
  }

  // Échelle/position du téléphone
  phone.scale.set(0.9, 0.9, 0.9)
  globalSettings.scene.add(phone)

  // Pause/Resume suivant la visibilité
  document.addEventListener('visibilitychange', () => {
    if (!globalSettings.videoEl) return
    if (document.hidden) globalSettings.videoEl.pause()
    else globalSettings.videoEl.play().catch(() => {})
  })

  // Boucle de rendu
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
}

onMounted(init)

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

function toggleControls() {
  panelSettings.camera = !panelSettings.camera
}

const { init: initLightingAmbient } = useLightingAmbient()
const { init: initLightingDirectional } = useLightingDirectional()
const { init: initLightingPoint } = useLightingPoint()
const { init: initLightingSpot } = useLightingSpot()
const { init: initLightingGlobal } = useLightingGlobal()

useCropDimensions()
useCameraPosition()
useCameraFOV()
useCameraControls()
const { init: initTheme } = useTheme()

onMounted(initTheme)

function initializeLights() {
  if (!globalSettings.scene) return

  initLightingAmbient()
  initLightingDirectional()
  initLightingPoint()
  initLightingSpot()
  initLightingGlobal()
}
</script>
