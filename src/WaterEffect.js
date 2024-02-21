import * as THREE from 'three'
import { TouchTexture } from './TouchTexture.js'

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
