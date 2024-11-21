// Three.js setup
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
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
            //FFF59D
            selectedAtom.material.color.set(0xa2b9c4);
        }

        selectedAtom = intersects[0].object; // Get the first intersected object
        selectedAtom.material.color.set(0xFFF59D); // Highlight the selected atom
        currentAtom = selectedAtom;

        //console.log("Selected Atom:", selectedAtom.position);
    }
}


renderer.domElement.addEventListener("pointerdown", onMouseDown);        
        



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
    const geometry = new THREE.LatheGeometry(points, 32); // 32 segments for smoothness

    const material = new THREE.MeshBasicMaterial({ color: lobecolor, wireframe: true });
    const lobe = new THREE.Mesh(geometry, material);
    lobe.scale.set(scaleFactor, scaleFactor, scaleFactor);


    return lobe;
}



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


function addPOrbital() {
    if (!currentAtom /*|| pOrbitalCount >= 3*/) return;
    if (!selectedAtom) {selectedAtom = currentAtom;}
    
    //console.log(selectedAtom.name);
    
    //console.log(scene.children);
    
    const OrbitalsOnAtom = scene.children.filter(obj => obj.parentAtom === selectedAtom.name);
    //console.log(OrbitalsOnAtom);
    const totalpOrbitalsOnAtom = OrbitalsOnAtom.filter(obj => obj.name === 'p_orbital').length/2;
    //console.log(totalpOrbitalsOnAtom);
    

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
   
    if (!selectedAtom) {selectedAtom = currentAtom;}
   
   
    const orbitalsOnAtom = scene.children.filter(obj => obj.parentAtom === selectedAtom.name);
    const totalpOrbitalsOnAtom = orbitalsOnAtom.filter(obj => obj.name === 'p_orbital').length/2;

    console.log(totalpOrbitalsOnAtom);

    
    const userSelection = await showHybridizationModal(totalpOrbitalsOnAtom);
    
    console.log(userSelection);
    

    // Remove existing orbitals before hybridizing
    scene.children = scene.children.filter(obj => obj.name !== "p_orbital");
    scene.children = scene.children.filter(obj => obj.name !== "s_orbital");
    
    const x = selectedAtom.position.x;
    const y = selectedAtom.position.y;
    const z = selectedAtom.position.z;
    

    if (totalpOrbitalsOnAtom === 1) { //atmost (2)sp
        // sp Hybridization (linear, two orbitals at 180 degrees)
        if (userSelection == "2sp") {
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000, 0.5); //red
		
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0xff0000, 0.5); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0x0000ff); //red
        }
        
        
        
        
    } else if (totalpOrbitalsOnAtom === 2) {//(3)sp2 or (2)sp / (1)p
        // sp² Hybridization (trigonal planar, three orbitals at 120 degrees)

        
        //(3) sp2 hybrid
        if (userSelection == "3sp2") {
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000,  0.5); //red
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", Math.PI/3, "y",  0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", -2*Math.PI/3, "y",  0xff0000,  0.5);
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", -Math.PI/3, "y",  0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", +2*Math.PI/3, "y",  0xff0000,  0.5);   
        }
        
        //(2) sp2 hybrid and 1 p
        if (userSelection == "2sp_1p") {
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000, 0.5); //red
		
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0xff0000); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0x0000ff, 0.5); //red
		
		setPOrbitalPosition(new THREE.Vector3(x, y, z), 0, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI, "z", 0xff0000); //red
        }
        
        
        
        
        
    } else if (totalpOrbitalsOnAtom === 3) {//(4) sp3 or (3)sp2 / (1)p or (2)sp / (2)p  
        
        
        if (userSelection == "4sp3") {
        
		// (3) sp³ Hybridization (tetrahedral, four orbitals at ~109.5 degrees)
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000,  0.5); //red
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), 13*Math.PI/120, "z", 0, 0,  0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), -107*Math.PI/120, "z", 0, 0,  0xff0000,  0.5);
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), 13*Math.PI/120, "z", 80*Math.PI/120, "x", 0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), -13*Math.PI/120, "z", -40*Math.PI/120, "x",  0xff0000,  0.5);
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), 13*Math.PI/120, "z", -80*Math.PI/120, "x", 0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), -13*Math.PI/120, "z", 40*Math.PI/120, "x",  0xff0000,  0.5);
		
        }
        
        
        if (userSelection == "3sp2_1p") {
        
		// (3) sp2 hybrid with (1) p
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000); //red
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", Math.PI/3, "y",  0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", -2*Math.PI/3, "y",  0xff0000,  0.5);
		
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", -Math.PI/3, "y",  0x0000ff);
		setPOrbitalPosition2Rotation(new THREE.Vector3(x, y, z), +Math.PI/2, "z", +2*Math.PI/3, "y",  0xff0000,  0.5);        
		//non hybrid p orbital
		setPOrbitalPosition(new THREE.Vector3(x, y, z), 0, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI, "z", 0xff0000); //red
		
        }
        
        if (userSelection == "2sp_2p") {
        
		// (2) sp hybrid with (2) p
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0xff0000,  0.5); //red
		
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "z", 0xff0000); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "z", 0x0000ff,  0.5); //red
		
		
		//non hybrid p orbital along y
		setPOrbitalPosition(new THREE.Vector3(x, y, z), 0, "z", 0x0000ff); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI, "z", 0xff0000); //red
		
		//non hybrid p orbital along z
		setPOrbitalPosition(new THREE.Vector3(x, y, z), -Math.PI/2, "x", 0xff0000); //blue
		setPOrbitalPosition(new THREE.Vector3(x, y, z), +Math.PI/2, "x", 0x0000ff); //red
        
        }


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


function showHybridizationModal(totalpOrbitals) {

  return new Promise((resolve) => {
    const modal = document.getElementById('hybridizationModal');
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = ''; // Clear existing options

    console.log(totalpOrbitals);

    let options = [];
    if (totalpOrbitals === 3) {
            options = [
                { label: '4 sp³ hybrid', value: '4sp3' },
                { label: '3 sp² hybrid and 1 p', value: '3sp2_1p' },
                { label: '2 sp hybrid and 2 p', value: '2sp_2p' }
            ];
    
        //options = ['4 sp³ hybrid', '3 sp² hybrid and 1 p', '2 sp hybrid and 2 p'];
    } else if (totalpOrbitals === 2) {
        //options = ['3 sp² hybrid', '2 sp hybrid and 1 p'];
            options = [
                { label: '3 sp² hybrid', value: '3sp2' },
                { label: '2 sp hybrid and 1 p', value: '2sp_1p' }
            ];

    
    
    } else if (totalpOrbitals === 1) {
        //options = ['2 sp hybrid'];
            options = [{ label: '2 sp hybrid', value: '2sp' }];
    
    }

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

    modal.style.display = 'block';

  });

}

function closeModal() {
    const modal = document.getElementById('hybridizationModal');
    modal.style.display = 'none';
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
render();



