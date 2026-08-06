import { describe, test, expect, vi, afterEach } from "vitest";
import { CorePieceLcQueue } from "../src/CorePieceLcQueue.js";
import { mountPiece } from "@collagejs/core";
import { unmountAndTransferLcQueue } from "../src/unmountAndTransferLcQueue.js";

// vi.mock('./CorePieceLcQueue.js', async () => {
//     return {
//         CorePieceLcQueue: vi.fn(class {
            
//         });
//     }
// });

const mockPiece = {
    mount: vi.fn(),
};

describe("unmountAndTransferLcQueue", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });
    test("Should unmount the current lifecycle queue and transfer to a new lifecycle queue.", async () => {
        const lc = new CorePieceLcQueue(mockPiece, mountPiece);
        const newLc = new CorePieceLcQueue(mockPiece, mountPiece);
        await lc.mount({} as any, {});
        expect(lc.isMounted).toBe(true);
        const transferredLc = unmountAndTransferLcQueue(lc, newLc);
        expect(transferredLc).toBe(newLc);
        await transferredLc.chain;
        expect(newLc.isMounted).toBe(false);
    });
    test("Should unmount the current lifecycle queue and transfer to a new lifecycle queue built from a new piece.", async () => {
        const lc = new CorePieceLcQueue(mockPiece, mountPiece);
        await lc.mount({} as any, {});
        expect(lc.isMounted).toBe(true);
        const newPiece = {
            mount: vi.fn(),
        };
        const transferredLc = unmountAndTransferLcQueue(lc, newPiece, mountPiece);
        expect(transferredLc).toBeInstanceOf(CorePieceLcQueue);
        expect(transferredLc).not.toBe(lc);
        await transferredLc.chain;
        expect(transferredLc.isMounted).toBe(false);
    });
});
