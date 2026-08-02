import { describe, test, expect, vi } from "vitest";
import { extractMountPieceFromProps } from "../src/props.js";
import { mountPieceKey, type MountPiece } from "@collagejs/core";

describe("extractMountPieceFromProps", () => {
    test("Should return undefined if props is undefined.", () => {
        const result = extractMountPieceFromProps(undefined);
        expect(result).toBeUndefined();
    });
    test("Should extract the mountPiece function from props and remove it.", () => {
        const mountPiece: MountPiece = vi.fn();
        const props = {
            [mountPieceKey]: mountPiece,
        };
        const result = extractMountPieceFromProps(props);
        expect(result).toBe(mountPiece);
        expect(props[mountPieceKey]).toBeUndefined();
    });
    test("Should return undefined if mountPiece is not present in props.", () => {
        const props = {
            someProp: "value",
        };
        const result = extractMountPieceFromProps(props);
        expect(result).toBeUndefined();
        expect(props.someProp).toBe("value");
    });
});
