    
//console.log("WHAT UP DUDE");
// Three.js setup
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
//document.getElementById('container').appendChild(renderer.domElement);
document.body.appendChild(renderer.domElement);


// OrbitControls for 3D rotation
let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;  // Make damping more responsive
controls.rotateSpeed = 0.5;    // Increase rotation speed for better responsiveness


// Raycaster setup
const raycaster = new THREE.Raycaster();
//raycaster.setFromCamera( mouse3D, camera );

const mouse = new THREE.Vector2();

let selectedAtom = null; // To track the currently selected atom

// Scene setup
let atoms = [];
let atomRadius = 0.2;
let lengthpLobe = 1;
let currentAtom = null;
camera.position.z = 5;

// Add Atom Function
function addAtom() {
    //console.log(currentAtom);
    //console.log(atoms.length);

    
    let geometry = new THREE.SphereGeometry(atomRadius, 32, 32);
    let material = new THREE.MeshBasicMaterial({ color: 0xa2b9c4 });
    let atom = new THREE.Mesh(geometry, material);
    
    if (atoms.length == 0) {
    	atom.position.set(0, 0, 0);
    } else if (atoms.length == 1) {
    	atom.position.set(2, 0, 0);
    }

    //atom.position.set(x, y, z);
    atom.name = "atom"+atoms.length;
    scene.add(atom);
    atoms.push(atom);
    //console.log("Atoms array:", atoms);
    
    
    //atom.name = "atom1";
    currentAtom = atom;
    render();
}

// Add s Orbital Function
function addSOrbital() {
    if (!currentAtom) return;
        
    let geometry = new THREE.SphereGeometry(0.4, 16, 16);
    let material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    let sOrbital = new THREE.Mesh(geometry, material);
    sOrbital.position.copy(currentAtom.position);
    sOrbital.name = "s_orbital"; // Set name property
    sOrbital.atom = currentAtom.name; // Set name property
    scene.add(sOrbital);
    render();
}

// Add p Orbital Function
let pOrbitalCount = 0;
        
       

// Mouse event listener for selecting atoms
function onMouseDown(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    
    if (event.target !== renderer.domElement) {
        console.log("Click outside canvas detected.");
        return;
    }
    
    
    //console.log("mouse down");
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Set up the raycaster
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections
    const intersects = raycaster.intersectObjects(atoms);

    if (intersects.length > 0) {
        // If an atom is clicked, select it
        if (selectedAtom) {
            // Reset the material of the previously selected atom
            selectedAtom.material.color.set(0xa2b9c4);
        }

        selectedAtom = intersects[0].object; // Get the first intersected object
        selectedAtom.material.color.set(0xff0000); // Highlight the selected atom
        currentAtom = selectedAtom;

        //console.log("Selected Atom:", selectedAtom.position);
    }
}


renderer.domElement.addEventListener("pointerdown", onMouseDown);        
        



function createPOrbitalLobe(lobecolor) {
    // Define the profile curve as an array of Vector2 points
    
    const points = [];
    points.push(new THREE.Vector2(0, 0));    // start of orbital
    points.push(new THREE.Vector2(0.05, 0.1));  // Gradually widen
    points.push(new THREE.Vector2(0.07, 0.2));   // Maximum width
    points.push(new THREE.Vector2(0.1, 0.3));    // Taper near the top
    points.push(new THREE.Vector2(0.15, 0.4));    // Taper near the top
    points.push(new THREE.Vector2(0.2, 0.5));    // Taper near the top
    points.push(new THREE.Vector2(0.25, 0.6));    // Taper near the top
    points.push(new THREE.Vector2(0.3, 0.7));    // Taper near the top
    points.push(new THREE.Vector2(0.3, 0.8));    // Taper near the top
    points.push(new THREE.Vector2(0.27, 0.9));    // Taper near the top
    points.push(new THREE.Vector2(0.2, 0.95));    // Taper near the top                    
    points.push(new THREE.Vector2(0, lengthpLobe));  // end of orbital
    

    // Create LatheGeometry by revolving the profile curve
    const geometry = new THREE.LatheGeometry(points, 32); // 32 segments for smoothness
    
    //if (lobenumber==1) {
    //var lobecolor = 0xff0000;
    //} else {
    //var lobecolor = 0x0000ff;
    //}
    
    //console.log(lobecolor);

    const material = new THREE.MeshBasicMaterial({ color: lobecolor, wireframe: true });
    const lobe = new THREE.Mesh(geometry, material);

    return lobe;
}



