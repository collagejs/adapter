import type { AcceptableTarget } from "@collagejs/core";

/**
 * Relocates all children from the source element to the target element using a simple `appendChild` 
 * operation.
 * 
 * The function doesn't perform any checks or validations on the source and target elements.
 * @param source DOM element whose children will be migrated to the target element.
 * @param target DOM element that receives the children found in the source element.
 * @returns A boolean indicating whether the relocation was successful.
 */
export function trivialRelocate(source: AcceptableTarget, target: AcceptableTarget) {
    while (source.firstChild) {
        target.appendChild(source.firstChild);
    }
    return true;
}
