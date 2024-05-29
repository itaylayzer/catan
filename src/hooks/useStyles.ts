import { CSSProperties } from "react";

type StyleObject = Record<string, CSSProperties>;

export function useStyles<T extends StyleObject>(styles: T): T {
    return styles;
}
