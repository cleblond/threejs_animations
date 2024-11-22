// Three.js setup
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


//
let isDragging = false;
let dragStartX = 0;
renderer.domElement.addEventListener("pointerdown", onPointerDown);
renderer.domElement.addEventListener("pointermove", onPointerMove);
renderer.domElement.addEventListener("pointerup", onPointerUp);

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
let hybridscale = 0.3;
let axislength = 2.5;

camera.position.z = 5;

// Add Atom Function
function addAtom() {

    console.log(atoms);
    if(atoms.length == 2) return;
    let geometry = new THREE.SphereGeometry(atomRadius, 16, 16);
    let material = new THREE.MeshBasicMaterial({ color: 0xa2b9c4 });
    let atom = new THREE.Mesh(geometry, material);
    
    if (atoms.length == 0) {
    	atom.position.set(0, 0, 0);
    } else if (atoms.length == 1) {
    	atom.position.set(2.5, 0, 0);
    }

    //atom.position.set(x, y, z);
    atom.name = "atom"+atoms.length;
    scene.add(atom);
    atoms.push(atom);

    currentAtom = atom;
    render();
}

// Add s Orbital Function
function addSOrbital() {
    if (!currentAtom) return;
        
    let geometry = new THREE.SphereGeometry(0.3, 8, 8);
    let material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    let sOrbital = new THREE.Mesh(geometry, material);
    sOrbital.position.copy(currentAtom.position);
    sOrbital.name = "s_orbital"; // Set name property
    sOrbital.parentAtom = currentAtom.name; // Set name property
    
    sOrbital.originalColor = new THREE.Color(material.color);
    
    // Compute the bounding box
    sOrbital.geometry.computeBoundingSphere();
    sOrbital.updateMatrixWorld();
    
    
    
    scene.add(sOrbital);
    render();
}

function updateBoundingBoxes() {
    scene.children.forEach(mesh => {
        if (mesh.isMesh && mesh.geometry.boundingBox) {
            mesh.geometry.computeBoundingBox();
            mesh.updateMatrixWorld();
        }
    });
}
//mesh.geometry.computeBoundingBox();
//mesh.updateMatrixWorld();
//const boundingBox = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);

const intersectingOrbitals = new Set();
function detectOrbitalIntersections() {
    const orbitals = scene.children.filter(obj => obj.name === "p_orbital" || obj.name === "s_orbital");
    const newIntersections = new Set();

    for (let i = 0; i < orbitals.length; i++) {
        const sphere1 = orbitals[i].geometry.boundingSphere.clone();
        sphere1.center.applyMatrix4(orbitals[i].matrixWorld);

        for (let j = i + 1; j < orbitals.length; j++) {
            const sphere2 = orbitals[j].geometry.boundingSphere.clone();
            sphere2.center.applyMatrix4(orbitals[j].matrixWorld);

            const distance = sphere1.center.distanceTo(sphere2.center);
            const radiusSum = sphere1.radius + sphere2.radius;

            if (distance <= radiusSum) {
              if (orbitals[i].parentAtom !== orbitals[j].parentAtom) {
                //console.log(`Intersection detected between ${orbitals[i].parentAtom} and ${orbitals[j].parentAtom}`);

                newIntersections.add(orbitals[i]);
                newIntersections.add(orbitals[j]);

                orbitals[i].material.color.set(0x000000);
                orbitals[j].material.color.set(0x000000);


                /*
                const overlapMidpoint = orbitals[i].position.clone().lerp(orbitals[j].position, 0.5);
                const overlapGeometry = new THREE.SphereGeometry(0.2, 16, 16);
                const overlapMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 });
                const overlapRegion = new THREE.Mesh(overlapGeometry, overlapMaterial);
                overlapRegion.position.copy(overlapMidpoint);
                scene.add(overlapRegion);
                */
                
                // Optional: visualize or trigger events here
              }
            }
        }
    }
    
    
    // Reset colors for orbitals no longer intersecting
    intersectingOrbitals.forEach(orbital => {
        if (!newIntersections.has(orbital)) {
            orbital.material.color.copy(orbital.originalColor); // Default color (red)
        }
    });

    // Update the global intersection tracking set
    intersectingOrbitals.clear();
    newIntersections.forEach(orbital => intersectingOrbitals.add(orbital));
    
    
    
    
}

