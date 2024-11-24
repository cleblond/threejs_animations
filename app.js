// Three.js setup
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const undoStack = [];
const redoStack = [];

let isRotating = false; 

//
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
renderer.domElement.addEventListener("pointerdown", onPointerDown);
renderer.domElement.addEventListener("pointermove", onPointerMove);
renderer.domElement.addEventListener("pointerup", onPointerUp);

// OrbitControls for 3D rotation
let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;  // Make damping more responsive
controls.rotateSpeed = 0.5;    // Increase rotation speed for better responsiveness

let hybridAtomCounter = 0; // Global counter


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
    atom.name = 'atom'+atoms.length;
    atom.axis = new THREE.Vector3(1, 0, 0);
    scene.add(atom);
    atoms.push(atom);
    
        // Push the action to the undo stack
    undoStack.push({
        type: "atom",
        objectType: "atom",
        object: atom,
    });
    

    currentAtom = atom;
    render();
}

function addAtomsToSp3Axes(centerAtom, distance = 2) {
    if (!centerAtom) return;

    // Tetrahedral direction vectors (normalized)
    const directions = [
        new THREE.Vector3(1, 0, 0), // Along positive x-axis
        new THREE.Vector3(-1 / 3, Math.sqrt(8 / 9), 0), // In the xy-plane
        new THREE.Vector3(-1 / 3, -Math.sqrt(2 / 9), Math.sqrt(2 / 3)), // Out of xy-plane
        new THREE.Vector3(-1 / 3, -Math.sqrt(2 / 9), -Math.sqrt(2 / 3)), // Out of xy-plane
    ];

    const atomslen = atoms.length;
    directions.forEach((direction, index) => {
        // Calculate position for the new atom
        const position = direction.clone().multiplyScalar(distance).add(centerAtom.position);

        // Create and place a new atom
        const atomGeometry = new THREE.SphereGeometry(atomRadius, 16, 16);
        const atomMaterial = new THREE.MeshBasicMaterial({ color: 0xa2b9c4 }); // Yellow for new atoms
        const atom = new THREE.Mesh(atomGeometry, atomMaterial);

        atom.parentAtom = selectedAtom.name;
        atom.axis = direction.clone().normalize();
        atom.position.copy(position);
        atom.name = `${centerAtom.name}_sp3_hybrid_atom${hybridAtomCounter++}`;
        scene.add(atom);
        atoms.push(atom);
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
        line.axis = direction.clone().normalize();

        // Add to the scene
        scene.add(line);
    });

    render();
}

function addAtomsToSp2Axes(centerAtom, distance = 2) {
    if (!centerAtom) return;

    // Trigonal planar direction vectors (normalized)
    const directions = [
        new THREE.Vector3(1, 0, 0), // Along positive x-axis
        new THREE.Vector3(-0.5, 0, Math.sqrt(3) / 2), // 120° in the xz-plane
        new THREE.Vector3(-0.5, 0, -Math.sqrt(3) / 2), // -120° in the xz-plane
    ];

    directions.forEach((direction, index) => {
        // Calculate position for the new atom
        const position = direction.clone().multiplyScalar(distance).add(centerAtom.position);

        // Create and place a new atom
        const atomGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const atomMaterial = new THREE.MeshBasicMaterial({ color: 0x99ccff }); // Light blue for new atoms
        const atom = new THREE.Mesh(atomGeometry, atomMaterial);

        atom.axis = direction.clone().nomralize();
        atom.position.copy(position);
        atom.name = `${centerAtom.name}_sp2_hybrid_atom${hybridAtomCounter++}`;

        scene.add(atom);
    });

    render();
}




// Add s Orbital Function
function addSOrbital() {
    if (!currentAtom) return;
    
    //check if current atom has an s
    const numOfS = scene.children.filter(obj => obj.parentAtom === currentAtom.name && obj.name === "s_orbital").length;
    if (numOfS == 1) return;
    
    const orbitals = scene.children.filter(obj => obj.name === "p_orbital" || obj.name === "s_orbital");
        
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
    
    undoStack.push({
        type: "s_orbital",
        //objectType: "s_orbital",
        object: sOrbital,
    });
    
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
    console.log("Intersects:", intersects);
    
    
    if (intersects.length > 0) {
        // If an atom is clicked, select it
        const intersected = intersects[0].object;
            console.log("Selected Atom:", selectedAtom);
            console.log(scene.children);
            
        if (intersected.name.startsWith("atom") || intersected.name.includes("_hybrid_atom")) {
            console.log("Selected:", intersected.name);

            // Reset previous selection if any
            if (selectedAtom) {
                selectedAtom.material.color.set(0xa2b9c4); // Reset to default color
            }

            // Highlight the newly selected atom
            selectedAtom = intersected;
            selectedAtom.material.color.set(0xFFF59D); // Highlight color

            // Update `currentAtom` to the selected one
            currentAtom = selectedAtom;

            // Log associated orbitals
            const associatedOrbitals = scene.children.filter(obj => obj.parentAtom === selectedAtom.name);
            console.log("Associated Orbitals:", associatedOrbitals);
        }
            


            selectedAtom = intersects[0].object; // Get the first intersected object
            selectedAtom.material.color.set(0xFFF59D); // Highlight the selected atom
            currentAtom = selectedAtom;

            isDragging = true;
            controls.enabled = false;
            dragStartX = event.clientX;

    }
    
    
    if  (dragMode === "rotate") {
    
        isDragging = true;
        controls.enabled = false;
    }

    
    
}

