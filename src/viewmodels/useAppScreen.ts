import { useEffect } from "react";
import game from "../game/game";
import useDestroy, { Action } from "../hooks/useDestroy";
import { useAssetStore } from "./useAssetLoader";

export const useApScreens = () => {
    const assets = useAssetStore();

    useEffect(() => {
        const destroyers: Action[] = [];

        (async () => {
            const { destroyer } = await game(assets);
            destroyers.push(destroyer);
        })();

        return useDestroy(destroyers);
    }, []);

    return {};
};
