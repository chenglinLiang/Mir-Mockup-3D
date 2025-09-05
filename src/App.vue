<script setup>
import { onMounted, onBeforeUnmount, ref, useTemplateRef, reactive } from 'vue'
import * as THREE from 'three'
import { GLTFLoader, OrbitControls } from 'three-stdlib'

const container = useTemplateRef('container')

let renderer
let scene
let camera
let controls
let rafId = 0
let videoEl
let videoTex

const cameraSettings = reactive({
  position: { x: 0.6, y: 0.5, z: 20 },
  target: { x: 0, y: 0.1, z: 0 },
  fov: 35,
  autoRotate: false,
  autoRotateSpeed: 2.0,
  enableZoom: true,
  enablePan: true,
  enableRotate: true,
  minDistance: 0.5,
  maxDistance: 30,
  minPolarAngle: 0,
  maxPolarAngle: Math.PI,
})

const presetPositions = [
  { name: 'Vue par défaut', position: { x: 0.6, y: 0.5, z: 20 }, target: { x: 0, y: 0.1, z: 0 } },
  { name: 'Vue de face', position: { x: 0, y: 0.1, z: 20 }, target: { x: 0, y: 0.1, z: 0 } },
  { name: 'Vue de côté', position: { x: 2, y: 0.1, z: 0 }, target: { x: 0, y: 0.1, z: 0 } },
  { name: 'Vue du dessus', position: { x: 0, y: 3, z: 0 }, target: { x: 0, y: 0, z: 0 } },
  { name: 'Vue en plongée', position: { x: -1, y: 1.5, z: 1.5 }, target: { x: 0, y: 0.1, z: 0 } },
]

const showControls = ref(true)
const showLightingControls = ref(false)
const isRecording = ref(false)
const recordingProgress = ref(0)
const showCropControls = ref(false)
const videoLaunched = ref(false)

// Paramètres de crop pour l'enregistrement
const cropSettings = reactive({
  enabled: false,
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
  aspectRatio: '16:9',
  customAspectRatio: true,
})

// Presets de dimensions communes
const dimensionPresets = [
  { name: '1920x1080 (16:9)', width: 1920, height: 1080, aspectRatio: '16:9' },
  { name: '1280x720 (16:9)', width: 1280, height: 720, aspectRatio: '16:9' },
  { name: '1080x1080 (1:1)', width: 1080, height: 1080, aspectRatio: '1:1' },
  { name: '1080x1350 (4:5)', width: 1080, height: 1350, aspectRatio: '4:5' },
  { name: '1080x1920 (9:16)', width: 1080, height: 1920, aspectRatio: '9:16' },
  { name: '854x480 (16:9)', width: 854, height: 480, aspectRatio: '16:9' },
  { name: 'Personnalisé', width: 1920, height: 1080, aspectRatio: 'custom' },
]

// Variables pour l'enregistrement vidéo
let mediaRecorder = null
let recordedChunks = []
let recordingStream = null
let recordingStartTime = 0
let recordingDuration = 0

// Paramètres d'éclairage
const lightingSettings = reactive({
  // Lumière ambiante
  ambientEnabled: true,
  ambientColor: '#ffffff',
  ambientIntensity: 0.25,

  // Lumière directionnelle
  directionalEnabled: true,
  directionalColor: '#ffffff',
  directionalIntensity: 5,
  directionalPosition: { x: -2.2, y: -0.1, z: -1.2 },

  // Lumière ponctuelle
  pointEnabled: false,
  pointColor: '#ffffff',
  pointIntensity: 1.0,
  pointPosition: { x: 1, y: 1, z: 1 },
  pointDistance: 10,

  // Lumière spot
  spotEnabled: false,
  spotColor: '#ffffff',
  spotIntensity: 1.0,
  spotPosition: { x: -1, y: 2, z: 1 },
  spotTarget: { x: 0, y: 0, z: 0 },
  spotAngle: 30,
  spotPenumbra: 0.1,
  spotDistance: 20,

  // Éclairage global
  exposureCompensation: 1.0,
  backgroundBrightness: 1.0,
})

// Variables pour stocker les références des lumières
let ambientLight
let directionalLight
let pointLight
let spotLight

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
  if (!container.value) return

  // Rendu
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.value.appendChild(renderer.domElement)

  // Scène & caméra
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(
    35,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    100,
  )
  camera.position.set(0.6, 0.5, 20)

  // Contrôles
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(cameraSettings.target.x, cameraSettings.target.y, cameraSettings.target.z)
  controls.autoRotate = cameraSettings.autoRotate
  controls.autoRotateSpeed = cameraSettings.autoRotateSpeed
  controls.enableZoom = cameraSettings.enableZoom
  controls.enablePan = cameraSettings.enablePan
  controls.enableRotate = cameraSettings.enableRotate
  controls.minDistance = cameraSettings.minDistance
  controls.maxDistance = cameraSettings.maxDistance
  controls.minPolarAngle = cameraSettings.minPolarAngle
  controls.maxPolarAngle = cameraSettings.maxPolarAngle

  // Env map (HDRI)
  // const pmrem = new THREE.PMREMGenerator(renderer)
  // const hdr = await new RGBELoader().loadAsync('/hdr/studio.hdr')
  // const envMap = pmrem.fromEquirectangular(hdr).texture
  // scene.environment = envMap
  // scene.background = new THREE.Color(0x0e0e10)
  // hdr.dispose()

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
  scene.background = gradientTexture

  // Configuration initiale des lumières
  initializeLights()

  // Sol supprimé pour éviter la barre noire

  // Vidéo texture
  const { v, tex } = makeVideoTexture('/video/demo.mp4')
  videoEl = v
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

  // 1) Option A — l’écran existe dans le modèle (mesh nommé "Screen")
  const screen = phone.getObjectByName('Screen')

  if (screen) {
    // Matériau de l’écran : noir + video en emissive pour un glow crédible
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
    // 2) Option B — pas de mesh écran : on crée un plan très fin ajusté devant
    // (à adapter selon ton modèle — positions/rotations approximatives)
    const screenGeo = new THREE.PlaneGeometry(0.62, 1.34) // ratio ~ iPhone
    const screenMat = new THREE.MeshBasicMaterial({ map: videoTex, toneMapped: false })
    const screenPlane = new THREE.Mesh(screenGeo, screenMat)
    screenPlane.position.set(0, 0.1, 0.03) // colle au dessus
    phone.add(screenPlane)
  }

  // Échelle/position du téléphone
  phone.scale.set(0.9, 0.9, 0.9)
  scene.add(phone)

  // Pause/Resume suivant la visibilité
  document.addEventListener('visibilitychange', () => {
    if (!videoEl) return
    if (document.hidden) videoEl.pause()
    else videoEl.play().catch(() => {})
  })

  // Boucle de rendu
  const tick = () => {
    controls.update()
    renderer.render(scene, camera)
    rafId = requestAnimationFrame(tick)
  }
  tick()

  // Resize
  const onResize = () => {
    if (!container.value) return
    const { clientWidth: w, clientHeight: h } = container.value
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', onResize)
}

