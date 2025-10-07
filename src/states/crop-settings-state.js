import { reactive } from 'vue'

const cropSettings = reactive({
  enabled: false,
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
  aspectRatio: '16:9',
  customAspectRatio: true,
})

export { cropSettings }
