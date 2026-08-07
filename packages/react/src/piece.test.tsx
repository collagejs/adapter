import {
    mountPiece,
    type AcceptableTarget,
    type CorePiece,
} from "@collagejs/core";
import { hostDataAttribute, frameworkDataAttribute } from "@collagejs/adapter";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Piece, piece } from "./piece.js";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { StrictMode } from "react";
import { CollageProvider } from "./collageContext.js";

type TestPieceProps = {
    testId?: string;
    message?: string;
    [x: string]: any;
};

const testPiece = {
    mount: vi.fn(async (target: AcceptableTarget, props?: TestPieceProps) => {
        const span = document.createElement("span");
        span.textContent = props?.message ?? "";
        span.dataset.testid = props?.testId;
        target.appendChild(span);
        return vi.fn(() => {
            span.remove();
            return Promise.resolve();
        });
    }),
    update: vi.fn(async (props: Partial<TestPieceProps>) => {
        return Promise.resolve();
    }),
} satisfies CorePiece<TestPieceProps>;

const testId= "test-piece";

function WithStrictMode({ use, children }: { use: boolean; children: React.ReactNode }) {
    if (!use) {
        return <>{children}</>;
    }
    return <StrictMode>{children}</StrictMode>;
}

[false, true].forEach((strictMode) => {
    const strictModeTitle = strictMode ? "[Strict Mode]: " : "";
    describe(`${strictModeTitle}Piece`, () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });
        test.each([
            {
                shadow: false,
                title: "its container element",
                expectedHostAttrValue: "dom",
            },
            {
                shadow: true,
                title: "the container's open shadow root",
                expectedHostAttrValue: "open",
            },
            {
                shadow: { mode: "closed" as const },
                title: "the container's closed shadow root",
                expectedHostAttrValue: "closed",
            },
            {
                shadow: { mode: "open" as const },
                title: "the container's open shadow root (root init)",
                expectedHostAttrValue: "open",
            }
        ])(`${strictModeTitle}Should mount the given core piece in $title, identified with its expected host attributes.`, async ({ shadow, expectedHostAttrValue }) => {
            const message = "CollageJS";
            render(
                <WithStrictMode use={strictMode}>
                    {/* @ts-expect-error */}
                    <Piece {...piece(testPiece, { shadow, containerProps: { "data-testid": testId } })} message={message} />
                </WithStrictMode>
            );
            const pieceRootLocator = page.getByTestId(testId);
            await expect.element(pieceRootLocator).toBeInTheDocument();
            const el = pieceRootLocator.element();
            expect(el?.getAttribute(hostDataAttribute)).toBe(expectedHostAttrValue);
            expect(el?.getAttribute(frameworkDataAttribute)).toBe("react");
        });
        test(`${strictModeTitle}Should unmount the core piece when the component is unmounted.`, async () => {
            const onUnmount = vi.fn();
            const cp = {
                ...testPiece,
                mount: [() => onUnmount(), testPiece.mount],
            };
            const message = "CollageJS";
            const { unmount } = await render(
                <WithStrictMode use={strictMode}>
                    <Piece {...piece(cp)} testId={testId} message={message} onUnmount={onUnmount} />
                </WithStrictMode>
            );
            const pieceRootLocator = page.getByTestId(testId);
            await expect.element(pieceRootLocator).toBeInTheDocument();
            await unmount();
            expect(onUnmount).toHaveBeenCalled();
        });
        test(`${strictModeTitle}Should update the core piece when the component is updated.`, async () => {
            const onMount = vi.fn();
            const onUpdate = vi.fn();
            const cp = {
                ...testPiece,
                mount: [onMount, testPiece.mount],
                update: [onUpdate, testPiece.update],
            };
            const message = "CollageJS";
            const { rerender } = await render(
                <WithStrictMode use={strictMode}>
                    <Piece {...piece(cp)} testId={testId} message={message} onUpdate={onUpdate} />
                </WithStrictMode>
            );
            const pieceRootLocator = page.getByTestId(testId);
            await expect.element(pieceRootLocator).toBeInTheDocument();
            const newMessage = "CollageJS Updated";
            vi.resetAllMocks();
            await rerender(
                <WithStrictMode use={strictMode}>
                    <Piece {...piece(cp)} testId={testId} message={newMessage} onUpdate={onUpdate} />
                </WithStrictMode>
            );
            expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ message: newMessage }));
            expect(onMount).not.toHaveBeenCalled();
        });
        test(`${strictModeTitle}Should forward container properties.`, async () => {
            const message = "CollageJS";
            const containerProps = {
                "data-testid": testId,
                className: "container-class",
            };
            await render(
                <WithStrictMode use={strictMode}>
                    <Piece {...piece(testPiece, { containerProps })} message={message} />
                </WithStrictMode>
            );
            const pieceRootLocator = page.getByTestId(testId);
            const el = pieceRootLocator.element();
            expect(el?.classList.contains("container-class")).toBe(true);
        });
        test.each([
            {
                text: 'disable',
                logging: false,
            },
            {
                text: 'enable',
                logging: true,
            },
        ])(`${strictModeTitle}Should $text debug logging when setting logging to $logging .`, async ({ logging }) => {
            const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
            const { unmount } = await render(
                <WithStrictMode use={strictMode}>
                    <Piece {...piece(testPiece, { logging })} testId={testId} message="CollageJS" />
                </WithStrictMode>
            );
            if (logging) {
                expect(debugSpy).toHaveBeenCalled();
            } else {
                expect(debugSpy).not.toHaveBeenCalled();
            }
            await unmount();
            debugSpy.mockRestore();
        });
        test(`${strictModeTitle}Should use the parent-aware mountPiece function stored in context.`, async () => {
            const contextMountPiece = vi.fn(mountPiece);
            const message = "CollageJS";
            await render(
                <CollageProvider value={contextMountPiece}>
                    <WithStrictMode use={strictMode}>
                        <Piece {...piece(testPiece)} testId={testId} message={message} />
                    </WithStrictMode>
                </CollageProvider>
            );
            expect(contextMountPiece).toHaveBeenCalled();
        });

        describe(`${strictModeTitle}Rerendering`, () => {
            test(`${strictModeTitle}Should unmount the initial core piece and mount the new one.`, async () => {
                const onUnmount = vi.fn();
                const cp1 = {
                    mount: [() => Promise.resolve(onUnmount), testPiece.mount],
                };
                const cp2 = {
                    mount: vi.fn(),
                };
                const { rerender } = await render(
                    <WithStrictMode use={strictMode}>
                        <Piece {...piece(cp1)} testId={testId} message="CollageJS" onUnmount={onUnmount} />
                    </WithStrictMode>
                );
                const pieceRootLocator = page.getByTestId(testId);
                await expect.element(pieceRootLocator).toBeInTheDocument();
                onUnmount.mockClear();
                await rerender(
                    <WithStrictMode use={strictMode}>
                        <Piece {...piece(cp2)} testId={testId} message="CollageJS" />
                    </WithStrictMode>
                );
                expect(onUnmount).toHaveBeenCalled();
                expect(cp2.mount).toHaveBeenCalled();
            });
            test(`${strictModeTitle}Should relocate the core piece when the shadow option changes.`, async () => {
                const message = "CollageJS";
                const unmountSpy = vi.fn();
                const mountSpy = vi.fn().mockResolvedValue(unmountSpy);
                const relocateSpy = vi.fn().mockResolvedValue('supported');
                const cp = {
                    ...testPiece,
                    mount: [mountSpy, testPiece.mount],
                    relocate: relocateSpy,
                    meta: {
                        relocatable: true,
                    }
                };
                const { rerender } = await render(
                    <WithStrictMode use={strictMode}>
                        <Piece {...piece(cp, { shadow: false })} testId={testId} message={message} />
                    </WithStrictMode>
                );
                vi.clearAllMocks();
                await rerender(
                    <WithStrictMode use={strictMode}>
                        <Piece {...piece(cp, { shadow: true })} testId={testId} message={message} />
                    </WithStrictMode>
                );
                const pieceRootLocator = page.getByTestId(testId);
                await expect.element(pieceRootLocator).toBeInTheDocument();
                const parent = pieceRootLocator.element().parentNode;
                expect(parent).toBeInstanceOf(ShadowRoot);
                expect(relocateSpy).toHaveBeenCalled();
                expect(unmountSpy).not.toHaveBeenCalled();
                expect(mountSpy).not.toHaveBeenCalled();
            });
            test(`${strictModeTitle}Should pass updated props to the core piece when props change.`, async () => {
                const unmountSpy = vi.fn();
                const mountSpy = vi.fn().mockResolvedValue(unmountSpy);
                const updateSpy = vi.fn();
                const cp = {
                    ...testPiece,
                    mount: [mountSpy, testPiece.mount],
                    update: [updateSpy, testPiece.update],
                };
                const { rerender } = await render(
                    <WithStrictMode use={strictMode}>
                        <Piece {...piece(cp)} testId={testId} message="CollageJS" />
                    </WithStrictMode>
                );
                const pieceRootLocator = page.getByTestId(testId);
                await expect.element(pieceRootLocator).toBeInTheDocument();
                const newMessage = "CollageJS Updated";
                vi.resetAllMocks();
                await rerender(
                    <WithStrictMode use={strictMode}>
                        <Piece {...piece(cp)} testId={testId} message={newMessage} />
                    </WithStrictMode>
                );
                expect(mountSpy).not.toHaveBeenCalled();
                expect(unmountSpy).not.toHaveBeenCalled();
                expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ message: newMessage }));
            });
            test(`${strictModeTitle}Should remount the core piece when the parent-aware mountPiece context changes.`, async () => {
                const contextMountPiece1 = vi.fn(mountPiece);
                const contextMountPiece2 = vi.fn(mountPiece);
                const message = "CollageJS";
                const unmountSpy = vi.fn();
                const mountSpy = vi.fn().mockResolvedValue(unmountSpy);
                const cp = {
                    ...testPiece,
                    mount: [mountSpy, testPiece.mount],
                };
                const { rerender } = await render(
                    <CollageProvider value={contextMountPiece1}>
                        <WithStrictMode use={strictMode}>
                            <Piece {...piece(cp)} testId={testId} message={message} />
                        </WithStrictMode>
                    </CollageProvider>
                );
                vi.clearAllMocks();
                await rerender(
                    <CollageProvider value={contextMountPiece2}>
                        <WithStrictMode use={strictMode}>
                            <Piece {...piece(cp)} testId={testId} message={message} />
                        </WithStrictMode>
                    </CollageProvider>
                );
                await expect.element(page.getByTestId(testId)).toBeInTheDocument();
                expect(unmountSpy).toHaveBeenCalled();
                expect(mountSpy).toHaveBeenCalled();
                expect(contextMountPiece2).toHaveBeenCalled();
            });
        });
    });
});