let dragMode = null; // Modes: "move" or "rotate"

function onPointerMove(event) {

   //if (!isDragging || !selectedAtom) return;
   if (!selectedAtom) return;
   if (!isDragging ) return;

        //if (isDragging) {
        detectOrbitalIntersections();
    //}
  if (dragMode === "move") {

    // Calculate the change in mouse x position
    const deltaX = (event.clientX - dragStartX) * 0.01; // Scale to scene units
    dragStartX = event.clientX;

    const dragAxis = selectedAtom.axis || new THREE.Vector3(1, 0, 0); //
 // Determine the axis to move along
    // Invert direction only if the axis is not the default X-axis
    const scalar = dragAxis.equals(new THREE.Vector3(1, 0, 0)) ? deltaX : -deltaX;
    const constrainedDelta = dragAxis.clone().multiplyScalar(scalar);

    // Update the atom's position along the constrained axis
    selectedAtom.position.add(constrainedDelta);
    // Update the atom's position along the x-axis
    //selectedAtom.position.x += deltaX;

    // Update associated orbitals
    const associatedOrbitals = scene.children.filter(obj => obj.parentAtom === selectedAtom.name);
    associatedOrbitals.forEach(orbital => {
        //orbital.position.x += deltaX;
        orbital.position.add(constrainedDelta);
    });

    render();
    
   } else if (dragMode === "rotate") {
        console.log("rortate");
        // Rotate Mode: Apply rotation based on mouse movement
        const deltaX = event.clientX - dragStartX;
        const deltaY = event.clientY - dragStartY;

        const rotationAngleX = deltaY * 0.01; // Vertical drag -> rotation around X-axis
        const rotationAngleY = deltaX * 0.01; // Horizontal drag -> rotation around Y-axis

        rotateOrbitalsAndAxes(selectedAtom, selectedAtom.axis, rotationAngleX); // Rotate around X-axis
        //rotateOrbitalsAndAxes(selectedAtom, new THREE.Vector3(0, 1, 0), rotationAngleY); // Rotate around Y-axis

        // Update drag start positions for smooth rotation
        dragStartX = event.clientX;
        dragStartY = event.clientY;

        render();
   
   
   
   }
}

function onPointerUp() {


    console.log("POINTER UP");
    if (isDragging) {
        isDragging = false;
        //selectedAtom = null; // Clear the selected atom
        
        controls.enabled = true;
        
    }
}

//renderer.domElement.addEventListener("pointerdown", onMouseDown);        
        



function createPOrbitalLobe(lobecolor, axis, scaleFactor = 1, applyQuaternion = true) {
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
    //geometry.scale(scaleFactor, scaleFactor, scaleFactor); // Apply scaling to the entire geometry
    const material = new THREE.MeshBasicMaterial({ color: lobecolor, wireframe: true });

    //lobe.scale.set(scaleFactor, scaleFactor, scaleFactor);

    geometry.scale(scaleFactor, scaleFactor, scaleFactor);
    // Create a quaternion to rotate from y-axis to the axis
    const lobe = new THREE.Mesh(geometry, material); 
    if (applyQuaternion && axis) {
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 0), // Default orientation of the lobe
            axis.clone().normalize() // Target orientation
        );
        
        console.log(quaternion);
        
        lobe.applyQuaternion(quaternion);
    }
    

    

    //
    

    
    lobe.originalColor = new THREE.Color(lobecolor);
    
 // Apply scaling to the entire geometry

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

