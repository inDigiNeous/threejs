'use strict';

// Globals
var container;

var scene;
var renderer;
var controls;

var camera;
var clock;

var objects = [];

var TWO_PI = Math.PI * 2;
var WIREFRAME = true;

// Initialise on load
window.addEventListener( 'load', function() {
	console.log("Loaded");
	init();
});


function init() {
	console.log("Initializing");

	scene = new THREE.Scene();

	// Camera
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.z = 5;

	clock = new THREE.Clock();

	// Our scene container
	container = document.getElementById( 'container' );

	// Renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setClearColor(0x202020);
	renderer.setSize( window.innerWidth, window.innerHeight );

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

// Let's add some spheres and then show the bounding boxes for those when selected
function createSceneObjects() {
	var sphere1 = createSphere(1, 21, 21, 0xFF00FF);
	sphere1.position.set(0.0, 0.0, 0.0);
	scene.add(sphere1);

	var bbh = new THREE.BoundingBoxHelper(sphere1, 0xFFFFFF);
	bbh.update();
	scene.add(bbh);

	var sphere2 = createSphere(0.8, 21, 21, 0x0000FF);
	sphere2.position.set(-2.0, 0.0, 0.0);
	scene.add(sphere2);

	var bh = new THREE.BoxHelper(sphere2);
	bh.update(sphere2);
	scene.add(bh);

	//var torus = createSphere(0.8, 21, 21, 0x0000FF);
	var torus = createTorus(0.1, 40, 8, 6, TWO_PI, 0xFFFF);
	torus.position.set(2.0, 0.0, 0.0);
	scene.add(torus);

	var bh2 = new THREE.BoxHelper(torus);
	bh2.update(torus);
	scene.add(bh2);
}

function onWindowResize() {
	var w = container.clientWidth;
	var h = container.clientHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize(w, h);
}

function doLogic() {
	controls.update();

	var delta = clock.getDelta();
	var t = clock.getElapsedTime();
}

function run() {
	requestAnimationFrame(run);
	doLogic();
	doDraw();
}

function doDraw() {
	renderer.render(scene, camera);
}
