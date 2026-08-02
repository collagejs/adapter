import { describe, test, expect, vi, afterEach, beforeEach } from "vitest";
import { buildPiece } from "../src/buildPiece.js";
import { createApp } from "vue";
import { mountPiece } from "@collagejs/core";
import { mountPieceContextKey } from "../src/context.js";

const hoisted = vi.hoisted(() => {
    vi.resetModules();
    return {
        createApp: {
            mount: vi.fn(),
            unmount: vi.fn(),
            provide: vi.fn(),
        },
        h: vi.fn(),
    };
});

vi.mock(import("vue"), async () => {
    const actual = await vi.importActual<typeof import("vue")>("vue");
    return {
        ...actual,
        createApp: vi.fn().mockImplementation(() => {
            return {
                ...hoisted.createApp,
            };
        }),
        h: hoisted.h,
    };
});

describe("buildPiece", () => {
    test("Should throw an error if no component is provided.", () => {
        expect(() => buildPiece(undefined as any)).toThrow();
    });
    test.each([
        "remountable" as const,
        "relocatable" as const,
    ])("Should warn if the provided meta object contains the %s property.", (property) => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        buildPiece({} as any, {
            meta: {
                [property]: true,
            },
        });
        expect(warnSpy).toHaveBeenCalledOnce();
        warnSpy.mockRestore();
    });
    test("Should return a core piece object with 1 mount function, 1 update function, 1 relocate function and the metadata.", () => {
        const piece = buildPiece({} as any);
        expect(piece).toHaveProperty("mount");
        expect(piece).toHaveProperty("update");
        expect(piece).toHaveProperty("relocate");
        expect(piece).toHaveProperty("meta");
        expect(piece.meta).toHaveProperty("remountable");
        expect(piece.meta).toHaveProperty("relocatable");
        (["mount", "update", "relocate"] as const).forEach((key) => {
            if (Array.isArray(piece[key])) {
                let fnCount = 0;
                piece[key].forEach((fn) => {
                    if (typeof fn === "function") {
                        fnCount++;
                    }
                });
                expect(fnCount).toBe(1);
            }
            else {
                expect(typeof piece[key]).toBe("function");
            }
        });
    });
    test("Should add the preventRemount function to the mount array if the remountable option is false.", () => {
        const piece = buildPiece({} as any, {
            remountable: false,
        });
        expect(Array.isArray(piece.mount)).toBe(true);
        expect(piece.mount.length).toBe(2);
        expect(typeof piece.mount[0]).toBe("function");
        expect(typeof piece.mount[1]).toBe("function");
    });
    test.each([
        "supported" as const,
        "unsupported" as const,
    ])("Should return a relocate function that returns a promise that resolves to the relocation '%s' option.", async (relocation) => {
        const piece = buildPiece({} as any, {
            relocation,
        });
        if (typeof piece.relocate === "function") {
            const result = await piece.relocate({} as any, {} as any);
            expect(result).toBe(relocation);
        }
        else {
            throw new Error("Relocate is not a function.  Adjust this test's expectations.");
        }
    });
    test("Should forward the relocation function as piece.relocate if a function is provided.", async () => {
        const relocationFn = vi.fn().mockResolvedValue("supported");
        const piece = buildPiece({} as any, {
            relocation: relocationFn,
        });
        expect(piece.relocate).toBe(relocationFn);
    });

    describe('mount', () => {
        afterEach(() => {
            vi.clearAllMocks();
        });
        test('Should create a Vue app and call its mount function.', async () => {
            const piece = buildPiece({} as any);
            const mounted = await mountPiece(piece, {} as any);
            expect(createApp).toHaveBeenCalledOnce();
            expect(hoisted.createApp.mount).toHaveBeenCalledOnce();
        });
        test('Should create a Vue app and register the mountPiece function inside props as context.', async () => {
            const piece = buildPiece({} as any);
            const mounted = await mountPiece(piece, {} as any);
            expect(createApp).toHaveBeenCalledOnce();
            expect(hoisted.createApp.provide).toHaveBeenCalledWith(mountPieceContextKey, expect.any(Function));
        });
        test("Should call the configureApp callback when provided.", async () => {
            const configureApp = vi.fn();
            const piece = buildPiece({} as any, {
                configureApp,
            });
            const mounted = await mountPiece(piece, {} as any);
            expect(configureApp).toHaveBeenCalledOnce();
        });
        test("Should use an HTML element as mounting target if a ShadowRoot is provided.", async () => {
            const shadowRoot = document.createElement("div").attachShadow({ mode: "open" });
            const piece = buildPiece({} as any);
            const mounted = await mountPiece(piece, shadowRoot);
            expect(createApp).toHaveBeenCalledOnce();
            const target = hoisted.createApp.mount.mock.calls[0]?.[0];
            expect(target).toBeInstanceOf(HTMLElement);
            expect(shadowRoot.contains(target)).toBe(true);
        });
        test("Should use the provided HTMLElement as mounting target if an HTMLElement is provided.", async () => {
            const element = document.createElement("div");
            const piece = buildPiece({} as any);
            const mounted = await mountPiece(piece, element);
            expect(createApp).toHaveBeenCalledOnce();
            const target = hoisted.createApp.mount.mock.calls[0]?.[0];
            expect(target).toBe(element);
        });
        test("Should return an unmount function that calls the Vue app's unmount function.", async () => {
            const piece = buildPiece({} as any);
            const mounted = await mountPiece(piece, {} as any);
            await mounted.unmount();
            expect(hoisted.createApp.unmount).toHaveBeenCalledOnce();
        });
        test("Should remove the child element from the ShadowRoot when unmounting.", async () => {
            const shadowRoot = document.createElement("div").attachShadow({ mode: "open" });
            const piece = buildPiece({} as any);
            const mounted = await mountPiece(piece, shadowRoot);
            const target = hoisted.createApp.mount.mock.calls[0]?.[0];
            expect(shadowRoot.contains(target)).toBe(true);
            await mounted.unmount();
            expect(shadowRoot.contains(target)).toBe(false);
        });
    });
    describe('update', () => {
        beforeEach(() => {
            hoisted.createApp.mount.mockReturnValue({});
        });
        afterEach(() => {
            vi.clearAllMocks();
        });
        test("Should throw an error if the component has not been mounted.", async () => {
            const piece = buildPiece({} as any);
            await expect(piece.update({} as any)).rejects.toThrow();
        });
        test("Should update the props of the Vue component instance.", async () => {
            const piece = buildPiece({} as any);
            const mounted = await mountPiece<{ ab: number; cd: number; foo?: string; }>(piece, {} as any, { ab: 1, cd: 2 });
            (vi.mocked(createApp).mock.calls[0]?.[0] as any).render();
            const props = hoisted.h.mock.calls[0]?.[1];
            const newProps = { foo: "bar" };
            await mounted.update(newProps);
            expect(props).toMatchObject(newProps);
        });
    });
});
