import { describe, test, expect, vi } from "vitest";
import { sanitizeMeta } from "../src/meta.js";

describe("sanitizeMeta", () => {
    test.each([
        'remountable' as const,
        'relocatable' as const,
    ])("Should remove the '%s' property from the meta object and emit a warning.", (property) => {
        const consoleWarnMock = vi.spyOn(console, "warn").mockImplementation(() => { });
        const meta = {
            [property]: true,
        };
        const sanitizedMeta = sanitizeMeta(meta, property);
        expect(sanitizedMeta).not.toHaveProperty(property);
        expect(consoleWarnMock).toHaveBeenCalledTimes(1);
        consoleWarnMock.mockRestore();
    });
    test("Should only remove the specified properties and leave other properties intact.", () => {
        const consoleWarnMock = vi.spyOn(console, "warn").mockImplementation(() => { });
        const meta = {
            remountable: true,
            relocatable: false,
            customProperty: "value",
        };
        const sanitizedMeta = sanitizeMeta(meta, "remountable");
        expect(sanitizedMeta).not.toHaveProperty("remountable");
        expect(sanitizedMeta).toHaveProperty("relocatable", false);
        expect(sanitizedMeta).toHaveProperty("customProperty", "value");
        expect(consoleWarnMock).toHaveBeenCalledTimes(1);
        consoleWarnMock.mockRestore();
    });
});