/*
function detectOrbitalIntersections() {
    //updateBoundingBoxes();
    const orbitals = scene.children.filter(obj => obj.name === "p_orbital" || obj.name === "s_orbital");

    for (let i = 0; i < orbitals.length; i++) {
        const sphere1 = orbitals[i].geometry.boundingBox.clone().applyMatrix4(orbitals[i].matrixWorld);

        for (let j = i + 1; j < orbitals.length; j++) {
            const sphere2 = orbitals[j].geometry.boundingBox.clone().applyMatrix4(orbitals[j].matrixWorld);

            if (box1.intersectsBox(box2)) {
                if (orbitals[i].parentAtom !== orbitals[j].parentAtom) {
                console.log(`Intersection detected between ${orbitals[i].parentAtom} and ${orbitals[j].parentAtom}`);
                // Perform actions here (e.g., visualize overlap or trigger events)
                
                }
                
            }
        }
    }
}
*/


// Mouse event listener for selecting atoms
function onPointerDown(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Set up the raycaster
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections
    const intersects = raycaster.intersectObjects(atoms);

    if (intersects.length > 0) {
        // If an atom is clicked, select it
        
        console.log(selectedAtom);
        
        if (selectedAtom) {
            // Reset the material of the previously selected atom
            //FFF59D
            selectedAtom.material.color.set(0xa2b9c4);
        }

        selectedAtom = intersects[0].object; // Get the first intersected object
        selectedAtom.material.color.set(0xFFF59D); // Highlight the selected atom
        currentAtom = selectedAtom;

        isDragging = true;
        dragStartX = event.clientX;

        // Disable OrbitControls
        controls.enabled = false;
        //console.log("Selected Atom:", selectedAtom.position);
    }
}


function onPointerMove(event) {
    if (!isDragging || !selectedAtom) return;

        //if (isDragging) {
        detectOrbitalIntersections();
    //}


    // Calculate the change in mouse x position
    const deltaX = (event.clientX - dragStartX) * 0.01; // Scale to scene units
    dragStartX = event.clientX;

    // Update the atom's position along the x-axis
    selectedAtom.position.x += deltaX;

    // Update associated orbitals
    const associatedOrbitals = scene.children.filter(obj => obj.parentAtom === selectedAtom.name);
    associatedOrbitals.forEach(orbital => {
        orbital.position.x += deltaX;
    });

    render();
}

function onPointerUp() {
    if (isDragging) {
        isDragging = false;
        //selectedAtom = null; // Clear the selected atom
        
        controls.enabled = true;
        
    }
}

//renderer.domElement.addEventListener("pointerdown", onMouseDown);        
        



function createPOrbitalLobe(lobecolor, scaleFactor = 1) {
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
    const geometry = new THREE.LatheGeometry(points, 8); // 32 segments for smoothness
    geometry.scale(scaleFactor, scaleFactor, scaleFactor); // Apply scaling to the entire geometry
    const material = new THREE.MeshBasicMaterial({ color: lobecolor, wireframe: true });
    const lobe = new THREE.Mesh(geometry, material);
    //lobe.scale.set(scaleFactor, scaleFactor, scaleFactor);
    lobe.originalColor = new THREE.Color(lobecolor);


    return lobe;
}


/*
function setPOrbitalPosition(position, anglerotation, axisrotation, color, scalefactor=1) {

    if (!currentAtom) return;

    // Create two lobes for the p orbital using the custom geometry function
    const pLobe1 = createPOrbitalLobe(color, scalefactor);

    // Set the name property for filtering
    pLobe1.name = "p_orbital";
    pLobe1.parentAtom = currentAtom.name;

    pLobe1.position.set(
        currentAtom.position.x,
        currentAtom.position.y,
        currentAtom.position.z
    );


    pLobe1.rotation[axisrotation] = anglerotation; // Rotate to align along the x-axis

    scene.add(pLobe1);

    render();
}



function setPOrbitalPosition2Rotation(position, anglerotation1, axisrotation1, anglerotation2, axisrotation2,  color, scalefactor=1) {

    if (!currentAtom) return;

    // Create two lobes for the p orbital using the custom geometry function
    const pLobe1 = createPOrbitalLobe(color, scalefactor);

    // Set the name property for filtering
    pLobe1.name = "p_orbital";
    pLobe1.parentAtom = currentAtom.name;

    pLobe1.position.set(
        currentAtom.position.x,
        currentAtom.position.y,
        currentAtom.position.z
    );


    pLobe1.rotation[axisrotation1] = anglerotation1; // Rotate to align along the x-axis
    pLobe1.rotation[axisrotation2] = anglerotation2;

    scene.add(pLobe1);

    render();
}
*/

