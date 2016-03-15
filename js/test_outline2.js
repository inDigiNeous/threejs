'use strict';

// Globals
var container;

var renderer;
var composer;

var camera;
var raycaster;
var mouse;

var scene;

var renderPasses = {}
var passScenes = {}
var passMaterials = {}

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
	createOutlinePasses();
	createSceneObjects();
	onWindowResize();
	run();

	console.log("... DONE!");
};

// Create our shader material for rendering the simple outline
function createOutlineShaderMaterial(offset, color) {
	var outlineShader = {
		// TODO: this is too simple
		// It is just rendering the current material faces with an extended position
		// resulting in the cube for example missing the corners
		//
		// Should just extend the radius of the original object if possible and render with that
		vertexShader: [
			"uniform float offset;",
			"void main() {",
			"vec4 pos = modelViewMatrix * vec4( position + normal * offset, 1.0 );",
			"gl_Position = projectionMatrix * pos;",
			"}"
		].join("\n"),

		fragmentShader: [
			"uniform vec3 outlineColor;",
			"void main(){",
			"gl_FragColor = vec4(outlineColor, 1.0);",
			"}"
		].join("\n")
	};

	var uniforms = { 
		// The offset amount the outline object is bigger than the selected object
		offset: { type: "f", value: offset},
		// Color we are outlining with
		outlineColor: { type: "v3", value: color },
	}

	var outlineShaderMaterial = new THREE.ShaderMaterial({
		uniforms: uniforms, 
		vertexShader: outlineShader.vertexShader,
		fragmentShader: outlineShader.fragmentShader
	})

	return outlineShaderMaterial
}

function clearOutlines() {
	var len = passScenes.mask.children.length - 1;
	var obj;

	if (len < 0) return;

	for (var i=len; i>=0; i--) {
		obj = passScenes.mask.children[i];
		passScenes.mask.remove(obj);

		obj = passScenes.outline.children[i];
		passScenes.outline.remove(obj);
	}
}

function addOutlineObj(objMesh) {
	var maskMesh = objMesh.clone()

	maskMesh.material = passMaterials.mask
	passScenes.mask.add(maskMesh)

	var outlineMesh = objMesh.clone()

	outlineMesh.material = passMaterials.outline
	passScenes.outline.add(outlineMesh)
}

function createOutlinePasses() {
	// Outline and mask scenes. For the selected object rendering pass.
	passScenes = {}
	passScenes.mask = new THREE.Scene()
	passScenes.outline = new THREE.Scene()

	// Outline & mask render materials
	passMaterials = {}
	passMaterials.outline = createOutlineShaderMaterial(1.618, new THREE.Vector3(0.0, 1.0, 1.0));
	passMaterials.mask = new THREE.MeshBasicMaterial({ color: 0x000000 })

	// Initialize our render passes
	renderPasses = {}

	// This is the normal rendering pass, render the models in the scene
	renderPasses.scene = new THREE.RenderPass(scene, camera)

	// Render the outline objects. Basically selected object with a bigger radius
	renderPasses.outline = new THREE.RenderPass(passScenes.outline, camera)
	renderPasses.outline.clear = false

	// Mask phase to mask out the actual object from the highlight object, to create the highlight effect
	renderPasses.mask = new THREE.MaskPass(passScenes.mask, camera)
	renderPasses.mask.inverse = true

	// Clear the mask ?
	renderPasses.clearMask = new THREE.ClearMaskPass()

	// The copy phase where we copy the resulting renderTarget to the canvas as a fullscreen quad
	renderPasses.copy = new THREE.ShaderPass( THREE.CopyShader )
	renderPasses.copy.renderToScreen = true

	// Create our effect composer
	composer = new THREE.EffectComposer(renderer)

	// Need the stencils for the outline
	composer.renderTarget1.stencilBuffer = true
	composer.renderTarget2.stencilBuffer = true

	// Add the passes to our composer
	composer.addPass(renderPasses.scene)
	composer.addPass(renderPasses.mask)
	composer.addPass(renderPasses.outline)
	composer.addPass(renderPasses.clearMask)
	composer.addPass(renderPasses.copy)
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

function doLogic() {
	controls.update();

	var delta = clock.getDelta();
	var t = clock.getElapsedTime();

	// find intersections
	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObjects(objects, true);

	// Would have to clear the scenes too ..
	clearOutlines();

	if (intersects.length > 0) {
		var selectedObj = intersects[0].object;
		addOutlineObj(selectedObj);
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
