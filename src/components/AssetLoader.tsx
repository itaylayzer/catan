import { ReactNode, useEffect } from "react";
import { useAssetStore } from "../viewmodels/useAssetLoader";

export default function AssetLoader({ children, items }: { children: ReactNode; items: Record<string, string> }) {
    const { progress, loadMeshes } = useAssetStore();

    useEffect(() => {
        loadMeshes(items).catch((r) => console.error(r));

        return () => {};
    }, []);

    return progress >= 2 ? (
        children
    ) : (
        <article className="progress">
            <main>
                <h3>Loading</h3>
                <div>
                    <progress value={progress} max={1}></progress> <p>{(progress * 100).toFixed(2)}%</p>
                </div>
            </main>
        </article>
    );
}