function setPOrbitalPosition(position, anglerotation, axisrotation, color, scalefactor = 1) {
    if (!currentAtom) return;

    // Create the orbital geometry
    const pLobe1 = createPOrbitalLobe(color, scalefactor);

    // Transform the geometry to apply the rotation first, then translation
    const geometry = pLobe1.geometry;
    const positions = geometry.attributes.position.array;

    // Apply rotation and translation to each vertex
    for (let i = 0; i < positions.length; i += 3) {
        let x = positions[i];
        let y = positions[i + 1];
        let z = positions[i + 2];

        // Apply the rotation (around the specified axis)
        if (axisrotation === "x") {
            const yNew = y * Math.cos(anglerotation) - z * Math.sin(anglerotation);
            const zNew = y * Math.sin(anglerotation) + z * Math.cos(anglerotation);
            y = yNew;
            z = zNew;
        } else if (axisrotation === "y") {
            const xNew = x * Math.cos(anglerotation) + z * Math.sin(anglerotation);
            const zNew = -x * Math.sin(anglerotation) + z * Math.cos(anglerotation);
            x = xNew;
            z = zNew;
        } else if (axisrotation === "z") {
            const xNew = x * Math.cos(anglerotation) - y * Math.sin(anglerotation);
            const yNew = x * Math.sin(anglerotation) + y * Math.cos(anglerotation);
            x = xNew;
            y = yNew;
        }

        // Apply translation (move to atom position)
        positions[i] = x + currentAtom.position.x;
        positions[i + 1] = y + currentAtom.position.y;
        positions[i + 2] = z + currentAtom.position.z;
    }

    // Update geometry
    //geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere();
    //geometry.computeVertexNormals();

    // Associate the orbital with the parent atom
    pLobe1.name = "p_orbital";
    pLobe1.parentAtom = currentAtom.name;
    
    //update bounding box
    //pLobe1.geometry.computeBoundingSphere();
    pLobe1.updateMatrixWorld();


    // Add to the scene
    scene.add(pLobe1);
    render();
}


function setPOrbitalPosition2Rotation(position, anglerotation1, axisrotation1, anglerotation2, axisrotation2, color, scalefactor = 1) {
    if (!currentAtom) return;

    // Create the orbital geometry
    const pLobe1 = createPOrbitalLobe(color, scalefactor);

    // Transform the geometry to the desired rotations first, then apply translation
    const geometry = pLobe1.geometry;
    const positions = geometry.attributes.position.array;

    // Apply rotations and translation to each vertex
    for (let i = 0; i < positions.length; i += 3) {
        let x = positions[i];
        let y = positions[i + 1];
        let z = positions[i + 2];

        // First rotation (around the first axis)
        if (axisrotation1 === "x") {
            const yNew = y * Math.cos(anglerotation1) - z * Math.sin(anglerotation1);
            const zNew = y * Math.sin(anglerotation1) + z * Math.cos(anglerotation1);
            y = yNew;
            z = zNew;
        } else if (axisrotation1 === "y") {
            const xNew = x * Math.cos(anglerotation1) + z * Math.sin(anglerotation1);
            const zNew = -x * Math.sin(anglerotation1) + z * Math.cos(anglerotation1);
            x = xNew;
            z = zNew;
        } else if (axisrotation1 === "z") {
            const xNew = x * Math.cos(anglerotation1) - y * Math.sin(anglerotation1);
            const yNew = x * Math.sin(anglerotation1) + y * Math.cos(anglerotation1);
            x = xNew;
            y = yNew;
        }

        // Second rotation (around the second axis)
        if (axisrotation2 === "x") {
            const yNew = y * Math.cos(anglerotation2) - z * Math.sin(anglerotation2);
            const zNew = y * Math.sin(anglerotation2) + z * Math.cos(anglerotation2);
            y = yNew;
            z = zNew;
        } else if (axisrotation2 === "y") {
            const xNew = x * Math.cos(anglerotation2) + z * Math.sin(anglerotation2);
            const zNew = -x * Math.sin(anglerotation2) + z * Math.cos(anglerotation2);
            x = xNew;
            z = zNew;
        } else if (axisrotation2 === "z") {
            const xNew = x * Math.cos(anglerotation2) - y * Math.sin(anglerotation2);
            const yNew = x * Math.sin(anglerotation2) + y * Math.cos(anglerotation2);
            x = xNew;
            y = yNew;
        }

        // Apply translation (move to atom position)
        positions[i] = x + currentAtom.position.x;
        positions[i + 1] = y + currentAtom.position.y;
        positions[i + 2] = z + currentAtom.position.z;
    }

    // Update geometry
    //geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere();
    //geometry.computeVertexNormals();

    // Associate the orbital with the parent atom
    pLobe1.name = "p_orbital";
    pLobe1.parentAtom = currentAtom.name;
    
    //update bounding box
    //pLobe1.geometry.computeBoundingBox();
    pLobe1.updateMatrixWorld();
    

    // Add to the scene
    scene.add(pLobe1);
    render();
}