onMounted(init)

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', () => {})
  if (videoEl) {
    videoEl.pause()
    videoEl.src = ''
    videoEl.load()
  }
  renderer?.dispose()
  // NB : pour un cleanup complet, dispose() les géos/mats si tu recrées la scène souvent
})

const onClick = async () => {
  if (!videoEl) return

  try {
    if (videoLaunched.value) {
      videoEl.pause()
      videoEl.currentTime = 0

      videoLaunched.value = false
    } else {
      await videoEl.play()
      videoLaunched.value = true
    }
  } catch {}
}

function updateCameraPosition() {
  if (!camera || !controls) return
  camera.position.set(
    cameraSettings.position.x,
    cameraSettings.position.y,
    cameraSettings.position.z,
  )
  controls.target.set(cameraSettings.target.x, cameraSettings.target.y, cameraSettings.target.z)
  controls.update()
}

function updateCameraFOV() {
  if (!camera) return
  camera.fov = cameraSettings.fov
  camera.updateProjectionMatrix()
}

function updateControlsSettings() {
  if (!controls) return
  controls.autoRotate = cameraSettings.autoRotate
  controls.autoRotateSpeed = cameraSettings.autoRotateSpeed
  controls.enableZoom = cameraSettings.enableZoom
  controls.enablePan = cameraSettings.enablePan
  controls.enableRotate = cameraSettings.enableRotate
  controls.minDistance = cameraSettings.minDistance
  controls.maxDistance = cameraSettings.maxDistance
  controls.minPolarAngle = cameraSettings.minPolarAngle
  controls.maxPolarAngle = cameraSettings.maxPolarAngle
}

function applyPreset(preset) {
  cameraSettings.position.x = preset.position.x
  cameraSettings.position.y = preset.position.y
  cameraSettings.position.z = preset.position.z
  cameraSettings.target.x = preset.target.x
  cameraSettings.target.y = preset.target.y
  cameraSettings.target.z = preset.target.z
  updateCameraPosition()
}

function resetCamera() {
  const defaultPreset = presetPositions[0]
  applyPreset(defaultPreset)
}

function toggleControls() {
  showControls.value = !showControls.value
}

function toggleLightingControls() {
  showLightingControls.value = !showLightingControls.value
}

// Fonction pour convertir couleur hex en couleur THREE
function hexToThreeColor(hex) {
  return new THREE.Color(hex)
}

// Initialisation des lumières
function initializeLights() {
  if (!scene) return

  // Lumière ambiante
  if (lightingSettings.ambientEnabled) {
    ambientLight = new THREE.AmbientLight(
      hexToThreeColor(lightingSettings.ambientColor),
      lightingSettings.ambientIntensity,
    )
    scene.add(ambientLight)
  }

  // Lumière directionnelle
  if (lightingSettings.directionalEnabled) {
    directionalLight = new THREE.DirectionalLight(
      hexToThreeColor(lightingSettings.directionalColor),
      lightingSettings.directionalIntensity,
    )
    directionalLight.position.set(
      lightingSettings.directionalPosition.x,
      lightingSettings.directionalPosition.y,
      lightingSettings.directionalPosition.z,
    )
    directionalLight.castShadow = false
    scene.add(directionalLight)
  }

  // Lumière ponctuelle
  if (lightingSettings.pointEnabled) {
    pointLight = new THREE.PointLight(
      hexToThreeColor(lightingSettings.pointColor),
      lightingSettings.pointIntensity,
      lightingSettings.pointDistance,
    )
    pointLight.position.set(
      lightingSettings.pointPosition.x,
      lightingSettings.pointPosition.y,
      lightingSettings.pointPosition.z,
    )
    scene.add(pointLight)
  }

  // Lumière spot
  if (lightingSettings.spotEnabled) {
    spotLight = new THREE.SpotLight(
      hexToThreeColor(lightingSettings.spotColor),
      lightingSettings.spotIntensity,
      lightingSettings.spotDistance,
      THREE.MathUtils.degToRad(lightingSettings.spotAngle),
      lightingSettings.spotPenumbra,
    )
    spotLight.position.set(
      lightingSettings.spotPosition.x,
      lightingSettings.spotPosition.y,
      lightingSettings.spotPosition.z,
    )
    spotLight.target.position.set(
      lightingSettings.spotTarget.x,
      lightingSettings.spotTarget.y,
      lightingSettings.spotTarget.z,
    )
    scene.add(spotLight)
    scene.add(spotLight.target)
  }

  updateGlobalLighting()
}

// Mise à jour de la lumière ambiante
function updateAmbientLight() {
  if (!scene) return

  if (lightingSettings.ambientEnabled) {
    if (!ambientLight) {
      ambientLight = new THREE.AmbientLight()
      scene.add(ambientLight)
    }
    ambientLight.color = hexToThreeColor(lightingSettings.ambientColor)
    ambientLight.intensity = lightingSettings.ambientIntensity
    ambientLight.visible = true
  } else if (ambientLight) {
    ambientLight.visible = false
  }
}

// Mise à jour de la lumière directionnelle
function updateDirectionalLight() {
  if (!scene) return

  if (lightingSettings.directionalEnabled) {
    if (!directionalLight) {
      directionalLight = new THREE.DirectionalLight()
      scene.add(directionalLight)
    }
    directionalLight.color = hexToThreeColor(lightingSettings.directionalColor)
    directionalLight.intensity = lightingSettings.directionalIntensity
    directionalLight.position.set(
      lightingSettings.directionalPosition.x,
      lightingSettings.directionalPosition.y,
      lightingSettings.directionalPosition.z,
    )
    directionalLight.visible = true
  } else if (directionalLight) {
    directionalLight.visible = false
  }
}

// Mise à jour de la lumière ponctuelle
function updatePointLight() {
  if (!scene) return

  if (lightingSettings.pointEnabled) {
    if (!pointLight) {
      pointLight = new THREE.PointLight()
      scene.add(pointLight)
    }
    pointLight.color = hexToThreeColor(lightingSettings.pointColor)
    pointLight.intensity = lightingSettings.pointIntensity
    pointLight.distance = lightingSettings.pointDistance
    pointLight.position.set(
      lightingSettings.pointPosition.x,
      lightingSettings.pointPosition.y,
      lightingSettings.pointPosition.z,
    )
    pointLight.visible = true
  } else if (pointLight) {
    pointLight.visible = false
  }
}

