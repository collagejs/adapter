import { describe, test, expect, vi } from "vitest";
import { CorePieceLcQueue } from "../src/CorePieceLcQueue.js";
import type { CorePiece } from "@collagejs/core";

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
            const unmountFn = vi.fn();
            const mountPiece = vi.fn().mockResolvedValue({ unmount: unmountFn, update: vi.fn() });
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            await expect(queue.unmount()).resolves.not.toThrow();
            expect(unmountFn).not.toHaveBeenCalled();
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
            const mountPiece = vi.fn().mockResolvedValue({ unmount, update: vi.fn(), relocate: vi.fn().mockResolvedValue(false), meta: {} });
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
            const mountPiece = vi.fn().mockResolvedValue({ unmount, update: vi.fn(), relocate: vi.fn().mockResolvedValue(false), meta: { remountable: true } });
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
    describe("transferTo", () => {
        test("Should transfer the queue to another queue.", async () => {
            const corePiece = {} as CorePiece;
            const mountPiece = vi.fn().mockResolvedValue({ unmount: vi.fn(), update: vi.fn() });
            const queue1 = new CorePieceLcQueue(corePiece, mountPiece);
            const queue2 = new CorePieceLcQueue(corePiece, mountPiece);
            queue1.transferTo(queue2);
            expect(() => queue1.mount({} as any, {})).toThrow();
            await expect(queue2.mount({} as any, {})).resolves.not.toThrow();
        });
    });
    describe("enqueue", () => {
        test("Should enqueue functions and execute them in order.", async () => {
            const corePiece = {} as CorePiece;
            const mountPiece = vi.fn().mockResolvedValue({ unmount: vi.fn(), update: vi.fn() });
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            const results: number[] = [];
            queue.enqueue(async () => { results.push(1); });
            queue.enqueue(async () => { results.push(2); });
            queue.enqueue(async () => { results.push(3); });
            await queue.chain;
            expect(results).toEqual([1, 2, 3]);
        });
        test("Should provide the mounted piece to the enqueued functions.", async () => {
            const corePiece = {} as CorePiece;
            const mountPiece = vi.fn().mockResolvedValue({ unmount: vi.fn(), update: vi.fn() });
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            const target = document.createElement("div");
            await queue.mount(target, {});
            let mountedPieceInFn: any;
            queue.enqueue(async (mp) => { mountedPieceInFn = mp; });
            await queue.chain;
            expect(mountedPieceInFn).toBeDefined();
        });
        test("Should not provide any mounted piece to the enqueued functions if the piece is not mounted.", async () => {
            const corePiece = {} as CorePiece;
            const mountPiece = vi.fn().mockResolvedValue({ unmount: vi.fn(), update: vi.fn() });
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            let mountedPieceInFn: any;
            queue.enqueue(async (mp) => { mountedPieceInFn = mp; });
            await queue.chain;
            expect(mountedPieceInFn).toBeUndefined();
        });
    });
    describe("isMounted", () => {
        test("Should return true if the piece is mounted.", async () => {
            const corePiece = {} as CorePiece;
            const mountPiece = vi.fn().mockResolvedValue({ unmount: vi.fn(), update: vi.fn() });
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            const target = document.createElement("div");
            await queue.mount(target, {});
            expect(queue.isMounted).toBe(true);
        });
        test("Should return false if the piece is not mounted.", async () => {
            const corePiece = {} as CorePiece;
            const mountPiece = vi.fn().mockResolvedValue({ unmount: vi.fn(), update: vi.fn() });
            const queue = new CorePieceLcQueue(corePiece, mountPiece);
            expect(queue.isMounted).toBe(false);
        });
    });
});