*/
/*
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

function setPOrbitalPosition(position, anglerotation, axisrotation, color, scalefactor = 1, applyQuaternion = true) {
    if (!currentAtom) return;

    // Create the orbital geometry
    const pLobe1 = createPOrbitalLobe(color, currentAtom.axis, scalefactor, applyQuaternion);

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
    
        // Apply rotation based on the axis
    //pLobe.rotation[axisRotation] = angleRotation;
    
    
    //update bounding box
    //pLobe1.geometry.computeBoundingSphere();
    pLobe1.updateMatrixWorld();

    //undoStack.push({
    //    type: "add",
    //    objectType: "p_orbital_lob",
    //    object: pLobe1,
    //});

    // Add to the scene
    scene.add(pLobe1);

    render();
    
    return pLobe1;
}


function setPOrbitalPosition2Rotation(position, anglerotation1, axisrotation1, anglerotation2, axisrotation2, color, scalefactor = 1, applyQuaternion = true) {
    if (!currentAtom) return;

    // Create the orbital geometry
    const pLobe1 = createPOrbitalLobe(color, currentAtom.axis, scalefactor, applyQuaternion);

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
    return pLobe1;
}


function addPOrbital() {
    if (!currentAtom /*|| pOrbitalCount >= 3*/) return;
    
    const addedObjects = [];
    
    
    //if(selectedAtom){
    //console.log("selectedAtom:", JSON.parse(JSON.stringify(selectedAtom)));
    //}
    
    //console.log("currentAtom:", currentAtom.name);
    
    
    if (selectedAtom) {currentAtom = selectedAtom;}

    const OrbitalsOnAtom = scene.children.filter(obj => obj.parentAtom === currentAtom.name);

    const totalpOrbitalsOnAtom = OrbitalsOnAtom.filter(obj => obj.name === 'p_orbital').length/2;

    // Create two lobes for the p orbital using the custom geometry function
    //const pLobe1 = createPOrbitalLobe();
    //const pLobe2 = createPOrbitalLobe();

    
    const x = currentAtom.position.x;
    const y = currentAtom.position.y;
    const z = currentAtom.position.z;



    //console.log(currentAtom);






    // Position and rotate the lobes along the appropriate axis
    if (totalpOrbitalsOnAtom === 0) { // Along the x-axis

        addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0xff0000, 1, true), addedObjects);
        addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0x0000ff, 1, true), addedObjects);
        
    } else if (totalpOrbitalsOnAtom === 1) { // Along the y-axis
	addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), 0, "x", 0xff0000, 1, true), addedObjects);
	//negative y
	addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), Math.PI, "z", 0x0000ff, 1, true), addedObjects);
        
        
    } else if (totalpOrbitalsOnAtom === 2) { // Along the z-axis
	//positive z
	addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), Math.PI/2, "x", 0xff0000, 1, true), addedObjects);
	//negative z
	addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "x", 0x0000ff, 1, true), addedObjects);
    }

    undoStack.push({
        type: "p_orbital",
        atom: selectedAtom,
        addedObjects: addedObjects
    });



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
    
    xAxis.name = "x-axis";
    scene.add(xAxis);
    //console.log(xAxis);
    
    const hitbox = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, length, 16), // Radius and height can be adjusted
        new THREE.MeshBasicMaterial({ visible: false }) // Invisible material
    );
    
    
    
    
    
    // Y-axis
    const yGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, axisLength, 0)
    ]);
    const yAxis = new THREE.Line(yGeometry, yMaterial);
    
    yAxis.name = "y-axis";
    
    
    
    
    scene.add(yAxis);

    // Z-axis
    const zGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, axisLength)
    ]);
    const zAxis = new THREE.Line(zGeometry, zMaterial);
    zAxis.name = "z-axis";
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



function addSp2Axes(atom, addedObjects = []) {
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
        line.axis = direction.clone().normalize(); 

        // Add to the scene
        scene.add(line);
        
        // Track the added object
        if (addedObjects) {
            addedObjects.push(line);
        }
        
        
        
    });

    render();
    
}



function addSp3Axes(atom, addedObjects = []) {
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
        line.axis = direction.clone().normalize(); 

        // Add to the scene
        scene.add(line);
        
                // Track the added object
        if (addedObjects) {
            addedObjects.push(line);
        }
        
        
    });

    render();
}




function addAndTrackObject(object, addedObjects) {
    addedObjects.push(object);
    return object;
}

