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

// 2. Configuration des contrôles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1; 
controls.zoomSpeed = 1.8;     
controls.rotateSpeed = 1.5;   

// 3. Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 3.5); 
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 4.0); 
dirLight.position.set(30, 50, 30);
scene.add(dirLight);

const cameraLight = new THREE.PointLight(0xffffff, 8.0, 100);
camera.add(cameraLight);
scene.add(camera);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let selectableObjects = [];

// =========================================================================
// 4. LISTE COMPLÈTE ET EXACTE DES OBJETS DE TA BATTERIE (DEPUIS LE GLTF)
// =========================================================================

const drumExactObjects = [
    // Structures et Fûts principaux
    "circle", "branco", "prato", "peli", "objeto", "pedal", "suporte",
    // Maillages de rendu physiques (Object_1700 à Object_2000 trouvés dans ton fichier)
    "object_17", "object_18", "object_19", "object_20"
];

const drumData = {
    title: "Pearl Roadshow 22\" Plus Jet Black",
    desc: `Batterie acoustique complète de la série Roadshow, idéale pour les batteurs exigeants. Elle comprend des fûts robustes en peuplier, un accastillage complet et des cymbales pour un punch et une résonance remarquables au studio.<br><br>
          <a href="https://www.thomann.fr/pearl_roadshow_22_plus_jet_black.htm?gad_source=1&gad_campaignid=1544038001&gclid=Cj0KCQjwornRBhCrARIsAON5exHpOQMgj_0FgzB6rgKyX7STbq3g1etN4JAWFiNKskSyCU7syJFgaa4aAjIhEALw_wcB" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Voir le produit sur Thomann ↗
          </a>`
};

// =========================================================================

// 5. Chargement du modèle 3D
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
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
        
        camera.position.set(maxDim * 0.3, maxDim * 0.6, cameraZ);
        controls.target.set(0, 0, 0);

        // On enregistre TOUS les sous-éléments du modèle 3D
        model.traverse((child) => {
            if (child.isMesh) {
                selectableObjects.push(child);
            }
        });
        console.log("Tous les objets du GLTF sont indexés.");
    },
    undefined,
    (error) => {
        console.error("Erreur de chargement du modèle :", error);
    }
);

// 6. Détection des interactions (Clic / Tactile)
function handleInteraction(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(selectableObjects);

    if (intersects.length > 0) {
        let hitObject = intersects[0].object;
        let current = hitObject;
        let finalData = null;

        // REMONTÉE ET VÉRIFICATION DE TOUTE LA HIÉRARCHIE DE L'OBJET CLIQUÉ
        while (current && current !== scene) {
            let nameLower = current.name.toLowerCase().trim();
            
            // Si le nom du maillage ou de l'un de ses parents contient un mot de la liste exacte
            if (drumExactObjects.some(keyword => nameLower.includes(keyword))) {
                finalData = drumData;
                break;
            }
            current = current.parent;
        }

        // Affichage du panel
        if (finalData) {
            document.getElementById('info-title').innerText = finalData.title;
            document.getElementById('info-description').innerHTML = finalData.desc;
            document.getElementById('info-box').classList.add('active');
        } else {
            document.getElementById('info-box').classList.remove('active');
        }
    } else {
        document.getElementById('info-box').classList.remove('active');
    }
}

window.addEventListener('click', (event) => {
    if (event.target.closest('#info-box') || event.target.closest('.site-header')) return; 
    handleInteraction(event.clientX, event.clientY);
});

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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
