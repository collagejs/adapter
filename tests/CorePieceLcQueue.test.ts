import { describe, test, expect, vi } from "vitest";
import { CorePieceLcQueue } from "../src/CorePieceLcQueue.js";
import { trivialRelocate } from "../src/trivialRelocate.js";
import { CorePiece } from "@collagejs/core";

vi.mock(import("../src/trivialRelocate.js"), () => ({
    trivialRelocate: vi.fn().mockReturnValue(3),
}));

describe("CorePieceLcQueue", () => {
    describe("mount", () => {
        test("Should mount the piece.", async () => {
            const corePiece = {} as CorePiece;
            const mountPiece = vi.fn().mockResolvedValue({ unmount: vi.fn(), update: vi.fn() });
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            const target = document.createElement("div");
            await queue.mount(target, {});
            expect(mountPiece).toHaveBeenCalledWith(corePiece, target, {});
        });
        test("Should throw an error if the piece is already mounted.", async () => {
            const corePiece = {} as CorePiece;
            const mountPiece = vi.fn().mockResolvedValue({ unmount: vi.fn() });
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            const target = document.createElement("div");
            await queue.mount(target, {});
            await expect(queue.mount(target, {})).rejects.toThrow();
        });
    });
    describe("unmount", () => {
        test("Should unmount the piece.", async () => {
            const unmount = vi.fn();
            const corePiece = {} as CorePiece;
            const mountPiece = vi.fn().mockResolvedValue({ unmount, update: vi.fn() });
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            const target = document.createElement("div");
            await queue.mount(target, {});
            await queue.unmount();
            expect(unmount).toHaveBeenCalled();
        });
        test("Should do nothing if the piece is not mounted.", async () => {
            const corePiece = {} as CorePiece;
            const mountPiece = vi.fn().mockResolvedValue({ unmount: vi.fn(), update: vi.fn() });
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            await expect(queue.unmount()).resolves.not.toThrow();
        });
    });
    describe("update", () => {
        test("Should update the piece.", async () => {
            const update = vi.fn();
            const corePiece = {} as CorePiece;
            const mountPiece = vi.fn().mockResolvedValue({ unmount: vi.fn(), update });
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            const target = document.createElement("div");
            await queue.mount(target, {});
            await queue.update({ foo: "bar" });
            expect(update).toHaveBeenCalledWith({ foo: "bar" });
        });
        test("Should throw an error if the piece is not mounted.", async () => {
            const corePiece = {} as CorePiece;
            const mountPiece = vi.fn().mockResolvedValue({ unmount: vi.fn(), update: vi.fn() });
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            await expect(queue.update({ foo: "bar" })).rejects.toThrow();
        });
    });
    describe("relocate", () => {
        test("Should unmount and remount the piece when 'CorePiece.relocate' returns false.", async () => {
            const unmount = vi.fn();
            const mountPiece = vi.fn().mockResolvedValue({ unmount, update: vi.fn(), relocate: vi.fn().mockResolvedValue(false) });
            const corePiece = {} as CorePiece;
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            const source = document.createElement("div");
            const target = document.createElement("div");
            await queue.mount(source, {});
            await queue.relocate(source, target, {});
            expect(unmount).toHaveBeenCalled();
            expect(mountPiece).toHaveBeenCalledWith(corePiece, target, {});
        });
        test("Should throw an error if the piece is not mounted.", async () => {
            const corePiece = {} as CorePiece;
            const mountPiece = vi.fn().mockResolvedValue({ unmount: vi.fn(), update: vi.fn(), relocate: vi.fn() });
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            const source = document.createElement("div");
            const target = document.createElement("div");
            await expect(queue.relocate(source, target, {})).rejects.toThrow();
        });
        test("Should warn if the piece is not remountable and relocation fails.", async () => {
            const unmount = vi.fn();
            const mountPiece = vi.fn().mockResolvedValue({ unmount, update: vi.fn(), relocate: vi.fn().mockResolvedValue(false), capabilities: {} });
            const corePiece = {} as CorePiece;
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            const source = document.createElement("div");
            const target = document.createElement("div");
            await queue.mount(source, {});
            const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
            await queue.relocate(source, target, {});
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("remountable"));
            consoleWarnSpy.mockRestore();
        });
        test("Should not warn if the piece is remountable and relocation fails.", async () => {
            const unmount = vi.fn();
            const mountPiece = vi.fn().mockResolvedValue({ unmount, update: vi.fn(), relocate: vi.fn().mockResolvedValue(false), capabilities: { remountable: true } });
            const corePiece = {} as CorePiece;
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            const source = document.createElement("div");
            const target = document.createElement("div");
            await queue.mount(source, {});
            const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
            await queue.relocate(source, target, {});
            expect(consoleWarnSpy).not.toHaveBeenCalled();
            consoleWarnSpy.mockRestore();
        });
    });
});
