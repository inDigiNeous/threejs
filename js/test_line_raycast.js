'use strict';

// Globals
var container;

var scene;
var renderer;
var controls;

var camera;
var clock;
var resolution;

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

	// Misc
	resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );

	// Event handlers
	window.addEventListener( 'resize', onWindowResize );

	// Create something and get it running
	createSceneObjects();
	onWindowResize();
	run();

	console.log("... DONE!");
};

function createCircle(numPoints, radius) {
	var x, y;
	var angleInc;
	var angleRad;
	var angleOffset = 0;

	angleInc = TWO_PI / numPoints;
	angleRad = Maf.deg2Rad(angleOffset);

	var geometry = new THREE.Geometry();

	for (var i=0; i<numPoints + 1; i++) {
		// Calculate vertex
		x = (Math.sin(angleRad) * radius);
		y = (Math.cos(angleRad) * radius);

		geometry.vertices.push(new THREE.Vector3(x, y, 0));

		// Increase angle
		angleRad += angleInc;
	}

	return geometry;
}

function createLines(numLines) {
	var material;
	var geometry;
	var line;

	var colors = [
		0xff00ff,
		0xffff00,
		0x00ffff
	];

	var pos = new THREE.Vector3(0, 0, 10);
	var y;

	for (var i=0; i<numLines; i++) {
		material = new THREE.LineBasicMaterial({
			color: colors[i % colors.length],
			linewidth: 6.0,
		});

		geometry = new THREE.Geometry();
		geometry.vertices.push(
				new THREE.Vector3(-1, 0, 0 ),
				new THREE.Vector3( 0, 1, 0 ),
				new THREE.Vector3( 1, 0, 0 )
				);

		line = new THREE.Line( geometry, material );
		line.position.y = 0.5 - ((i+1)/8.0);

		scene.add(line);
	}
}

function createSceneObjects() {
	createLines(16);
}

function onWindowResize() {
	var w = container.clientWidth;
	var h = container.clientHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize(w, h);
	resolution.set(w, h);
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
