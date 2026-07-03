import type { AcceptableTarget, CorePiece, MountedPiece, MountPiece, RelocateFn } from "@collagejs/core";
import { AsyncQueue } from "./AsyncQueue.js";
import { trivialRelocate } from "./trivialRelocate.js";

/**
 * A queue that manages the mounting, unmounting, updating, and relocating of a `CorePiece` object in a sequential manner.
 */
export class CorePieceLcQueue<
    TProps extends Record<string, any> = Record<string, any>,
    TCap extends Record<string, any> = {}
> extends AsyncQueue {
    /**
     * CorePiece object to be managed by this queue.
     */
    #corePiece: CorePiece<TProps, TCap>;
    /**
     * MountPiece function that handles the mounting of the `CorePiece` object.
     */
    #mountPiece: MountPiece<TProps, TCap>;
    /**
     * MountedPiece object that represents the currently mounted state of the `CorePiece` object, if any.
     */
    #mountedPiece: MountedPiece<TProps, TCap> | undefined;
    /**
     * Optional RelocateFn function that handles the relocation of the `CorePiece` object. If not provided, a default 
     * relocation function will be used.
     */
    #relocateFn: RelocateFn | undefined;
    /**
     * Initializes a new instance of this class.
     * @param corePiece `CorePiece` object to manage.
     * @param mountPiece Function used to mount the `CorePiece` object.
     * @param relocateFn Optional function used to relocate the `CorePiece` object.
     */
    constructor(corePiece: CorePiece<TProps, TCap>, mountPiece: MountPiece<TProps, TCap>, relocateFn?: RelocateFn) {
        super(true);
        this.#corePiece = corePiece;
        this.#mountPiece = mountPiece;
        this.#relocateFn = relocateFn;
    }
    /**
     * Mounts the `CorePiece` object to the specified target with the given properties.
     * @param target The target to mount the piece to.
     * @param props The properties to pass to the piece during mounting.
     * @returns The mounting promise.
     */
    mount(target: AcceptableTarget, props: TProps) {
        return this.enqueue(async () => {
            if (this.#mountedPiece) {
                throw new Error("Cannot mount a piece that is already mounted.");
            }
            this.#mountedPiece = await this.#mountPiece(this.#corePiece, target, props);
        });
    }
    /**
     * Unmounts the `CorePiece` object.
     * @returns The unmounting promise.
     */
    unmount() {
        return this.enqueue(async () => {
            await this.#mountedPiece?.unmount();
            this.#mountedPiece = undefined;
        });
    }
    /**
     * Updates the `CorePiece` object with the given properties.
     * @param props The properties to update the piece with.
     * @returns The updating promise.
     */
    update(props: TProps) {
        return this.enqueue(() => {
            if (!this.#mountedPiece) {
                throw new Error("Cannot update a piece that is not mounted.");
            }
            return this.#mountedPiece.update(props);
        });
    }
    /**
     * Relocates the `CorePiece` object from the source target to the target target with the given properties.
     * @param source The source target from which to relocate the piece.
     * @param target The target to which to relocate the piece.
     * @param props The properties to pass to the piece during relocation via remounting, if needed.
     * @returns The relocation promise.
     */
    relocate(source: AcceptableTarget, target: AcceptableTarget, props: TProps) {
        return this.enqueue(async () => {
            if (!this.#mountedPiece) {
                throw new Error("Cannot relocate a piece that is not mounted.");
            }
            const result = await this.#mountedPiece.relocate(source, target);
            if (result === 'ready') {
                (this.#relocateFn ?? trivialRelocate)(source, target);
            }
            else if (!result) {
                // Relocation failed or is disallowed, so unmount and mount instead.
                if (!this.#mountedPiece.capabilities?.remountable) {
                    console.warn("The piece either disallowed or failed relocation internally.  It will be remounted in the new target despite not being remountable, which might result in inconsistencies or errors.");
                }
                await this.#mountedPiece.unmount();
                this.#mountedPiece = await this.#mountPiece(this.#corePiece, target, props);
            }
        });
    }
}