//function addPOrbitalNew(direction1, direction2) {
function setPOrbitalPosition(position, anglerotation, axisrotation, color) {
//function addPOrbitalNew(direction1, anglerotation, axisrotation) {
    if (!currentAtom) return;

    // Create two lobes for the p orbital using the custom geometry function
    const pLobe1 = createPOrbitalLobe(color);
    //const pLobe2 = createPOrbitalLobe();

    // Set the name property for filtering
    pLobe1.name = "p_orbital";
    pLobe1.parentAtom = currentAtom.name;
    //pLobe2.name = "orbital";

    // Use direction1 and direction2 to set the positions of the lobes
    
    //console.log(currentAtom.position.x + position.x * (atomRadius + 0.5));
    
    pLobe1.position.set(
        currentAtom.position.x,
        currentAtom.position.y,
        currentAtom.position.z
    );
    
    
    /*
    pLobe1.position.set(
        currentAtom.position.x + position.x * (atomRadius + 0.5),
        currentAtom.position.y + position.y * (atomRadius + 0.5),
        currentAtom.position.z + position.z * (atomRadius + 0.5)
    );
    */

    pLobe1.rotation[axisrotation] = anglerotation; // Rotate to align along the x-axis

    /*
    pLobe2.position.set(
        currentAtom.position.x + direction1.x * (atomRadius + 0.5),
        currentAtom.position.y + direction1.y * (atomRadius + 0.5),
        currentAtom.position.z + direction1.z * (atomRadius + 0.5)
    );
    */


    scene.add(pLobe1);
    //scene.add(pLobe2);
    render();
}



//addAtom();


/*
//positive x
setPOrbitalPosition(new THREE.Vector3(0, 0, 0), -Math.PI/2, "z");
//negative x
setPOrbitalPosition(new THREE.Vector3(0, 0, 0), +Math.PI/2, "z");


//positive y
setPOrbitalPosition(new THREE.Vector3(0, 0, 0), 0, "x");
//negative y
setPOrbitalPosition(new THREE.Vector3(0, 0, 0), Math.PI, "z");

//positive z
setPOrbitalPosition(new THREE.Vector3(0, 0, 0), Math.PI/2, "x");
//negative z
setPOrbitalPosition(new THREE.Vector3(0, 0, 0), -Math.PI/2, "x");
*/


function addPOrbital() {
    if (!currentAtom /*|| pOrbitalCount >= 3*/) return;
    if (!selectedAtom) {selectedAtom = currentAtom;}
    
    console.log(selectedAtom.name);
    
    console.log(scene.children);
    
    const OrbitalsOnAtom = scene.children.filter(obj => obj.parentAtom === selectedAtom.name);
    console.log(OrbitalsOnAtom);
    const totalpOrbitalsOnAtom = OrbitalsOnAtom.filter(obj => obj.name === 'p_orbital').length/2;
    console.log(totalpOrbitalsOnAtom);
    

    //console.log(
    // Create two lobes for the p orbital using the custom geometry function
    const pLobe1 = createPOrbitalLobe();
    const pLobe2 = createPOrbitalLobe();

    
    const x = selectedAtom.position.x;
    const y = selectedAtom.position.y;
    const z = selectedAtom.position.z;

    pLobe1.name = "p_orbital";
    pLobe2.name = "p_orbital";
    pLobe1.atom = selectedAtom.name;
    pLobe2.atom = selectedAtom.name;

    // Flip the second lobe along the y-axis to make it point in the opposite direction
    //pLobe1.scale.y = -1;

    // Position and rotate the lobes along the appropriate axis
    if (totalpOrbitalsOnAtom === 0) { // Along the x-axis
        //pLobe1.scale.y = -1;
        //pLobe1.position.set(currentAtom.position.x + atomRadius, currentAtom.position.y, currentAtom.position.z);
        //pLobe2.position.set(currentAtom.position.x - atomRadius, currentAtom.position.y, currentAtom.position.z);
        //pLobe1.rotation.z = Math.PI / 2; // Rotate to align along the x-axis
        //pLobe2.rotation.z = Math.PI / 2;
        setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0xff0000);
        setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0x0000ff);
        
    } else if (totalpOrbitalsOnAtom === 1) { // Along the y-axis
        //pLobe2.scale.y = -1;
        //pLobe1.position.set(currentAtom.position.x, currentAtom.position.y + atomRadius, currentAtom.position.z);
        //pLobe2.position.set(currentAtom.position.x, currentAtom.position.y - atomRadius, currentAtom.position.z);
        //positive y
	setPOrbitalPosition(new THREE.Vector3(x, y, z), 0, "x", 0xff0000);
	//negative y
	setPOrbitalPosition(new THREE.Vector3(x, y, z), Math.PI, "z", 0x0000ff);
        
        
    } else if (totalpOrbitalsOnAtom === 2) { // Along the z-axis
	//positive z
	setPOrbitalPosition(new THREE.Vector3(x, y, z), Math.PI/2, "x", 0xff0000);
	//negative z
	setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "x", 0x0000ff);
    }

    //scene.add(pLobe1);
    //scene.add(pLobe2);
    //pOrbitalCount++;
    render();
}





