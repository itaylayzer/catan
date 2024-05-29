export default function clamp(val: number, min: number, max: number) {
    return Math.max(Math.min(val, max), min);
}
