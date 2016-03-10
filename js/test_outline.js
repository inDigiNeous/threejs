'use strict';

// Globals
var container;

var renderer;
var composer;

var scene;
var maskScene;
var outlineScene;

var camera;
var raycaster;
var mouse;

var normalPass;
var maskPass;
var outlinePass;
var clearMaskPass;
var copyPass;

var outlineMaterial;
var maskMaterial;

var controls;
var clock;

// Normal rendered objects
var objects = [];

// Outlined objects
var outlineObjs = [];

// The mask objects for outlined
var maskObjs = [];

var currentIntersected;

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

	// Raycaster
	raycaster = new THREE.Raycaster();
	raycaster.linePrecision = 0.005;

	// Scenes
	scene = new THREE.Scene();
	maskScene = new THREE.Scene();
	outlineScene = new THREE.Scene();

	// Cameras
	var aspectRatio = window.innerWidth / window.innerHeight;
	var fov = 60;
	var camera_z = 480;

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

	// Outline & mask materials
	outlineMaterial = createOutlineShaderMat();
	maskMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

	// Our scene container
	container = document.getElementById( 'container' );

	// Controls
	controls = new THREE.OrbitControls( camera, renderer.domElement );

	// Append to our container
	container.appendChild(renderer.domElement);

	mouse = new THREE.Vector2();

	// Event handlers
	window.addEventListener( 'resize', onWindowResize );
	document.addEventListener( 'mousemove', onMouseMove, false );

	// Create something and get it running
	createSceneObjects();
	onWindowResize();
	run();

	console.log("... DONE!");
};

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
//
// Let's get the selection working out now.
// In order for us to select objects, we have to 
//
// First raycast them
// Then add to the selected objects
//
//
function createOutlineShaderMat() {
	var uniforms = { 
		offset: { type: "f", value: 2.000},
		outlineColor: { type: "v3", value: new THREE.Vector3(0.0, 1.0, 1.0) },
	};

	var shader = shaders['outline'];
	var outlineMaterial = new THREE.ShaderMaterial({
		uniforms: uniforms, 
		vertexShader: shader.vertex_shader,
		fragmentShader: shader.fragment_shader
	});

	return outlineMaterial;
}

function addMeshMask(mesh) {
	var flatMesh = mesh.clone();
	flatMesh.material = maskMaterial;

	maskObjs.push(flatMesh);
	maskScene.add(flatMesh);
}

function addMeshOutline(mesh) {
	var outlineMesh = mesh.clone();
	outlineMesh.material = outlineMaterial;

	outlineObjs.push(outlineMesh);
	outlineScene.add(outlineMesh);
}

function removeMeshMask(mesh) {
	maskScene.remove(mesh);
}

function removeMeshOutline(mesh) {
	outlineScene.remove(mesh);
}

function createSceneObjects() {
	var torusKnotGeometry = new THREE.TorusKnotGeometry(60, 12, 96, 12);
	var torusMat = new THREE.MeshPhongMaterial({ color: 0x2274A5 });
	var torusKnotMesh = new THREE.Mesh(torusKnotGeometry, torusMat);

	objects.push(torusKnotMesh);
	scene.add(torusKnotMesh);

	var sphereMat = new THREE.MeshPhongMaterial({ color: 0xE83F6F });
	var sphereGeometry = new THREE.SphereGeometry(60, 16, 16);
	var sphereMesh = new THREE.Mesh(sphereGeometry, sphereMat);
	sphereMesh.position.set(-200, 0, 0);

	objects.push(sphereMesh);
	scene.add(sphereMesh);

	var boxGeometry = new THREE.BoxGeometry(80, 80, 80);
	var boxMat = new THREE.MeshPhongMaterial({ color: 0xFFBF00 });
	var boxMesh = new THREE.Mesh(boxGeometry, boxMat);
	boxMesh.position.set(200, 0, 0);

	objects.push(boxMesh);
	scene.add(boxMesh);
}

function onMouseMove(evt) {
	evt.preventDefault();
	mouse.x = ( evt.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( evt.clientY / window.innerHeight ) * 2 + 1;
}

function onWindowResize() {
	var w = container.clientWidth;
	var h = container.clientHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize(w, h);
	composer.reset();
}

function clearOutlineScenes() {
	var len = maskScene.children.length - 1;
	var obj;

	if (len < 0) return;

	for (var i=len; i>= 0; i--) {
		obj = maskScene.children[i];
		maskScene.remove(obj);

		obj = outlineScene.children[i];
		outlineScene.remove(obj);
	}
}

function doLogic() {
	controls.update();

	var delta = clock.getDelta();
	var t = clock.getElapsedTime();

	// find intersections
	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObjects(objects, true);

	// Clear the currently outlined objects
	outlineObjs = [];
	maskObjs = [];

	// Would have to clear the scenes too ..
	clearOutlineScenes();

	if (intersects.length > 0) {
		var selectedObj = intersects[0].object;
		addMeshMask(selectedObj);
		addMeshOutline(selectedObj);
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
