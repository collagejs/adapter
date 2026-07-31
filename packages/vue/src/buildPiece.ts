import { createApp, type Component, h, reactive, type App, type VNodeProps, type ComponentPublicInstance } from "vue";
import type { BuildPieceOptions } from "./types.js";
import { mountPiece as coreMountPiece, mountPieceKey, preventRemount, type AcceptableTarget, type CorePiece, type CorePieceMeta, type MountPiece } from "@collagejs/core";
import { mountPieceContextKey } from "./context.js";

export type MountProps<TProps extends Record<string, any> = Record<string, any>> = TProps & {
    [x: symbol]: MountPiece;
};

class PieceContext<TProps extends VNodeProps> {
    #initialProps: TProps | undefined;
    app: App<Element> | undefined;
    props: TProps;
    instance: ComponentPublicInstance<TProps> | undefined;

    constructor(initialProps?: TProps) {
        this.#initialProps = initialProps;
        this.props = reactive({}) as TProps;
    }

    createApp(component: Component<TProps>, props?: TProps) {
        this.props = reactive({
            ...this.#initialProps,
            ...props
        }) as TProps;
        this.app = createApp({
            render: () => h(component, this.props)
        });
        return this.app;
    }
}

/**
 * Creates a *CollageJS* core piece from a Vue component.  The piece can be mounted, updated, and relocated.
 * @param component Component to wrap.
 * @param options Additional options.
 * @returns The *CollageJS* piece, ready to be mounted.
 */
export function buildPiece<
    TProps extends Record<string, any> = Record<string, any>,
    TMeta extends Record<string, any> = {}
>(component: Component<TProps>, options?: BuildPieceOptions<TProps, TMeta>) {
    const pieceContext = new PieceContext<TProps>(options?.props);
    
    const relocation = options?.relocation ?? 'supported';
    const meta = {
        remountable: options?.remountable ?? true,
        relocatable: !!relocation && relocation !== 'unsupported',
        ...options?.meta
    };

    return {
        mount: [meta.remountable === false && preventRemount(), mountComponent.bind(pieceContext)] as const,
        update: updateComponent.bind(pieceContext),
        relocate: typeof relocation === 'string' ?
            () => Promise.resolve(relocation) :
            relocation,
        get meta() {
            return meta as CorePieceMeta & TMeta;
        }
    } satisfies CorePiece<TProps, TMeta>;

    async function mountComponent(this: PieceContext<TProps>, target: AcceptableTarget, props?: MountProps<TProps>) {
        const mountPiece = props?.[mountPieceKey];
        delete props?.[mountPieceKey];
        const app = this.createApp(component, props);
        app.provide(mountPieceContextKey, mountPiece ?? coreMountPiece);
        options?.configureApp?.(app);
        let targetElement: Element | ShadowRoot;
        if (target instanceof ShadowRoot) {
            targetElement = globalThis.document.createElement('div');
            target.appendChild(targetElement);
        }
        else {
            targetElement = target;
        }
        this.instance = app.mount(targetElement) as ComponentPublicInstance<TProps>;
        return () => {
            app.unmount();
            targetElement.remove();
            this.instance = undefined;
            return Promise.resolve();
        }
    }

    async function updateComponent(this: PieceContext<TProps>, newProps: Partial<TProps>) {
        if (!this.instance) {
            throw new Error('Cannot update:  No component has been mounted.');
        }
        for (let key in newProps) {
            /*
            The issue here is that TProps might have required properties, and since newProps is now partial, 
            required properties might carry undefined values.

            This cannot be helped.  It should only be necessary to specify the properties that change.  The for..in
            loop will correctly enumerate keys with undefined values and this is valid, as optional properties can
            become undefined after being defined.
            */
            // @ts-expect-error TS2322
            this.props[key] = newProps[key];
        }
        return Promise.resolve();
    }
}