function addPOrbital() {
    if (!currentAtom /*|| pOrbitalCount >= 3*/) return;
    
    //if(selectedAtom){
    console.log("selectedAtom:", JSON.parse(JSON.stringify(selectedAtom)));
    //}
    
    console.log("currentAtom:", currentAtom.name);
    
    
    if (selectedAtom) {currentAtom = selectedAtom;}
    
    //console.log(selectedAtom.name);
    
    //console.log(scene.children);
    
    const OrbitalsOnAtom = scene.children.filter(obj => obj.parentAtom === currentAtom.name);
    //console.log(OrbitalsOnAtom);
    const totalpOrbitalsOnAtom = OrbitalsOnAtom.filter(obj => obj.name === 'p_orbital').length/2;
    //console.log(totalpOrbitalsOnAtom);
    

    //console.log(
    // Create two lobes for the p orbital using the custom geometry function
    const pLobe1 = createPOrbitalLobe();
    const pLobe2 = createPOrbitalLobe();

    
    const x = currentAtom.position.x;
    const y = currentAtom.position.y;
    const z = currentAtom.position.z;

    pLobe1.name = "p_orbital";
    pLobe2.name = "p_orbital";
    pLobe1.atom = currentAtom.name;
    pLobe2.atom = currentAtom.name;


    // Position and rotate the lobes along the appropriate axis
    if (totalpOrbitalsOnAtom === 0) { // Along the x-axis

        setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0xff0000);
        setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0x0000ff);
        
    } else if (totalpOrbitalsOnAtom === 1) { // Along the y-axis
	setPOrbitalPosition(new THREE.Vector3(x, y, z), 0, "x", 0xff0000);
	//negative y
	setPOrbitalPosition(new THREE.Vector3(x, y, z), Math.PI, "z", 0x0000ff);
        
        
    } else if (totalpOrbitalsOnAtom === 2) { // Along the z-axis
	//positive z
	setPOrbitalPosition(new THREE.Vector3(x, y, z), Math.PI/2, "x", 0xff0000);
	//negative z
	setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "x", 0x0000ff);
    }

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


function addSp2Axes(atom) {
    if (!atom) return;

    // Trigonal planar direction vectors (normalized)
    const directions = [
        new THREE.Vector3(1, 0, 0), // Along positive x-axis
        new THREE.Vector3(-0.5, 0, Math.sqrt(3) / 2), // 120° in the xz-plane
        new THREE.Vector3(-0.5, 0, -Math.sqrt(3) / 2), // -120° in the xz-plane
    ];

    // Line material
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

    // Create axes
    directions.forEach(direction => {
        const end = direction.clone().multiplyScalar(axislength).add(atom.position); // Scale and offset
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([atom.position, end]);
        const line = new THREE.Line(lineGeometry, lineMaterial);

        // Optionally, tag the line for future reference
        line.name = "sp2_axis";
        line.parentAtom = atom.name;

        // Add to the scene
        scene.add(line);
    });

    render();
}



