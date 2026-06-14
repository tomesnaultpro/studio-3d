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

// 4. DICTIONNAIRE DES MATÉRIELS
// Le code va chercher si l'un de ces mots est écrit dans le nom de l'objet OU de ses parents
const equipmentsData = {
    "drum": { 
        title: "Batterie Acoustique", 
        desc: "Une superbe batterie complète pour rythmer les morceaux du studio. Elle comprend les cymbales, la caisse claire, les toms, les pieds en métal et une grosse caisse imposante." 
    },
    "sofa": { 
        title: "Canapé Chill & Production", 
        desc: "L'espace détente indispensable pour accueillir les artistes ou écouter confortablement les mixages finaux pendant les sessions d'enregistrement." 
    },
    "couch": { 
        title: "Canapé Chill & Production", 
        desc: "L'espace détente indispensable pour accueillir les artistes ou écouter confortablement les mixages finaux pendant les sessions d'enregistrement." 
    },
    "canap": { 
        title: "Canapé Chill & Production", 
        desc: "L'espace détente indispensable pour accueillir les artistes ou écouter confortablement les mixages finaux pendant les sessions d'enregistrement." 
    },
    "speaker": { 
        title: "Enceintes de Monitoring", 
        desc: "Enceintes de haute précision configurées pour obtenir un rendu audio parfaitement neutre et professionnel lors de la phase de mixage." 
    },
    "enceinte": { 
        title: "Enceintes de Monitoring", 
        desc: "Enceintes de haute précision configurées pour obtenir un rendu audio parfaitement neutre et professionnel lors de la phase de mixage." 
    },
    "monitor": { 
        title: "Poste de Travail / Écrans", 
        desc: "Configuration multi-écrans reliée à la station audio numérique (DAW) pour organiser les pistes de voix, les instruments virtuels et les effets de mixage." 
    },
    "ecran": { 
        title: "Poste de Travail / Écrans", 
        desc: "Configuration multi-écrans reliée à la station audio numérique (DAW) pour organiser les pistes de voix, les instruments virtuels et les effets de mixage." 
    },
    "desk": { 
        title: "Bureau de Production", 
        desc: "Meuble de studio ergonomique centralisant le clavier de contrôle, l'ordinateur de production et l'ensemble des contrôleurs matériels." 
    },
    "bureau": { 
        title: "Bureau de Production", 
        desc: "Meuble de studio ergonomique centralisant le clavier de contrôle, l'ordinateur de production et l'ensemble des contrôleurs matériels." 
    },
    "keyboard": { 
        title: "Clavier Maître / Synthétiseur", 
        desc: "Clavier de contrôle MIDI permettant de jouer et de composer en temps réel tous les instruments virtuels (pianos, synthés, cordes) sur l'ordinateur." 
    },
    "piano": { 
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

        // Centrage automatique et gestion de la taille
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
        console.log("Studio chargé !");
    },
    undefined,
    (error) => {
        console.error("Erreur :", error);
    }
);

// 6. Détection intelligente des clics avec remontée des parents
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
        let foundData = null;
        let current = hitObject;

        // On remonte le groupe d'objets (parents) pour voir si un des morceaux contient un nom connu
        while (current && current !== scene) {
            let currentNameLower = current.name.toLowerCase();
            
            for (const key in equipmentsData) {
                if (currentNameLower.includes(key)) {
                    foundData = equipmentsData[key];
                    break;
                }
            }
            if (foundData) break;
            current = current.parent; // On monte d'un niveau si on n'a rien trouvé
        }

        // Affichage des informations dans le menu latéral
        if (foundData) {
            document.getElementById('info-title').innerText = foundData.title;
            document.getElementById('info-description').innerText = foundData.desc;
            document.getElementById('info-box').classList.add('active');
        } else {
            // Si l'élément cliqué n'est pas dans la liste, on affiche son nom par défaut
            document.getElementById('info-title').innerText = "Élément de la pièce";
            document.getElementById('info-description').innerText = `Cet objet s'appelle "${hitObject.name}" dans ton projet 3D.`;
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
