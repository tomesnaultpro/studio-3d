import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// 1. Configuration de la Scène
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0d11);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);

// 2. Configuration des contrôles (Boostés pour la vitesse et le tactile)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1; // Plus réactif (de 0.05 à 0.1)
controls.zoomSpeed = 1.8;     // Zoom beaucoup plus rapide (de 0.6 à 1.8)
controls.rotateSpeed = 1.5;   // Rotation plus rapide de la caméra

// 3. Lumières globales puissantes
const ambientLight = new THREE.AmbientLight(0xffffff, 3.5); 
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 4.0); 
dirLight.position.set(30, 50, 30);
scene.add(dirLight);

const cameraLight = new THREE.PointLight(0xffffff, 8.0, 100);
camera.add(cameraLight);
scene.add(camera);

// 4. DICTIONNAIRE DE BASE (En attente de tes vrais noms !)
const descriptionsData = {
    "sofa": { title: "Canapé", desc: "Espace détente du studio." },
    "drum": { title: "Batterie", desc: "Batterie acoustique complète." }
};

// LISTE NOIRE : Les objets à ignorer totalement lors d'un clic
const ignoredObjects = ["fond_lateral", "sol", "cube001"];

// 5. Chargement 3D et Centrage Automatique
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

        // Centrage automatique basé sur la taille du studio
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        cameraZ *= 1.5; 
        camera.position.set(maxDim * 0.3, maxDim * 0.6, cameraZ);
        
        controls.target.set(0, 0, 0);
        controls.maxDistance = cameraZ * 3;
        controls.minDistance = maxDim * 0.1;

        model.traverse((child) => {
            if (child.isMesh) {
                // On n'ajoute pas à la liste des objets cliquables s'ils sont dans la liste noire
                const meshNameLower = child.name.toLowerCase();
                const isIgnored = ignoredObjects.some(ignored => meshNameLower.includes(ignored));
                
                if (!isIgnored) {
                    selectableObjects.push(child);
                }
            }
        });
        console.log("Studio mobile & rapide initialisé !");
    },
    undefined,
    (error) => {
        console.error("Erreur :", error);
    }
);

// 6. Détection des clics (Gère le clic souris + le toucher tactile)
function handleInteraction(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(selectableObjects);

    if (intersects.length > 0) {
        let hitObject = intersects[0].object;
        let finalData = null;
        let current = hitObject;

        // Remontée des parents pour l'identification
        while (current && current !== scene) {
            let nameLower = current.name.toLowerCase();
            
            for (const key in descriptionsData) {
                if (nameLower.includes(key)) {
                    finalData = descriptionsData[key];
                    break;
                }
            }
            if (finalData) break;
            current = current.parent;
        }

        if (finalData) {
            document.getElementById('info-title').innerText = finalData.title;
            document.getElementById('info-description').innerText = finalData.desc;
            document.getElementById('info-box').classList.add('active');
        } else {
            // Si l'objet n'a pas encore sa description personnalisée
            document.getElementById('info-title').innerText = "Élément du Studio";
            document.getElementById('info-description').innerText = `Cet objet porte le nom technique "${hitObject.name}".`;
            document.getElementById('info-box').classList.add('active');
        }
    } else {
        // Si on clique dans le vide (ou sur un objet ignoré), on ferme la box
        document.getElementById('info-box').classList.remove('active');
    }
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Écouteur pour la souris
window.addEventListener('click', (event) => {
    if (event.target.closest('#info-box') || event.target.closest('.site-header')) return; 
    handleInteraction(event.clientX, event.clientY);
});

// Écouteur pour les écrans tactiles (Téléphone / Tablette)
window.addEventListener('touchend', (event) => {
    if (event.target.closest('#info-box') || event.target.closest('.site-header')) return;
    // Empêche le déclenchement de clics fantômes
    if (event.changedTouches.length > 0) {
        handleInteraction(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }
});

document.getElementById('close-btn').addEventListener('click', () => {
    document.getElementById('info-box').classList.remove('active');
});

// 7. Boucle d'animation
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// 8. Redimensionnement
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