// Add Hybridize Button Functionality
async function hybridizeOrbitals() {

   //console.log(JSON.parse(JSON.stringify(scene.children)));
   
   const addedObjects = [];
   
   //console.log(currentAtom);
   
    if (!selectedAtom) {selectedAtom = currentAtom;}
   
   
    const orbitalsOnAtom = scene.children.filter(obj => obj.parentAtom === selectedAtom.name);
    const totalPOrbitalsOnAtom = orbitalsOnAtom.filter(obj => obj.name === 'p_orbital').length/2;
    const totalSOrbitalsOnAtom = orbitalsOnAtom.filter(obj => obj.name === 's_orbital').length;

    //console.log(totalpOrbitalsOnAtom);

    
    const userSelection = await showHybridizationModal(totalSOrbitalsOnAtom, totalPOrbitalsOnAtom);
    
    
    const removedObjects = [];
    scene.children.forEach(child => {
        
        if (child.parentAtom == selectedAtom.name) {
            console.log("Object deleted:", child.name, "Parent Atom:", child.parentAtom);
            removedObjects.push(child);
        }
        
        
        
    });
    
    scene.children = scene.children.filter(obj => obj.parentAtom !== selectedAtom.name);
    
    const x = selectedAtom.position.x;
    const y = selectedAtom.position.y;
    const z = selectedAtom.position.z;
    

    if (totalPOrbitalsOnAtom === 1) { //atmost (2)sp
        // sp Hybridization (linear, two orbitals at 180 degrees)
        if (userSelection == "2sp") {
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff, 1,false), addedObjects); //blue
		
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000, hybridscale, false), addedObjects); //red
		
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0xff0000, hybridscale, false), addedObjects);
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0x0000ff, 1, false), addedObjects);
        }
        
        
        
        
    } else if (totalPOrbitalsOnAtom === 2) {//(3)sp2 or (2)sp / (1)p
        // sp² Hybridization (trigonal planar, three orbitals at 120 degrees)

        
        //(3) sp2 hybrid
        if (userSelection == "3sp2") {
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff, 1, false), addedObjects); //blue
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000,  hybridscale, 1), addedObjects); //red
		
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", Math.PI/3, "y",  0x0000ff, 1, false), addedObjects);
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", -2*Math.PI/3, "y",  0xff0000,  hybridscale, false), addedObjects);
		
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", -Math.PI/3, "y",  0x0000ff, 1, false), addedObjects);
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", +2*Math.PI/3, "y",  0xff0000,  hybridscale, 1), addedObjects);
		
		addAndTrackObject(addSp2Axes(selectedAtom), addedObjects);
	    addSp2Axes(selectedAtom, addedObjects);
		
        }
        
        //(2) sp2 hybrid and 1 p
        if (userSelection == "2sp_1p") {
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff, 1, false), addedObjects); //blue
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000, hybridscale, false), addedObjects); //red
		
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0xff0000, 1, false), addedObjects); //blue
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0x0000ff, hybridscale, false), addedObjects); //red
		
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), 0, "z", 0x0000ff, 1, false), addedObjects); //blue
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI, "z", 0xff0000, 1, false), addedObjects); //red
        }
        
        
        
        
        
    } else if (totalPOrbitalsOnAtom === 3) {//(4) sp3 or (3)sp2 / (1)p or (2)sp / (2)p  
        
        
        if (userSelection == "4sp3") {
        
		// (3) sp³ Hybridization (tetrahedral, four orbitals at ~109.5 degrees)
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff, 1, false), addedObjects); //blue
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000,  hybridscale, false), addedObjects); //red
		
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), 13*Math.PI/120, "z", 0, 0,  0x0000ff, 1, false), addedObjects);
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), -107*Math.PI/120, "z", 0, 0,  0xff0000,  hybridscale, false), addedObjects);
		
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), 13*Math.PI/120, "z", 80*Math.PI/120, "x", 0x0000ff, 1, false), addedObjects);
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), -13*Math.PI/120, "z", -40*Math.PI/120, "x",  0xff0000,  hybridscale, false), addedObjects);
		
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), 13*Math.PI/120, "z", -80*Math.PI/120, "x", 0x0000ff, 1, false), addedObjects);
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), -13*Math.PI/120, "z", 40*Math.PI/120, "x",  0xff0000,  hybridscale, false), addedObjects);
		
		
		addSp3Axes(selectedAtom, addedObjects);
		//addAtomsToSp3Axes(selectedAtom, distance = 2);
		
        }
        
        
        if (userSelection == "3sp2_1p") {
        
		// (3) sp2 hybrid with (1) p
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff, 1, false), addedObjects); //blue
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000, hybridscale, false), addedObjects); //red
		
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", Math.PI/3, "y",  0x0000ff, 1, false), addedObjects);
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", -2*Math.PI/3, "y",  0xff0000,  hybridscale, false), addedObjects);
		
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", -Math.PI/3, "y",  0x0000ff, 1, false), addedObjects);
		addAndTrackObject(setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", +2*Math.PI/3, "y",  0xff0000,  hybridscale, false), addedObjects);        
		//non hybrid p orbital
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), 0, "z", 0x0000ff, 1, false), addedObjects); //blue
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI, "z", 0xff0000, 1, false), addedObjects); //red
		
		addSp2Axes(selectedAtom, addedObjects);
		
        }
        
        if (userSelection == "2sp_2p") {
        
		// (2) sp hybrid with (2) p
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff, 1, false), addedObjects); //blue
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000,  hybridscale, false), addedObjects); //red
		
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0x0000ff, 1, false), addedObjects); //blue
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0xff0000,  hybridscale, false), addedObjects); //red
		
		
		//non hybrid p orbital along y
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), 0, "z", 0x0000ff, 1, false), addedObjects); //blue
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI, "z", 0xff0000, 1, false), addedObjects); //red
		
		//non hybrid p orbital along z
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "x", 0xff0000, 1, false), addedObjects); //blue
		addAndTrackObject(setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "x", 0x0000ff, 1, false), addedObjects); //red
        
        }


    }
    

    undoStack.push({
        type: "hybridization",
        atom: selectedAtom,
        addedObjects: addedObjects,
        removedObjects: removedObjects,
    });

   console.log("undoSTack in hybridize:", undoStack);


    
    //console.log(selectedAtom);
    //const delatoms = scene.children.filter(obj => obj.name && obj.name.match(/^atom\d+$/));
    
    //const regex = /^atom(\d+)$/;

    
    /*
    if (regex.test(selectedAtom.name)) {
        // Extract the number part and check if it's odd
        const match = selectedAtom.name.match(regex); // Extract the match
        const number = parseInt(match[1], 10); // Get the numeric part
        if (number % 2 === 1) { // Check if it's odd
            console.log("The name matches 'atom' with an odd number.");
            
            reflectOrbitals();
            
        } 
    } 
    */
    
    
    if (selectedAtom.name.includes("sp3_hybrid") || selectedAtom.name == "atom1") {
        reflectOrbitals();
    
    }
    
    
    
    
    
    
    render(); 
    
}


/*
// Function to create hybrid orbitals
function addHybridOrbital(direction) {
    const hybridLobe = createHybridOrbitalLobe();
    hybridLobe.position.copy(currentAtom.position).add(direction.multiplyScalar(atomRadius + hybridscale));
    hybridLobe.lookAt(currentAtom.position); // Orient toward atom
    hybridLobe.name = "orbital"; // Tag as orbital for filtering
    scene.add(hybridLobe);
    
    
    
}
*/

