import * as THREE from 'three'
//import { TouchTexture } from './TouchTexture.js'

/*
*
*
Touch Texture
*
*
*/
const easeOutSine = (t, b, c, d) => c * Math.sin((t / d) * (Math.PI / 2)) + b
const easeOutQuad = (t, b, c, d) => -c * (t / d) * (t / d - 2) + b


export class TouchTexture {
  constructor() {
    this.size = 64
    this.radius = 0.1 * this.size

    this.maxAge = 64
    this.speed = 1 / this.maxAge

    this.trail = []
    this.prev = null

    this.canvas = document.createElement('canvas')
    this.canvas.width = this.size
    this.canvas.height = this.size

    this.ctx = this.canvas.getContext('2d')

    this.texture = new THREE.Texture(this.canvas)
  }

  update() {
    this.ctx.fillStyle = 'black'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    for (let i = 0; i < this.trail.length; i++) {
      const point = this.trail[i]
      const f = point.force * this.speed * (1 - point.age / this.maxAge)

      point.x += point.vx * f
      point.y += point.vy * f
      point.age++

      if (point.age > this.maxAge) {
        this.trail.splice(i, 1)
        i--
        continue
      }

      let intensity

      if (point.age < this.maxAge * 0.3) {
        intensity = easeOutSine(point.age / (this.maxAge * 0.3), 0, 1, 1)
      } else {
        intensity = easeOutQuad(1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7), 0, 1, 1)
      }
      intensity *= point.force

      const color = `${((point.vx + 1) / 2) * 255}, ${((point.vy + 1) / 2) * 255}, ${intensity * 255}`

      const offset = this.size * 5
      this.ctx.shadowOffsetX = offset
      this.ctx.shadowOffsetY = offset
      this.ctx.shadowBlur = this.radius * 1
      this.ctx.shadowColor = `rgba(${color}, ${0.2 * intensity})`

      this.ctx.beginPath()
      this.ctx.fillStyle = 'rgba(255, 0, 0, 1)'
      this.ctx.arc(
        point.x * this.canvas.width - offset,
        (1 - point.y) * this.canvas.height - offset,
        this.radius,
        0,
        Math.PI * 2,
      )
      this.ctx.fill()
    }

    this.texture.needsUpdate = true
  }

  addPoint(x, y) {
    let force = 0
    let vx = 0
    let vy = 0

    if (this.prev) {
      const dx = x - this.prev.x
      const dy = y - this.prev.y
      if (dx === 0 && dy === 0) return

      const dd = dx * dx + dy * dy
      const d = Math.sqrt(dd)
      vx = dx / d
      vy = dy / d

      force = Math.min(dd * 10000, 1)
    }

    this.prev = { x, y }
    this.trail.push({ x, y, age: 0, force, vx, vy })
  }
}


/*
*
*
Water Effect
*
*
*/
export class WaterEffect {
  constructor(renderer) {
    this.renderer = renderer
    this.scene = new THREE.Scene()

    this.touches = new TouchTexture()
    this.screen = new THREE.WebGLRenderTarget()

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 3, -1, -1, 3], 2))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        touches: { value: this.touches.texture },
        screen: { value: this.screen.texture },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;

        void main() {
          vUv = position.xy * 0.5 + 0.5;
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D touches;
        uniform sampler2D screen;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;

          vec4 tex = texture2D(touches, uv);
          float vx = -(tex.r * 2.0 - 1.0);
          float vy = -(tex.g * 2.0 - 1.0);
          float intensity = tex.b;

          uv.x += vx * 0.2 * intensity;
          uv.y += vy * 0.2  * intensity;

          gl_FragColor = texture2D(screen, uv);
        }
      `,
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)

    this.onPointerMove = this.onPointerMove.bind(this)
    window.addEventListener('pointermove', this.onPointerMove)
  }

  onPointerMove(e) {
    this.touches.addPoint(e.clientX / this.screen.width, 1 - e.clientY / this.screen.height)
  }

  setSize(width, height) {
    this.renderer.setSize(width, height)
    this.screen.setSize(width, height)
  }

  render(scene, camera) {
    this.renderer.setRenderTarget(this.screen)
    this.renderer.render(scene, camera)
    this.renderer.setRenderTarget(null)

    this.touches.update()
    this.renderer.render(this.scene, camera)
  }

  dispose() {
    this.touches.texture.dispose()
    this.screen.dispose()
    this.geometry.dispose()
    this.material.dispose()

    window.removeEventListener('pointermove', this.onPointerMove)
  }
}
