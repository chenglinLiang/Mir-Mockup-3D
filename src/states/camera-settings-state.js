import { reactive } from 'vue'

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

export { cameraSettings }