function showHybridizationModal(totalSOrbitals, totalPOrbitals) {

  return new Promise((resolve) => {
    const modal = document.getElementById('hybridizationModal');
    const optionsDiv = document.getElementById('options');
    const messageHTML = document.getElementById('message');
    optionsDiv.innerHTML = ''; // Clear existing options
    var message = '';
    //console.log(totalPOrbitals, totalSOrbitals);

    let options = [];
    
    if (totalSOrbitals) {
        if (totalPOrbitals === 3) {
                options = [
                    { label: '4 sp³ hybrid', value: '4sp3' },
                    { label: '3 sp² hybrid and 1 p', value: '3sp2_1p' },
                    { label: '2 sp hybrid and 2 p', value: '2sp_2p' }
                ];
                
                message =  "Select a hybridization scheme for the one s orbital and three p orbitals.";
        
            //options = ['4 sp³ hybrid', '3 sp² hybrid and 1 p', '2 sp hybrid and 2 p'];
        } else if (totalPOrbitals === 2) {
            //options = ['3 sp² hybrid', '2 sp hybrid and 1 p'];
                options = [
                    { label: '3 sp² hybrid', value: '3sp2' },
                    { label: '2 sp hybrid and 1 p', value: '2sp_1p' }
                ];
                message =  "Select a hybridization scheme for the one s orbital and two p orbitals.";
        
        
        } else if (totalPOrbitals === 1) {
            //options = ['2 sp hybrid'];
                options = [{ label: '2 sp hybrid', value: '2sp' }];
                message =  "This atom has one s orbital and one p orbital. You can form two sp hybrid orbitals.";
        
        } else if (totalPOrbitals === 0) {
        
                message =  "There are no orbitals on this atom to hybridize! Please add an s orbital and one or more p orbitals first.";
        }
    } else {
    
                message = "This atom has no s orbital. Please add an s orbital first.";
    }

    //console.log(message);

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
    //console.log('User selected:', option);
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
    
    
    
    

    // Find all orbitals and atoms associated with the selected atom
    const associatedObjs = scene.children.filter(obj => obj.parentAtom === selectedAtom.name);

    
    //console.log("Associated Orbitals:", associatedObjs);

    if (associatedObjs.length === 0) {
        console.log("No orbitals found for the selected atom.");
        return;
    }

    // Reflect each orbital through the atom's center
    const atomPosition = selectedAtom.position.clone();
    
    
     // Reflect all associated atoms
    const associatedAtoms = scene.children.filter(obj =>
        obj.parentAtom === selectedAtom.name && obj.name.includes("sp3_hybrid")
    );

    associatedAtoms.forEach(atom => {
        if (atom.position) {
            // Reflect atom position
            atom.position.x = 2 * atomPosition.x - atom.position.x;
            atom.position.y = 2 * atomPosition.y - atom.position.y;
            atom.position.z = 2 * atomPosition.z - atom.position.z;

            console.log("Reflected Atom:", atom.name, "New Position:", atom.position);
        }
    });
    
    
    // Reflect all associated orbitals
    const associatedOrbitals = scene.children.filter(obj =>
        obj.parentAtom === selectedAtom.name && !obj.name.includes("sp3_hybrid")
    );

    associatedOrbitals.forEach(orbital => {
        /*
        if (orbital.position) {
            // Reflect orbital position (global space)
            orbital.position.x = 1 * atomPosition.x - orbital.position.x;
            orbital.position.y = 1 * atomPosition.y - orbital.position.y;
            orbital.position.z = 1 * atomPosition.z - orbital.position.z;

            console.log("Reflected Orbital Position:", orbital.name, orbital.position);
        }
        */

        if (orbital.geometry && orbital.geometry instanceof THREE.BufferGeometry) {
            const geometry = orbital.geometry;
            const positions = geometry.attributes.position.array;

            for (let i = 0; i < positions.length; i += 3) {
                // Get vertex position in global space
                const globalVertexX = orbital.position.x + positions[i];
                const globalVertexY = orbital.position.y + positions[i + 1];
                const globalVertexZ = orbital.position.z + positions[i + 2];

                // Reflect vertex globally
                const reflectedGlobalX = 2 * atomPosition.x - globalVertexX;
                const reflectedGlobalY = 2 * atomPosition.y - globalVertexY;
                const reflectedGlobalZ = 2 * atomPosition.z - globalVertexZ;

                // Convert back to local space
                positions[i] = reflectedGlobalX - orbital.position.x;
                positions[i + 1] = reflectedGlobalY - orbital.position.y;
                positions[i + 2] = reflectedGlobalZ - orbital.position.z;
            }

            // Update geometry
            geometry.attributes.position.needsUpdate = true;
            geometry.computeBoundingSphere();
            geometry.computeVertexNormals();
        }
    });
    //console.log("Reflected orbitals for atom:", selectedAtom.name);
    //render();
}

function removeAllObjects() {
    // Filter out all orbitals from the scene
    
    //console.log(JSON.parse(JSON.stringify(scene.children)));
    const orbitals = scene.children.filter(obj => obj.name === "p_orbital" || obj.name === "s_orbital");
    const delatoms = scene.children.filter(obj => obj.name && obj.name.match(/^atom\d+$/));
    // Remove each orbital from the scene
    orbitals.forEach(orbital => scene.remove(orbital));
    delatoms.forEach(atom => scene.remove(atom));
    atoms = [];
    //console.log(atoms);
    //console.log(`${orbitals.length} orbitals removed.`);
    render(); // Update the scene
}


function deleteSelectedAtomAndAssociatedObjects() {
    if (!selectedAtom) {
        console.log("No atom selected to delete.");
        return;
    }

    // Log the selected atom for debugging
    console.log("Deleting selected atom:", selectedAtom.name);

    // Find and delete all associated orbitals and sp3 hybrid atoms
    const objectsToDelete = scene.children.filter(obj =>
        obj.parentAtom === selectedAtom.name || // Associated orbitals
        obj.name.includes(selectedAtom.name + "_sp3_hybrid") // Associated sp3 hybrid atoms
    );

    // Add the selected atom itself to the list of objects to delete
    objectsToDelete.push(selectedAtom);

    // Remove all objects from the scene
    objectsToDelete.forEach(obj => {
        console.log("Deleting object:", obj.name);
        scene.remove(obj);
    });

    // Remove any axes related to the atom (assuming axes have identifiable names or properties)
    const axesToDelete = scene.children.filter(obj => 
        obj.name && obj.name.includes(selectedAtom.name + "_axis")
    );

    axesToDelete.forEach(axis => {
        console.log("Deleting axis:", axis.name);
        scene.remove(axis);
    });

    // Reset the selectedAtom to null
    selectedAtom = null;

    // Re-render the scene
    render();

            console.log(scene.children);

    console.log("Deleted selected atom and all associated objects.");
}



// Toggle state to track whether the mode is active
let isAddAtomModeActive = false;

// Function to toggle the state
function toggleAddAtomMode() {
    dragMode = "rotate";
    isAddAtomModeActive = !isAddAtomModeActive;

    // Update button appearance
    const button = document.getElementById("toggleAddAtomButton");
    button.textContent = isAddAtomModeActive ? "Add Atom Mode: ON" : "Add Atom Mode: OFF";

    if (isAddAtomModeActive) {
        setCanvasMessage("You are in atom add mode. Click an axis to add an atom to it.");
    } else {
        setCanvasMessage('');
    }


    console.log("Add Atom Mode is now", isAddAtomModeActive ? "ACTIVE" : "INACTIVE");
}


let isRotateModeActive = false; // Track whether rotation mode is active

function toggleRotateMode() {
    isRotateModeActive = !isRotateModeActive; // Toggle rotation mode state

    if (isRotateModeActive) {
    
        setCanvasMessage("You are in rotate mode. Click an atom and then use the mousewheel or click drag to rotate about its axis.");
    
        dragMode = "rotate"; // Set the drag mode to rotate
        controls.enabled = false; // Disable OrbitControls
        controls.enableZoom = false;
        console.log("Rotation mode enabled.");
    } else {
        //dragMode = "move"; // Reset drag mode to move
        controls.enabled = true; // Re-enable OrbitControls
        controls.enableZoom = true;
        console.log("Rotation mode disabled.");
        setCanvasMessage();
    }

    // Update button text dynamically
    const button = document.getElementById("rotateModeButton");
    button.textContent = isRotateModeActive ? "Rotate Mode: ON" : "Rotate Mode: OFF";
}



function onMouseWheel(event) {
    if (dragMode !== "rotate") return;
    console.log(event);
    if (!selectedAtom) return; // No atom selected

    // Determine rotation angle based on wheel delta
    const delta = event.deltaY > 0 ? -Math.PI / 36 : Math.PI / 36; // 5 degrees per scroll step

    // Define the rotation axis (e.g., y-axis for now)
    const rotationAxis = new THREE.Vector3(0, 1, 0); // Rotate around y-axis
    rotateOrbitalsAndAxes(selectedAtom, selectedAtom.axis, delta);
}

window.addEventListener("wheel", onMouseWheel);



function rotateOrbitalsAndAxes(atom, axis, angle) {
    if (!atom) {
        console.log("No atom provided for rotation.");
        return;
    }

    // Normalize the rotation axis
    const normalizedAxis = axis.clone().normalize();

    // Collect associated objects (orbitals and axes)
    const associatedObjects = scene.children.filter(obj => obj.parentAtom === atom.name);

    if (associatedObjects.length === 0) {
        console.log("No associated objects found for atom:", atom.name);
        return;
    }

    // Create a rotation matrix
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis(normalizedAxis, angle);

    // Rotation origin (atom's position)
    const origin = atom.position.clone();

    // Rotate each associated object
    associatedObjects.forEach(obj => {
        console.log("Rotating object:", obj.name);

        // Handle LatheGeometry vertices
        if (obj.geometry && obj.geometry instanceof THREE.BufferGeometry) {
            const positions = obj.geometry.attributes.position.array;

            for (let i = 0; i < positions.length; i += 3) {
                const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);

                // Translate to the origin
                vertex.sub(origin);

                // Apply rotation
                vertex.applyMatrix4(rotationMatrix);

                // Translate back
                vertex.add(origin);

                // Update the vertex position
                positions[i] = vertex.x;
                positions[i + 1] = vertex.y;
                positions[i + 2] = vertex.z;
            }

            // Mark geometry as needing an update
            obj.geometry.attributes.position.needsUpdate = true;
            obj.geometry.computeBoundingSphere(); // Optional: Recompute bounds
        } else if (obj.position) {
            // Handle objects with positions (e.g., axes)
            obj.position.sub(origin);
            obj.position.applyMatrix4(rotationMatrix);
            obj.position.add(origin);
        }

        // Rotate axis direction if the object has one
        if (obj.axis) {
            obj.axis.applyMatrix4(rotationMatrix).normalize();
        }
    });

    console.log(`Rotated ${associatedObjects.length} objects around axis:`, normalizedAxis);

    render(); // Ensure the scene updates
}

/*

function rotateOrbitalsAndAxes(atom, axis, angle) {
    if (!atom) {
        console.log("No central atom provided for rotation.");
        return;
    }

    // Ensure the axis is normalized
    const normalizedAxis = axis.clone().normalize();

    // Collect orbitals and axes associated with the atom
    const associatedObjects = scene.children.filter(
        obj => obj.parentAtom === atom.name
    );

    if (associatedObjects.length === 0) {
        console.log("No associated orbitals or axes found for atom:", atom.name);
        return;
    }

    // Create a rotation matrix
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis(normalizedAxis, angle);

    // Central atom's position as the rotation origin
    const origin = atom.position.clone();
    console.log(JSON.parse(JSON.stringify(associatedObjects)));

    
    // Rotate each associated object
    associatedObjects.forEach(obj => {
        // Translate the object to the origin
        obj.position.sub(origin);

        // Apply the rotation matrix
        obj.position.applyMatrix4(rotationMatrix);

        // Translate the object back to its original position
        obj.position.add(origin);

        // Rotate the object's axis direction if it has one
        if (obj.axis) {
            obj.axis.applyMatrix4(rotationMatrix).normalize();
        }
    });
    
    
    associatedObjects.forEach(obj => {
    console.log("Before rotation:", obj.name, obj.position.clone());
    obj.position.sub(origin); // Move to origin
    obj.position.applyMatrix4(rotationMatrix); // Rotate
    obj.position.add(origin); // Move back
    console.log("After rotation:", obj.name, obj.position.clone());

    if (obj.axis) {
        console.log("Before axis rotation:", obj.name, obj.axis.clone());
        obj.axis.applyMatrix4(rotationMatrix).normalize();
        console.log("After axis rotation:", obj.name, obj.axis.clone());
    }
    });
    
    
    

    console.log(`Rotated ${associatedObjects.length} objects around axis:`, normalizedAxis);

    render(); // Update the scene
}
*/

/*
// Enable Rotation Mode
function enableRotationMode() {
    dragMode = "rotate";
    isRotating = true;
    controls.enabled = false; // Disable OrbitControls
    controls.enableZoom = false; // Temporarily disable zoom
    //if (selectedAtom) {
        //highlightSelectedAtom(selectedAtom); // Highlight the selected atom
    //}
    document.getElementById("rotateModeButton").textContent = "Disable Rotation Mode";
    console.log("Rotation mode enabled.");
}*/
// Add toggle functionality to the button

/*
document.getElementById("rotateModeButton").addEventListener("click", () => {
    if (isRotating) {
        disableRotationMode();
    } else {
        enableRotationMode();
    }
});
*/

/*
// Disable Rotation Mode
function disableRotationMode() {
    dragMode = null;
    isRotating = false;
    controls.enableZoom = true; // Re-enable zoom
    controls.enabled = true; // Disable OrbitControls
    //if (selectedAtom) {
    //    resetHighlight(selectedAtom); // Reset atom highlight
    //}
    document.getElementById("rotateModeButton").textContent = "Enable Rotation Mode";
    console.log("Rotation mode disabled.");
}
*/

// Function to handle clicks on the scene
function onSceneClick(event) {
    if (!isAddAtomModeActive) return; // Do nothing if mode is inactive

    // Raycast to detect clicked objects
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Intersect with all objects in the scene
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
    
        console.log("Intersects array:", intersects);
        const proximityThreshold = 0.05;
        

        
        //const clickedObject = intersects[0].object;
        
        
        
        
        for (const intersect of intersects) {
        
                const clickedObject = intersect.object;
                // Check if the clicked object is a hybrid axis or x-axis
                if (
                    
                
                    clickedObject.name.includes("sp3_axis") ||
                    clickedObject.name.includes("sp2_axis") ||
                    clickedObject.name.includes("x-axis")
                ) {
                    console.log("Clicked on axis:", clickedObject.name);            
                    console.log(atoms);
                    
                    //const axisOrigin = clickedObject.position || new THREE.Vector3(0, 0, 0); // Default position
                    //const axisDirection = clickedObject.axis || new THREE.Vector3(1, 0, 0); // Default to x-axis



                    
                    let axisOrigin, axisDirection;
                    
                    if (clickedObject.name.includes("x-axis")) {
                        axisOrigin = new THREE.Vector3(0, 0, 0); // x-axis origin at (0,0,0)
                        axisDirection = new THREE.Vector3(1, 0, 0); // x-axis direction
                    } else if (clickedObject.name.includes("sp3_axis")) {
                    
                        //console.log(clickedObject);
                        const centralAtom = scene.getObjectByName(clickedObject.parentAtom);
                        //console.log(centralAtom);
                    
                        axisOrigin = centralAtom.position.clone(); // Central atom's position
                        axisDirection = clickedObject.axis.clone(); // Use the axis vector from the clicked object
                    } else if (clickedObject.name.includes("sp2_axis")) {
                        const centralAtom = scene.getObjectByName(clickedObject.parentAtom);
                        axisOrigin = centralAtom.position.clone(); // Central atom for sp2
                        axisDirection = clickedObject.axis.clone(); // Use the axis vector from the clicked object
                    }
                    

                    //const axisOrigin = closestPointOnAxis || new THREE.Vector3(0, 0, 0); // Default position
                    const clickedPoint = intersect.point; // Exact click position
                    const closestPointOnAxis = calculateClosestPointOnAxis(clickedPoint, axisOrigin, axisDirection);
                    
                    const distanceToAxis = clickedPoint.distanceTo(closestPointOnAxis);
 
                    if (distanceToAxis <= proximityThreshold) {
                    
                       console.log(`Close enough to axis: ${clickedObject.name}, distance: ${distanceToAxis}`);

                         //if(atoms.length == 2) return;
                        let geometry = new THREE.SphereGeometry(atomRadius, 16, 16);
                        let material = new THREE.MeshBasicMaterial({ color: 0xa2b9c4 });
                        let atom = new THREE.Mesh(geometry, material);
                        
                        //atom.position.set(x, y, z);
                        atom.name = 'atom'+atoms.length;
                        atom.axis = clickedObject.axis;
                        
                        
                        atom.position.copy(closestPointOnAxis);
                        
                        atoms.push(atom);
                        
                        scene.add(atom);
                        console.log("Added atom:", atom.name, "on axis:", clickedObject.name);

                        // Exit the loop and the function immediately
                        return;
                    
                    
                    }
                    
                    
                   

                }

            
        }
        


    }
}


