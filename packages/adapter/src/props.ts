import { mountPieceKey, type MountProps } from "@collagejs/core";

/**
 * Extracts the `mountPiece` function from a properties object and removes it from the object.
 * @param props Properties object from where to extract the `mountPiece` function.
 * @returns The obtained `mountPiece` function or `undefined` if there was none.
 */
export function extractMountPieceFromProps<TProps extends Record<string, any>>(
    props: MountProps<TProps> | undefined
) {
    if (!props) {
        return undefined;
    }
    const mountPiece = props[mountPieceKey];
    delete props[mountPieceKey];
    return mountPiece;
}
