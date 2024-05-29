import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { create } from "zustand";

// https://gero3.github.io/facetype.js/

export type loadedAssets = {
    gltf: { [key: string]: GLTF };
    fbx: { [key: string]: THREE.Group };
    textures: { [key: string]: THREE.Texture };
    fonts: { [key: string]: Font };
    progress: number;
};

const defualtValue: loadedAssets = {
    fbx: {},
    fonts: {},
    gltf: {},
    textures: {},
    progress: 0,
};

type AssetStore = loadedAssets & { loadMeshes(items: Record<string, string>): Promise<void> };

export const useAssetStore = create<AssetStore>((set) => ({
    ...defualtValue,
    loadMeshes(items) {
        const SetProgress = (progress: number) => set({ progress });

        return new Promise<void>((resolve, reject) => {
            const loadingManager = new THREE.LoadingManager();
            const gltfLoader = new GLTFLoader(loadingManager);
            const fbxLodaer = new FBXLoader(loadingManager);
            const textureLoader = new THREE.TextureLoader(loadingManager);
            const fontLoader = new FontLoader(loadingManager);

            const _assets = {
                gltf: {},
                fbx: {},
                textures: {},
                fonts: {},
            } as loadedAssets;

            const itemsLength = Object.keys(items).length;
            let itemProgress = 0;
            let minerProgress = 0;
            for (const itemEntry of Object.entries(items)) {
                const [itemName, itemSrc] = itemEntry;

                switch (true) {
                    case itemSrc.endsWith(".fbx"):
                        {
                            fbxLodaer.load(
                                itemSrc,
                                (mesh1) => {
                                    _assets.fbx[itemName] = mesh1;

                                    itemProgress += 1 / itemsLength;
                                    minerProgress = 0;
                                    set({ progress: itemProgress });
                                },
                                (progres) => {
                                    minerProgress = progres.loaded / progres.total;
                                    set({ progress: itemProgress + minerProgress / itemsLength });
                                },
                                (error) => {
                                    reject(error);
                                }
                            );
                        }
                        break;
                    case itemSrc.endsWith(".gltf"):
                        {
                            gltfLoader.load(
                                itemSrc,
                                (mesh1) => {
                                    _assets.gltf[itemName] = mesh1;

                                    itemProgress += 1 / itemsLength;
                                    minerProgress = 0;
                                    SetProgress(itemProgress);
                                },
                                (progres) => {
                                    minerProgress = progres.loaded / progres.total;
                                    SetProgress(itemProgress + minerProgress / itemsLength);
                                },
                                (error) => {
                                    reject(error);
                                }
                            );
                        }
                        break;
                    case itemSrc.endsWith(".png"):
                        {
                            textureLoader.load(
                                itemSrc,
                                (mesh1) => {
                                    _assets.textures[itemName] = mesh1;

                                    itemProgress += 1 / itemsLength;
                                    minerProgress = 0;
                                    SetProgress(itemProgress);
                                },
                                (progres) => {
                                    minerProgress = progres.loaded / progres.total;
                                    SetProgress(itemProgress + minerProgress / itemsLength);
                                },
                                (error) => {
                                    reject(error);
                                }
                            );
                        }
                        break;
                    case itemSrc.endsWith(".typeface.json"):
                        {
                            fontLoader.load(
                                itemSrc,
                                (font) => {
                                    _assets.fonts[itemName] = font;
                                    itemProgress += 1 / itemsLength;
                                    minerProgress = 0;
                                    SetProgress(itemProgress);
                                },
                                (progres) => {
                                    minerProgress = progres.loaded / progres.total;
                                    SetProgress(itemProgress + minerProgress / itemsLength);
                                }, // onProgress callback (useful for progress tracking)
                                (error) => {
                                    reject(error); // Reject the promise if there's an error
                                }
                            );
                        }
                        break;
                }
            }

            loadingManager.onLoad = () => {
                console.log(`Loaded FBX`, JSON.stringify(Array.from(Object.keys(_assets.fbx))));
                console.log(`Loaded GLTF`, JSON.stringify(Array.from(Object.keys(_assets.gltf))));
                console.log(`Loaded Textures`, JSON.stringify(Array.from(Object.keys(_assets.textures))));
                console.log(`Loaded Fonts`, JSON.stringify(Array.from(Object.keys(_assets.fonts))));

                set({ ..._assets });
                requestAnimationFrame(() => {
                    SetProgress(2);
                });

                resolve();
            };
        });
    },
}));
