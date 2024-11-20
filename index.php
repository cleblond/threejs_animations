<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>P Orbitals in Three.js</title>
    <style>
        body { margin: 0; }
        canvas { display: block; }
    </style>
</head>
<body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://threejs.org/examples/js/controls/OrbitControls.js"></script>
<script>
// Basic Three.js setup
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls allow for mouse rotation
var controls = new THREE.OrbitControls(camera, renderer.domElement);

// Create groups for the orbitals along each axis
var orbitalGroupX = new THREE.Group();
var orbitalGroupY = new THREE.Group();
var orbitalGroupZ = new THREE.Group();

// Create the geometry for the lobes
var lobeGeometry = new THREE.SphereGeometry(1, 32, 32);  // Sphere for the lobe

// Materials for the lobes (positive and negative phases)
var lobeMaterialPositive = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }); // Red for positive phase
var lobeMaterialNegative = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true }); // Blue for negative phase

// Function to create a p orbital along a specified axis
function createPOrbital(group, axis) {
    var positiveLobe = new THREE.Mesh(lobeGeometry, lobeMaterialPositive);
    var negativeLobe = new THREE.Mesh(lobeGeometry, lobeMaterialNegative);
    
    // Position lobes based on axis (closer together so they just touch)
    if (axis === 'x') {
        positiveLobe.position.x = 1.1;  // Positive lobe along x
        negativeLobe.position.x = -1.1; // Negative lobe along x
    } else if (axis === 'y') {
        positiveLobe.position.y = 1.1;  // Positive lobe along y
        negativeLobe.position.y = -1.1; // Negative lobe along y
    } else if (axis === 'z') {
        positiveLobe.position.z = 1.1;  // Positive lobe along z
        negativeLobe.position.z = -1.1; // Negative lobe along z
    }
    
    // Add lobes to the group
    group.add(positiveLobe);
    group.add(negativeLobe);
}

// Create p orbitals along x, y, and z axes
createPOrbital(orbitalGroupX, 'x');
createPOrbital(orbitalGroupY, 'y');
createPOrbital(orbitalGroupZ, 'z');

// Add all orbital groups to the scene
scene.add(orbitalGroupX);
scene.add(orbitalGroupY);
scene.add(orbitalGroupZ);

// Set up camera position
camera.position.z = 5;

// Render function
var render = function () {
    requestAnimationFrame(render);
    controls.update();  // Update controls for mouse rotation
    renderer.render(scene, camera);
};

// Start rendering
render();
</script>
</body>
</html>

