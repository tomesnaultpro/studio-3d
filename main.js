import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
// Outils officiels Three.js pour la sélection de zone
import { SelectionBox } from 'three/addons/interactive/SelectionBox.js';
import { SelectionHelper } from 'three/addons/interactive/SelectionHelper.js';

// 1. Configuration de la Scène
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0d11);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Style CSS pour le rectangle de sélection Windows (à ajouter si nécessaire, ou géré automatiquement)
const style = document.createElement('style');
style.innerHTML = `.selectBox { border: 2px dashed #00d2ff; background-color: rgba(0, 210, 255, 0.2); position: absolute; pointer-events: none; }`;
document.head.appendChild(style);

// 2. Configuration des contrôles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1; 

// 3. Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 3.5); 
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 4.0); 
dirLight.position.set(30, 50, 30);
scene.add(dirLight);

// 4. Chargement du modèle 3D
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
        camera.position.set(maxDim * 0.5, maxDim * 0.5, maxDim * 1.5);
        controls.target.set(0, 0, 0);
        console.log("Studio chargé. Mode sélection multiple prêt !");
    }
);

// =========================================================================
// 5. SYSTÈME DE SÉLECTION MULTIPLE (STYLE WINDOWS)
// =========================================================================

const selectionBox = new SelectionBox(camera, scene);
const helper = new SelectionHelper(renderer, 'selectBox');

// Crée un panneau temporaire dans ton interface pour afficher la liste des noms copiables
const namesPanel = document.createElement('div');
namesPanel.style.position = 'absolute';
namesPanel.style.top = '20px';
namesPanel.style.right = '20px';
namesPanel.style.width = '320px';
namesPanel.style.maxHeight = '80vh';
namesPanel.style.overflowY = 'auto';
namesPanel.style.backgroundColor = 'rgba(20, 20, 25, 0.95)';
namesPanel.style.color = '#fff';
namesPanel.style.padding = '15px';
namesPanel.style.fontFamily = 'monospace';
namesPanel.style.fontSize = '12px';
namesPanel.style.borderRadius = '8px';
namesPanel.style.border = '1px solid #333';
namesPanel.style.zIndex = '9999';
namesPanel.innerHTML = `<h3>Objets Sélectionnés</h3><p style="color:#888;">Maintiens la touche <b>Maj (Shift)</b> enfoncée et glisse la souris pour encadrer la batterie.</p><textarea id="names-output" style="width:100%; height:200px; background:#000; color:#00ffcc; border:1px solid #444; padding:5px; font-family:monospace;" readonly></textarea><br><button id="copy-btn" style="margin-top:5px; width:100%; padding:5px; background:#00d2ff; color:#000; border:none; font-weight:bold; cursor:pointer;">Copier la liste</button>`;
document.body.appendChild(namesPanel);

window.addEventListener('pointerdown', function (event) {
    // On active la sélection uniquement si la touche Maj (Shift) est enfoncée pour ne pas gêner la rotation de caméra
    if (event.shiftKey) {
        controls.enabled = false; // Désactive la caméra pendant qu'on sélectionne
        selectionBox.startPoint.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
            0.5
        );
    }
});

window.addEventListener('pointermove', function (event) {
    if (helper.isDown) {
        selectionBox.endPoint.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
            0.5
        );
    }
});

window.addEventListener('pointerup', function (event) {
    controls.enabled = true; // Réactive la caméra au relâchement
    
    if (event.shiftKey) {
        selectionBox.endPoint.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
            0.5
        );

        // Récupère tous les objets capturés dans la boîte
        const allSelected = selectionBox.select();
        const uniqueNames = new Set();

        allSelected.forEach(obj => {
            if (obj.isMesh && obj.name) {
                uniqueNames.add(obj.name.trim());
                // On récupère aussi le nom du parent direct s'il existe
                if (obj.parent && obj.parent.name && obj.parent !== scene) {
                    uniqueNames.add(obj.parent.name.trim());
                }
            }
        });

        // Convertit la liste en texte trié pour l'affichage
        const namesArray = Array.from(uniqueNames).sort();
        document.getElementById('names-output').value = JSON.stringify(namesArray, null, 2);
    }
});

// Bouton de copie rapide
document.getElementById('copy-btn').addEventListener('click', () => {
    const textarea = document.getElementById('names-output');
    textarea.select();
    document.execCommand('copy');
    alert('Liste copiée ! Colle-la directement dans notre discussion.');
});

// 6. Boucle d'animation
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
