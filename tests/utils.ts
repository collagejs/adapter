export function delay(time = 0): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, time));
}
