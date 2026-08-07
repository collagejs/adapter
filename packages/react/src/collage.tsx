import { createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
    mountPiece,
    preventRemount,
    type AcceptableTarget,
    type CorePiece,
    type CorePieceMeta,
    type MountPiece,
    type MountProps,
} from "@collagejs/core";
import { CollageProvider } from "./collageContext.js";
import { sanitizeMeta, extractMountPieceFromProps } from '@collagejs/adapter';
import type { BuildPieceOptions } from "./types.js";

class ReactPiece<TProps extends Record<string, any> = Record<string, any>> {
    props = {} as TProps;
    target: AcceptableTarget | undefined = undefined;
    root: Root | undefined = undefined;
    mountPiece: MountPiece | undefined = undefined;
    mounted = false;
}

function renderComponent<TProps extends Record<string, any> = Record<string, any>>(
    component: ComponentType<TProps>,
    root: Root,
    props: TProps,
    parentMountPiece?: MountPiece,
) {
    root.render(
        createElement(CollageProvider, { value: parentMountPiece }, createElement(component, props)),
    );
}
/**
 * Builds a `CorePiece` object that encapsulates the given React component, allowing it to be mounted, updated, and
 *  relocated within a *CollageJS* application.
 * @param component React component to encapsulate as a `CorePiece` object.
 * @param options Optional set of options for the piece-building process.
 * @returns The `CorePiece` object that encapsulates the given component.
 */
export function buildPiece<
    TProps extends Record<string, any> = Record<string, any>,
    TMeta extends Record<string, any> = {}
>(
    component: ComponentType<TProps>,
    options?: BuildPieceOptions<TProps, TMeta>,
) {
    if (!component) {
        throw new Error("No component was given to the function.");
    }

    const thisValue = new ReactPiece<TProps>();

    async function mountComponent(this: ReactPiece<TProps>, target: AcceptableTarget, props?: MountProps<TProps>) {
        if (this.mounted) {
            throw new Error("Cannot mount: this CorePiece instance is already mounted.");
        }
        this.target = target;

        const root = createRoot(target, options?.rootOptions);
        this.root = root;

        const parentAwareMountPiece = extractMountPieceFromProps<TProps>(props);

        const mergedProps = {
            ...options?.props,
            ...props,
        } as TProps;

        this.props = mergedProps;
        this.mountPiece = parentAwareMountPiece;
        renderComponent(component, root, this.props, parentAwareMountPiece);
        this.mounted = true;

        return async () => {
            if (!this.root || !this.target || !this.mounted) {
                throw new Error("Cannot unmount: there is no mounted component instance to unmount.");
            }

            this.root.unmount();
            this.root = undefined;
            this.target = undefined;
            this.mountPiece = undefined;
            this.props = {} as TProps;
            this.mounted = false;
        };
    }

    function updateComponent(this: ReactPiece<TProps>, newProps: Partial<TProps>) {
        if (!this.root || !this.target || !this.mounted) {
            return Promise.reject(new Error("Cannot update: no component has been mounted."));
        }

        for (const key in newProps) {
            // @ts-expect-error TS2322: TProps might have required properties.
            this.props[key] = newProps[key];
        }

        renderComponent(component, this.root, this.props, this.mountPiece);
        return Promise.resolve();
    }

    const relocation = options?.relocation ?? 'supported';
    const meta = {
        remountable: options?.remountable ?? true,
        relocatable: !!relocation && relocation !== 'unsupported',
        ...sanitizeMeta(options?.meta, 'relocatable', 'remountable'),
    } as CorePieceMeta & TMeta;

    return {
        mount: [options?.remountable === false && preventRemount(), mountComponent.bind(thisValue)],
        update: updateComponent.bind(thisValue),
        relocate: typeof relocation === 'string' ? () => Promise.resolve(relocation) : relocation,
        get meta() {
            return meta;
        }
    } satisfies CorePiece<TProps, TMeta>;
}