function addSp3Axes(atom) {
    if (!atom) return;

    // Tetrahedral direction vectors (normalized)
    const directions = [
        new THREE.Vector3(1, 0, 0), // Along positive x-axis
        new THREE.Vector3(-1 / 3, Math.sqrt(8 / 9), 0), // In the xy-plane
        new THREE.Vector3(-1 / 3, -Math.sqrt(2 / 9), Math.sqrt(2 / 3)), // Out of xy-plane
        new THREE.Vector3(-1 / 3, -Math.sqrt(2 / 9), -Math.sqrt(2 / 3)), // Out of xy-plane
    ];

    // Line material
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

    // Create axes
    directions.forEach(direction => {
        const end = direction.clone().multiplyScalar(axislength).add(atom.position); // Scale and offset
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([atom.position, end]);
        const line = new THREE.Line(lineGeometry, lineMaterial);

        // Optionally, tag the line for future reference
        line.name = "sp3_axis";
        line.parentAtom = atom.name;

        // Add to the scene
        scene.add(line);
    });

    render();
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


// Add Hybridize Button Functionality
async function hybridizeOrbitals() {

   //console.log(JSON.parse(JSON.stringify(scene.children)));
   
   console.log(currentAtom);
   
    if (!selectedAtom) {selectedAtom = currentAtom;}
   
   
    const orbitalsOnAtom = scene.children.filter(obj => obj.parentAtom === selectedAtom.name);
    const totalpOrbitalsOnAtom = orbitalsOnAtom.filter(obj => obj.name === 'p_orbital').length/2;

    //console.log(totalpOrbitalsOnAtom);

    
    const userSelection = await showHybridizationModal(totalpOrbitalsOnAtom, orbitalsOnAtom.length-totalpOrbitalsOnAtom);
    
    //console.log(userSelection);
    

    // Remove existing orbitals before hybridizing
    //scene.children = scene.children.filter(obj => obj.name !== "p_orbital");
    //scene.children = scene.children.filter(obj => obj.name !== "s_orbital");
    
    scene.children = scene.children.filter(obj => obj.parentAtom !== selectedAtom.name);
    
    const x = selectedAtom.position.x;
    const y = selectedAtom.position.y;
    const z = selectedAtom.position.z;
    

    if (totalpOrbitalsOnAtom === 1) { //atmost (2)sp
        // sp Hybridization (linear, two orbitals at 180 degrees)
        if (userSelection == "2sp") {
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000, hybridscale); //red
		
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0xff0000, hybridscale);
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0x0000ff);
        }
        
        
        
        
    } else if (totalpOrbitalsOnAtom === 2) {//(3)sp2 or (2)sp / (1)p
        // sp² Hybridization (trigonal planar, three orbitals at 120 degrees)

        
        //(3) sp2 hybrid
        if (userSelection == "3sp2") {
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000,  hybridscale); //red
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", Math.PI/3, "y",  0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", -2*Math.PI/3, "y",  0xff0000,  hybridscale);
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", -Math.PI/3, "y",  0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", +2*Math.PI/3, "y",  0xff0000,  hybridscale);
		
		addSp2Axes(selectedAtom);
		
        }
        
        //(2) sp2 hybrid and 1 p
        if (userSelection == "2sp_1p") {
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000, hybridscale); //red
		
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0xff0000); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0x0000ff, hybridscale); //red
		
		setPOrbitalPosition(new THREE.Vector3(x, y, z), 0, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI, "z", 0xff0000); //red
        }
        
        
        
        
        
    } else if (totalpOrbitalsOnAtom === 3) {//(4) sp3 or (3)sp2 / (1)p or (2)sp / (2)p  
        
        
        if (userSelection == "4sp3") {
        
		// (3) sp³ Hybridization (tetrahedral, four orbitals at ~109.5 degrees)
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000,  hybridscale); //red
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), 13*Math.PI/120, "z", 0, 0,  0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), -107*Math.PI/120, "z", 0, 0,  0xff0000,  hybridscale);
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), 13*Math.PI/120, "z", 80*Math.PI/120, "x", 0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), -13*Math.PI/120, "z", -40*Math.PI/120, "x",  0xff0000,  hybridscale);
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), 13*Math.PI/120, "z", -80*Math.PI/120, "x", 0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), -13*Math.PI/120, "z", 40*Math.PI/120, "x",  0xff0000,  hybridscale);
		
		
		addSp3Axes(selectedAtom);
		
		
        }
        
        
        if (userSelection == "3sp2_1p") {
        
		// (3) sp2 hybrid with (1) p
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000, hybridscale); //red
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", Math.PI/3, "y",  0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", -2*Math.PI/3, "y",  0xff0000,  hybridscale);
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", -Math.PI/3, "y",  0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", +2*Math.PI/3, "y",  0xff0000,  hybridscale);        
		//non hybrid p orbital
		setPOrbitalPosition(new THREE.Vector3(x, y, z), 0, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI, "z", 0xff0000); //red
		
		addSp2Axes(selectedAtom);
		
        }
        
        if (userSelection == "2sp_2p") {
        
		// (2) sp hybrid with (2) p
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000,  hybridscale); //red
		
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0xff0000,  hybridscale); //red
		
		
		//non hybrid p orbital along y
		setPOrbitalPosition(new THREE.Vector3(x, y, z), 0, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI, "z", 0xff0000); //red
		
		//non hybrid p orbital along z
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "x", 0xff0000); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "x", 0x0000ff); //red
        
        }


    }
    

    

    render();
    
    if (selectedAtom.name == "atom1") {
        reflectOrbitals();
    
    }
    
    
}

