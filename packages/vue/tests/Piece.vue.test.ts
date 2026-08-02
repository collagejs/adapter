import { describe, test, expect } from 'vitest';
import { buildPiece } from '../src/buildPiece.js';
import { h, nextTick, reactive } from 'vue';
import { render } from 'vitest-browser-vue';
import Piece from '../src/Piece.vue';
import { frameworkDataAttribute, hostDataAttribute } from '@collagejs/adapter';

const testId = 'test-piece';

const comp = {
    render() {
        return h('span', {}, 'Hello World');
    }
}

const corePiece = buildPiece(comp);

describe('Piece', () => {
    test.each([
        {
            shadow: undefined,
            description: 'light DOM (default)',
        },
        {
            shadow: false,
            description: 'light DOM (shadow=false)',
        },
        {
            shadow: true,
            description: 'shadow DOM (shadow=true)',
        },
        {
            shadow: { mode: 'open' as const },
            description: 'shadow DOM (shadow={mode: "open"})',
        },
        {
            shadow: { mode: 'closed' as const },
            description: 'shadow DOM (shadow={mode: "closed"})',
        }
    ])("Should render the given core piece in $description .", async ({ shadow }) => {
        const screen = render(Piece, {
            props: {
                'data-testid': testId,
                piece: corePiece,
                shadow
            }
        });
        const pieceDom = screen.getByTestId(testId);
        await expect.element(pieceDom).toBeInTheDocument();
        const el = pieceDom.element();
        if (!shadow) {
            expect(el.shadowRoot).toBeNull();
        }
        else {
            expect(() => el.attachShadow({ mode: 'open' })).toThrow();
        }
    });
    test("Should forward the specified piece properties to the mounted piece.", async () => {
        const testProps = {
            foo: 'bar',
            baz: 42
        };
        const screen = render(Piece, {
            props: {
                'data-testid': testId,
                piece: corePiece,
                pieceProps: testProps
            }
        });
        const pieceDom = screen.getByTestId(testId);
        await expect.element(pieceDom).toBeInTheDocument();
        const el = pieceDom.element();
        const span = el.querySelector('span');
        expect(span).not.toBeNull();
        expect(span?.textContent).toBe('Hello World');
        expect(span?.attributes.getNamedItem('foo')?.value).toBe('bar');
        expect(span?.attributes.getNamedItem('baz')?.value).toBe('42');
    });
    test("Should unmount the core piece when the component is unmounted.", async () => {
        let called = false;
        const cp = {
            ...corePiece,
            mount: [corePiece.mount, () => Promise.resolve(() => (called = true, Promise.resolve()))]
        }
        const screen = render(Piece, {
            props: {
                'data-testid': testId,
                piece: cp
            }
        });
        const pieceDom = screen.getByTestId(testId);
        await expect.element(pieceDom).toBeInTheDocument();
        await screen.unmount();
        await nextTick();
        await Promise.resolve(setTimeout(() => {}, 0));
        /*
        Seems that we have to await a lot for the asynchronous unmounting to complete.

        - nextTick() alone doesn't cut it.  The assertion still goes first.
        - The delay() alone doesn't cut it.  The assertion still goes first.
        - nextTick() + delay() seems to work.  The assertion goes last.
        */
        expect(called).toBe(true);
        await expect.element(pieceDom).not.toBeInTheDocument();
    });
    test.each([
        {
            shadow: false,
            expectedHostAttValue: 'dom',
            text: 'light DOM'
        },
        {
            shadow: true,
            expectedHostAttValue: 'open',
            text: 'an open shadow root'
        },
        {
            shadow: { mode: 'closed' as const },
            expectedHostAttValue: 'closed',
            text: 'a closed shadow root'
        }
    ])("Should set the CollageJS piece host attributes when mounting in $text .", async ({ shadow, expectedHostAttValue }) => {
        const screen = render(Piece, {
            props: {
                'data-testid': testId,
                piece: corePiece,
                shadow
            }
        });
        const pieceDom = screen.getByTestId(testId);
        await expect.element(pieceDom).toBeInTheDocument();
        const el = pieceDom.element();
        expect(el.getAttribute(frameworkDataAttribute)).toBe('vue');
        expect(el.getAttribute(hostDataAttribute)).toBe(expectedHostAttValue);
        if (!shadow) {
            expect(el.shadowRoot).toBeNull();
        }
        else {
            expect(() => el.attachShadow({ mode: 'open' })).toThrow();
        }
    });
    test("Should forward all non-properties as attributes to the host element.", async () => {
        const screen = render(Piece, {
            props: {
                'data-testid': testId,
                piece: corePiece,
                'foo': 'bar',
                'baz': 42
            }
        });
        const pieceDom = screen.getByTestId(testId);
        await expect.element(pieceDom).toBeInTheDocument();
        const el = pieceDom.element();
        expect(el.getAttribute('foo')).toBe('bar');
        expect(el.getAttribute('baz')).toBe('42');
    });
    describe("Property Updates", () => {
        test("Should forward pieceProps changes to the core piece.", async () => {
            const initialProps = {
                foo: 'bar',
                baz: 42
            };
            const updatedProps = {
                foo: 'qux',
                baz: 99
            };
            const screen = render(Piece, {
                props: {
                    'data-testid': testId,
                    piece: corePiece,
                    pieceProps: initialProps
                }
            });
            const pieceDom = screen.getByTestId(testId);
            await expect.element(screen.getByTestId(testId)).toBeInTheDocument();
            const el = screen.getByTestId(testId).element();
            const span = el.querySelector('span');
            expect(span).not.toBeNull();
            expect(span?.attributes.getNamedItem('foo')?.value).toBe(initialProps.foo);
            expect(span?.attributes.getNamedItem('baz')?.value).toBe(initialProps.baz.toString());
            // Update the pieceProps
            await screen.rerender({
                pieceProps: updatedProps
            });
            await expect.element(pieceDom).toBeInTheDocument();
            expect(span).not.toBeNull();
            expect(span?.textContent).toBe('Hello World');
            expect(span?.attributes.getNamedItem('foo')?.value).toBe(updatedProps.foo);
            expect(span?.attributes.getNamedItem('baz')?.value).toBe(updatedProps.baz.toString());
        });
        test("Should relocate the core piece when the shadow property changes.", async () => {
            const screen = render(Piece, {
                props: {
                    'data-testid': testId,
                    piece: corePiece,
                    shadow: false
                }
            });
            const pieceDom = screen.getByTestId(testId);
            await expect.element(pieceDom).toBeInTheDocument();
            let el = pieceDom.element();
            expect(el.shadowRoot).toBeNull();
            // Update the shadow property to true
            await screen.rerender({
                shadow: true
            });
            await expect.element(pieceDom).toBeInTheDocument();
            el = pieceDom.element();
            expect(el.shadowRoot).not.toBeNull();
            const span = el.shadowRoot?.querySelector('span');
            expect(span).not.toBeNull();
            expect(span?.textContent).toBe('Hello World');
        });
        test("Should unmount the core piece and mount the new core piece when the piece property changes.", async () => {
            const newComp = {
                render() {
                    return h('div', {}, 'Goodbye World');
                }
            };
            const newCorePiece = buildPiece(newComp);
            const screen = render(Piece, {
                props: {
                    'data-testid': testId,
                    piece: corePiece
                }
            });
            const pieceDom = screen.getByTestId(testId);
            await expect.element(pieceDom).toBeInTheDocument();
            let el = pieceDom.element();
            let span = el.querySelector('span');
            expect(span).not.toBeNull();
            expect(span?.textContent).toBe('Hello World');
            // Update the piece property to the new core piece
            await screen.rerender({
                piece: newCorePiece
            });
            await expect.element(pieceDom).toBeInTheDocument();
            el = pieceDom.element();
            const div = el.querySelector('div');
            expect(div).not.toBeNull();
            expect(div?.textContent).toBe('Goodbye World');
        });
    });
});
