import { describe, test, expect } from "vitest";

describe("index", () => {
    test("Should export exactly the expected objects.", async () => {
        const expectedExports = [
            "AsyncQueue",
            "CorePieceLcQueue",
            "getPieceTarget",
            "trivialRelocate",
            "hostDataAttribute",
            "frameworkDataAttribute",
            "hostAttributes",
        ];
        const actualExports = Object.keys(await import("../src/index.js"));
        expect(actualExports).toEqual(expect.arrayContaining(expectedExports));
        expect(expectedExports).toEqual(expect.arrayContaining(actualExports));
    });
});
