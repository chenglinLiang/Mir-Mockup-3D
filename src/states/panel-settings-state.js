import { reactive } from 'vue'

const panelSettings = reactive({
  lighting: false,
  camera: false,
  crop: false,
  background: false,
})

export { panelSettings }
