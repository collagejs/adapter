import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { buildPieceFactory } from "./collage.svelte.ts";
import Dummy from "../testing/Dummy.svelte";
import { mountPieceKey, type MountFn, type UpdateFn } from "@collagejs/core";
import { createRawSnippet } from "svelte";

const mountMock = vi.fn();
const unmountMock = vi.fn();
const buildPiece = buildPieceFactory(mountMock, unmountMock);

describe("buildPiece", () => {
    beforeEach(() => {
        mountMock.mockReturnValue({});
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    test("Should throw an error when no component is given to it.", () => {
        // @ts-expect-error Testing error case
        expect(() => buildPiece(undefined)).toThrow();
    });
    test("Should emit a warning when 'target' is specified in mount options.", () => {
        const consoleWarnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});
        buildPiece(Dummy, {
            mount: {
                // @ts-expect-error target is not allowed here
                target: document.createElement("div"),
            },
        });
        expect(consoleWarnSpy).toHaveBeenCalledOnce();
        consoleWarnSpy.mockRestore();
    });
    test("Should return an object compliant with the CorePiece interface.", async () => {
        const piece = buildPiece(Dummy);
        expect(piece).toHaveProperty("mount");
        if (Array.isArray(piece.mount)) {
            let hasFn = false;
            for (const mountFn of piece.mount) {
                if (!mountFn) {
                    continue;
                }
                expect(typeof mountFn).toBe("function");
                hasFn = true;
            }
            expect(hasFn).toBe(true);
        } else {
            expect(typeof piece.mount).toBe("function");
        }
        expect(piece).toHaveProperty("update");
        expect(typeof piece.update).toBe("function");
    });
    describe("Metadata", () => {
        test("Should return the metadata provided in options.", () => {
            const metadata = {
                abc: false,
            };
            const piece = buildPiece(Dummy, {
                meta: metadata,
            });
            expect(piece.meta).toEqual(expect.objectContaining(metadata));
        });
        test("Should return a metadata object with 'remountable' and 'relocatable' set to 'true' if no metadata is provided.", () => {
            const piece = buildPiece(Dummy);
            expect(piece.meta).toEqual({
                remountable: true,
                relocatable: true,
            });
        });
        test.each([false, true])(
            "Should return a metadata object with 'remountable' set to %s if remountable is set to false in options.",
            (remountable) => {
                const piece = buildPiece(Dummy, {
                    remountable,
                });
                expect(piece.meta).toEqual(
                    expect.objectContaining({ remountable }),
                );
            },
        );
        test("Should forward any user-defined metadata to the returned piece object.", () => {
            const meta = {
                remountable: false,
                custom: true,
            };
            const piece = buildPiece(Dummy, {
                meta,
            });
            expect(piece.meta).toEqual(expect.objectContaining(meta));
        });
        test.each([
            {
                expected: false,
                relocation: "unsupported" as const,
            },
            {
                expected: false,
                relocation: false as const,
            },
            {
                expected: true,
                relocation: "supported" as const,
            },
            {
                expected: true,
                relocation: vi.fn(),
            },
            {
                expected: true,
                relocation: [],
            },
        ])(
            "Should set 'relocatable' to $expected if relocation is set to $relocation .",
            ({ expected, relocation }) => {
                const piece = buildPiece(Dummy, {
                    relocation,
                });
                expect(piece.meta.relocatable).toBe(expected);
            },
        );
        test("Should ignore any user-defined 'remountable' or 'relocatable' metadata if remountable or relocation is set in options.", () => {
            const piece = buildPiece(Dummy, {
                remountable: false,
                relocation: "unsupported",
                meta: {
                    remountable: true,
                    relocatable: true,
                },
            });
            expect(piece.meta).toEqual(
                expect.objectContaining({
                    remountable: false,
                    relocatable: false,
                }),
            );
        });
    });
    describe("Mounting", () => {
        test("Should preserve any incoming context when mounting.", async () => {
            const context = new Map().set("testKey", "testValue");
            const piece = buildPiece(Dummy, {
                mount: {
                    context,
                },
            });
            await Promise.all(
                piece.mount
                    .filter(Boolean)
                    .map((fn) =>
                        (fn as MountFn)(document.createElement("div")),
                    ),
            );
            const mountOptions = mountMock.mock.calls[0][1];
            expect(mountOptions.context).toBeInstanceOf(Map);
            expect(mountOptions.context.get("testKey")).toBe("testValue");
        });
        test("Should not pass the 'mountPiece' prop to the component being mounted.", async () => {
            const piece = buildPiece(Dummy);
            await Promise.all(
                piece.mount.filter(Boolean).map((fn) =>
                    (fn as MountFn)(document.createElement("div"), {
                        [mountPieceKey]: vi.fn(),
                    }),
                ),
            );
            const mountOptions = mountMock.mock.calls[0][1];
            expect(
                Object.getOwnPropertySymbols(mountOptions.props),
            ).not.toContain(mountPieceKey);
        });
        test("Should merge props from mount options and mount call, with mount call taking precedence.", async () => {
            const piece = buildPiece(Dummy, {
                mount: {
                    props: {
                        propA: "fromMountOptions",
                        propB: "fromMountOptions",
                    },
                },
            });
            await Promise.all(
                piece.mount.filter(Boolean).map((fn) =>
                    (fn as MountFn)(document.createElement("div"), {
                        propB: "fromMountCall",
                        propC: "fromMountCall",
                    }),
                ),
            );
            const mountOptions = mountMock.mock.calls[0][1];
            expect(mountOptions.props).toEqual({
                propA: "fromMountOptions",
                propB: "fromMountCall",
                propC: "fromMountCall",
            });
        });
        test("Should add the 'preventRemount' function to the mount lifecycle if remountable is false.", async () => {
            const piece = buildPiece(Dummy, {
                remountable: false,
            });
            expect(piece.mount).toBeInstanceOf(Array);
            expect(piece.mount).toHaveLength(2);
            const [preventRemountFn, mountFn] = piece.mount;
            expect(typeof preventRemountFn).toBe("function");
            expect(typeof mountFn).toBe("function");
        });
        describe("Unmounting", () => {
            test("Should throw an error if there is no component to unmount.", async () => {
                mountMock.mockReturnValueOnce(undefined);
                const piece = buildPiece(Dummy);
                const target = document.createElement("div");
                const unmountFns = await Promise.all(
                    piece.mount
                        .filter(Boolean)
                        .map((fn) => (fn as MountFn)(target)),
                );
                await expect(() =>
                    Promise.all(unmountFns.map((fn) => fn?.())),
                ).rejects.toThrow();
            });
        });
    });
    describe("Updating", () => {
        test("Should throw an error if no component has been mounted.", async () => {
            const piece = buildPiece(Dummy);
            await expect((piece.update as UpdateFn)({})).rejects.toThrow();
        });
        test("Should update the component's props when update is called.", async () => {
            const realBuildPiece = buildPieceFactory();
            let currentProps: Record<string, any> = {};
            const children = createRawSnippet<[Record<string, any>]>(
                (argsFn) => {
                    return {
                        render() {
                            const args = argsFn();
                            $inspect(args).with(
                                (t, v) => (currentProps = $state.snapshot(v)),
                            );
                            return `<div></div>`;
                        },
                    };
                },
            );
            const piece = realBuildPiece(Dummy);
            await Promise.all(
                piece.mount.filter(Boolean).map((fn) =>
                    (fn as MountFn)(document.createElement("div"), {
                        children,
                        propA: "initialA",
                        propB: "initialB",
                    }),
                ),
            );
            expect(currentProps).toEqual({
                propA: "initialA",
                propB: "initialB",
            });
            await (piece.update as UpdateFn)({
                propB: "updatedB",
                propC: "newC",
            });
            expect(currentProps).toEqual({
                propA: "initialA",
                propB: "updatedB",
                propC: "newC",
            });
        });
    });
    describe("Relocation", () => {
        test("Should, by default, create a CorePiece object that supports relocation.", async () => {
            const piece = buildPiece(Dummy);
            expect(piece.relocate).toBeInstanceOf(Function);
            const relocationResult = await (piece.relocate as Function)();
            expect(relocationResult).toBe("supported");
        });
        test.each([
            {
                text: "supports",
                relocation: "supported" as const,
            },
            {
                text: "does not support",
                relocation: "unsupported" as const,
            },
        ])(
            "Should create a CorePiece object $text relocation if $relocation is specified.",
            async ({ relocation }) => {
                const piece = buildPiece(Dummy, {
                    relocation,
                });
                expect(piece.relocate).toBeInstanceOf(Function);
                const relocationResult = await (piece.relocate as Function)();
                expect(relocationResult).toBe(relocation);
            },
        );
        test("Should create a CorePiece object that uses the provided relocation function if one is specified.", async () => {
            const relocationFn = vi.fn().mockResolvedValue("supported");
            const piece = buildPiece(Dummy, {
                relocation: relocationFn,
            });
            expect(piece.relocate).toBeInstanceOf(Function);
            await (piece.relocate as Function)();
            expect(relocationFn).toHaveBeenCalledOnce();
        });
    });
});
