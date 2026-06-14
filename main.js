import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1. Configuration de la Scène 3D
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 8); // Position de la caméra (x, y, z)

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// 2. Mouvements de caméra (Orbit Controls)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 3. Lumières globales
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// 4. BASE DE DONNÉES DES INFOS (Tu la rempliras ici grâce aux alertes)
const equipmentsData = {
    "ExempleNomDeBlender": { 
        title: "Mon Équipement", 
        desc: "Voici la description de ce qui s'affiche quand je clique dessus !" 
    }
};

// 5. Chargement de ton fichier unique studio.glb
const loader = new GLTFLoader();
let selectableObjects = [];

loader.load(
    'studio.glb', 
    (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        model.position.set(0, 0, 0);

        // On mémorise tous les éléments pour pouvoir cliquer dessus
        model.traverse((child) => {
            if (child.isMesh) {
                selectableObjects.push(child);
            }
        });
        console.log("3D chargée !");
    },
    undefined,
    (error) => {
        console.error("Erreur de chargement 3D :", error);
    }
);

// 6. Détection du clic et technique de l'Espion
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    if (event.target.closest('#info-box')) return; // Évite de cliquer à travers la popup

    // Coordonnées de la souris
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(selectableObjects);

    if (intersects.length > 0) {
        let hitObject = intersects[0].object;

        // 🚨 L'ESPION : L'alerte te donne le nom exact défini par Blender !
        alert("Tu as cliqué sur l'objet nommé : " + hitObject.name);

        // Recherche du nom dans la base de données (remonte aux parents si besoin)
        let foundData = null;
        let current = hitObject;
        while (current) {
            if (equipmentsData[current.name]) {
                foundData = equipmentsData[current.name];
                break;
            }
            current = current.parent;
        }

        // Si le nom est dans ta liste, on ouvre la popup d'infos
        if (foundData) {
            document.getElementById('info-title').innerText = foundData.title;
            document.getElementById('info-description').innerText = foundData.desc;
            document.getElementById('info-box').style.display = 'block';
        }
    }
});

// Fermeture de la popup
document.getElementById('close-btn').addEventListener('click', () => {
    document.getElementById('info-box').style.display = 'none';
});

// 7. Boucle d'animation
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Ajustement automatique à l'écran
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
