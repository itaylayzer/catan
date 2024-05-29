import * as THREE from "three";
import * as CANNON from "cannon-es";
import { randInt } from "three/src/math/MathUtils.js";

const numEulars = [
    { x: 0, y: 0, z: (1 * Math.PI) / 2 }, // 1
    { x: 0, y: 0, z: (2 * Math.PI) / 2 }, // 2
    { x: 0, y: 0, z: 0 }, // 3
    { x: (2 * Math.PI) / 2, y: 0, z: 0 }, // 4
    { x: (3 * Math.PI) / 2, y: 0, z: 0 }, // 5
    { x: (1 * Math.PI) / 2, y: 0, z: 0 }, // 6
];

export class Dice {
    private mesh: THREE.Mesh;
    private body: CANNON.Body;
    private updateFn: () => void;
    private quaternion: { x: number; y: number; z: number };
    constructor(world: CANNON.World, scene: THREE.Scene, textures: Record<string, THREE.Texture>) {
        const mats: THREE.Material[] = [];

        for (let index = 1; index < 7; index++) {
            const texture = textures[`dice${index}`];
            texture.name = index.toString();
            mats.push(
                new THREE.MeshStandardMaterial({
                    map: texture,
                })
            );
        }
        const w = 2;

        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(w, w, w), mats);

        this.body = new CANNON.Body({
            mass: 1,
            type: CANNON.BODY_TYPES.STATIC,
            shape: new CANNON.Box(new CANNON.Vec3(0.5 * w, 0.5 * w, 0.5 * w)),
            position: new CANNON.Vec3(0, 10, 0),
        });

        this.updateFn = () => {
            this.body.quaternion.slerp(
                new CANNON.Quaternion().setFromEuler(this.quaternion.x, this.quaternion.y, this.quaternion.z, "XYZ"),
                0.3,
                this.body.quaternion
            );
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
        };

        scene.add(this.mesh);
        world.addBody(this.body);
        this.quaternion = { x: 0, y: 0, z: 0 };
        this.updateFn();
    }
    private get velocityZero(): boolean {
        for (const axis of [this.body.velocity.x, this.body.velocity.y, this.body.velocity.z]) {
            if (Math.abs(axis) > 0.01) return false;
        }
        return true;
    }

    private rotFromNum(val: number): void {
        this.quaternion = numEulars[val - 1];
    }

    private roll(seconds: number): Promise<number> {
        const rand = randInt(1, 6);
        this.rotFromNum(rand);
        if (seconds < 0) return Promise.resolve(rand);
        else {
            return new Promise<number>((resolve) => {
                setTimeout(async () => {
                    resolve(await this.roll(seconds - 100 / (1000 * seconds)));
                }, 100 / seconds);
            });
        }
    }

    private unfreeze(): void {
        this.body.type = CANNON.BODY_TYPES.DYNAMIC;
    }
    private set position(val: number) {
        this.body.position.x = val;
    }
    private static dices: Dice[];
    static {
        this.dices = [];
    }
    public static async clear(world: CANNON.World, scene: THREE.Scene) {
        for (const dice of this.dices) {
            world.removeBody(dice.body);
            scene.remove(dice.mesh);
        }
    }
    public static roll(pos: number, world: CANNON.World, scene: THREE.Scene, assets: Record<string, THREE.Texture>): Promise<number> {
        return new Promise<number>(async (resolve) => {
            const dice = new Dice(world, scene, assets);
            dice.position = pos;
            this.dices.push(dice);

            const num = await dice.roll(2);
            dice.unfreeze();
            const interval = setInterval(() => {
                if (dice.velocityZero) {
                    clearInterval(interval);
                    resolve(num);
                }
            }, 17);
        });
    }

    public static get updates() {
        return this.dices.map((v) => v.updateFn);
    }
}
