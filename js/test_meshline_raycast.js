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

var controls_enabled = false;
var controls;

var camera;
var zoom_mult = 0;
var zoom_camera = false;

var raycaster;
var mouse;
var clock;
var resolution;

var ray;

var meshlines = [];
var materials = [];
var linecolors = [];
var normal_linewidth = 10;
var highlight_linewidth = 30;

var currentIntersected;

var TWO_PI = Math.PI * 2;
var WIREFRAME = false;

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
	effectBloom = new THREE.BloomPass( 1.6 );

	effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
	var width = window.innerWidth || 2;
	var height = window.innerHeight || 2;
	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / width, 1 / height );

	effectCopy = new THREE.ShaderPass( THREE.CopyShader );
	effectCopy.renderToScreen = true;

	composer = new THREE.EffectComposer( renderer );
	composer.addPass( renderModel );
	composer.addPass( effectFXAA );
	//composer.addPass( effectBloom );
	composer.addPass( effectCopy );

	// Controls
	if (controls_enabled === true) {
		controls = new THREE.OrbitControls( camera, renderer.domElement );
	}

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

function createMeshLineMesh(geometry, material) {
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

	for (var i=0; i<numLines; i++) {
		var color = colors[i % colors.length];

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

		var material = new THREE.MeshLineMaterial( { 
			color: new THREE.Color(color),
			opacity: 1.0,
			resolution: resolution,
			sizeAttenuation: false,
			lineWidth: normal_linewidth,
			near: camera.near,
			far: camera.far,
			depthTest: true,
			blending: THREE.AdditiveBlending,
			transparent: false,
			side: THREE.DoubleSide,
			wireframe: WIREFRAME
		});

		materials.push(material);

		// We first create a mesh line
		var meshLine = new THREE.MeshLine();
		meshLine.setGeometry(geometry);
		meshlines.push(meshLine);

		// Then the actual rendered mesh from that
		var mesh = new THREE.Mesh(meshLine.geometry, material);

		meshLine.setMatrixWorld(mesh.matrixWorld);
		meshLine.setMaterial(material);

		scene.add(mesh);
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

var currentIntersectedIndex = 0;

function doLogic() {
	var delta = clock.getDelta();
	var t = clock.getElapsedTime();

	if (zoom_camera === true) {
		camera.position.z = 1.0 - Math.cos(t / 8.0);
		camera.lookAt( scene.position );
		camera.updateMatrixWorld();
	}

	if (controls_enabled === true) {
		controls.update();
	}

	// find intersections
	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects(meshlines, false);

	// How do we find the correct material here ?
	//
	//
	if (intersects.length > 0) {
		if ( currentIntersected !== undefined ) {
			// Set the meshline lineWidth here
			currentIntersected.material.uniforms.lineWidth.value = normal_linewidth;
		}

		currentIntersected = intersects[0].object;
		currentIntersected.material.uniforms.lineWidth.value = highlight_linewidth;

	} else {
		if ( currentIntersected !== undefined ) {
			currentIntersected.material.uniforms.lineWidth.value = normal_linewidth;
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
