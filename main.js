import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
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

// Style CSS pour le rectangle de sélection Windows
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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectableObjects = [];

// =========================================================================
// 4. BASE DE DONNÉES COMPLÈTE DU STUDIO
// =========================================================================

// --- A. LA BATTERIE (Ta liste exacte validée) ---
const drumObjectsList = [
  "object_1007", "object_1013", "object_1016", "object_1022", "object_1049", 
  "object_1052", "object_1055", "object_1058", "object_1064", "object_11", 
  "object_1133", "object_1136", "object_1175", "object_1178", "object_1181", 
  "object_1184", "object_1187", "object_1190", "object_1199", "object_1202", 
  "object_1262", "object_1292", "object_131", "object_1349", "object_1352", 
  "object_1355", "object_1358", "object_1361", "object_1364", "object_1367", 
  "object_1370", "object_137001", "object_1373", "object_1376", "object_1379", 
  "object_1382", "object_1385", "object_1388", "object_1391", "object_1394", 
  "object_1397", "object_14", "object_1400", "object_140001", "object_1403", 
  "object_143", "object_149001", "object_1505", "object_1508", "object_1511", 
  "object_1514", "object_1517", "object_1520", "object_152001", "object_1523", 
  "object_1529", "object_1532", "object_1535", "object_1538", "object_155", 
  "object_158", "object_161", "object_164001", "object_1688", "object_1694", 
  "object_1697", "object_17", "object_170001", "object_1703", "object_1706", 
  "object_1709", "object_1712", "object_1718", "object_1721", "object_1724", 
  "object_1727", "object_1730", "object_1733", "object_1736", "object_1739", 
  "object_1742", "object_1745", "object_1748", "object_1751", "object_1760", 
  "object_1766", "object_1769", "object_1772", "object_1775", "object_1778", 
  "object_1781", "object_1784", "object_1787", "object_1790", "object_179001", 
  "object_1793", "object_182001", "object_185001", "object_188001", "object_194", 
  "object_197", "object_20001", "object_203", "object_206001", "object_209", 
  "object_212", "object_218001", "object_224001", "object_227", "object_230001", 
  "object_23001", "object_233", "object_236001", "object_242", "object_245", 
  "object_257", "object_260", "object_26001", "object_263", "object_266", 
  "object_272", "object_281", "object_284", "object_29", "object_32001", 
  "object_35", "object_356", "object_359", "object_362", "object_365", 
  "object_368", "object_377", "object_38", "object_380", "object_386", 
  "object_389", "object_392", "object_395", "object_398", "object_401", 
  "object_404", "object_407", "object_41", "object_44001", "object_458", 
  "object_47", "object_482", "object_50001", "object_509", "object_512", 
  "object_515", "object_518", "object_53", "object_536", "object_56", 
  "object_566", "object_575", "object_590", "object_629", "object_632", 
  "object_647", "object_656", "object_659", "object_665", "object_668", 
  "object_695", "object_704", "object_707", "object_740", "object_743", 
  "object_746", "object_749", "object_752", "object_755", "object_758", 
  "object_779", "object_8001", "object_803", "object_842", "object_845", 
  "object_860", "object_869", "object_872", "object_878", "object_905", 
  "object_950"
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

// --- B. LES AUTRES ÉLÉMENTS DU STUDIO ---
const studioStudioData = [
    {
        keywords: ["graphictablet", "desk", "screen", "bureau", "jarre"],
        title: "La Jarre à Son - Home Studio Desk 2023",
        desc: "Le meuble central du studio de production musicale, doté d'une ergonomie poussée avec sa tablette graphique intégrée et ses supports d'enceintes surélevés.<br><br><a href='https://sketchfab.com/3d-models/la-jarre-a-son-home-studio-desk-2023-538fdc1dc1c1478da6a2761ec3c6dcab' target='_blank' style='color:#00d2ff;font-weight:600;'>Voir sur Sketchfab ↗</a>"
    },
    {
        keywords: ["speaker", "enceinte", "monitor", "krk", "yamaha"],
        title: "Moniteurs de Studio Pro",
        desc: "Enceintes de monitoring actives haute fidélité assurant une réponse en fréquence neutre et ultra-précise pour le mixage et le mastering.<br><br><a href='https://www.thomann.fr' target='_blank' style='color:#00d2ff;font-weight:600;'>Découvrir sur Thomann ↗</a>"
    },
    {
        keywords: ["headphone", "casque", "audiotechnica", "beyer"],
        title: "Casque de Monitoring Professionnel",
        desc: "Casque de studio de référence offrant une isolation acoustique maximale et un confort optimal pour les longues sessions d'enregistrement.<br><br><a href='https://www.thomann.fr' target='_blank' style='color:#00d2ff;font-weight:600;'>Voir sur Thomann ↗</a>"
    },
    {
        keywords: ["sofa", "couch", "canap", "fauteuil"],
        title: "Canapé Lounge Studio",
        desc: "Espace détente confortable installé à l'arrière de la régie pour accueillir les artistes et écouter les mixages dans des conditions réelles de salon."
    },
    {
        keywords: ["chair", "chaise", "tabouret", "stool"],
        title: "Chaise Ergonomique de Production",
        desc: "Siège réglable de haute qualité conçu pour maintenir une posture saine devant la station de travail audio numérique (STAN)."
    },
    {
        keywords: ["cushion", "coussin", "pillow"],
        title: "Coussins Confort",
        desc: "Éléments décoratifs et de confort pour optimiser l'accueil dans l'espace lounge du studio."
    }
];

function getObjectData(nameLower) {
    if (drumObjectsList.includes(nameLower)) {
        return drumData;
    }
    for (const item of studioStudioData) {
        if (item.keywords.some(kw => nameLower.includes(kw))) {
            return item;
        }
    }
    return null;
}

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

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);

        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.set(maxDim * 0.4, maxDim * 0.5, maxDim * 1.3);
        controls.target.set(0, 0, 0);

        model.traverse((child) => {
            if (child.isMesh) {
                selectableObjects.push(child);
            }
        });
        console.log("Scanner de Studio prêt.");
    }
);

