<template>
  <div class="relative flex flex-col gap-2">
    <button class="btn" @click="onClick">
      {{ videoLaunched ? t('recording.stopVideo') : t('recording.playVideo') }}
    </button>

    <button @click="toggleRecording" class="btn btn-secondary">
      {{ isRecording ? t('recording.stop') : t('recording.record') }}
    </button>

    <div
      v-if="isRecording"
      class="absolute left-4 bottom-28 w-[300px] bg-black/80 rounded-lg p-3 text-white text-sm"
    >
      <div class="flex items-center gap-2 mb-2">
        <span>🔴</span>
        <span>{{ t('recording.inProgress') }}</span>
        <span style="margin-left: auto">{{ recordingProgress.toFixed(0) }}%</span>
      </div>
      <div class="w-full h-1 bg-white/30 rounded overflow-hidden">
        <div
          class="h-full bg-green-500 rounded transition-all duration-100 ease-linear"
          :style="{ width: recordingProgress + '%' }"
        ></div>
      </div>
      <div class="mt-2 text-xs opacity-80">
        {{ t('recording.remaining', { seconds: Math.ceil(recordingDuration * (1 - recordingProgress / 100)).toFixed(0) }) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { globalSettings } from '@/states/global-settings-state.js'
import { cropSettings } from '@/states/crop-settings-state.js'

const { t } = useI18n()

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
      resolve(10) // default duration if no video
    }
  })
}

async function startRecording() {
  if (!globalSettings.renderer || !globalSettings.container.value || isRecording.value) return

  try {
    // Get source video duration
    recordingDuration = await getVideoDuration()

    // Create stream based on crop settings
    let streamCanvas
    let streamContext

    if (cropSettings.enabled) {
      // Create intermediate canvas for crop
      streamCanvas = document.createElement('canvas')
      streamCanvas.width = cropSettings.width
      streamCanvas.height = cropSettings.height
      streamContext = streamCanvas.getContext('2d')

      // Create stream from cropped canvas
      recordingStream = streamCanvas.captureStream(30)

      // Function to update cropped canvas
      const updateCroppedCanvas = () => {
        if (!isRecording.value) return

        try {
          // Convert container coordinates to canvas coordinates
          const containerRect = globalSettings.container.value.getBoundingClientRect()
          const canvasWidth = globalSettings.renderer.domElement.width
          const canvasHeight = globalSettings.renderer.domElement.height

          // Calculate scale factors
          const scaleX = canvasWidth / containerRect.width
          const scaleY = canvasHeight / containerRect.height

          // Convert coordinates and dimensions
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

          // Clear canvas before drawing
          streamContext.clearRect(0, 0, streamCanvas.width, streamCanvas.height)

          // Copy cropped portion from WebGL canvas to stream canvas
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
          console.warn('Error during crop:', error)
        }

        requestAnimationFrame(updateCroppedCanvas)
      }

      // Start continuous copy with delay to ensure canvas is ready
      setTimeout(() => {
        updateCroppedCanvas()
      }, 100)
    } else {
      // Normal recording without crop
      recordingStream = globalSettings.renderer.domElement.captureStream(30)
    }

    // Configure MediaRecorder
    const options = {
      mimeType: 'video/webm; codecs=vp9',
      videoBitsPerSecond: 5000000, // 5 Mbps for good quality
    }

    // Fallback for different browsers
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

      // Filename with dimensions if crop enabled
      const filename = cropSettings.enabled
        ? `mockup-3d-recording-${cropSettings.width}x${cropSettings.height}-${Date.now()}.webm`
        : `mockup-3d-recording-${Date.now()}.webm`

      // Create download link
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Cleanup
      URL.revokeObjectURL(url)
      isRecording.value = false
      recordingProgress.value = 0
    }

    // Start recording
    isRecording.value = true
    recordingStartTime = performance.now()
    mediaRecorder.start(100) // Collect data every 100ms

    // Restart source video from beginning to synchronize
    if (globalSettings.videoEl) {
      globalSettings.videoEl.currentTime = 0
      await globalSettings.videoEl.play()
    }

    // Automatically stop after video duration
    setTimeout(() => {
      stopRecording()
    }, recordingDuration * 1000)

    // Update progress
    updateRecordingProgress()
  } catch (error) {
    console.error("Error starting recording:", error)
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
