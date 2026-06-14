import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// 1. Configuration du rendu et de la scène
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10); // Position de départ de la caméra

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// 2. Mouvements de caméra (Orbit Controls)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 3. Lumières globales (Boostées au maximum et dynamiques)
const ambientLight = new THREE.AmbientLight(0xffffff, 4.0); // Lumière ambiante très forte
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 5.0); // Lumière type "Soleil"
dirLight.position.set(20, 40, 20);
scene.add(dirLight);

// Lumière "Flash" attachée à la caméra (éclaire là où on regarde)
const cameraLight = new THREE.PointLight(0xffffff, 15.0, 100);
camera.add(cameraLight);
scene.add(camera);

// 4. BASE DE DONNÉES DES INFOS (À remplir avec les noms de Blender)
const equipmentsData = {
    "ExempleNomDeBlender": { 
        title: "Mon Équipement", 
        desc: "Voici la description !" 
    }
};

// 5. Initialisation du chargeur et configuration du décompresseur DRACO
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

// Lien vers le décompresseur officiel Google pour lire ton fichier compressé
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);

let selectableObjects = [];

// Chargement de ton modèle studio.glb
loader.load(
    'studio.glb', 
    (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        model.position.set(0, 0, 0);

        // On force les contrôles et la caméra à viser le centre du modèle
        camera.lookAt(model.position);
        controls.target.set(0, 0, 0);

        // On mémorise la structure pour pouvoir cliquer sur les objets
        model.traverse((child) => {
            if (child.isMesh) {
                selectableObjects.push(child);
            }
        });
        console.log("3D chargée avec succès !");
    },
    undefined,
    (error) => {
        console.error("Erreur de chargement 3D :", error);
    }
);

// 6. Détection du clic et technique de l'Espion
const raycaster =
