import { page,  } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { contextKey } from '$lib/collageContext.js';
import Piece, { piece } from './Piece.svelte';
import { mountPiece, mountPieceKey, type CorePiece } from '@collagejs/core';
import { buildTestPiece, pieceTestId } from '$lib/testing/piece-building.js';
import { delay } from '$lib/testing/utils.js';
import { flushSync } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

// @ts-expect-error
vi.mock(import('@collagejs/core'), async (importActual) => {
    const actual = await importActual()
    return {
        ...actual,
        mountPiece: vi.fn(actual.mountPiece)
    };
});

describe('Piece', () => {
    let testPiece: CorePiece;
    const testPieceCallbacks: Parameters<typeof buildTestPiece>[0] = {
        mount: vi.fn(),
        unmount: vi.fn(),
        update: vi.fn()
    };
    beforeEach(() => {
        testPiece = buildTestPiece(testPieceCallbacks);
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Mounting', () => {
        test("Should obtain the mountPiece function from context.", async () => {
            const context = new Map();
            const mountPieceMock = vi.fn();
            mountPieceMock.mockReturnValue(Promise.resolve());
            context.set(contextKey, {
                mountPiece: mountPieceMock
            });
            const { unmount } = await render(Piece, {
                context,
                props: {
                    ...piece(testPiece)
                }
            });
            // const testEl = page.getByTestId(pieceTestId);
            // await expect.element(testEl).toBeInTheDocument();
            // expect(mountPiece).toHaveBeenCalled();
            // await delay();
            expect(mountPieceMock).toHaveBeenCalledOnce();
            await unmount();
        });
        test("Should use the default mountPiece function if none is in context.", async () => {
            const { unmount } = await render(Piece, {
                props: {
                    ...piece(testPiece)
                }
            });
            const testEl = page.getByTestId(pieceTestId);
            await expect.element(testEl).toBeInTheDocument();
            expect(mountPiece).toHaveBeenCalledOnce();
            await unmount();
        });
        test("Should mount the CollageJS piece given via the piece() function.", async () => {
            const { unmount } = await render(Piece, {
                props: {
                    ...piece(testPiece)
                }
            });
            const testEl = page.getByTestId(pieceTestId);
            await expect.element(testEl).toBeInTheDocument();
            await unmount();
        });
        test("Should pass the specified props to the mounted piece.", async () => {
            const testProps = {
                foo: 'bar',
                count: 42
            };
            const { unmount } = await render(Piece, {
                props: {
                    ...testProps,
                    ...piece(testPiece)
                }
            });
            const testEl = page.getByTestId(pieceTestId);
            await expect.element(testEl).toBeInTheDocument();
            expect(testPieceCallbacks.mount).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining(testProps));
            await unmount();
        });
        test("Should pass the new mountPiece function via props when mounting the piece.", async () => {
            const { unmount } = await render(Piece, {
                props: {
                    ...piece(testPiece)
                }
            });
            expect(testPieceCallbacks.mount).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({
                [mountPieceKey]: expect.any(Function)
            }));
            await unmount();
        });
    });

    describe('Updating', () => {
        test("Should update the mounted piece when the props change (rerender).", async () => {
            const { rerender, unmount } = await render(Piece, {
                props: {
                    ...piece(testPiece),
                    foo: 'initial',
                    count: 1
                }
            });
            const testEl = page.getByTestId(pieceTestId);
            await expect.element(testEl).toBeInTheDocument();

            await rerender({
                ...piece(testPiece),
                foo: 'updated',
                count: 2
            });
            expect(testPieceCallbacks.update).toHaveBeenCalledWith(expect.objectContaining({
                foo: 'updated',
                count: 2
            }));
            await unmount();
        });
        test("Should update the mounted piece when the props change (reactive).", async () => {
            const props = $state({
                ...piece(testPiece),
                foo: 'initial',
                count: 1
            });
            const { unmount } = await render(Piece, {
                props
            });

            const testEl = page.getByTestId(pieceTestId);
            await expect.element(testEl).toBeInTheDocument();
            props.foo = 'updated';
            props.count = 2;
            await delay();
            expect(testPieceCallbacks.update).toHaveBeenCalledWith(expect.objectContaining({
                foo: 'updated',
                count: 2
            }));
            await unmount();
        });
    });

    describe('Unmounting', () => {
        test("Should unmount the mounted piece when the Piece component is unmounted.", async () => {
            const { unmount } = await render(Piece, {
                props: {
                    ...piece(testPiece)
                }
            });
            const testEl = page.getByTestId(pieceTestId);
            await expect.element(testEl).toBeInTheDocument();
            await unmount();
            expect(testPieceCallbacks.unmount).toHaveBeenCalledOnce();
        });
        test("Should wait for mount() to finish before unmounting.", async () => {
            const callOrder: string[] = [];
            vi.mocked(testPieceCallbacks.mount).mockImplementation(() => {
                callOrder.push('mount');
                return () => {
                    callOrder.push('post-delay');
                };
            });
            vi.mocked(testPieceCallbacks.unmount).mockImplementation(() => {
                callOrder.push('unmount');
            });
            const { unmount } = await render(Piece, {
                props: {
                    ...piece(testPiece)
                }
            });
            // Intentionally not waiting for the piece to be mounted.
            await unmount();
            await delay();
            expect(callOrder).toEqual(['mount', 'post-delay', 'unmount']);
        });
    });

    describe('Container Props', () => {
        test("Should pass the container props to the container DIV element.", async () => {
            const containerProps = {
                'data-testid': 'my-piece-container',
                class: 'piece-container-class'
            };
            const { unmount } = await render(Piece, {
                props: {
                    ...piece(testPiece, { containerProps }),
                }
            });
            const containerEl = page.getByTestId(containerProps['data-testid']);
            expect(containerEl).toHaveClass(containerProps.class);
            await unmount();
        });
        test("Should update the container DIV element's props when they change (rerender).", async () => {
            const initialContainerProps = {
                'data-testid': 'my-piece-container',
                class: 'initial-class'
            };
            const updatedContainerProps = {
                'data-testid': 'my-piece-container',
                class: 'updated-class',
                title: 'Piece Container'
            };
            const { rerender, unmount } = await render(Piece, {
                props: {
                    ...piece(testPiece, { containerProps: initialContainerProps }),
                }
            });
            const containerEl = page.getByTestId(initialContainerProps['data-testid']);
            expect(containerEl).toHaveClass(initialContainerProps.class);
            await rerender({
                ...piece(testPiece, { containerProps: updatedContainerProps }),
            });
            expect(containerEl).toHaveClass(updatedContainerProps.class);
            expect(containerEl).toHaveAttribute('title', updatedContainerProps.title);
            await unmount();
        });
        test("Should update the container DIV element's props when they change (reactive).", async () => {
            const containerProps = $state<HTMLAttributes<HTMLDivElement>>({
                'data-testid': 'my-piece-container',
                class: 'initial-class'
            });
            const { unmount } = await render(Piece, {
                props: {
                    ...piece(testPiece, { containerProps }),
                }
            });
            const containerEl = page.getByTestId(containerProps['data-testid']);
            expect(containerEl).toHaveClass(containerProps.class as string);
            containerProps.class = 'updated-class';
            containerProps.title = 'Piece Container';
            flushSync();
            expect(containerEl).toHaveClass('updated-class');
            expect(containerEl).toHaveAttribute('title', 'Piece Container');
            await unmount();
        });
    });
    describe('Shadow Option', () => {
        const containerTestId = 'cjs-piece-container';
        test.each([
            {
                shadow: true,
                text: 'true',
            },
            {
                shadow: { mode: 'open' as const },
                text: 'mode: "open"',
            },
            {
                shadow: { mode: 'closed' as const },
                text: 'mode: "closed"',
            },
        ])("Should mount the piece in a shadow DOM if the shadow option is $text .", async ({ shadow }) => {
            const { unmount } = await render(Piece, {
                props: {
                    ...piece(testPiece, { shadow, containerProps: { 'data-testid': containerTestId } }),
                }
            });
            const testEl = page.getByTestId(containerTestId);
            await expect.element(testEl).toBeInTheDocument();
            expect(() => testEl.element().attachShadow({ mode: 'open' })).toThrow();
            await unmount();
        });
    });
});