// Mise à jour de la lumière spot
function updateSpotLight() {
  if (!scene) return

  if (lightingSettings.spotEnabled) {
    if (!spotLight) {
      spotLight = new THREE.SpotLight()
      scene.add(spotLight)
      scene.add(spotLight.target)
    }
    spotLight.color = hexToThreeColor(lightingSettings.spotColor)
    spotLight.intensity = lightingSettings.spotIntensity
    spotLight.distance = lightingSettings.spotDistance
    spotLight.angle = THREE.MathUtils.degToRad(lightingSettings.spotAngle)
    spotLight.penumbra = lightingSettings.spotPenumbra
    spotLight.position.set(
      lightingSettings.spotPosition.x,
      lightingSettings.spotPosition.y,
      lightingSettings.spotPosition.z,
    )
    spotLight.target.position.set(
      lightingSettings.spotTarget.x,
      lightingSettings.spotTarget.y,
      lightingSettings.spotTarget.z,
    )
    spotLight.visible = true
  } else if (spotLight) {
    spotLight.visible = false
  }
}

// Mise à jour de l'éclairage global
function updateGlobalLighting() {
  if (!renderer || !scene) return

  renderer.toneMappingExposure = lightingSettings.exposureCompensation

  // Recréer le dégradé avec la luminosité ajustée
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const context = canvas.getContext('2d')

  // Créer le dégradé linéaire (du haut vers le bas)
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height)

  // Appliquer la luminosité aux couleurs du dégradé
  const brightness = lightingSettings.backgroundBrightness
  const topColor = `hsl(194, 70%, ${Math.min(100, 72 * brightness)}%)` // Bleu ciel ajusté
  const bottomColor = `hsl(60, 77%, ${Math.min(100, 96 * brightness)}%)` // Crème ajusté

  gradient.addColorStop(0, topColor)
  gradient.addColorStop(1, bottomColor)

  // Remplir le canvas avec le dégradé
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  // Créer une texture à partir du canvas
  const gradientTexture = new THREE.CanvasTexture(canvas)
  scene.background = gradientTexture
}

// Réinitialisation de l'éclairage
function resetLighting() {
  lightingSettings.ambientEnabled = true
  lightingSettings.ambientColor = '#ffffff'
  lightingSettings.ambientIntensity = 0.25

  lightingSettings.directionalEnabled = true
  lightingSettings.directionalColor = '#ffffff'
  lightingSettings.directionalIntensity = 1.2
  lightingSettings.directionalPosition.x = 2
  lightingSettings.directionalPosition.y = 3
  lightingSettings.directionalPosition.z = 1

  lightingSettings.pointEnabled = false
  lightingSettings.spotEnabled = false

  lightingSettings.exposureCompensation = 1.0
  lightingSettings.backgroundBrightness = 1.0

  updateAllLights()
}

// Mise à jour de toutes les lumières
function updateAllLights() {
  updateAmbientLight()
  updateDirectionalLight()
  updatePointLight()
  updateSpotLight()
  updateGlobalLighting()
}

// Fonctions d'enregistrement vidéo
async function getVideoDuration() {
  return new Promise((resolve) => {
    if (videoEl && !isNaN(videoEl.duration)) {
      resolve(videoEl.duration)
    } else if (videoEl) {
      videoEl.addEventListener(
        'loadedmetadata',
        () => {
          resolve(videoEl.duration)
        },
        { once: true },
      )
    } else {
      resolve(10) // durée par défaut si pas de vidéo
    }
  })
}

async function startRecording() {
  if (!renderer || !container.value || isRecording.value) return

  try {
    // Obtenir la durée de la vidéo source
    recordingDuration = await getVideoDuration()

    // Créer un stream selon les paramètres de crop
    let streamCanvas
    let streamContext

    if (cropSettings.enabled) {
      // Créer un canvas intermédiaire pour le crop
      streamCanvas = document.createElement('canvas')
      streamCanvas.width = cropSettings.width
      streamCanvas.height = cropSettings.height
      streamContext = streamCanvas.getContext('2d')

      // Créer le stream à partir du canvas cropé
      recordingStream = streamCanvas.captureStream(30)

      // Fonction pour mettre à jour le canvas cropé
      const updateCroppedCanvas = () => {
        if (!isRecording.value) return

        try {
          // Convertir les coordonnées du container vers les coordonnées du canvas
          const containerRect = container.value.getBoundingClientRect()
          const canvasWidth = renderer.domElement.width
          const canvasHeight = renderer.domElement.height

          // Calculer les facteurs d'échelle
          const scaleX = canvasWidth / containerRect.width
          const scaleY = canvasHeight / containerRect.height

          // Convertir les coordonnées et dimensions
          const sourceX = Math.max(
            0,
            Math.min(Math.round(cropSettings.x * scaleX), canvasWidth - 1),
          )
          const sourceY = Math.max(
            0,
            Math.min(Math.round(cropSettings.y * scaleY), canvasHeight - 1),
          )
          const sourceWidth = Math.max(
            1,
            Math.min(Math.round(cropSettings.width * scaleX), canvasWidth - sourceX),
          )
          const sourceHeight = Math.max(
            1,
            Math.min(Math.round(cropSettings.height * scaleY), canvasHeight - sourceY),
          )

          // Effacer le canvas avant de dessiner
          streamContext.clearRect(0, 0, streamCanvas.width, streamCanvas.height)

          // Copier la portion croppée du canvas WebGL vers le canvas de stream
          streamContext.drawImage(
            renderer.domElement,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight, // source
            0,
            0,
            cropSettings.width,
            cropSettings.height, // destination
          )
        } catch (error) {
          console.warn('Erreur lors du crop:', error)
        }

        requestAnimationFrame(updateCroppedCanvas)
      }

      // Démarrer la copie continue avec un délai pour s'assurer que le canvas est prêt
      setTimeout(() => {
        updateCroppedCanvas()
      }, 100)
    } else {
      // Enregistrement normal sans crop
      recordingStream = renderer.domElement.captureStream(30)
    }

    // Configurer MediaRecorder
    const options = {
      mimeType: 'video/webm; codecs=vp9',
      videoBitsPerSecond: 5000000, // 5 Mbps pour une bonne qualité
    }

    // Fallback pour différents navigateurs
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm; codecs=vp8'
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm'
      }
    }

    recordedChunks = []
    mediaRecorder = new MediaRecorder(recordingStream, options)

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)

      // Nom du fichier avec dimensions si crop activé
      const filename = cropSettings.enabled
        ? `mockup-3d-recording-${cropSettings.width}x${cropSettings.height}-${Date.now()}.webm`
        : `mockup-3d-recording-${Date.now()}.webm`

      // Créer un lien de téléchargement
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Nettoyer
      URL.revokeObjectURL(url)
      isRecording.value = false
      recordingProgress.value = 0
    }

    // Démarrer l'enregistrement
    isRecording.value = true
    recordingStartTime = performance.now()
    mediaRecorder.start(100) // Collecter les données toutes les 100ms

    // Redémarrer la vidéo source depuis le début pour synchroniser
    if (videoEl) {
      videoEl.currentTime = 0
      await videoEl.play()
    }

    // Arrêter automatiquement après la durée de la vidéo
    setTimeout(() => {
      stopRecording()
    }, recordingDuration * 1000)

    // Mettre à jour le progrès
    updateRecordingProgress()
  } catch (error) {
    console.error("Erreur lors du démarrage de l'enregistrement:", error)
    isRecording.value = false
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    if (recordingStream) {
      recordingStream.getTracks().forEach((track) => track.stop())
    }
  }
}

