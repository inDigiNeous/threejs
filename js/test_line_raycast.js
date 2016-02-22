'use strict';

// Globals
var container;

var scene;
var renderer;
var composer;

var renderModel;
var effectCopy;
var effectFXAA;
var effectBloom;

//var controls;

var camera;
var zoom_mult = 0;
var line_width = 3;

var raycaster;
var mouse;
var clock;
var resolution;

var ray;

var objects = [];
var linecolors = [];

var currentIntersected;

var TWO_PI = Math.PI * 2;
var WIREFRAME = true;

// Initialise on load
window.addEventListener( 'load', function() {
	console.log("Loaded");
	init();
});

function init() {
	console.log("Initializing !!");

	scene = new THREE.Scene();

	// Camera
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

	// Renderer
	renderer = new THREE.WebGLRenderer({ antialias: false });
	renderer.setClearColor(0x090909);
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;

	// Raycaster
	raycaster = new THREE.Raycaster();
	raycaster.linePrecision = 0.005;

	renderModel = new THREE.RenderPass( scene, camera );
	effectBloom = new THREE.BloomPass( 1.3 );

	effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
	var width = window.innerWidth || 2;
	var height = window.innerHeight || 2;
	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / width, 1 / height );

	effectCopy = new THREE.ShaderPass( THREE.CopyShader );
	effectCopy.renderToScreen = true;

	composer = new THREE.EffectComposer( renderer );
	composer.addPass( renderModel );
	composer.addPass( effectFXAA );
	composer.addPass( effectBloom );
	composer.addPass( effectCopy );

	// Controls
	//controls = new THREE.OrbitControls( camera, renderer.domElement );

	// The ray we are casting
	var material = new THREE.LineBasicMaterial({
		color: 0x00ffff,
		linewidth: 1.0,
	});

	// The ray is just a line
	// We rotate and scale this line to match the ray we are shooting
	mouse = new THREE.Vector2();
	clock = new THREE.Clock();

	// Our scene container
	container = document.getElementById( 'container' );

	// Append to our container
	container.appendChild(renderer.domElement);

	// Misc
	resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );

	// Event handlers
	window.addEventListener( 'resize', onWindowResize );
	document.addEventListener( 'mousemove', onMouseMove, false );

	// Create something and get it running
	createSceneObjects();
	onWindowResize();
	run();

	console.log("... DONE!");
};

function createLines(numLines) {
	var material;
	var geometry;
	var line;

	var colors = [
		0xff00ff,
		0xffff00,
		0x00ffff
	];

	for (var i=0; i<numLines; i++) {
		var color = colors[i % colors.length];

		material = new THREE.LineBasicMaterial({
			color: color,
			linewidth: line_width
		});

		geometry = new THREE.Geometry();
		var z = -0.8 + (0.05 * (i+1));
		var len = 0.05;

		geometry.vertices.push(
			new THREE.Vector3(-len,   0, 	z ),
			new THREE.Vector3(   0,   len,	z ),
			new THREE.Vector3(   0,   len,	z ),

			new THREE.Vector3(len,   0, 	z ),
			new THREE.Vector3(   0,  -len,	z ),
			new THREE.Vector3(   0,  -len,	z ),

			new THREE.Vector3(-len,   0, 	z ),
			new THREE.Vector3(   0,  len,	z ),
			new THREE.Vector3(   0,  len,	z )
		);

		line = new THREE.Line( geometry, material );

		linecolors.push(color);
		objects.push(line);
		scene.add(line);
	}
}

function createCube(size, color) {
	var geometry = new THREE.BoxGeometry( size, size, size);
	var material = new THREE.MeshBasicMaterial( { color: color, wireframe: WIREFRAME });
	var cube = new THREE.Mesh( geometry, material );

	return cube;
}

function createSphere(radius, widthSegments, heightSegments, color) {
	var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
	var material = new THREE.MeshBasicMaterial( { color: color, wireframe: true });
	var sphere = new THREE.Mesh( geometry, material );

	return sphere;
}

function createCursor() {
	var sphere = createSphere(0.010, 16, 16, 0x00ff00);
	return sphere;
}

function createSceneObjects() {
	createLines(36);
}

function onWindowResize() {
	var w = container.clientWidth;
	var h = container.clientHeight;

	camera.aspect = w / h;
	camera.updateProjectionMatrix();

	renderer.setSize(w, h);
	resolution.set(w, h);

	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );

	composer.reset();
}

function onMouseMove(evt) {
	evt.preventDefault();
	mouse.x = ( evt.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( evt.clientY / window.innerHeight ) * 2 + 1;
}

function doLogic() {
	var delta = clock.getDelta();
	var t = clock.getElapsedTime();

	camera.position.z = 1.0 - Math.cos(t / 4.0);

	camera.lookAt( scene.position );
	camera.updateMatrixWorld();

	//controls.update();

	// find intersections
	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObjects(objects, true);

	if (intersects.length > 0) {
		console.log("intersects.length = ")
		console.log(intersects)
		if ( currentIntersected !== undefined ) {
			currentIntersected.material.linewidth = line_width;
		}

		currentIntersected = intersects[ 0 ].object;
		currentIntersected.material.linewidth *= 4;

	} else {
		console.log("no intersects found");
		if ( currentIntersected !== undefined ) {
			currentIntersected.material.linewidth = line_width;
		}
		currentIntersected = undefined;
	}
}

function run() {
	requestAnimationFrame(run);
	doLogic();
	doDraw();
}

function doDraw() {
	camera.lookAt( scene.position );
	camera.updateMatrixWorld();

	renderer.clear();
	composer.render();
	//renderer.render(scene, camera);
}