// =========================================================================
// 6. LE SCANNER DE SCÈNE (CORRIGÉ : PLACÉ EN BAS À DROITE)
// =========================================================================

const selectionBox = new SelectionBox(camera, scene);
const helper = new SelectionHelper(renderer, 'selectBox');

const namesPanel = document.createElement('div');
namesPanel.id = 'extraction-panel';
namesPanel.style.position = 'absolute';
namesPanel.style.bottom = '20px'; // Déplacé en bas pour éviter de cacher ton volet d'info
namesPanel.style.right = '20px';
namesPanel.style.width = '320px';
namesPanel.style.maxHeight = '40vh';
namesPanel.style.overflowY = 'auto';
namesPanel.style.backgroundColor = 'rgba(20, 20, 25, 0.95)';
namesPanel.style.color = '#fff';
namesPanel.style.padding = '15px';
namesPanel.style.fontFamily = 'monospace';
namesPanel.style.fontSize = '12px';
namesPanel.style.borderRadius = '8px';
namesPanel.style.border = '1px solid #333';
namesPanel.style.zIndex = '9999';
namesPanel.innerHTML = `<h3>Outil d'extraction</h3><p style="color:#888; margin:5px 0;">Maintiens <b>Maj (Shift)</b> + glisse la souris pour copier de nouveaux meubles.</p><textarea id="names-output" style="width:100%; height:120px; background:#000; color:#00ffcc; border:1px solid #444; padding:5px; font-family:monospace;" readonly></textarea><button id="copy-btn" style="margin-top:5px; width:100%; padding:5px; background:#00d2ff; color:#000; border:none; font-weight:bold; cursor:pointer;">Copier la liste</button>`;
document.body.appendChild(namesPanel);

function handleSingleClick(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(selectableObjects);

    if (intersects.length > 0) {
        let current = intersects[0].object;
        let finalData = null;

        while (current && current !== scene) {
            let nameLower = current.name.toLowerCase().trim();
            finalData = getObjectData(nameLower);
            if (finalData) break;
            current = current.parent;
        }

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

window.addEventListener('pointerdown', function (event) {
    if (event.target.closest('#extraction-panel') || event.target.closest('#info-box')) return;
    if (event.shiftKey) {
        controls.enabled = false;
        selectionBox.startPoint.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
    }
});

window.addEventListener('pointermove', function (event) {
    if (helper.isDown) {
        selectionBox.endPoint.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
    }
});

window.addEventListener('pointerup', function (event) {
    controls.enabled = true;
    if (event.shiftKey) {
        selectionBox.endPoint.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
        const allSelected = selectionBox.select();
        const uniqueNames = new Set();

        allSelected.forEach(obj => {
            if (obj.isMesh && obj.name) {
                uniqueNames.add(obj.name.trim());
                if (obj.parent && obj.parent.name && obj.parent !== scene) uniqueNames.add(obj.parent.name.trim());
            }
        });

        document.getElementById('names-output').value = JSON.stringify(Array.from(uniqueNames).sort(), null, 2);
    }
});

window.addEventListener('click', (event) => {
    if (event.shiftKey || event.target.closest('#info-box') || event.target.closest('.site-header') || event.target.closest('button')) return; 
    handleSingleClick(event.clientX, event.clientY);
});

document.getElementById('copy-btn').addEventListener('click', () => {
    const textarea = document.getElementById('names-output');
    textarea.select();
    document.execCommand('copy');
    alert('Liste copiée !');
});

document.getElementById('close-btn').addEventListener('click', () => {
    document.getElementById('info-box').classList.remove('active');
});

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