// Function to create hybrid orbitals
function addHybridOrbital(direction) {
    const hybridLobe = createHybridOrbitalLobe();
    hybridLobe.position.copy(currentAtom.position).add(direction.multiplyScalar(atomRadius + hybridscale));
    hybridLobe.lookAt(currentAtom.position); // Orient toward atom
    hybridLobe.name = "orbital"; // Tag as orbital for filtering
    scene.add(hybridLobe);
}


function showHybridizationModal(totalpOrbitals, sOrbitalPresent) {

  return new Promise((resolve) => {
    const modal = document.getElementById('hybridizationModal');
    const optionsDiv = document.getElementById('options');
    const messageHTML = document.getElementById('message');
    optionsDiv.innerHTML = ''; // Clear existing options
    var message = '';
    console.log(totalpOrbitals, sOrbitalPresent);

    let options = [];
    
    if (sOrbitalPresent) {
        if (totalpOrbitals === 3) {
                options = [
                    { label: '4 sp³ hybrid', value: '4sp3' },
                    { label: '3 sp² hybrid and 1 p', value: '3sp2_1p' },
                    { label: '2 sp hybrid and 2 p', value: '2sp_2p' }
                ];
                
                message =  "Select a hybridization scheme for the one s orbital and three p orbitals.";
        
            //options = ['4 sp³ hybrid', '3 sp² hybrid and 1 p', '2 sp hybrid and 2 p'];
        } else if (totalpOrbitals === 2) {
            //options = ['3 sp² hybrid', '2 sp hybrid and 1 p'];
                options = [
                    { label: '3 sp² hybrid', value: '3sp2' },
                    { label: '2 sp hybrid and 1 p', value: '2sp_1p' }
                ];
                message =  "Select a hybridization scheme for the one s orbital and two p orbitals.";
        
        
        } else if (totalpOrbitals === 1) {
            //options = ['2 sp hybrid'];
                options = [{ label: '2 sp hybrid', value: '2sp' }];
                message =  "This atom has one s orbital and one p orbital. You can form two sp hybrid orbitals.";
        
        } else if (totalpOrbitals === 0) {
        
                message =  "There are no orbitals on this atom to hybridize! Please add an s orbital and one or more p orbitals first.";
        }
    } else {
    
                message = "This atom has no s orbital. Please add an s orbital first.";
    }

    console.log(message);

    // Dynamically add buttons for each option
    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.label;
        button.style.margin = '5px';
        button.onclick = () => {
            resolve(option.value);
            handleHybridizationSelection(option);
        };
        optionsDiv.appendChild(button);
        
    });
    messageHTML.innerText = message;
    modal.style.display = 'block';

  });

}

