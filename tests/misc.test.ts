import { describe, test, expect } from "vitest";
import { hostAttributes, hostDataAttribute, frameworkDataAttribute } from "../src/misc.js";

describe("hostAttributes", () => {
    test.each<{
        shadow: boolean | ShadowRootInit | ShadowRootMode;
        text: string;
        expected: Record<string, string>;
    }>([
        {
            shadow: false,
            text: "false",
            expected: { [hostDataAttribute]: "dom" },
        },
        {
            shadow: true,
            text: "true",
            expected: { [hostDataAttribute]: "open" },
        },
        {
            shadow: { mode: "open" },
            text: "{ mode: 'open' }",
            expected: { [hostDataAttribute]: "open" },
        },
        {
            shadow: { mode: "closed" },
            text: "{ mode: 'closed' }",
            expected: { [hostDataAttribute]: "closed" },
        },
        {
            shadow: "open",
            text: "'open'",
            expected: { [hostDataAttribute]: "open" },
        },
    ])(`Should apply the correct value to ${hostDataAttribute} when shadow is $text .`, ({ shadow, expected }) => {
        expect(hostAttributes({ shadow })).toEqual(expect.objectContaining(expected));
    });
    test(`Should apply the correct value to ${frameworkDataAttribute} when framework is provided.`, () => {
        const framework = "react";
        const expected = { [frameworkDataAttribute]: framework };
        expect(hostAttributes({ framework })).toEqual(expect.objectContaining(expected));
    });
});
