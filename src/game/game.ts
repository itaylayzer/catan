import * as THREE from "three";
import * as CANNON from "cannon-es";
import { createLight } from "./lib/createLights";
import { loadedAssets } from "../viewmodels/useAssetLoader";
import CannonDebugger from "cannon-es-debugger";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { colors } from "./constants";
import { Board } from "./data/Board";
import { Dice } from "./data/Dice";

export default (assets: loadedAssets) => {
    const container = document.querySelector("div.gameContainer") as HTMLDivElement;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.background);

    const world = new CANNON.World();
    world.gravity = new CANNON.Vec3(0, -9.81, 0);

    // @ts-ignore
    const cannonDebugger = CannonDebugger(scene, world, {});

    const camera = new THREE.OrthographicCamera(
        window.innerWidth / -30,
        window.innerWidth / 30,
        window.innerHeight / 30,
        window.innerHeight / -30,
        -150,
        150
    );
    camera.position.set(0, 10, 0);

    camera.lookAt(new THREE.Vector3(0, 0, 0));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    //#region LIGHTS
    createLight(
        [
            {
                color: 0xffffff,
                intensity: 2,
                type: "directional",
                rot: new THREE.Euler(0.1, 0.1, 0),
            },
            {
                color: 0xffffff,
                intensity: 0.7,
                type: "ambient",
                rot: new THREE.Euler(0.9, 0.5, 0),
            },
        ],
        scene
    );

    const board = new Board(world, assets.textures, assets.fonts.roboto);
    scene.add(board);
    assets.fbx.pawn.scale.multiplyScalar(0.008);
    assets.fbx.pawn.position.x -= 2;
    scene.add(assets.fbx.pawn);
    (assets.fbx.pawn.children[0] as THREE.Mesh).material = new THREE.MeshStandardMaterial({ color: "#101010" });
    function _documentEvents() {
        container.addEventListener("click", () => {
            if (board.rollable) {
                board.rollDice(world, scene, assets.textures);
            }
        });
    }

    _documentEvents();
    //#endregion
    const updates: (() => void)[] = [];
    const updateInterval = setInterval(() => {
        [...updates, ...Dice.updates].map((fn) => fn());

        world.step(3 / 60);

        controls.update();
        // cannonDebugger.update();
        renderer.render(scene, camera);
    }, 17);

    return {
        destroyer: () => {
            clearInterval(updateInterval);
            while (container.firstChild) container.removeChild(container.firstChild);
        },
    };
};