// Add Axes and Labels
function addAxes() {
    const axisLength = 2; // Length of each axis line

    // Create materials for the axes and text labels
    const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red for X-axis
    const yMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // Green for Y-axis
    const zMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff }); // Blue for Z-axis

    // X-axis
    const xGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(axisLength, 0, 0)
    ]);
    const xAxis = new THREE.Line(xGeometry, xMaterial);
    scene.add(xAxis);

    // Y-axis
    const yGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, axisLength, 0)
    ]);
    const yAxis = new THREE.Line(yGeometry, yMaterial);
    scene.add(yAxis);

    // Z-axis
    const zGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, axisLength)
    ]);
    const zAxis = new THREE.Line(zGeometry, zMaterial);
    scene.add(zAxis);

    // Add axis labels using sprites for simplicity
    addAxisLabel("X", axisLength, 0, 0, 0xff0000);
    addAxisLabel("Y", 0, axisLength, 0, 0x00ff00);
    addAxisLabel("Z", 0, 0, axisLength, 0x0000ff);
}

// Function to add a text label at a given position
function addAxisLabel(text, x, y, z, color) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = "32px Arial";
    context.fillStyle = "#" + color.toString(16).padStart(6, '0');
    context.fillText(text, 0, 64); // Draw text on canvas

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(x, y, z);
    //sprite.scale.set(0.5, 0.5, 0.5); // Adjust size
    scene.add(sprite);
}

// Call the addAxes function once to add the axes and labels to the scene


// Add Hybridize Button Functionality
function hybridizeOrbitals() {

   //console.log(JSON.parse(JSON.stringify(scene.children)));

   //console.log(scene.children);

    const totalOrbitals = scene.children.filter(obj => obj.name === "orbital").length;

    //console.log(totalOrbitalss);

    // Remove existing orbitals before hybridizing
    scene.children = scene.children.filter(obj => obj.name !== "orbital");

    if (totalOrbitals === 2) {
        // sp Hybridization (linear, two orbitals at 180 degrees)
        addHybridOrbital(new THREE.Vector3(1, 0, 0));
        addHybridOrbital(new THREE.Vector3(-1, 0, 0));
    } else if (totalOrbitals === 3) {
        // sp² Hybridization (trigonal planar, three orbitals at 120 degrees)
        addHybridOrbital(new THREE.Vector3(Math.cos(0), Math.sin(0), 0));
        addHybridOrbital(new THREE.Vector3(Math.cos(2 * Math.PI / 3), Math.sin(2 * Math.PI / 3), 0));
        addHybridOrbital(new THREE.Vector3(Math.cos(4 * Math.PI / 3), Math.sin(4 * Math.PI / 3), 0));
    } else if (totalOrbitals === 4) {
        // sp³ Hybridization (tetrahedral, four orbitals at ~109.5 degrees)
        addHybridOrbital(new THREE.Vector3(1, 1, 1).normalize());
        addHybridOrbital(new THREE.Vector3(1, -1, -1).normalize());
        addHybridOrbital(new THREE.Vector3(-1, 1, -1).normalize());
        addHybridOrbital(new THREE.Vector3(-1, -1, 1).normalize());
    }

    render();
}

// Function to create hybrid orbitals
function addHybridOrbital(direction) {
    const hybridLobe = createHybridOrbitalLobe();
    hybridLobe.position.copy(currentAtom.position).add(direction.multiplyScalar(atomRadius + 0.5));
    hybridLobe.lookAt(currentAtom.position); // Orient toward atom
    hybridLobe.name = "orbital"; // Tag as orbital for filtering
    scene.add(hybridLobe);
}

// Create a hybrid orbital lobe with a new set of points
function createHybridOrbitalLobe() {

    
    const points = [];
    points.push(new THREE.Vector2(0, 0));    // start of orbital
    points.push(new THREE.Vector2(0.05, 0.1));  // Gradually widen
    points.push(new THREE.Vector2(0.07, 0.2));   // Maximum width
    points.push(new THREE.Vector2(0.1, 0.3));    // Taper near the top
    points.push(new THREE.Vector2(0.15, 0.4));    // Taper near the top
    points.push(new THREE.Vector2(0.2, 0.5));    // Taper near the top
    points.push(new THREE.Vector2(0.25, 0.6));    // Taper near the top
    points.push(new THREE.Vector2(0.3, 0.7));    // Taper near the top
    points.push(new THREE.Vector2(0.3, 0.8));    // Taper near the top
    points.push(new THREE.Vector2(0.27, 0.9));    // Taper near the top
    points.push(new THREE.Vector2(0.2, 0.95));    // Taper near the top                    
    points.push(new THREE.Vector2(0, lengthpLobe));  // end of orbital
    
    
    const geometry = new THREE.LatheGeometry(points, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffa500, wireframe: true });
    const lobe = new THREE.Mesh(geometry, material);
    return lobe;
}

// Add button event listener
//document.getElementById("hybridizeButton").onclick = hybridizeOrbitals;







        

// Render Function
function render() {
    scene.background = new THREE.Color( 0xd0dbe0 );
    requestAnimationFrame(render);
    controls.update();
    renderer.render(scene, camera);
}

//addAtom();
//addPOrbital();
addAxes();
render();


