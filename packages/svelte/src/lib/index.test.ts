import { describe, test, expect } from "vitest";
import * as lib from "./index.ts";

describe("Index", () => {
    test("Should only export the expected objects.", () => {
        const expectedExports = [
            "Piece",
            "piece",
            "buildPiece"
        ];
        for (const key of Object.keys(lib)) {
            expect(expectedExports).toContain(key);
        }
        for (const key of expectedExports) {
            expect(lib).toHaveProperty(key);
        }
    });
});