function updateRecordingProgress() {
  if (!isRecording.value) return

  const elapsed = (performance.now() - recordingStartTime) / 1000
  recordingProgress.value = Math.min((elapsed / recordingDuration) * 100, 100)

  if (elapsed < recordingDuration) {
    requestAnimationFrame(updateRecordingProgress)
  }
}

async function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

// Fonctions de crop
function toggleCropControls() {
  showCropControls.value = !showCropControls.value
}

function applyDimensionPreset(preset) {
  cropSettings.width = preset.width
  cropSettings.height = preset.height
  cropSettings.aspectRatio = preset.aspectRatio
  cropSettings.customAspectRatio = preset.aspectRatio === 'custom'

  // Centrer le crop dans le canvas actuel
  if (renderer && container.value) {
    const canvasWidth = container.value.clientWidth
    const canvasHeight = container.value.clientHeight
    cropSettings.x = Math.max(0, (canvasWidth - cropSettings.width) / 2)
    cropSettings.y = Math.max(0, (canvasHeight - cropSettings.height) / 2)
  }
}

function updateCropDimensions() {
  if (!cropSettings.customAspectRatio) {
    // Maintenir le ratio d'aspect
    const ratios = {
      '16:9': 16 / 9,
      '1:1': 1,
      '4:5': 4 / 5,
      '9:16': 9 / 16,
    }

    const ratio = ratios[cropSettings.aspectRatio]
    if (ratio) {
      cropSettings.height = Math.round(cropSettings.width / ratio)
    }
  }

  // S'assurer que le crop reste dans les limites du canvas
  if (renderer && container.value) {
    const canvasWidth = container.value.clientWidth
    const canvasHeight = container.value.clientHeight

    cropSettings.width = Math.min(cropSettings.width, canvasWidth)
    cropSettings.height = Math.min(cropSettings.height, canvasHeight)
    cropSettings.x = Math.min(cropSettings.x, canvasWidth - cropSettings.width)
    cropSettings.y = Math.min(cropSettings.y, canvasHeight - cropSettings.height)
  }
}
</script>

