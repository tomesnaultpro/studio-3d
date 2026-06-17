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
// 4. BASE DE DONNÉES COMPLÈTE ET VALIDÉE DU STUDIO
// =========================================================================

// --- A. LA BATTERIE ---
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
          <a href="https://www.thomann.fr/pearl_roadshow_22_plus_jet_black.htm" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Voir le produit sur Thomann ↗
          </a>`
};

// --- B. ENCEINTES KRK + TRÉPIEDS FUSIONNÉS ---
const speakerObjectsList = [
  "object_126", "object_135", "object_136", "object_137", "object_138", 
  "object_140", "object_149", "object_150", "object_151", "object_152",
  "object_135003", "object_136005", "object_137006", "object_138004", 
  "studiomonitorstand_studiomonitorstand_metal_0", "studiomonitorstand_studiomonitorstand_plastic_0", 
  "object_135004", "object_136007", "object_137007", "object_138005", 
  "studiomonitorstand_studiomonitorstand_metal_0001", "studiomonitorstand_studiomonitorstand_plastic_0001", 
  "studiomonitorstand_studiomontiorstand_cushion_0001", "studiomonitorstand_studiomontiorstand_cushion_0"
];

const speakerData = {
    title: "KRK Kreate 5 avec Trépieds (La Paire)",
    desc: `Enceintes de monitoring actives associées à leurs trépieds d'isolation acoustique. Ce système offre une clarté légendaire avec un woofer en Kevlar et élimine les vibrations indésirables pour un mixage audio ultra-précis.<br><br>
          <a href="https://www.sonovente.com/krk-kreate-5-la-paire-supports-bas-p106242.html" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Voir l'ensemble sur SonoVente ↗
          </a>`
};

// --- C. CANAPÉ DESIGN BONO ---
const sofaObjectsList = [
  "box009_gray_fabric_0", "cylinder001_metall_0", "line001_metall_0", 
  "line002_metall_0", "line009_metall_0", "line010_metall_0",
  "f-1910-5680_conforama_canap??-lit_sienna_black_plastic_plas",
  "f-1910-5680_conforama_canap-lit_sienna_black_plastic_plas"
];

const sofaData = {
    title: "Canapé Design 3 Places BONO",
    desc: `Canapé élégant en tissu effet velours texturé gris. Sa structure moderne et son assise confortable offrent un espace lounge idéal à l'arrière du studio pour accueillir les artistes pendant les phases d'écoute.<br><br>
          <a href="https://www.miliboo.com/canape-design-3-places-tissu-effet-velours-texture-gris-bono-57597.html" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Voir le canapé sur Miliboo ↗
          </a>`
};

// --- D. MICRO ENREGISTREMENT RODE NT1-A ---
const micObjectsList = [
  "layer_2base__0", "layer_4mic_head__0"
];

const micData = {
    title: "Rode NT1-A Complete Vocal Bundle",
    desc: `Microphone de studio d'enregistrement à condensateur large membrane avec sa suspension araignée, son filtre anti-pop intégré et son écran acoustique d'isolation.<br><br>
          <a href="https://www.thomann.fr/rode_nt1_a_compl._micscreen_bundle.htm" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Voir le pack Micro sur Thomann ↗
          </a>`
};

// --- E. CASQUE AUDIO APPLE AIRPODS MAX ---
const headphoneObjectsList = [
  "aanwpkmfljrfwqj", "aexpvrshrbaaroo", "bnozvcfckcmanz", "djdgbrevlkseknl", 
  "fzpyptjpuzbycjw", "huobrxkxkekuwxx", "huxnidmrqhpdtej", "ihefvqmczhpaduy", 
  "jdajisnyuduqgzb", "juhozdroclbfkqg", "lswgfsweioaicgt", "object_162", 
  "object_164", "object_169", "object_170", "object_172", "object_173", 
  "pndaaljhshkuws", "qvkyuxluhiwizge", "tovohyqezchyzgl", "wdmisgpfbmqrdoh", 
  "wwrkmzfxzwaccgu", "wwtyjswgshsanes", "xiphiahsthjzhhw", "ygrsyuxvgxlggro", 
  "ymagkzdkmtwuqje", "zczolifjlvletmq", "zhebfjyaxlhlsle", "zdaqqruptsemflo", 
  "alkkbnxysoolingi", "ecebpffksspuio", "gwzdgrmvilveqvj", "hexwygwownpqirf", 
  "lfgkqhirxtridbu", "ltnuleuwbsqyabk", "sytnpmcquioflqg", "syukhlwqwhfyqza", 
  "uofrdwfacejqwov", "vuggowiguweeaqg"
];

const headphoneData = {
    title: "Apple AirPods Max - Bleu",
    desc: `Casque supra-auriculaire haut de gamme associant un son haute fidélité à la technologie de réduction active du bruit leader du marché. Idéal pour s'isoler ou effectuer des vérifications d'écoute.<br><br>
          <a href="https://www.apple.com/fr/shop/buy-airpods/airpods-max-2/bleu" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Voir sur l'Apple Store ↗
          </a>`
};

// --- F. APPLE iPHONE 15 PRO ---
const phoneObjectsList = [
  "object_101001", "object_105", "object_107001", "object_110001", "object_11001", 
  "object_112", "object_114001", "object_116001", "object_118001", "object_120001", 
  "object_122002", "object_126001", "object_128001", "object_130", "object_132", 
  "object_134001", "object_136001", "object_138001", "object_140002", "object_1401", 
  "object_142", "object_144", "object_147", "object_149002", "object_151001", 
  "object_153", "object_155001", "object_157001", "object_159001", "object_16", 
  "object_161001", "object_163001", "object_165", "object_167002", "object_169001", 
  "object_171", "object_174", "object_176002", "object_178001", "object_180001", 
  "object_1801", "object_182002", "object_184", "object_186001", "object_188002", 
  "object_190", "object_192", "object_195", "object_197001", "object_199001", 
  "object_20002", "object_202001", "object_204001", "object_206002", "object_2201", 
  "object_24", "object_27", "object_29001", "object_31", "object_33", 
  "object_35001", "object_37", "object_39", "object_41001", "object_44002", 
  "object_47001", "object_49", "object_51001", "object_53001", "55001", 
  "object_57001", "object_59002", "object_62002", "object_64", "object_67", 
  "object_69001", "object_71002", "object_73001", "object_76", "object_78001", 
  "object_81", "object_83002", "object_85001", "object_87", "object_90", 
  "object_92001", "object_94", "object_96", "object_98002"
];

const phoneData = {
    title: "Apple iPhone 15 Pro (256 Go) - Noir",
    desc: `Smartphone de contrôle ultra-puissant doté d'un châssis en titane. Il sert d'outil multimédia parfait pour piloter la diffusion, enregistrer des sessions ou gérer la DAW à distance.<br><br>
          <a href="https://www.darty.com/nav/achat/telephonie/telephone_mobile_seul/iphone/apple_iph15pro_256go_noir.html" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Voir l'iPhone sur Darty ↗
          </a>`
};

// --- G. CLAVIER MIDI ARTURIA KEYLAB 61 MK3 ---
const midiPianoObjectsList = [
  "object_68", "object_69", "object_71", "object_72", "object_73", "object_74"
];

const midiPianoData = {
    title: "Arturia KeyLab 61 Mk3 - White",
    desc: `Clavier maître USB/MIDI haut de gamme à 61 touches semi-lestées. Offre de nombreux pads, curseurs et encodeurs avec une intégration logicielle parfaite pour composer efficacement.<br><br>
          <a href="https://www.bax-shop.fr/clavier-midi/arturia-keylab-61-mk3-white-clavier-usb-midi" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Découvrir sur Bax-Music ↗
          </a>`
};

// --- H. SURFACE DE CONTRÔLE AKAI MIDIMIX ---
const akaiMixObjectsList = [
  "object_100", "object_98", "object_99"
];

const akaiMixData = {
    title: "Akai Professional MIDImix",
    desc: `Surface de contrôle ultra-compacte permettant de mixer ses projets musicaux en studio avec une ergonomie tactile. Elle offre 8 faders individuels et 24 potentiomètres rotatifs.<br><br>
          <a href="https://www.stars-music.fr/akai-midimix-surface-controle_87378.html" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Voir sur Stars Music ↗
          </a>`
};

// --- I. ÉCRAN DELL + BRAS ARTICULÉ ERGONOMIQUE MANUTAN ---
const screenObjectsList = [
  "object_206", "object_214", "object_217", "object_218", "object_220", "object_222", 
  "object_188", "object_196", "object_199", "object_200", "object_202", "object_204"
];

const screenData = {
    title: "Moniteur Dell 27\" & Bras Ergonomique Manutan",
    desc: `Ensemble d'affichage de régie comprenant l'écran Dell 27" fluide suspendu sur son bras porte-écran articulé noir Manutan Expert pour optimiser l'espace de travail sur le bureau.<br><br>
          <a href="https://www.dell.com/fr-fr/shop/%C3%A9cran-dell-27-200-hz-se2725hg/apd/210-bsns/%C3%A9crans-et-accessoires-pour-%C3%A9crans" target="_blank" style="color: #00d2ff; text-decoration: underline; font-weight: 600;">Voir l'Écran sur Dell ↗</a><br>
          <a href="https://www.manutan.fr/fr/maf/bras-porte-ecran-articule-ergonomique-simple-noir-manutan-expert-ac28285" target="_blank" style="color: #00d2ff; text-decoration: underline; font-weight: 600;">Voir le Bras sur Manutan ↗</a>`
};

// --- J. SONY ALPHA 7 III & BRAS SMALLRIG (Nouvel ajout fusionné) ---
const cameraObjectsList = [
  "object_50", "object_51", "object_52", "object_54", "object_55", 
  "object_57", "object_58", "object_59", "object_42", "object_43", "object_44"
];

const cameraData = {
    title: "Sony Alpha 7 III & Bras Magique SmallRig",
    desc: `Caméra hybride plein format hautes performances associée à un objectif 28-70mm, suspendue solidement par un bras magique articulé articulé SmallRig (11"). Parfait pour capturer des vidéos de qualité professionnelle en régie ou filmer des sessions de podcast.<br><br>
          <a href="https://www.digit-photo.com/SONY-Alpha-7-III-28-70mm-f-3-5-5-6-SEL-rSONYILCE7M3KBCEC.html" target="_blank" style="color: #00d2ff; text-decoration: underline; font-weight: 600;">Voir la Caméra sur Digit-Photo ↗</a><br>
          <a href="https://www.digit-photo.com/SMALLRIG-5309-Support-Bras-Magique-11-rSMALLRIG5309.html" target="_blank" style="color: #00d2ff; text-decoration: underline; font-weight: 600;">Voir le Bras SmallRig sur Digit-Photo ↗</a>`
};

// --- K. ELGATO STREAM DECK MK2 (Nouvel ajout) ---
const streamDeckObjectsList = [
  "object_224", "object_225", "object_226"
];

const streamDeckData = {
    title: "Elgato Stream Deck MK2",
    desc: `Interface de contrôle d'automatisation de studio comprenant 15 touches LCD entièrement personnalisables. Elle permet de lancer des macros, contrôler l'audio, basculer des scènes vidéo et piloter des applications de production en une pression.<br><br>
          <a href="https://www.thomann.fr/elgato_stream_deck_mk2.htm" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Voir sur Thomann ↗
          </a>`
};

// --- L. MICRO DE STUDIO PODCAST SHURE SM7B (Nouvel ajout) ---
const shureMicObjectsList = [
  "object_114", "object_117", "object_118", "object_120", "object_122", "object_124"
];

const shureMicData = {
    title: "Shure SM7B Podcast Bundle",
    desc: `Le microphone dynamique d'antenne et de studio le plus réputé au monde pour la voix. Livré en pack complet avec son bras articulé de table haut de gamme pour une flexibilité maximale et un rendu audio chaud, soyeux et parfaitement isolé des bruits ambiants.<br><br>
          <a href="https://www.thomann.fr/shure_sm_7_b_podcast_bundle.htm" 
             target="_blank" 
             style="color: #00d2ff; text-decoration: underline; font-weight: 600;">
             Voir le pack Shure sur Thomann ↗
          </a>`
};

// --- M. RECHERCHE AUTOMATIQUE / MOTS-CLÉS (Éléments restants) ---
const studioStudioData = [
    {
        keywords: ["graphictablet", "desk", "screen", "bureau", "jarre"],
        title: "La Jarre à Son - Home Studio Desk 2023",
        desc: "Le meuble central du studio de production musicale, doté d'une ergonomie poussée avec sa tablette graphique intégrée et ses supports d'enceintes surélevés.<br><br><a href='https://sketchfab.com/3d-models/la-jarre-a-son-home-studio-desk-2023-538fdc1dc1c1478da6a2761ec3c6dcab' target='_blank' style='color:#00d2ff;font-weight:600;'>Voir sur Sketchfab ↗</a>"
    },
    {
        keywords: ["chair", "chaise", "tabouret", "stool", "wheelchair", "fauteuil"],
        title: "Fauteuil de Direction Ergonomique",
        desc: "Siège de bureau haut de gamme réglable avec accoudoirs, offrant un soutien parfait de la colonne pour travailler confortablement durant les longues sessions de production.<br><br><a href='https://www.jpg.fr/fauteuils-de-direction_sku70961-00J.html' target='_blank' style='color:#00d2ff;font-weight:600;'>Voir le fauteuil sur JPG ↗</a>"
    },
    {
        keywords: ["cushion", "coussin", "pillow"],
        title: "Coussin Décoratif Pokar",
        desc: `Coussin de confort coloré (40x40 Orange), parfait pour apporter une touche de design et optimiser l'assise dans l'espace détente du studio.<br><br>
              <a href="https://pokar.fr/fr/product/1123-coussin-decoratif-pour-palettes-40x40-orange" target="_blank" style="color:#00d2ff;font-weight:600;">Voir sur Pokar ↗</a>`
    }
];

function getObjectData(nameLower) {
    if (drumObjectsList.includes(nameLower)) return drumData;
    if (speakerObjectsList.includes(nameLower)) return speakerData;
    if (sofaObjectsList.includes(nameLower)) return sofaData;
    if (micObjectsList.includes(nameLower)) return micData;
    if (headphoneObjectsList.includes(nameLower)) return headphoneData;
    if (phoneObjectsList.includes(nameLower)) return phoneData;
    if (midiPianoObjectsList.includes(nameLower)) return midiPianoData;
    if (akaiMixObjectsList.includes(nameLower)) return akaiMixData;
    if (screenObjectsList.includes(nameLower)) return screenData;
    if (cameraObjectsList.includes(nameLower)) return cameraData;
    if (streamDeckObjectsList.includes(nameLower)) return streamDeckData;
    if (shureMicObjectsList.includes(nameLower)) return shureMicData;

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
// 6. LE SCANNER DE SCÈNE (EN BAS À DROITE)
// =========================================================================

const selectionBox = new SelectionBox(camera, scene);
const helper = new SelectionHelper(renderer, 'selectBox');

const namesPanel = document.createElement('div');
namesPanel.id = 'extraction-panel';
namesPanel.style.position = 'absolute';
namesPanel.style.bottom = '20px';
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
