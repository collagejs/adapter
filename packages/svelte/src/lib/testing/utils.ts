export function delay(time = 0) {
    return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), time);
    });
}
