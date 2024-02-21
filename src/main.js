import * as THREE from 'three';
import { WaterEffect } from './WaterEffect'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';



var container = document.getElementById( 'webgl' );

const renderer = new THREE.WebGLRenderer({ 
	alpha: true,
	antialias: true
});
renderer.setSize( container.clientWidth-16, container.clientHeight-16 );
renderer.setAnimationLoop( animationLoop );
container.appendChild( renderer.domElement );


//renderer.setSize( window.innerWidth, window.innerHeight);
//document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 100;


const loader = new FontLoader();

loader.load( 'https://uploads-ssl.webflow.com/65d48c89e255b4e76fcc9054/65d624164654f4a99883bb40_satoshi.txt', function ( font ) {

	const geometry = new TextGeometry( 'Name 1', {
		font: font,
		size: 25,
		height: 0
	} );

	//const geometry = new THREE.BoxGeometry()
	const material = new THREE.MeshMatcapMaterial({ color: 0x333 });
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
