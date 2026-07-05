import { describe, test, expect } from "vitest";
import { trivialRelocate } from "../src/trivialRelocate.js";

describe("trivialRelocate", () => {
    test("Should relocate all children from source to target while maintaining order.", () => {
        const source = document.createElement("div");
        const target = document.createElement("div");
        const child1 = document.createElement("main");
        const child2 = document.createElement("article");
        const child3 = document.createElement("section");
        source.appendChild(child1);
        source.appendChild(child2);
        source.appendChild(child3);

        trivialRelocate(source, target);

        expect(target.childNodes).toHaveLength(3);
        expect(target.childNodes[0]).toBe(child1);
        expect(target.childNodes[1]).toBe(child2);
        expect(target.childNodes[2]).toBe(child3);
        expect(source.childNodes).toHaveLength(0);
    });
    test("Should do nothing if source has no children.", () => {
        const source = document.createElement("div");
        const target = document.createElement("div");

        trivialRelocate(source, target);

        expect(target.childNodes).toHaveLength(0);
        expect(source.childNodes).toHaveLength(0);
    });
    test("Should return 'true' when children are relocated.", () => {
        const source = document.createElement("div");
        const target = document.createElement("div");
        const child1 = document.createElement("main");
        const child2 = document.createElement("article");
        source.appendChild(child1);
        source.appendChild(child2);

        const relocated = trivialRelocate(source, target);

        expect(relocated).toBe(true);
    });
});
