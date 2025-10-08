import { reactive } from 'vue'

const backgroundSettings = reactive({
  backgroundImage: null,
  exposureCompensation: 1.0,
  backgroundBrightness: 0.5,
  color1: `hsl(194, 70%, ${Math.min(100, 72)}%)`,
  color2: `hsl(60, 77%, ${Math.min(100, 96)}%)`,
})

export { backgroundSettings }
