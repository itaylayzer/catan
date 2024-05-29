export type Action = () => void;
export default function useDestroy(actions: Action[]) {
    return () => {
        for (const action of actions) {
            action();
        }
    };
}
