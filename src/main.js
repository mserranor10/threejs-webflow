import * as THREE from 'three';
import { WaterEffect } from './WaterEffect'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

const renderer = new THREE.WebGLRenderer({ 
	alpha: true,
	});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.append( renderer.domElement );

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 275;


const loader = new FontLoader();

loader.load( '/satoshi.json', function ( font ) {

	const geometry = new TextGeometry( 'Hello three.js!', {
		font: font,
		size: 80,
		height: 0
	} );

	//const geometry = new THREE.BoxGeometry()
	const material = new THREE.MeshNormalMaterial()
	const mesh = new THREE.Mesh(geometry, material)
	scene.add(mesh)

} );



const effect = new WaterEffect(renderer)

const handleResize = () => {
  effect.setSize(window.innerWidth, window.innerHeight)

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}
handleResize()

window.addEventListener('resize', handleResize)

renderer.setAnimationLoop(() => {
  effect.render(scene, camera)
})