// Utility function to calculate the closest point on an axis
function calculateClosestPointOnAxis(point, axisOrigin, axisDirection) {

    console.log(point, axisOrigin, axisDirection);
    const pointToOrigin = point.clone().sub(axisOrigin); // Vector from axis origin to point
    console.log(pointToOrigin);
    const projection = pointToOrigin.clone().projectOnVector(axisDirection); // Project onto axis
    return axisOrigin.clone().add(projection); // Closest point on axis
}



window.addEventListener("dblclick", onSceneClick);





function undo() {

    console.log("undoSTack:", undoStack); 

    if (undoStack.length === 0) {
        console.log("Nothing to undo.");
        return;
    }

    const lastAction = undoStack.pop();
    
    console.log(lastAction);
    
    redoStack.push(lastAction); // Save the action to the redo stack

    if (lastAction.type === "atom" || lastAction.type === "s_orbital") {
        // Remove the object from the scene
        scene.remove(lastAction.object);
        console.log("Undid add action:", lastAction.object);
        //atoms.pop();
    } else if (lastAction.type === "delete") {
        // Re-add the deleted object to the scene
        scene.add(lastAction.object);
        console.log("Undid delete action:", lastAction.object);
    } else if (lastAction.type === "hybridization") {
    
        // Remove the added objects
        lastAction.addedObjects.forEach(obj => {
            scene.remove(obj);
        });

        // Re-add the removed objects
        lastAction.removedObjects.forEach(obj => {
            scene.add(obj);
        });

        console.log("Undid hybridization for atom:", lastAction.atom.name);
    
    
    } else if (lastAction.type === "p_orbital") {
    console.log(scene.children, atoms);
            // Remove the added objects
        lastAction.addedObjects.forEach(obj => {
            scene.remove(obj);
        });
    
    

    }
    render();
}

