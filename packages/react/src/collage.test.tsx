import {
    mountPiece,
    type CorePiece,
    type RelocateFn,
} from "@collagejs/core";
import { afterEach, describe, expect, test, vi } from "vitest";
import { buildPiece } from "./collage.js";
import { createElement } from "react";

const hoisted = vi.hoisted(() => {
    const crRender = vi.fn();
    const crUnmount = vi.fn();
    return {
        createRoot: vi.fn(() => {
            return {
                render: crRender,
                unmount: crUnmount,
            };
        }),
        crRender,
        crUnmount,
        createElement: vi.fn(),
    };
});

vi.mock(import("react"), { spy: true });

// vi.mock(import("react"), async (importActual) => {
//     return {
//         ...await importActual(),
//         createElement: hoisted.createElement,
//     };
// });

vi.mock(import("react-dom/client"), async (importActual) => {
    return {
        ...await importActual(),
        createRoot: hoisted.createRoot,
    }
});

function createProbePiece<
    TProps extends Record<string, any> = Record<string, any>,
>(): CorePiece<TProps> & {
    mountSpy: ReturnType<typeof vi.fn>;
} {
    const mountSpy = vi.fn(async () => {
        return async () => undefined;
    });

    return {
        mount: mountSpy,
        mountSpy,
    };
}

async function settle() {
    await Promise.resolve();
    await Promise.resolve();
}

afterEach(() => {
    document.body.innerHTML = "";
});

describe("buildPiece", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });
    test("Should create a core piece out of a component.", async () => {

        const corePiece = buildPiece(() => { }, {
            rootOptions: {
                identifierPrefix: "cjs-test-",
            },
        });
        expect(corePiece.mount).toBeDefined();
        if (Array.isArray(corePiece.mount)) {
            for (const mountFn of corePiece.mount) {
                if (mountFn !== false) {
                    expect(mountFn).toBeTypeOf("function");
                }
            }
        }
        expect(corePiece.update).toBeTypeOf("function");
        expect(corePiece.relocate).toBeTypeOf("function");
        expect(corePiece.meta).toBeDefined();
    });

    test("Should add the remountable and relocatable meta properties with the default values.", async () => {
        const piece = buildPiece(() => { });
        expect(piece.meta?.remountable).toBe(true);
        expect(piece.meta?.relocatable).toBe(true);
    });

    test("Should add a relocate function that returns 'supported' when the relocation option is not provided.", async () => {
        const piece = buildPiece(() => { });
        expect(piece.relocate).toBeTypeOf("function");
        const relocationResult = await (piece.relocate as RelocateFn)({} as any, {} as any);
        expect(relocationResult).toBe("supported");
    });

    test.each([
        {
            relocation: "supported" as const,
            expectedReturnValue: "supported" as const,
        },
        {
            relocation: "unsupported" as const,
            expectedReturnValue: "unsupported" as const,
        },
        {
            relocation: false as const,
            expectedReturnValue: "unsupported" as const,
        }
    ])("Should add a relocate function that returns $expectedReturnValue when the relocation option is set to $relocation .", async ({ relocation, expectedReturnValue }) => {
        const piece = buildPiece(() => { }, {
            relocation,
        });
        if (relocation !== false) {
            expect(piece.relocate).toBeTypeOf("function");
            const relocationResult = await (piece.relocate as RelocateFn)({} as any, {} as any);
            expect(relocationResult).toBe(expectedReturnValue);
            expect(piece.meta?.relocatable).toBe(expectedReturnValue === 'supported');
        }
    });
    test.each([
        {
            text: "function",
            relocation: async () => "supported" as const,
        },
        {
            text: "array of functions",
            relocation: [async () => "supported" as const],
        }
    ])("Should forward the $text specified in the 'relocation' option as the value of relocate.", async ({ relocation }) => {
        const piece = buildPiece(() => { }, {
            relocation,
        });
        expect(piece.relocate).toBe(relocation);
    });
    test.each([
        false,
        true
    ])("Should set meta.remountable to '%s' when the remountable option is set to that value.", async (remountable) => {
        const piece = buildPiece(() => { }, {
            remountable,
        });
        expect(piece.meta?.remountable).toBe(remountable);
    });
    test("Should add preventRemount to the mount array when remountable is set to false.", async () => {
        const piece = buildPiece(() => { }, {
            remountable: false,
        });
        expect(piece.mount).toBeInstanceOf(Array);
        const mounted = await mountPiece(piece, {} as any, {} as any);
        await mounted.unmount();
        await expect(mountPiece(piece, {} as any, {} as any)).rejects.toThrow();
    });
    describe("mount", () => {
        test("Should mount the component to the specified target.", async () => {
            const target = {} as any;
            const piece = buildPiece(() => { });
            const mounted = await mountPiece(piece, target, {});
            expect(hoisted.createRoot).toHaveBeenCalledWith(target, undefined);
            expect(hoisted.crRender).toHaveBeenCalled();
            await mounted.unmount();
        });
        test("Should mount the component to the specified target with the specified root options.", async () => {
            const target = {} as any;
            const rootOptions = {
                identifierPrefix: "cjs-test-",
            };
            const piece = buildPiece(() => { }, {
                rootOptions,
            });
            const mounted = await mountPiece(piece, target, {});
            expect(hoisted.createRoot).toHaveBeenCalledWith(target, rootOptions);
            await mounted.unmount();
        });
        test("Should pass the parent-aware mountPiece function to context.", async () => {
            const target = {} as any;
            const piece = buildPiece(() => { });
            const mounted = await mountPiece(piece, target, {});
            expect(createElement).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                value: expect.anything(),
            }), expect.anything());
            await mounted.unmount();
        });
        test("Should return a function that unmounts the component when called.", async () => {
            const target = {} as any;
            const piece = buildPiece(() => { });
            const mounted = await mountPiece(piece, target, {});
            expect(hoisted.crUnmount).not.toHaveBeenCalled();
            await mounted.unmount();
            expect(hoisted.crUnmount).toHaveBeenCalled();
        });

        describe("update", () => {
            test("Should update the component with the new props.", async () => {
                const target = {} as any;
                const piece = buildPiece(() => { });
                const mounted = await mountPiece(piece, target);
                vi.mocked(createElement).mockClear();
                await piece.update({ text: "world" });
                expect(createElement).toHaveBeenCalledWith(expect.any(Function), { text: "world" });
                await mounted.unmount();
            });
            test("Should throw an error if the component is not mounted.", async () => {
                const piece = buildPiece(() => { });
                await expect(piece.update({ text: "world" })).rejects.toThrow();
            });
        });
    });
});
