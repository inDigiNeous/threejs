'use strict';

// Globals
var container;

var renderer;
var composer;

var scene;
var maskScene;
var outlineScene;

var camera;

var normalPass;
var maskPass;
var outlinePass;
var clearMaskPass;
var copyPass;

var outlineShaderMat;

var controls;
var clock;

var objects = [];
var outlinedObjects = [];

var TWO_PI = Math.PI * 2;
var WIREFRAME = true;

var shaders = {
	'outline': {
		vertex_shader: [
			"uniform float offset;",
			"void main() {",
			"vec4 pos = modelViewMatrix * vec4( position + normal * offset, 1.0 );",
			"gl_Position = projectionMatrix * pos;",
			"}"
		].join("\n"),

		fragment_shader: [
			"uniform vec3 outlineColor;",
			"void main(){",
			"gl_FragColor = vec4(outlineColor, 1.0);",
			"}"
		].join("\n")
	}
};

// Initialise on load
window.addEventListener( 'load', function() {
	console.log("Loaded");
	init();
});

function init() {
	console.log("Initializing");

	// Renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setClearColor(0x202020);
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;

	// Scenes
	scene = new THREE.Scene();
	maskScene = new THREE.Scene();
	outlineScene = new THREE.Scene();

	// Cameras
	var aspectRatio = window.innerWidth / window.innerHeight;
	var fov = 60;
	var camera_z = 400;

	camera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.1, 1000);
	camera.position.set(0, 0, camera_z);
	scene.add(camera)

	clock = new THREE.Clock();

	// Lights
	var light = new THREE.DirectionalLight(0xffffff);
	light.position.set(1, 1, 1);
	scene.add(light);

	// Composer
	composer = new THREE.EffectComposer( renderer );
	composer.renderTarget1.stencilBuffer = true;
	composer.renderTarget2.stencilBuffer = true;

	// Passes
	normalPass = new THREE.RenderPass(scene, camera);

	outlinePass = new THREE.RenderPass(outlineScene, camera);
	outlinePass.clear = false;

	maskPass = new THREE.MaskPass(maskScene, camera);
	maskPass.inverse = true;

	clearMaskPass = new THREE.ClearMaskPass();

	copyPass = new THREE.ShaderPass(THREE.CopyShader);
	copyPass.renderToScreen = true;

	composer.addPass(normalPass);
	composer.addPass(maskPass);
	composer.addPass(outlinePass);
	composer.addPass(clearMaskPass);
	composer.addPass(copyPass);

	// Outline material
	outlineShaderMat = createOutlineShaderMat();

	// Our scene container
	container = document.getElementById( 'container' );

	// Controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );

	// Append to our container
	container.appendChild(renderer.domElement);

	// Event handlers
	window.addEventListener( 'resize', onWindowResize );

	// Create something and get it running
	createSceneObjects();
	onWindowResize();
	run();

	console.log("... DONE!");
};

function createSphere(radius, widthSegments, heightSegments, color) {
	var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
	var material = new THREE.MeshBasicMaterial( { color: color, wireframe: WIREFRAME });
	var mesh = new THREE.Mesh( geometry, material );

	return mesh;
}

function createTorus(radius, tube, radialSegments, tubularSegments, arc, color) {
	//var geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
	var geometry = new THREE.TorusGeometry(1.0, 0.15, 8, 3);
	var material = new THREE.MeshBasicMaterial( { color: color, wireframe: WIREFRAME });
	var mesh = new THREE.Mesh( geometry, material );

	return mesh;
}

function createCube(size, color) {
	var geometry = new THREE.BoxGeometry( size, size, size);
	var material = new THREE.MeshBasicMaterial( { color: color, wireframe: WIREFRAME });
	var mesh = new THREE.Mesh( geometry, material );

	return mesh;
}

// How do we do this for multiple objects now ?
// We need to add every selected object to our
//
// maskScene
// outlineScene
//
// And keep the other objects in
// scene
// So .. if we create multiple objects.
// We only add the selected one to our maskScene and outlineScene
//
// So maybe 
function createOutlineShaderMat() {
	var uniforms = { 
		offset: { type: "f", value: 1.618},
		outlineColor: { type: "v3", value: new THREE.Vector3(1.0, 1.0, 1.0) },
	};

	var shader = shaders['outline'];
	var outlineShaderMat = new THREE.ShaderMaterial({
		uniforms: uniforms, 
		vertexShader: shader.vertex_shader,
		fragmentShader: shader.fragment_shader
	});

	return outlineShaderMat;
}

// Add a mesh created to our outlined objects
function addOutlineMesh(mesh) {
	// flat mask
	var flatMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
	var flatMesh = new THREE.Mesh(mesh.geometry, flatMat);
	outlinedObjects.push(flatMesh);
	maskScene.add(flatMesh);

	var outlineMesh = new THREE.Mesh(mesh.geometry, outlineShaderMat);
	outlinedObjects.push(outlineMesh);
	outlineScene.add(outlineMesh);
}

function createSceneObjects() {
	var torusKnotGeometry = new THREE.TorusKnotGeometry(60, 12, 96, 12);
	var phongMat = new THREE.MeshPhongMaterial({ color: 0x4080ff });
	var torusKnotMesh = new THREE.Mesh(torusKnotGeometry, phongMat);

	objects.push(torusKnotMesh);
	scene.add(torusKnotMesh);

	// Add to outlined objects
	addOutlineMesh(torusKnotMesh);

	var sphereGeometry = new THREE.SphereGeometry(60, 16, 16);
	var sphereMesh = new THREE.Mesh(sphereGeometry, phongMat);
	sphereMesh.position.set(-200, 0, 0);

	objects.push(sphereMesh);
	scene.add(sphereMesh);

	var boxGeometry = new THREE.BoxGeometry(80, 80, 80);
	var boxMesh = new THREE.Mesh(boxGeometry, phongMat);
	boxMesh.position.set(200, 0, 0);

	objects.push(boxMesh);
	scene.add(boxMesh);
}

function onWindowResize() {
	var w = container.clientWidth;
	var h = container.clientHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize(w, h);
	composer.reset();
}

function doLogic() {
	controls.update();

	var delta = clock.getDelta();
	var t = clock.getElapsedTime();

	if(objects[0]) {
		objects[0].rotation.y += 0.01;
		outlinedObjects[0].rotation.y = objects[0].rotation.y;
		outlinedObjects[1].rotation.y = objects[0].rotation.y;
	}
}

function run() {
	requestAnimationFrame(run);
	doLogic();
	doDraw();
}

function doDraw() {
	composer.render();
}
