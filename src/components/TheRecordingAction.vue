<template>
  <div class="relative flex flex-col gap-2">
    <button class="btn" @click="onClick">
      {{ videoLaunched ? '⬛ Stopper la vidéo' : '▶️ Lancer la vidéo' }}
    </button>

    <button @click="toggleRecording" class="btn btn-secondary">
      {{ isRecording ? '🔴 Arrêter' : '📹 Enregistrer' }}
    </button>

    <div
      v-if="isRecording"
      class="absolute left-4 bottom-28 w-[300px] bg-black/80 rounded-lg p-3 text-white text-sm"
    >
      <div class="flex items-center gap-2 mb-2">
        <span>🔴</span>
        <span>Enregistrement en cours...</span>
        <span style="margin-left: auto">{{ recordingProgress.toFixed(0) }}%</span>
      </div>
      <div class="w-full h-1 bg-white/30 rounded overflow-hidden">
        <div
          class="h-full bg-green-500 rounded transition-all duration-100 ease-linear"
          :style="{ width: recordingProgress + '%' }"
        ></div>
      </div>
      <div class="mt-2 text-xs opacity-80">
        {{ Math.ceil(recordingDuration * (1 - recordingProgress / 100)).toFixed(0) }}s restantes
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { globalSettings } from '@/states/global-settings-state.js'
import { cropSettings } from '@/states/crop-settings-state.js'

const videoLaunched = ref(false)
const isRecording = ref(false)
const recordingProgress = ref(0)

let mediaRecorder = null
let recordedChunks = []
let recordingStream = null
let recordingStartTime = 0
let recordingDuration = 0

const onClick = async () => {
  if (!globalSettings.videoEl) return

  try {
    if (videoLaunched.value) {
      globalSettings.videoEl.pause()
      globalSettings.videoEl.currentTime = 0

      videoLaunched.value = false
    } else {
      await globalSettings.videoEl.play()
      videoLaunched.value = true
    }
  } catch {
    /* empty */
  }
}

async function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    if (recordingStream) {
      recordingStream.getTracks().forEach((track) => track.stop())
    }

    // Reset video
    if (globalSettings.videoEl) {
      globalSettings.videoEl.pause()
      globalSettings.videoEl.currentTime = 0
      videoLaunched.value = false
    }
  }
}

async function getVideoDuration() {
  return new Promise((resolve) => {
    if (globalSettings.videoEl && !isNaN(globalSettings.videoEl.duration)) {
      resolve(globalSettings.videoEl.duration)
    } else if (globalSettings.videoEl) {
      globalSettings.videoEl.addEventListener(
        'loadedmetadata',
        () => {
          resolve(globalSettings.videoEl.duration)
        },
        { once: true },
      )
    } else {
      resolve(10) // durée par défaut si pas de vidéo
    }
  })
}

async function startRecording() {
  if (!globalSettings.renderer || !globalSettings.container.value || isRecording.value) return

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
          const containerRect = globalSettings.container.value.getBoundingClientRect()
          const canvasWidth = globalSettings.renderer.domElement.width
          const canvasHeight = globalSettings.renderer.domElement.height

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
            globalSettings.renderer.domElement,
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
      recordingStream = globalSettings.renderer.domElement.captureStream(30)
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
    if (globalSettings.videoEl) {
      globalSettings.videoEl.currentTime = 0
      await globalSettings.videoEl.play()
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

function updateRecordingProgress() {
  if (!isRecording.value) return

  const elapsed = (performance.now() - recordingStartTime) / 1000
  recordingProgress.value = Math.min((elapsed / recordingDuration) * 100, 100)

  if (elapsed < recordingDuration) {
    requestAnimationFrame(updateRecordingProgress)
  }
}
</script>
