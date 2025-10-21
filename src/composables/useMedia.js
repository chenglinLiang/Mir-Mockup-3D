import { watch } from 'vue'

import { mediaSettings } from '@/states/media-settings-state'
import { globalSettings } from '@/states/global-settings-state.js'
import * as THREE from 'three'

export const useMedia = () => {
  let videoTex

  watch(
    () => mediaSettings.video,
    () => {
      updateVideoSource()
    },
  )

  const init = () => {
    updateVideoSource()
  }

  const updateVideoSource = () => {
    // Cleanup old video
    if (globalSettings.videoEl) {
      globalSettings.videoEl.pause()
      globalSettings.videoEl.src = ''
      globalSettings.videoEl.load()
    }
    // Remove old texture
    if (videoTex) {
      videoTex.dispose()
      videoTex = null
    }

    const { v, tex } = makeVideoTexture(mediaSettings.video || '/video/demo.mp4')
    globalSettings.videoEl = v
    videoTex = tex

    const screen = globalSettings.phone.getObjectByName('Screen')

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
      screenPlane.position.set(0, 0.1, 0.03) // stick on top
      globalSettings.phone.add(screenPlane)
    }
  }

  function makeVideoTexture(src) {
    // Create video element in memory (required for mobile autoplay)
    const v = document.createElement('video')
    v.src = src
    v.muted = true // autoplay policy
    v.loop = true
    v.playsInline = true // iOS
    v.crossOrigin = 'anonymous'
    // IMPORTANT: only call play() after user gesture (see below)
    const tex = new THREE.VideoTexture(v)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.encoding = THREE.sRGBEncoding // compat old dts
    tex.generateMipmaps = false
    return { v, tex }
  }

  return { init }
}