function redo() {
    if (redoStack.length === 0) {
        console.log("Nothing to redo.");
        return;
    }

    const lastAction = redoStack.pop();
    undoStack.push(lastAction); // Save the action to the undo stack

    if (lastAction.type === "atom" || lastAction.type === "s_orbital") {
        // Re-add the object to the scene
        scene.add(lastAction.object);
        console.log("Redid add action:", lastAction.object);
    } else if (lastAction.type === "delete") {
        // Remove the object from the scene
        scene.remove(lastAction.object);
        console.log("Redid delete action:", lastAction.object);
    } else if (lastAction.type === "hybridization") {
    
        // Remove the re-added objects
        lastAction.removedObjects.forEach(obj => {
            scene.remove(obj);
        });

        // Re-add the hybridized objects
        lastAction.addedObjects.forEach(obj => {
            scene.add(obj);
        });

        console.log("Redid hybridization for atom:", lastAction.atom.name);
    
    
    } else if (lastAction.type === "p_orbital") {
    console.log(scene.children, atoms);
            // Remove the added objects
        lastAction.addedObjects.forEach(obj => {
            scene.add(obj);
        });
    
    

    }
    
    
    

    render();
}




// Add the toggle button to the UI
//const button = document.createElement("button");
//button.id = "toggleAddAtomButton";
//button.textContent = "Add Atom Mode: OFF";
//button.style.position = "absolute";
//button.style.top = "10px";
//button.style.left = "10px";
//button.addEventListener("click", toggleAddAtomMode);
//const controlDiv = document.getElementById('controls');

//controlDiv.appendChild(button);

// Add the click event listener for the scene



function setCanvasMessage(message) {
    const messageDiv = document.getElementById("canvasMessage");

    if (!message || message.trim() === "") {
        // Fade out and hide after the specified duration
        messageDiv.style.opacity = 0;
        setTimeout(() => {
            messageDiv.style.display = "none";
        }, 500); // Match the CSS transition duration (500ms)
    } else {
        // Show the message div and update the text
        messageDiv.style.display = "block";
        messageDiv.style.opacity = 1; // Ensure it's fully visible
        messageDiv.textContent = message;

        // Automatically clear after a duration (optional)
        if (duration > 0) {
            setTimeout(() => setCanvasMessage(""), duration);
        }
    }
    
    
    
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
    //console.log(scene.children);

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



