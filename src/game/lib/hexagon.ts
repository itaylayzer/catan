import * as THREE from "three";

export default class HexagonGeometry extends THREE.CylinderGeometry {
    constructor(radius: number = 1, depth: number = 1) {
        super(radius, radius, depth, 6);
    }
}