<template>
  <div style="width: 100vw; height: 100vh">
    <div ref="container" style="width: 100%; height: 100%; position: relative; overflow: hidden">
      <!-- Bouton "Play" overlay pour UX -->
      <button
        style="
          position: absolute;
          left: 1rem;
          bottom: 1rem;
          padding: 0.6rem 1rem;
          border-radius: 0.6rem;
          border: 0;
          background: #fff;
          cursor: pointer;
        "
        @click="onClick"
      >
        {{ videoLaunched ? '⬛ Stopper la vidéo' : '▶️ Lancer la vidéo' }}
      </button>

      <!-- Bouton d'enregistrement vidéo -->
      <button
        @click="toggleRecording"
        :disabled="!videoEl"
        style="
          position: absolute;
          left: 1rem;
          bottom: 4rem;
          padding: 0.6rem 1rem;
          border-radius: 0.6rem;
          border: 0;
          cursor: pointer;
          font-weight: 500;
        "
        :style="{
          background: isRecording ? '#ff4444' : '#4CAF50',
          color: 'white',
          opacity: !videoEl ? 0.5 : 1,
        }"
      >
        {{ isRecording ? '🔴 Arrêter' : '📹 Enregistrer' }}
      </button>

      <!-- Barre de progression d'enregistrement -->
      <div
        v-if="isRecording"
        style="
          position: absolute;
          left: 1rem;
          bottom: 7rem;
          width: 300px;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 0.5rem;
          padding: 0.8rem;
          color: white;
          font-size: 0.9rem;
        "
      >
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem">
          <span>🔴</span>
          <span>Enregistrement en cours...</span>
          <span style="margin-left: auto">{{ recordingProgress.toFixed(0) }}%</span>
        </div>
        <div
          style="
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
            overflow: hidden;
          "
        >
          <div
            style="
              height: 100%;
              background: #4caf50;
              border-radius: 2px;
              transition: width 0.1s ease;
            "
            :style="{ width: recordingProgress + '%' }"
          ></div>
        </div>
        <div style="margin-top: 0.5rem; font-size: 0.8rem; opacity: 0.8">
          {{ Math.ceil(recordingDuration * (1 - recordingProgress / 100)).toFixed(0) }}s restantes
        </div>
      </div>

      <!-- Bouton pour afficher/masquer les contrôles -->
      <button
        @click="toggleControls"
        style="
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          border: 0;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          cursor: pointer;
          font-size: 0.9rem;
        "
      >
        {{ showControls ? '✕ Masquer' : '⚙️ Contrôles' }}
      </button>

      <!-- Menu de contrôle de la caméra -->
      <div
        v-if="showControls"
        style="
          position: absolute;
          top: 4rem;
          right: 1rem;
          width: 300px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 0.8rem;
          padding: 1rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          font-family:
            system-ui,
            -apple-system,
            sans-serif;
          font-size: 0.85rem;
          max-height: calc(100vh - 6rem);
          overflow-y: auto;
        "
      >
        <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: #333">Contrôles Caméra</h3>

        <!-- Vues prédéfinies -->
        <div style="margin-bottom: 1rem">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #555">Vues prédéfinies</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem">
            <button
              v-for="preset in presetPositions"
              :key="preset.name"
              @click="applyPreset(preset)"
              style="
                padding: 0.4rem 0.6rem;
                border: 1px solid #ddd;
                border-radius: 0.4rem;
                background: white;
                cursor: pointer;
                font-size: 0.75rem;
                flex: 1;
                min-width: 80px;
              "
            >
              {{ preset.name }}
            </button>
          </div>
        </div>

        <!-- Position de la caméra -->
        <div style="margin-bottom: 1rem">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #555">Position</h4>
          <div
            style="
              display: grid;
              grid-template-columns: 20px 1fr 40px;
              gap: 0.5rem;
              align-items: center;
            "
          >
            <label style="font-weight: 500">X:</label>
            <input
              v-model.number="cameraSettings.position.x"
              @input="updateCameraPosition"
              type="range"
              min="0"
              max="100"
              step="0.1"
              style="width: 100%"
            />
            <span style="text-align: right; font-size: 0.75rem">{{
              cameraSettings.position.x.toFixed(1)
            }}</span>

            <label style="font-weight: 500">Y:</label>
            <input
              v-model.number="cameraSettings.position.y"
              @input="updateCameraPosition"
              type="range"
              min="0"
              max="100"
              step="0.1"
              style="width: 100%"
            />
            <span style="text-align: right; font-size: 0.75rem">{{
              cameraSettings.position.y.toFixed(1)
            }}</span>

            <label style="font-weight: 500">Z:</label>
            <input
              v-model.number="cameraSettings.position.z"
              @input="updateCameraPosition"
              type="range"
              min="5"
              max="30"
              step="0.1"
              style="width: 100%"
            />
            <span style="text-align: right; font-size: 0.75rem">{{
              cameraSettings.position.z.toFixed(1)
            }}</span>
          </div>
        </div>

        <!-- Cible de la caméra -->
        <div style="margin-bottom: 1rem">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #555">Cible</h4>
          <div
            style="
              display: grid;
              grid-template-columns: 20px 1fr 40px;
              gap: 0.5rem;
              align-items: center;
            "
          >
            <label style="font-weight: 500">X:</label>
            <input
              v-model.number="cameraSettings.target.x"
              @input="updateCameraPosition"
              type="range"
              min="-2"
              max="2"
              step="0.1"
              style="width: 100%"
            />
            <span style="text-align: right; font-size: 0.75rem">{{
              cameraSettings.target.x.toFixed(1)
            }}</span>

            <label style="font-weight: 500">Y:</label>
            <input
              v-model.number="cameraSettings.target.y"
              @input="updateCameraPosition"
              type="range"
              min="-2"
              max="2"
              step="0.1"
              style="width: 100%"
            />
            <span style="text-align: right; font-size: 0.75rem">{{
              cameraSettings.target.y.toFixed(1)
            }}</span>

            <label style="font-weight: 500">Z:</label>
            <input
              v-model.number="cameraSettings.target.z"
              @input="updateCameraPosition"
              type="range"
              min="-2"
              max="2"
              step="0.1"
              style="width: 100%"
            />
            <span style="text-align: right; font-size: 0.75rem">{{
              cameraSettings.target.z.toFixed(1)
            }}</span>
          </div>
        </div>

        <!-- FOV -->
        <div style="margin-bottom: 1rem">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #555">Champ de vision</h4>
          <div
            style="display: grid; grid-template-columns: 1fr 40px; gap: 0.5rem; align-items: center"
          >
            <input
              v-model.number="cameraSettings.fov"
              @input="updateCameraFOV"
              type="range"
              min="10"
              max="120"
              step="1"
              style="width: 100%"
            />
            <span style="text-align: right; font-size: 0.75rem">{{ cameraSettings.fov }}°</span>
          </div>
        </div>

        <!-- Rotation automatique -->
        <div style="margin-bottom: 1rem">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer">
            <input
              v-model="cameraSettings.autoRotate"
              @change="updateControlsSettings"
              type="checkbox"
            />
            <span style="font-weight: 500">Rotation automatique</span>
          </label>
          <div
            v-if="cameraSettings.autoRotate"
            style="
              margin-top: 0.5rem;
              display: grid;
              grid-template-columns: 1fr 40px;
              gap: 0.5rem;
              align-items: center;
            "
          >
            <input
              v-model.number="cameraSettings.autoRotateSpeed"
              @input="updateControlsSettings"
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              style="width: 100%"
            />
            <span style="text-align: right; font-size: 0.75rem">{{
              cameraSettings.autoRotateSpeed
            }}</span>
          </div>
        </div>

        <!-- Limites de distance -->
        <div style="margin-bottom: 1rem">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #555">Limites de zoom</h4>
          <div
            style="
              display: grid;
              grid-template-columns: 50px 1fr 40px;
              gap: 0.5rem;
              align-items: center;
            "
          >
            <label style="font-weight: 500">Min:</label>
            <input
              v-model.number="cameraSettings.minDistance"
              @input="updateControlsSettings"
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              style="width: 100%"
            />
            <span style="text-align: right; font-size: 0.75rem">{{
              cameraSettings.minDistance.toFixed(1)
            }}</span>

            <label style="font-weight: 500">Max:</label>
            <input
              v-model.number="cameraSettings.maxDistance"
              @input="updateControlsSettings"
              type="range"
              min="5"
              max="50"
              step="1"
              style="width: 100%"
            />
            <span style="text-align: right; font-size: 0.75rem">{{
              cameraSettings.maxDistance
            }}</span>
          </div>
        </div>

        <!-- Contrôles d'interaction -->
        <div style="margin-bottom: 1rem">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #555">Interactions</h4>
          <div style="display: flex; flex-direction: column; gap: 0.3rem">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer">
              <input
                v-model="cameraSettings.enableZoom"
                @change="updateControlsSettings"
                type="checkbox"
              />
              <span>Zoom</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer">
              <input
                v-model="cameraSettings.enablePan"
                @change="updateControlsSettings"
                type="checkbox"
              />
              <span>Panoramique</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer">
              <input
                v-model="cameraSettings.enableRotate"
                @change="updateControlsSettings"
                type="checkbox"
              />
              <span>Rotation</span>
            </label>
          </div>
        </div>

        <!-- Bouton Reset -->
        <button
          @click="resetCamera"
          style="
            width: 100%;
            padding: 0.6rem;
            border: 1px solid #ddd;
            border-radius: 0.5rem;
            background: #f8f9fa;
            cursor: pointer;
            font-weight: 500;
            margin-bottom: 0.5rem;
          "
        >
          🔄 Réinitialiser
        </button>

        <!-- Bouton pour afficher les contrôles d'éclairage -->
        <button
          @click="toggleLightingControls"
          style="
            width: 100%;
            padding: 0.6rem;
            border: 1px solid #ddd;
            border-radius: 0.5rem;
            background: #e3f2fd;
            cursor: pointer;
            font-weight: 500;
            margin-bottom: 0.5rem;
          "
        >
          {{ showLightingControls ? '💡 Masquer Éclairage' : '💡 Contrôles Éclairage' }}
        </button>

        <!-- Bouton pour afficher les contrôles de crop -->
        <button
          @click="toggleCropControls"
          style="
            width: 100%;
            padding: 0.6rem;
            border: 1px solid #ddd;
            border-radius: 0.5rem;
            background: #fff3e0;
            cursor: pointer;
            font-weight: 500;
          "
        >
          {{ showCropControls ? '✂️ Masquer Crop' : '✂️ Contrôles Crop' }}
        </button>

        <!-- Section Crop -->
        <div
          v-if="showCropControls"
          style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0"
        >
          <h4 style="margin: 0 0 0.8rem 0; font-size: 0.9rem; color: #555">
            ✂️ Crop d'enregistrement
          </h4>

          <!-- Activation du crop -->
          <label
            style="
              display: flex;
              align-items: center;
              gap: 0.5rem;
              cursor: pointer;
              margin-bottom: 1rem;
            "
          >
            <input v-model="cropSettings.enabled" type="checkbox" />
            <span style="font-weight: 500">Activer le crop</span>
          </label>

          <div v-if="cropSettings.enabled">
            <!-- Presets de dimensions -->
            <div style="margin-bottom: 1rem">
              <h5 style="margin: 0 0 0.5rem 0; font-size: 0.8rem; color: #666">Presets</h5>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem">
                <button
                  v-for="preset in dimensionPresets.slice(0, 6)"
                  :key="preset.name"
                  @click="applyDimensionPreset(preset)"
                  style="
                    padding: 0.3rem 0.4rem;
                    border: 1px solid #ddd;
                    border-radius: 0.3rem;
                    background: white;
                    cursor: pointer;
                    font-size: 0.7rem;
                  "
                >
                  {{ preset.name }}
                </button>
              </div>
            </div>

            <!-- Dimensions personnalisées -->
            <div style="margin-bottom: 1rem">
              <h5 style="margin: 0 0 0.5rem 0; font-size: 0.8rem; color: #666">Dimensions</h5>
              <div
                style="
                  display: grid;
                  grid-template-columns: 60px 1fr;
                  gap: 0.5rem;
                  align-items: center;
                  margin-bottom: 0.3rem;
                "
              >
                <label style="font-size: 0.8rem">Largeur:</label>
                <input
                  v-model.number="cropSettings.width"
                  @input="updateCropDimensions"
                  type="number"
                  min="100"
                  max="4000"
                  step="10"
                  style="
                    padding: 0.3rem;
                    border: 1px solid #ddd;
                    border-radius: 0.3rem;
                    font-size: 0.8rem;
                  "
                />
              </div>
              <div
                style="
                  display: grid;
                  grid-template-columns: 60px 1fr;
                  gap: 0.5rem;
                  align-items: center;
                "
              >
                <label style="font-size: 0.8rem">Hauteur:</label>
                <input
                  v-model.number="cropSettings.height"
                  @input="updateCropDimensions"
                  type="number"
                  min="100"
                  max="4000"
                  step="10"
                  :disabled="!cropSettings.customAspectRatio"
                  style="
                    padding: 0.3rem;
                    border: 1px solid #ddd;
                    border-radius: 0.3rem;
                    font-size: 0.8rem;
                  "
                />
              </div>

              <!-- Option ratio personnalisé -->
              <label
                style="
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  cursor: pointer;
                  margin-top: 0.5rem;
                "
              >
                <input v-model="cropSettings.customAspectRatio" type="checkbox" />
                <span style="font-size: 0.8rem">Ratio personnalisé</span>
              </label>
            </div>

            <!-- Position du crop -->
            <div style="margin-bottom: 1rem">
              <h5 style="margin: 0 0 0.5rem 0; font-size: 0.8rem; color: #666">Position</h5>
              <div
                style="
                  display: grid;
                  grid-template-columns: 30px 1fr 40px;
                  gap: 0.3rem;
                  align-items: center;
                  font-size: 0.8rem;
                "
              >
                <label>X:</label>
                <input
                  v-model.number="cropSettings.x"
                  type="range"
                  min="0"
                  :max="container ? container.clientWidth - cropSettings.width : 1920"
                  step="10"
                  style="width: 100%"
                />
                <span style="text-align: right; font-size: 0.7rem">{{ cropSettings.x }}</span>

                <label>Y:</label>
                <input
                  v-model.number="cropSettings.y"
                  type="range"
                  min="0"
                  :max="container ? container.clientHeight - cropSettings.height : 1080"
                  step="10"
                  style="width: 100%"
                />
                <span style="text-align: right; font-size: 0.7rem">{{ cropSettings.y }}</span>
              </div>
            </div>

            <!-- Informations -->
            <div
              style="
                padding: 0.5rem;
                background: #f8f9fa;
                border-radius: 0.4rem;
                font-size: 0.7rem;
                color: #666;
              "
            >
              📐 {{ cropSettings.width }}x{{ cropSettings.height }}px<br />
              📍 Position: ({{ cropSettings.x }}, {{ cropSettings.y }})<br />
              🎬 Fichier: mockup-3d-recording-{{ cropSettings.width }}x{{
                cropSettings.height
              }}-[timestamp].webm
            </div>
          </div>
        </div>
      </div>

      <!-- Overlay pour aperçu de la zone de crop -->
      <div
        v-if="cropSettings.enabled && showCropControls"
        :style="{
          position: 'absolute',
          left: cropSettings.x + 'px',
          top: cropSettings.y + 'px',
          width: cropSettings.width + 'px',
          height: cropSettings.height + 'px',
          border: '2px solid #ff6b35',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none',
          zIndex: 10,
        }"
      >
        <div
          style="
            position: absolute;
            top: -25px;
            left: 0;
            background: #ff6b35;
            color: white;
            padding: 0.2rem 0.5rem;
            border-radius: 0.3rem;
            font-size: 0.7rem;
            font-weight: bold;
            white-space: nowrap;
          "
        >
          Zone d'enregistrement {{ cropSettings.width }}×{{ cropSettings.height }}
        </div>
      </div>

      <!-- Menu de contrôle de l'éclairage -->
      <div
        v-if="showControls && showLightingControls"
        style="
          position: absolute;
          top: 4rem;
          left: 1rem;
          width: 320px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 0.8rem;
          padding: 1rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          font-family:
            system-ui,
            -apple-system,
            sans-serif;
          font-size: 0.85rem;
          max-height: calc(100vh - 6rem);
          overflow-y: auto;
        "
      >
        <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: #333">💡 Contrôles Éclairage</h3>

        <!-- Lumière ambiante -->
        <div
          style="
            margin-bottom: 1rem;
            padding: 0.8rem;
            border: 1px solid #e0e0e0;
            border-radius: 0.5rem;
          "
        >
          <label
            style="
              display: flex;
              align-items: center;
              gap: 0.5rem;
              cursor: pointer;
              margin-bottom: 0.5rem;
            "
          >
            <input
              v-model="lightingSettings.ambientEnabled"
              @change="updateAmbientLight"
              type="checkbox"
            />
            <span style="font-weight: 500">🌅 Lumière ambiante</span>
          </label>
          <div v-if="lightingSettings.ambientEnabled">
            <div
              style="
                display: grid;
                grid-template-columns: 50px 1fr 50px;
                gap: 0.5rem;
                align-items: center;
                margin-bottom: 0.5rem;
              "
            >
              <label style="font-size: 0.8rem">Couleur:</label>
              <input
                v-model="lightingSettings.ambientColor"
                @input="updateAmbientLight"
                type="color"
                style="width: 100%; height: 30px; border-radius: 0.3rem; border: 1px solid #ddd"
              />
              <span></span>
            </div>
            <div
              style="
                display: grid;
                grid-template-columns: 50px 1fr 40px;
                gap: 0.5rem;
                align-items: center;
              "
            >
              <label style="font-size: 0.8rem">Force:</label>
              <input
                v-model.number="lightingSettings.ambientIntensity"
                @input="updateAmbientLight"
                type="range"
                min="0"
                max="2"
                step="0.05"
                style="width: 100%"
              />
              <span style="text-align: right; font-size: 0.75rem">{{
                lightingSettings.ambientIntensity.toFixed(2)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Lumière directionnelle -->
        <div
          style="
            margin-bottom: 1rem;
            padding: 0.8rem;
            border: 1px solid #e0e0e0;
            border-radius: 0.5rem;
          "
        >
          <label
            style="
              display: flex;
              align-items: center;
              gap: 0.5rem;
              cursor: pointer;
              margin-bottom: 0.5rem;
            "
          >
            <input
              v-model="lightingSettings.directionalEnabled"
              @change="updateDirectionalLight"
              type="checkbox"
            />
            <span style="font-weight: 500">☀️ Lumière directionnelle</span>
          </label>
          <div v-if="lightingSettings.directionalEnabled">
            <div
              style="
                display: grid;
                grid-template-columns: 50px 1fr 50px;
                gap: 0.5rem;
                align-items: center;
                margin-bottom: 0.5rem;
              "
            >
              <label style="font-size: 0.8rem">Couleur:</label>
              <input
                v-model="lightingSettings.directionalColor"
                @input="updateDirectionalLight"
                type="color"
                style="width: 100%; height: 30px; border-radius: 0.3rem; border: 1px solid #ddd"
              />
              <span></span>
            </div>
            <div
              style="
                display: grid;
                grid-template-columns: 50px 1fr 40px;
                gap: 0.5rem;
                align-items: center;
                margin-bottom: 0.5rem;
              "
            >
              <label style="font-size: 0.8rem">Force:</label>
              <input
                v-model.number="lightingSettings.directionalIntensity"
                @input="updateDirectionalLight"
                type="range"
                min="0"
                max="5"
                step="0.1"
                style="width: 100%"
              />
              <span style="text-align: right; font-size: 0.75rem">{{
                lightingSettings.directionalIntensity.toFixed(1)
              }}</span>
            </div>
            <h5 style="margin: 0.5rem 0 0.3rem 0; font-size: 0.8rem; color: #666">Position:</h5>
            <div
              style="
                display: grid;
                grid-template-columns: 20px 1fr 40px;
                gap: 0.3rem;
                align-items: center;
                font-size: 0.8rem;
              "
            >
              <label>X:</label>
              <input
                v-model.number="lightingSettings.directionalPosition.x"
                @input="updateDirectionalLight"
                type="range"
                min="-5"
                max="5"
                step="0.1"
                style="width: 100%"
              />
              <span style="text-align: right; font-size: 0.7rem">{{
                lightingSettings.directionalPosition.x.toFixed(1)
              }}</span>

              <label>Y:</label>
              <input
                v-model.number="lightingSettings.directionalPosition.y"
                @input="updateDirectionalLight"
                type="range"
                min="-5"
                max="5"
                step="0.1"
                style="width: 100%"
              />
              <span style="text-align: right; font-size: 0.7rem">{{
                lightingSettings.directionalPosition.y.toFixed(1)
              }}</span>

              <label>Z:</label>
              <input
                v-model.number="lightingSettings.directionalPosition.z"
                @input="updateDirectionalLight"
                type="range"
                min="-5"
                max="5"
                step="0.1"
                style="width: 100%"
              />
              <span style="text-align: right; font-size: 0.7rem">{{
                lightingSettings.directionalPosition.z.toFixed(1)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Lumière ponctuelle -->
        <div
          style="
            margin-bottom: 1rem;
            padding: 0.8rem;
            border: 1px solid #e0e0e0;
            border-radius: 0.5rem;
          "
        >
          <label
            style="
              display: flex;
              align-items: center;
              gap: 0.5rem;
              cursor: pointer;
              margin-bottom: 0.5rem;
            "
          >
            <input
              v-model="lightingSettings.pointEnabled"
              @change="updatePointLight"
              type="checkbox"
            />
            <span style="font-weight: 500">💡 Lumière ponctuelle</span>
          </label>
          <div v-if="lightingSettings.pointEnabled">
            <div
              style="
                display: grid;
                grid-template-columns: 50px 1fr 50px;
                gap: 0.5rem;
                align-items: center;
                margin-bottom: 0.5rem;
              "
            >
              <label style="font-size: 0.8rem">Couleur:</label>
              <input
                v-model="lightingSettings.pointColor"
                @input="updatePointLight"
                type="color"
                style="width: 100%; height: 30px; border-radius: 0.3rem; border: 1px solid #ddd"
              />
              <span></span>
            </div>
            <div
              style="
                display: grid;
                grid-template-columns: 50px 1fr 40px;
                gap: 0.5rem;
                align-items: center;
                margin-bottom: 0.5rem;
              "
            >
              <label style="font-size: 0.8rem">Force:</label>
              <input
                v-model.number="lightingSettings.pointIntensity"
                @input="updatePointLight"
                type="range"
                min="0"
                max="10"
                step="0.1"
                style="width: 100%"
              />
              <span style="text-align: right; font-size: 0.75rem">{{
                lightingSettings.pointIntensity.toFixed(1)
              }}</span>
            </div>
            <div
              style="
                display: grid;
                grid-template-columns: 65px 1fr 40px;
                gap: 0.5rem;
                align-items: center;
                margin-bottom: 0.5rem;
              "
            >
              <label style="font-size: 0.8rem">Distance:</label>
              <input
                v-model.number="lightingSettings.pointDistance"
                @input="updatePointLight"
                type="range"
                min="1"
                max="50"
                step="1"
                style="width: 100%"
              />
              <span style="text-align: right; font-size: 0.75rem">{{
                lightingSettings.pointDistance
              }}</span>
            </div>
            <h5 style="margin: 0.5rem 0 0.3rem 0; font-size: 0.8rem; color: #666">Position:</h5>
            <div
              style="
                display: grid;
                grid-template-columns: 20px 1fr 40px;
                gap: 0.3rem;
                align-items: center;
                font-size: 0.8rem;
              "
            >
              <label>X:</label>
              <input
                v-model.number="lightingSettings.pointPosition.x"
                @input="updatePointLight"
                type="range"
                min="-5"
                max="5"
                step="0.1"
                style="width: 100%"
              />
              <span style="text-align: right; font-size: 0.7rem">{{
                lightingSettings.pointPosition.x.toFixed(1)
              }}</span>

              <label>Y:</label>
              <input
                v-model.number="lightingSettings.pointPosition.y"
                @input="updatePointLight"
                type="range"
                min="-5"
                max="5"
                step="0.1"
                style="width: 100%"
              />
              <span style="text-align: right; font-size: 0.7rem">{{
                lightingSettings.pointPosition.y.toFixed(1)
              }}</span>

              <label>Z:</label>
              <input
                v-model.number="lightingSettings.pointPosition.z"
                @input="updatePointLight"
                type="range"
                min="-5"
                max="5"
                step="0.1"
                style="width: 100%"
              />
              <span style="text-align: right; font-size: 0.7rem">{{
                lightingSettings.pointPosition.z.toFixed(1)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Lumière spot -->
        <div
          style="
            margin-bottom: 1rem;
            padding: 0.8rem;
            border: 1px solid #e0e0e0;
            border-radius: 0.5rem;
          "
        >
          <label
            style="
              display: flex;
              align-items: center;
              gap: 0.5rem;
              cursor: pointer;
              margin-bottom: 0.5rem;
            "
          >
            <input
              v-model="lightingSettings.spotEnabled"
              @change="updateSpotLight"
              type="checkbox"
            />
            <span style="font-weight: 500">🔦 Lumière spot</span>
          </label>
          <div v-if="lightingSettings.spotEnabled">
            <div
              style="
                display: grid;
                grid-template-columns: 50px 1fr 50px;
                gap: 0.5rem;
                align-items: center;
                margin-bottom: 0.5rem;
              "
            >
              <label style="font-size: 0.8rem">Couleur:</label>
              <input
                v-model="lightingSettings.spotColor"
                @input="updateSpotLight"
                type="color"
                style="width: 100%; height: 30px; border-radius: 0.3rem; border: 1px solid #ddd"
              />
              <span></span>
            </div>
            <div
              style="
                display: grid;
                grid-template-columns: 50px 1fr 40px;
                gap: 0.5rem;
                align-items: center;
                margin-bottom: 0.5rem;
              "
            >
              <label style="font-size: 0.8rem">Force:</label>
              <input
                v-model.number="lightingSettings.spotIntensity"
                @input="updateSpotLight"
                type="range"
                min="0"
                max="10"
                step="0.1"
                style="width: 100%"
              />
              <span style="text-align: right; font-size: 0.75rem">{{
                lightingSettings.spotIntensity.toFixed(1)
              }}</span>
            </div>
            <div
              style="
                display: grid;
                grid-template-columns: 50px 1fr 40px;
                gap: 0.5rem;
                align-items: center;
                margin-bottom: 0.5rem;
              "
            >
              <label style="font-size: 0.8rem">Angle:</label>
              <input
                v-model.number="lightingSettings.spotAngle"
                @input="updateSpotLight"
                type="range"
                min="5"
                max="90"
                step="1"
                style="width: 100%"
              />
              <span style="text-align: right; font-size: 0.75rem"
                >{{ lightingSettings.spotAngle }}°</span
              >
            </div>
            <div
              style="
                display: grid;
                grid-template-columns: 65px 1fr 40px;
                gap: 0.5rem;
                align-items: center;
                margin-bottom: 0.5rem;
              "
            >
              <label style="font-size: 0.8rem">Flou:</label>
              <input
                v-model.number="lightingSettings.spotPenumbra"
                @input="updateSpotLight"
                type="range"
                min="0"
                max="1"
                step="0.05"
                style="width: 100%"
              />
              <span style="text-align: right; font-size: 0.75rem">{{
                lightingSettings.spotPenumbra.toFixed(2)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Éclairage global -->
        <div
          style="
            margin-bottom: 1rem;
            padding: 0.8rem;
            border: 1px solid #e0e0e0;
            border-radius: 0.5rem;
          "
        >
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #333; font-weight: 500">
            🌍 Éclairage global
          </h4>
          <div
            style="
              display: grid;
              grid-template-columns: 80px 1fr 40px;
              gap: 0.5rem;
              align-items: center;
              margin-bottom: 0.5rem;
            "
          >
            <label style="font-size: 0.8rem">Exposition:</label>
            <input
              v-model.number="lightingSettings.exposureCompensation"
              @input="updateGlobalLighting"
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              style="width: 100%"
            />
            <span style="text-align: right; font-size: 0.75rem">{{
              lightingSettings.exposureCompensation.toFixed(1)
            }}</span>
          </div>
          <div
            style="
              display: grid;
              grid-template-columns: 80px 1fr 40px;
              gap: 0.5rem;
              align-items: center;
            "
          >
            <label style="font-size: 0.8rem">Fond:</label>
            <input
              v-model.number="lightingSettings.backgroundBrightness"
              @input="updateGlobalLighting"
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              style="width: 100%"
            />
            <span style="text-align: right; font-size: 0.75rem">{{
              lightingSettings.backgroundBrightness.toFixed(1)
            }}</span>
          </div>
        </div>

        <!-- Bouton Reset éclairage -->
        <button
          @click="resetLighting"
          style="
            width: 100%;
            padding: 0.6rem;
            border: 1px solid #ddd;
            border-radius: 0.5rem;
            background: #fff3e0;
            cursor: pointer;
            font-weight: 500;
          "
        >
          🔄 Réinitialiser Éclairage
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Plein écran de démo si tu montes le composant seul */
:host,
.wrap {
  width: 100%;
  height: 100%;
}

/* Supprime les marges et bordures par défaut */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* S'assure que le conteneur principal occupe tout l'écran */
div {
  border: none !important;
  outline: none !important;
}

/* Cache les barres de défilement potentielles */
::-webkit-scrollbar {
  display: none;
}

/* Styles pour Firefox */
* {
  scrollbar-width: none;
}
</style>
