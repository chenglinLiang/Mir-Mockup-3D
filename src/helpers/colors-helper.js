import * as THREE from 'three'

export function hexToThreeColor(hex) {
  return new THREE.Color(hex)
}

export function hexToHSL(hex) {
  let r = 0,
    g = 0,
    b = 0
  if (hex.length === 4) {
    r = '0x' + hex[1] + hex[1]
    g = '0x' + hex[2] + hex[2]
    b = '0x' + hex[3] + hex[3]
  } else if (hex.length === 7) {
    r = '0x' + hex[1] + hex[2]
    g = '0x' + hex[3] + hex[4]
    b = '0x' + hex[5] + hex[6]
  }
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h,
    s,
    l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  h = Math.round(h * 360)
  s = Math.round(s * 100)
  l = Math.round(l * 100)
  return `hsl(${h}, ${s}%, ${l}%)`
}

export function hslToHex(h, s, l) {
  s /= 100
  l /= 100
  let c = (1 - Math.abs(2 * l - 1)) * s
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  let m = l - c / 2
  let r = 0,
    g = 0,
    b = 0
  if (0 <= h && h < 60) {
    r = c
    g = x
    b = 0
  } else if (60 <= h && h < 120) {
    r = x
    g = c
    b = 0
  } else if (120 <= h && h < 180) {
    r = 0
    g = c
    b = x
  } else if (180 <= h && h < 240) {
    r = 0
    g = x
    b = c
  } else if (240 <= h && h < 300) {
    r = x
    g = 0
    b = c
  } else if (300 <= h && h < 360) {
    r = c
    g = 0
    b = x
  }
  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)
  return (
    '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0')
  )
}
