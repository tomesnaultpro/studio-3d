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

// 2. Configuration des contrôles (Rapides)
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

// LISTE NOIRE STRICTE : Les objets de décor totalement ignorés au clic
const ignoredObjects = ["fond_lateral", "sol", "cube001"];
let selectableObjects = [];

// =========================================================================
// 4. LISTES DES OBJETS ET CONTENUS DE TON STUDIO
// =========================================================================

// --- A. ENCEINTES KRK ---
const krkObjectsList = [
    "object_150", "object_151", "object_149", "object_152", "object_135", 
    "object_136", "object_137", "object_138", "object_136005", "object_135003", 
    "object_135004", "object_135006", "object_135007", "object_137007", 
    "object_136007", "object_138005", "object_138004", "object_137006"
];
const krkData = {
    title: "KRK Classic 5 Monitor Pack",
    desc: `Enceintes de monitoring professionnelles actives de 5 pouces, idéales pour un rendu sonore ultra-précis lors du mixage et de la production musicale.<br><br>
          <a href="https://www.amazon.fr/KRK-Classic-5-Monitor-Pack/dp/B0CN3XC58B/ref=asc_df_B0CN3XC58B?mcid=04736f897ceb346187c4db4ea99957cb&tag=googshopfr-21&linkCode=df0&hvadid=701508078423&hvpos=&hvnetw=g&hvrand=9223592458026554633&hvpone=&hvptwo=&hvqmt=&hvdev=c&hvdvcmdl=&hvlocint=&hvlocphy=9049781&hvtargid=pla-2270877372701&psc=1&hvocijid=9223592458026554633-B0CN3XC58B-&hvexpln=0" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Voir le produit sur Amazon ↗
          </a>`
};

// --- B. LE CANAPÉ ---
const sofaObjectsList = [
    "box009_gray_fabric_0", "line009_metall_0", "cylinder001_metall_0", 
    "f-1910-5680_conforama_canap-lit_sienna_black_plastic_plas", "line010_metall_0", 
    "line002_metall_0", "line001_metall_0"
];
const sofaData = {
    title: "Canapé Convertible",
    desc: `Un superbe canapé-lit confortable et au design épuré, parfait pour se détendre entre deux sessions d'enregistrement ou accueillir des artistes au studio.<br><br>
          <a href="https://www.habitat.fr/c/canapes-convertibles?pid=122677&utm_source=google_shopping&utm_medium=cpc&utm_campaign=FR%20-%20FR%20-%20PLA%20-%20RECONDUITS&utm_content=FR%20-%20FR%20-%20PLA%20-%20RECONDUITS%20-%20Salon%20canape&utm_term=757540387378&utm_source_platform=Google&utm_creative_format=122677&utm_id=22656347250_179186089605_757540387378&gad_source=1&gad_campaignid=22656347250&gclid=Cj0KCQjwornRBhCrARIsAON5exGWrEtOfgxQeDsSel0Az9ueFKPX7lR6jbUt6pBTk0dkvfSfT7_Qtw8aAokvEALw_wcB" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Voir le produit sur Habitat ↗
          </a>`
};

// --- C. LES COUSSINS ---
const pillowObjectsList = [
    "pillow_01_perl_fabric_0", "pillow_002_perl_fabric_0"
];
const pillowData = {
    title: "Coussin olario orange",
    desc: `Coussin en coton texture de dimensions 60x60 cm. Sa couleur orange vibrante apporte une touche chaleureuse, moderne et colorée au canapé du studio.<br><br>
          <a href="https://www.maisonsdumonde.com/FR/fr/p/coussin-en-coton-texture-orange-60x60-olario-247807.htm?store=&utm_source=google&utm_medium=cpc&utm_campaign=SEA-GOO-B2C-INT-FR-FR-DCD-MDM-GEN-PMAX-HIGH-Deco&gad_source=1&gad_campaignid=22352879894&gclid=Cj0KCQjwornRBhCrARIsAON5exGXivwFaBj8qMgqGmcco-8Ap7woYY16QcP2yYV_hY778AWiKbaITg0aApbhEALw_wcB" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Voir le produit sur Maisons du Monde ↗
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

        // Tri des objets cliquables
        model.traverse((child) => {
            if (child.isMesh) {
                const meshNameLower = child.name.toLowerCase();
                const isIgnored = ignoredObjects.some(ignored => meshNameLower.includes(ignored));
                
                if (!isIgnored) {
                    selectableObjects.push(child);
                }
            }
        });
        console.log("Studio prêt avec les Enceintes, le Canapé et les Coussins !");
    },
    undefined,
    (error) => {
        console.error("Erreur de chargement :", error);
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

        // On remonte l'arborescence en forçant le tout en minuscules
        while (current && current !== scene) {
            let nameLower = current.name.toLowerCase();
            
            if (krkObjectsList.includes(nameLower)) {
                finalData = krkData;
                break;
            } else if (sofaObjectsList.includes(nameLower)) {
                finalData = sofaData;
                break;
            } else if (pillowObjectsList.includes(nameLower)) {
                finalData = pillowData;
                break;
            }
            current = current.parent;
        }

        // Affichage dynamique dans le panneau latéral
        if (finalData) {
            document.getElementById('info-title').innerText = finalData.title;
            document.getElementById('info-description').innerHTML = finalData.desc;
            document.getElementById('info-box').classList.add('active');
        } else {
            // Pour les autres objets non configurés
            document.getElementById('info-title').innerText = "Élément du Studio";
            document.getElementById('info-description').innerText = `Tu as cliqué sur l'objet "${hitObject.name}". Donne-moi son nom et son lien marchand pour que je l'ajoute !`;
            document.getElementById('info-box').classList.add('active');
        }
    } else {
        // Clic sur le Sol, Fond_lateral ou dans le vide = fermeture automatique
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
