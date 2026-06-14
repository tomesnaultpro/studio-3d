import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// 1. Configuration de la Scène
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);

// 2. Configuration des contrôles (Optimisés Souris + Pad)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.zoomSpeed = 0.6; // Plus doux pour les trackpads/pads

// 3. Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 3.5); 
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 4.0); 
dirLight.position.set(30, 50, 30);
scene.add(dirLight);

const cameraLight = new THREE.PointLight(0xffffff, 10.0, 100);
camera.add(cameraLight);
scene.add(camera);

// 4. Base de données
const equipmentsData = {
    "ExempleNomDeBlender": { 
        title: "Mon Équipement", 
        desc: "Description !" 
    }
};

// 5. Chargement 3D et Centrage Automatique Rationnel
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);

let selectableObjects = [];

loader.load(
    'studio.glb', 
    (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // --- CALCUL DU CENTRAGE ET DU ZOOM AUTOMATIQUE ---
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // On recentre le modèle au point (0,0,0) virtuel
        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);

        // On recule la caméra proportionnellement à la taille du modèle
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        cameraZ *= 1.8; // Recul de sécurité pour tout voir au début
        camera.position.set(0, maxDim * 0.8, cameraZ);
        
        controls.target.set(0, 0, 0);
        controls.maxDistance = cameraZ * 3;
        controls.minDistance = maxDim * 0.2;
        // --------------------------------------------------

        model.traverse((child) => {
            if (child.isMesh) {
                selectableObjects.push(child);
            }
        });
        console.log("Studio centré et configuré au pixel près !");
    },
    undefined,
    (error) => {
        console.error("Erreur :", error);
    }
);

// 6. Clics
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    if (event.target.closest('#info-box')) return; 

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(selectableObjects);

    if (intersects.length > 0) {
        let hitObject = intersects[0].object;
        alert("Tu as cliqué sur l'objet nommé : " + hitObject.name);

        let foundData = null;
        let current = hitObject;
        while (current) {
            if (equipmentsData[current.name]) {
                foundData = equipmentsData[current.name];
                break;
            }
            current = current.parent;
        }

        if (foundData) {
            document.getElementById('info-title').innerText = foundData.title;
            document.getElementById('info-description').innerText = foundData.desc;
            document.getElementById('info-box').style.display = 'block';
        }
    }
});

document.getElementById('close-btn').addEventListener('click', () => {
    document.getElementById('info-box').style.display = 'none';
});

// 7. Animation
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// 8. Redimensionnement fluide et plein écran dynamique
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
