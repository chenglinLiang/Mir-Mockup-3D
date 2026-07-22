// Inspect GLB scene structure: mesh names, hierarchy, bounding boxes.
// Usage: node scripts/inspect-glb.mjs path/to/file.glb
import { readFileSync } from 'node:fs'
import { argv } from 'node:process'
import * as THREE from 'three'
import { GLTFLoader } from 'three-stdlib'

const file = argv[2]
if (!file) {
  console.error('Usage: node scripts/inspect-glb.mjs <path-to-glb>')
  process.exit(1)
}

const buf = readFileSync(file)
const data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)

// Patch some browser-only globals that three uses during parse
globalThis.self = globalThis
globalThis.window = { URL: { createObjectURL: () => 'blob:mock' } }
globalThis.document = {
  createElement: () => ({ style: {}, getContext: () => null }),
}

const loader = new GLTFLoader()
loader.parse(data, '', (gltf) => {
  const scene = gltf.scene
  console.log('=== Scene root:', scene.type, 'name:', scene.name || '(unnamed)')
  console.log('=== Hierarchy (depth, type, name, [position], [scale]):')
  scene.traverse((obj) => {
    const depth = objDepth(scene, obj)
    const indent = '  '.repeat(depth)
    const pos = obj.position ? `[${obj.position.x.toFixed(3)}, ${obj.position.y.toFixed(3)}, ${obj.position.z.toFixed(3)}]` : ''
    const scl = obj.scale ? `s=[${obj.scale.x.toFixed(3)}, ${obj.scale.y.toFixed(3)}, ${obj.scale.z.toFixed(3)}]` : ''
    const rot = obj.rotation && (obj.rotation.x || obj.rotation.y || obj.rotation.z)
      ? `r=[${obj.rotation.x.toFixed(2)},${obj.rotation.y.toFixed(2)},${obj.rotation.z.toFixed(2)}]` : ''
    let extra = ''
    if (obj.isMesh) {
      const geo = obj.geometry
      const attrs = geo && geo.attributes
      const vc = attrs && attrs.position ? attrs.position.count : '?'
      extra = ` | Mesh verts=${vc}`
      // Local bounding box
      if (geo) {
        geo.computeBoundingBox()
        const bb = geo.boundingBox
        const sz = new THREE.Vector3()
        bb.getSize(sz)
        extra += ` size=[${sz.x.toFixed(3)},${sz.y.toFixed(3)},${sz.z.toFixed(3)}]`
      }
      // Normal statistics — detect non-uniform normals on a flat mesh
      if (attrs && attrs.normal) {
        const nrm = attrs.normal
        const min = new THREE.Vector3(Infinity, Infinity, Infinity)
        const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity)
        const tmp = new THREE.Vector3()
        for (let i = 0; i < nrm.count; i++) {
          tmp.fromBufferAttribute(nrm, i)
          min.min(tmp)
          max.max(tmp)
        }
        extra += ` nrmRange=[${min.x.toFixed(2)},${min.y.toFixed(2)},${min.z.toFixed(2)}]→[${max.x.toFixed(2)},${max.y.toFixed(2)},${max.z.toFixed(2)}]`
      }
    }
    console.log(`${indent}${obj.type} "${obj.name || '(unnamed)'}" ${pos} ${scl} ${rot}${extra}`)
  })

  // World-space bounding box of whole scene
  const box = new THREE.Box3().setFromObject(scene)
  const size = new THREE.Vector3()
  box.getSize(size)
  const center = new THREE.Vector3()
  box.getCenter(center)
  console.log('\n=== World bounding box')
  console.log('min:', `[${box.min.x.toFixed(3)}, ${box.min.y.toFixed(3)}, ${box.min.z.toFixed(3)}]`)
  console.log('max:', `[${box.max.x.toFixed(3)}, ${box.max.y.toFixed(3)}, ${box.max.z.toFixed(3)}]`)
  console.log('size:', `[${size.x.toFixed(3)}, ${size.y.toFixed(3)}, ${size.z.toFixed(3)}]`)
  console.log('center:', `[${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)}]`)
}, (err) => {
  console.error('Parse error:', err)
  process.exit(1)
})

function objDepth(root, target) {
  let d = 0
  root.traverse((o) => {
    if (o === target) {
      let p = o
      while (p.parent && p.parent !== root) {
        d++
        p = p.parent
      }
    }
  })
  return d
}
