import type { AcceptableTarget, CorePiece, CorePieceMeta, MountProps, RelocateFn } from "@collagejs/core";
import { delay } from "./utils.ts";

export const pieceTestId = 'cjs-piece-test';

export function buildTestPiece<
    TProps extends Record<string, any> = Record<string, any>,
    TMeta extends Record<string, any> = {}
>(
    callbacks?: {
        mount: (target: AcceptableTarget, props?: MountProps<TProps>) => void | (() => void);
        unmount: () => void;
        update: (props: TProps) => void;
    },
    meta?: CorePieceMeta & TMeta,
    relocateFn?: RelocateFn
): CorePiece<TProps, TMeta> {
    let pre: HTMLElement;
    return {
        async mount(target: AcceptableTarget, props?: MountProps<TProps>) {
            const delayMountCb = callbacks?.mount?.(target, props);
            pre = document.createElement('pre');
            pre.setAttribute('data-testid', pieceTestId);
            pre.textContent = JSON.stringify(props, null, 2);
            target.appendChild(pre);
            if (delayMountCb) {
                await delay();
                delayMountCb();
            }
            const capturedPre = pre;
            return () => {
                callbacks?.unmount?.();
                capturedPre.remove();
                return Promise.resolve();
            };
        },
        update(props: TProps) {
            callbacks?.update?.(props);
            pre.textContent = JSON.stringify(props, null, 2);
            return Promise.resolve();
        },
        relocate: relocateFn ?? (() => Promise.resolve('supported')),
        get meta() {
            return meta;
        }
    } satisfies CorePiece<TProps, TMeta>;
}
