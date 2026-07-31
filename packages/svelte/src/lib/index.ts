import { buildPieceFactory } from './collagejs/collage.svelte.ts';
export { default as Piece } from './Piece/Piece.svelte';
export * from './Piece/Piece.svelte';
/**
 * Creates a `CorePiece`-compliant object from a Svelte component.
 * @param component The Svelte component to wrap.
 * @param options Optional options object for additional features and configuration of the mount/unmount process.
 * @returns A `CorePiece`-compliant object that wraps the given Svelte component.
 */
export const buildPiece = buildPieceFactory();