function closeModal() {
    const modal = document.getElementById('hybridizationModal');
    modal.style.display = 'none';
}


function findAlignedOrbitals(atom1, atom2, orbitalsAtom1, orbitalsAtom2) {
    const alignedPairs = [];
    orbitalsAtom1.forEach(orbital1 => {
        const direction1 = orbital1.position.clone().sub(atom1.position).normalize();
        orbitalsAtom2.forEach(orbital2 => {
            const direction2 = orbital2.position.clone().sub(atom2.position).normalize();
            const dotProduct = direction1.dot(direction2);
            if (Math.abs(dotProduct) > alignmentThreshold) {
                alignedPairs.push({ orbital1, orbital2 });
            }
        });
    });
    return alignedPairs;
}



function handleHybridizationSelection(option) {
    console.log('User selected:', option);
    closeModal();

    // Perform hybridization based on the selected option
    if (option === '4 sp³ hybrid') {
        // Call a function to add 4 sp³ orbitals
        console.log('Performing sp³ hybridization...');
    } else if (option === '3 sp² hybrid and 1 p') {
        // Call a function to add 3 sp² and 1 p orbital
        console.log('Performing sp² hybridization...');
    } else if (option === '2 sp hybrid and 2 p') {
        // Call a function to add 2 sp and 2 p orbitals
        console.log('Performing sp hybridization...');
    }
    // Add similar conditions for other options
}


function reflectOrbitals() {
    if (!selectedAtom) {
        console.log("No atom selected to reflect orbitals.");
        return;
    }

    // Find all orbitals associated with the selected atom
    const associatedOrbitals = scene.children.filter(obj => obj.parentAtom === selectedAtom.name);
    //console.log("Associated Orbitals:", associatedOrbitals);

    if (associatedOrbitals.length === 0) {
        console.log("No orbitals found for the selected atom.");
        return;
    }

    // Reflect each orbital through the atom's center
    const atomPosition = selectedAtom.position.clone();

    associatedOrbitals.forEach(orbital => {
        if (!orbital.geometry || !(orbital.geometry instanceof THREE.BufferGeometry)) {
            console.log("Orbital does not have a BufferGeometry.");
            return;
        }

        const geometry = orbital.geometry;
        const positions = geometry.attributes.position.array;

        for (let i = 0; i < positions.length; i += 3) {
            // Original vertex position
            const vx = positions[i];
            const vy = positions[i + 1];
            const vz = positions[i + 2];

            // Reflect the vertex relative to the atom's center
            positions[i] = 2 * atomPosition.x - vx; // Reflect x
            positions[i + 1] = 2 * atomPosition.y - vy; // Reflect y
            positions[i + 2] = 2 * atomPosition.z - vz; // Reflect z

            // Debugging log
            //console.log("Original Vertex:", { x: vx, y: vy, z: vz });
            /*console.log("Reflected Vertex:", {
                x: positions[i],
                y: positions[i + 1],
                z: positions[i + 2],
            });
            */
        }

        // Mark geometry for update
        geometry.attributes.position.needsUpdate = true;
        geometry.computeBoundingSphere();
        geometry.computeVertexNormals();
    });

    //console.log("Reflected orbitals for atom:", selectedAtom.name);
    //render();
}

function removeAllObjects() {
    // Filter out all orbitals from the scene
    const orbitals = scene.children.filter(obj => obj.name === "p_orbital" || obj.name === "s_orbital");
    const delatoms = scene.children.filter(obj => obj.name && obj.name.match(/^atom\d+$/));
    // Remove each orbital from the scene
    orbitals.forEach(orbital => scene.remove(orbital));
    delatoms.forEach(atom => scene.remove(atom));
    atoms = [];
    console.log(atoms);
    console.log(`${orbitals.length} orbitals removed.`);
    render(); // Update the scene
}


//for texting only delet later.
/*
addAtom();
addSOrbital();
addPOrbital();
addPOrbital();
addPOrbital();
*/      

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

//addCornerAxes();

render();



