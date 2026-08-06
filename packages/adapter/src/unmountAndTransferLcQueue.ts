import { CorePieceLcQueue } from "./CorePieceLcQueue.js";
import type { CorePiece, MountPiece } from "@collagejs/core";
import type { CorePieceLcQueueOptions } from "./types.js";

/**
 * Unmounts the *CollageJS* core piece object associated with the current lifecycle queue and transfers the queue to the
 * provided new lifecycle queue.
 * @param lc Current lifecycle queue instance.
 * @param newLc New lifecycle queue instance.
 * @returns The new lifecycle queue instance.
 */
export function unmountAndTransferLcQueue<TProps extends Record<string, any> = Record<string, any>>(
    lc: CorePieceLcQueue<TProps>,
    newLc: CorePieceLcQueue<TProps>,
): CorePieceLcQueue<TProps>;
/**
 * Unmounts the *CollageJS* core piece object associated with the current lifecycle queue and transfers the queue to a
 * new lifecycle queue that is built using the provided core piece and mounting function.
 * @param lc Current lifecycle queue instance.
 * @param newPiece New *CollageJS* core piece object.
 * @param mountPieceFn Parent-aware or core mounting function.
 * @param options Optional options for the new lifecycle queue instance.
 * @returns The new lifecycle queue instance.
 */
export function unmountAndTransferLcQueue<TProps extends Record<string, any> = Record<string, any>>(
    lc: CorePieceLcQueue<TProps>,
    newPiece: CorePiece<TProps> | Promise<CorePiece<TProps>>,
    mountPieceFn: MountPiece<TProps>,
    options?: CorePieceLcQueueOptions,
): CorePieceLcQueue<TProps>;
export function unmountAndTransferLcQueue<TProps extends Record<string, any> = Record<string, any>>(
    lc: CorePieceLcQueue<TProps>,
    newLcOrPiece: CorePieceLcQueue<TProps> | CorePiece<TProps> | Promise<CorePiece<TProps>>,
    mountPieceFn?: MountPiece<TProps>,
    options?: CorePieceLcQueueOptions,
) {
    lc.unmount();
    if (newLcOrPiece instanceof CorePieceLcQueue) {
        lc.transferTo(newLcOrPiece);
        return newLcOrPiece;
    }
    if (!mountPieceFn) {
        throw new Error("mountPieceFn is required when providing a new piece.");
    }
    const newLc = new CorePieceLcQueue(newLcOrPiece, mountPieceFn, options);
    lc.transferTo(newLc);
    return newLc;
}
