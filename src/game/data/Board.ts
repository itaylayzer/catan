import * as THREE from "three";
import * as CANNON from "cannon-es";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import HexagonGeometry from "../lib/hexagon";
import { degToRad, randInt } from "three/src/math/MathUtils.js";
import { colors } from "../constants";
import { Dice } from "./Dice";
import { Font } from "three/examples/jsm/Addons.js";

function toWhite(img: HTMLImageElement) {
    // Create a canvas element
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d")!;

    // Set canvas dimensions to match the image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get the image data
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;

    // Loop through each pixel and set it to white
    for (var i = 0; i < data.length; i += 4) {
        // Set RGB values to 255 (white)
        data[i] = 255; // Red
        data[i + 1] = 255; // Green
        data[i + 2] = 255; // Blue
    }

    // Put the modified image data back onto the canvas
    ctx.putImageData(imageData, 0, 0);

    return canvas;
}

const matsColors: Record<string, string> = {
    wood: "#75d9a7",
    sheep: "#a0f38b",
    wheat: "#f1ee8f",
    blank: "#1a1a1a",
    brick: "#e98a84",
    stone: "#d0d0d0",
};

export class Board extends THREE.Group {
    private hasRolled: boolean;

    constructor(world: CANNON.World, textures: Record<string, THREE.Texture>, font: Font) {
        super();
        this.hasRolled = false;
        const rows = [3, 4, 5, 4, 3];

        const matsTexture: Record<string, THREE.CanvasTexture> = {};
        for (const key of Object.keys(matsColors)) {
            if (key == "blank") continue;
            matsTexture[key] = new THREE.CanvasTexture(toWhite(textures[key].image as HTMLImageElement));
        }

        const hexColors: string[] = [
            "wood",
            "wood",
            "wood",
            "wood",
            "sheep",
            "sheep",
            "sheep",
            "sheep",
            "wheat",
            "blank",
            "wheat",
            "wheat",
            "wheat",
            "brick",
            "brick",
            "brick",
            "stone",
            "stone",
            "stone",
        ];
        const numbers: number[] = [2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12];
        shuffle(hexColors, 0, 9);
        shuffle(numbers, 0, 9);
        shuffle(hexColors, 10, 19);
        shuffle(numbers, 10, 19);
        const round = 5;
        const height = 1;
        const spacing = 1.1;
        const fixing = { x: 0.86, z: 0.75 };

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            for (let colIndex = 0; colIndex < rows[rowIndex]; colIndex++) {
                const colorName = hexColors.pop();

                let colorValue;
                if (colorName) colorValue = matsColors[colorName];
                const hex = new THREE.Mesh(new HexagonGeometry(round, height), new THREE.MeshStandardMaterial({ color: colorValue }));
                hex.position.x = fixing.x * round * spacing * (-(rows[rowIndex] - 3) + colIndex * 2);
                hex.position.z = rowIndex * 2 * round * fixing.z * spacing;

                const hexNumber = numbers.pop()!;

                const textBody = new THREE.Mesh(
                    new TextGeometry(hexNumber.toString(), {
                        font,
                        depth: 0.1,
                        height: 0.001,
                        size: 2 + +(colorName == "blank"),
                    }),
                    new THREE.MeshBasicMaterial({ color: "white" })
                );
                textBody.position.x = hex.position.x - 1;
                textBody.position.z = hex.position.z;
                textBody.position.z = hex.position.z + 1 + +(colorName == "blank") * 0.5;
                textBody.position.y = 0.55;
                textBody.rotation.x = -Math.PI / 2;
                if (colorName != "blank" && colorName) {
                    const text: THREE.Texture = matsTexture[colorName].clone();

                    const matIcon = new THREE.Mesh(
                        new THREE.PlaneGeometry(3, 3),
                        new THREE.MeshBasicMaterial({
                            map: text,
                            transparent: true,
                        })
                    );
                    super.add(matIcon);
                    matIcon.position.x = hex.position.x + 1.5;
                    matIcon.position.z = hex.position.z;
                    matIcon.position.y = 0.55;
                    textBody.position.x = hex.position.x - 2.5 - +(hexNumber.toString().length > 1) * 1.5;
                    matIcon.rotation.x = -Math.PI / 2;
                }
                super.add(textBody);

                super.add(hex);
            }
        }
        var box = new THREE.Box3().setFromObject(this);
        const size = new THREE.Vector3();
        box.getSize(size);
        const mult = { x: 1.81, z: 3.28 };
        this.position.x -= round * mult.x;
        this.position.z -= round * mult.z;

        const ground = new THREE.Mesh(new HexagonGeometry(30, 1), new THREE.MeshStandardMaterial({ color: colors.sea }));
        ground.position.y -= 1;
        ground.rotation.y = degToRad(60) * 0.5;

        ground.position.x += round * mult.x * 1.08333;
        ground.position.z += round * mult.z * 1.08333;

        // super.add(ground);

        world.addBody(new CANNON.Body({ shape: new CANNON.Box(new CANNON.Vec3(size.x / 2, 0.5, size.z / 2)), mass: 0 }));
    }

    get rollable(): boolean {
        return !this.hasRolled;
    }
    public async rollDice(world: CANNON.World, scene: THREE.Scene, assets: Record<string, THREE.Texture>) {
        this.hasRolled = true;
        Dice.clear(world, scene);
        const promises = [Dice.roll(-5, world, scene, assets), Dice.roll(5, world, scene, assets)];
        await Promise.all(promises);
        this.hasRolled = false;
    }
}

function shuffle<T>(hexColors: T[], minIndex: number, maxIndex: number) {
    for (; minIndex < maxIndex; minIndex++) {
        const index = randInt(minIndex, maxIndex - 1);
        const temp = hexColors[minIndex];

        hexColors[minIndex] = hexColors[index];
        hexColors[index] = temp;
    }
}
