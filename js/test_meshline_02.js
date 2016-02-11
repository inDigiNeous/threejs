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
var cubes = [];
var meshLines = [];

var TWO_PI = Math.PI * 2;
var WIREFRAME = true;

// Initialise on load
window.addEventListener( 'load', function() {
	console.log("Loaded");
	init();
});

function hsv2rgb(h, s, v) {
	var h = h * 6;
	var i = Math.floor(h),
	    f = h - i,
	    p = v * (1 - s),
	    q = v * (1 - f * s),
	    t = v * (1 - (1 - f) * s),
	    mod = i % 6,
	    r = [v, q, p, p, t, v][mod] * 255,
	    g = [t, v, v, q, p, p][mod] * 255,
	    b = [p, p, t, v, v, q][mod] * 255;

	return [r, g, b];
}

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


function createMeshLineMesh(geometry, material) {
	var meshLine = new THREE.MeshLine();
	meshLine.setGeometry(geometry);

	var mesh = new THREE.Mesh(meshLine.geometry, material);
	meshLines.push(meshLine);

	return mesh;
}

function createSphere(radius, widthSegments, heightSegments, color) {
	var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
	var material = new THREE.MeshBasicMaterial( { color: color, wireframe: WIREFRAME });
	var cube = new THREE.Mesh( geometry, material );

	return cube;
}

function createTorus(radius, tube, radialSegments, tubularSegments, arc, color) {
	var geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
	var material = new THREE.MeshBasicMaterial( { color: color, wireframe: WIREFRAME });
	var cube = new THREE.Mesh( geometry, material );

	return cube;
}

function createCube(size, color) {
	var geometry = new THREE.BoxGeometry( size, size, size);
	var material = new THREE.MeshBasicMaterial( { color: color, wireframe: WIREFRAME });
	var cube = new THREE.Mesh( geometry, material );

	return cube;
}

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

function createCircleTunnel(numCircles) {
	var numPoints = 6;
	var radius = 2;

	var x = 0;
	var y = 0;
	var z = 0;

	var color;
	var r = 1;
	var g = 0;
	var b = 1;

	var c = 1.0 / numCircles;

	for (var i=0; i<numCircles; i++) {
		r = 1.0 / (-z + 0.01);
		g = 1.0 / (-z + 0.01);
		b = 1.0 / (-z + 0.01);
		color = new THREE.Color(r, g, b);

		var lineWidth = 64.0;

		var material = new THREE.MeshLineMaterial( { 
			color: color,
			opacity: 1.0,
			resolution: resolution,
			sizeAttenuation: false,
			lineWidth: lineWidth,
			near: camera.near,
			far: camera.far,
			depthTest: true,
			blending: THREE.AdditiveAlphaBlending,
			transparent: false,
			side: THREE.DoubleSide,
			wireframe: WIREFRAME
		});

		var circle = createCircle(numPoints, radius);
		var meshCircle = createMeshLineMesh(circle, material);

		meshCircle.position.set(x, y, z);
		scene.add(meshCircle);
		objects.push(meshCircle);

		var cube = createCube(0.3, color);
		//var cube = createSphere(0.3, 16, 16, color);
		//var cube = createTorus(10, 3, 16, 100, color);
		cube.position.set(x, y, z);
		scene.add(cube);
		cubes.push(cube);

		//z = z - Math.sin((i+1) * 32) * 6;
		z = z - 1.618;
	}
}

function createSceneObjects() {
	createCircleTunnel(6);
}

function onWindowResize() {
	var w = container.clientWidth;
	var h = container.clientHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize(w, h);
	resolution.set(w, h);

	console.log("onWindowResize, w = " + w + " h = " + h);
}

function doLogic() {
	controls.update();

	var delta = clock.getDelta();
	var t = clock.getElapsedTime();

	for (var i=0; i<cubes.length; i++) {
		var cube = cubes[i];
		var amt = delta;

		cube.rotation.y -= amt;
		cube.rotation.x += amt;
	}
}

function run() {
	requestAnimationFrame(run);
	doLogic();
	doDraw();
}

function doDraw() {
	renderer.render(scene, camera);
}
