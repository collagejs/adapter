import { describe, test, expect, vi } from "vitest";
import { getPieceTarget } from "../src/getPieceTarget";

describe("getPieceTarget", () => {
    test("Should return the element itself when shadow is false.", () => {
        const element = document.createElement("div");
        const result = getPieceTarget(element, false);
        expect(result).toBe(element);
    });
    test("Should return an open shadow root when shadow is true.", () => {
        const element = document.createElement("div");
        const asSpy = vi.spyOn(element, "attachShadow");
        const result = getPieceTarget(element, true);
        expect(result).toBeInstanceOf(ShadowRoot);
        expect(asSpy).toHaveBeenCalledWith({ mode: "open" });
        asSpy.mockRestore();
    });
    test("Should return a shadow root with the specified configuration when shadow is an object.", () => {
        const element = document.createElement("div");
        const shadowConfig: ShadowRootInit = { mode: "closed" };
        const asSpy = vi.spyOn(element, "attachShadow");
        const result = getPieceTarget(element, shadowConfig);
        expect(result).toBeInstanceOf(ShadowRoot);
        expect(asSpy).toHaveBeenCalledWith(shadowConfig);
        asSpy.mockRestore();
    });
});
