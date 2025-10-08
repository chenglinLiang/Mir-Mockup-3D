import { reactive } from 'vue'

const panelSettings = reactive({
  lighting: false,
  camera: false,
  crop: false,
  background: false,
  media: true,
})

export { panelSettings }
