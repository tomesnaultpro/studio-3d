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
controls.dampingFactor = 0.05;
controls.zoomSpeed = 0.6;

// 3. Lumières globales puissantes
const ambientLight = new THREE.AmbientLight(0xffffff, 3.5); 
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 4.0); 
dirLight.position.set(30, 50, 30);
scene.add(dirLight);

const cameraLight = new THREE.PointLight(0xffffff, 8.0, 100);
camera.add(cameraLight);
scene.add(camera);

// 4. DICTIONNAIRE UNIQUE BASE SUR TON FICHIER STUDIO.GLB
const equipmentsData = {
    // --- LE CANAPÉ (Tous ses composants Object_1136, 1137, etc.) ---
    "object_1135": "sofa", "object_1136": "sofa", "object_1137": "sofa", "object_1138": "sofa",
    "object_1139": "sofa", "object_1140": "sofa", "object_1141": "sofa", "object_1142": "sofa",
    "object_1143": "sofa", "object_1144": "sofa",

    // --- LA BATTERIE (Tous les fûts, cymbales et pieds métalliques) ---
    "object_138": "drum", "object_139": "drum", "object_140": "drum", "object_141": "drum",
    "object_144": "drum", "object_145": "drum", "object_146": "drum", "object_147": "drum",
    "object_148": "drum", "object_153": "drum", "object_154": "drum", "object_157": "drum",
    "object_158": "drum", "object_159": "drum", "object_164": "drum", "object_165": "drum",
    "object_170": "drum", "object_171": "drum", "object_174": "drum", "object_175": "drum",
    "object_176": "drum", "object_181": "drum", "object_182": "drum", "object_185": "drum",
    "object_186": "drum", "object_187": "drum", "object_192": "drum", "object_193": "drum",
    "object_202": "drum", "object_203": "drum", "object_204": "drum", "object_205": "drum",
    "object_206": "drum", "object_211": "drum", "object_212": "drum", "object_215": "drum",
    "object_216": "drum", "object_217": "drum", "object_222": "drum", "object_223": "drum",
    "object_228": "drum", "object_229": "drum", "object_232": "drum", "object_233": "drum",
    "object_234": "drum", "object_239": "drum", "object_240": "drum",

    // --- LE BUREAU INFORMATIQUE (Écrans, Enceintes, Clavier) ---
    "object_2": "desk", "object_3": "desk", "object_4": "desk", "object_5": "desk",
    "object_402": "speaker", "object_403": "speaker", // Enceinte Gauche
    "object_404": "speaker", "object_405": "speaker", // Enceinte Droite
    "object_510": "keyboard", "object_511": "keyboard", "object_512": "keyboard", // Clavier maître
    "object_700": "monitor", "object_701": "monitor", "object_702": "monitor", // Les écrans de contrôle
    "object_88": "mic", "object_89": "mic" // Micro et son pied
};

// Les textes détaillés en français pour chaque catégorie
const descriptionsData = {
    "drum": {
        title: "Batterie Acoustique",
        desc: "Une superbe batterie complète pour rythmer les morceaux du studio. Elle comprend les cymbales, la caisse claire, les toms et une grosse caisse imposante."
    },
    "sofa": {
        title: "Canapé Chill & Production",
        desc: "L'espace détente indispensable pour accueillir les artistes ou écouter confortablement les mixages finaux pendant les sessions d'enregistrement."
    },
    "speaker": {
        title: "Enceintes de Monitoring",
        desc: "Enceintes de haute précision configurées pour obtenir un rendu audio parfaitement neutre et professionnel lors de la phase de mixage."
    },
    "monitor": {
        title: "Poste de Travail / Écrans",
        desc: "Configuration multi-écrans reliée à la station audio numérique (DAW) pour organiser les pistes de voix, les instruments virtuels et les effets de mixage."
    },
    "desk": {
        title: "Bureau de Production",
        desc: "Meuble de studio ergonomique centralisant le clavier de contrôle, l'ordinateur de production et l'ensemble des contrôleurs matériels."
    },
    "keyboard": {
        title: "Clavier Maître / Synthétiseur",
        desc: "Clavier de contrôle MIDI permettant de jouer et de composer en temps réel tous les instruments virtuels (pianos, synthés, cordes) sur l'ordinateur."
    },
    "mic": {
        title: "Microphone de Studio",
        desc: "Micro professionnel monté sur pied pour enregistrer les voix, les instruments acoustiques ou les prises de son de proximité avec une clarté maximale."
    }
};

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

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        cameraZ *= 1.6; 
        camera.position.set(maxDim * 0.3, maxDim * 0.6, cameraZ);
        
        controls.target.set(0, 0, 0);
        controls.maxDistance = cameraZ * 3;
        controls.minDistance = maxDim * 0.1;

        model.traverse((child) => {
            if (child.isMesh) {
                selectableObjects.push(child);
            }
        });
        console.log("Studio de musique initialisé !");
    },
    undefined,
    (error) => {
        console.error("Erreur :", error);
    }
);

// 6. Détection intelligente des clics avec conversion des noms techniques
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    if (event.target.closest('#info-box') || event.target.closest('.site-header')) return; 

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(selectableObjects);

    if (intersects.length > 0) {
        let hitObject = intersects[0].object;
        let finalData = null;
        let current = hitObject;

        // On remonte l'objet cliqué ou ses parents pour trouver une correspondance
        while (current && current !== scene) {
            let nameLower = current.name.toLowerCase();
            
            // Étape A : Recherche par ID technique (ex: object_1136)
            if (equipmentsData[nameLower]) {
                const category = equipmentsData[nameLower];
                finalData = descriptionsData[category];
                break;
            }
            
            // Étape B : Sécurité si le nom contient un mot-clé textuel
            for (const key in descriptionsData) {
                if (nameLower.includes(key)) {
                    finalData = descriptionsData[key];
                    break;
                }
            }
            if (finalData) break;
            current = current.parent;
        }

        // Affichage des informations propres
        if (finalData) {
            document.getElementById('info-title').innerText = finalData.title;
            document.getElementById('info-description').innerText = finalData.desc;
            document.getElementById('info-box').classList.add('active');
        } else {
            // Si on clique sur le sol blanc ou un mur non configuré
            document.getElementById('info-title').innerText = "Structure du Studio";
            document.getElementById('info-description').innerText = "Un élément de décor ou de structure de ton studio d'enregistrement.";
            document.getElementById('info-box').classList.add('active');
        }
    }
});

document.getElementById('close-btn').addEventListener('click', () => {
    document.getElementById('info-box').classList.remove('active');
});

// 7. Animation
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
