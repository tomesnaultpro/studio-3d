*import * as THREE from 'three';
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

// 2. Configuration des contrôles (Rapides et réactifs)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1; 
controls.zoomSpeed = 1.8;     
controls.rotateSpeed = 1.5;   

// 3. Lumières globales puissantes
const ambientLight = new THREE.AmbientLight(0xffffff, 3.5); 
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 4.0); 
dirLight.position.set(30, 50, 30);
scene.add(dirLight);

const cameraLight = new THREE.PointLight(0xffffff, 8.0, 100);
camera.add(cameraLight);
scene.add(camera);

// Outils pour la détection des clics (Déclarés ici pour éviter les bugs)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// 4. DICTIONNAIRE DE BASE (En attente de tes vrais noms !)
const descriptionsData = {
    "sofa": { title: "Canapé", desc: "Espace détente du studio." },
    "drum": { title: "Batterie", desc: "Batterie acoustique complète." }
};

// LISTE NOIRE : Les objets à exclure totalement
const ignoredObjects = ["fond_lateral", "sol", "cube001"];

let selectableObjects = [];

// 5. Chargement 3D et Centrage Automatique
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);

loader.load(
    'studio.glb', 
    (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Centrage automatique
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

        // Tri strict des objets cliquables
        model.traverse((child) => {
            if (child.isMesh) {
                const meshNameLower = child.name.toLowerCase();
                
                // On vérifie si le nom contient un des mots interdits
                const isIgnored = ignoredObjects.some(ignored => meshNameLower.includes(ignored));
                
                if (!isIgnored) {
                    selectableObjects.push(child);
                }
            }
        });
        console.log("Studio trié et initialisé !");
    },
    undefined,
    (error) => {
        console.error("Erreur :", error);
    }
);

// 6. Détection des clics (Souris + Tactile)
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
            document.getElementById('info-title').innerText = "Élément du Studio";
            document.getElementById('info-description').innerText = `Cet objet porte le nom technique "${hitObject.name}".`;
            document.getElementById('info-box').classList.add('active');
        }
    } else {
        // Ferme la box si on clique sur le Sol ou Fond_lateral (qui ne font plus partie des objets interactifs)
        document.getElementById('info-box').classList.remove('active');
    }
}

// Écouteur Souris
window.addEventListener('click', (event) => {
    if (event.target.closest('#info-box') || event.target.closest('.site-header')) return; 
    handleInteraction(event.clientX, event.clientY);
});

// Écouteur Tactile
window.addEventListener('touchend', (event) => {
    if (event.target.closest('#info-box') || event.target.closest('.site-header')) return;
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
