import { describe, test, expect } from "vitest";
import { AsyncQueue } from "../src/AsyncQueue.js";
import { delay } from "./utils.js";

describe("LifecycleSync", () => {
    describe("enqueue", () => {
        test("Should execute functions in order.", async () => {
            const lifecycleSync = new AsyncQueue();
            let result = "";
            const fn1 = async () => { result += "1"; };
            const fn2 = async () => { result += "2"; };
            const fn3 = async () => { result += "3"; };

            lifecycleSync.enqueue(fn1);
            lifecycleSync.enqueue(fn2);
            lifecycleSync.enqueue(fn3);

            await delay();

            expect(result).toBe("123");
        });
        test("Should return the promise of the enqueued function.", async () => {
            const lifecycleSync = new AsyncQueue();
            const fn = async () => "test";
            const promise = lifecycleSync.enqueue(fn);
            const result = await promise;
            expect(result).toBe("test");
        });
        test("An error in the chain should not prevent subsequent functions from executing.", async () => {
            const lifecycleSync = new AsyncQueue();
            let result = "";
            const fn1 = async () => { result += "1"; };
            const fn2 = async () => { throw new Error("Test error"); };
            const fn3 = async () => { result += "3"; };

            lifecycleSync.enqueue(fn1);
            lifecycleSync.enqueue(fn2);
            lifecycleSync.enqueue(fn3);

            await delay();

            expect(result).toBe("13");
        });
        test("Should return a promise that throws when awaited if the enqueued function throws.", async () => {
            const lifecycleSync = new AsyncQueue();
            const fn = async () => { throw new Error("Test error"); };
            const promise = lifecycleSync.enqueue(fn);
            await expect(promise).rejects.toThrow("Test error");
        });
        test("Should abort the chain if a function throws and abortChainOnError is true.", async () => {
            const lifecycleSync = new AsyncQueue(true);
            let result = "";
            const fn1 = async () => { result += "1"; };
            const fn2 = async () => { throw new Error("Stop the queue!"); };
            const fn3 = async () => { result += "3"; };
            const fn4 = async () => { result += "4"; };

            lifecycleSync.enqueue(fn1);
            lifecycleSync.enqueue(fn2);
            lifecycleSync.enqueue(fn3);
            lifecycleSync.enqueue(fn4);
            await delay();
            // await expect(ep2).rejects.toThrow();
            expect(result).toBe("1");
            await lifecycleSync.resetError();
        });
    });
    describe("resetError", () => {
        test("Should reset the error state of the chain.", async () => {
            const lifecycleSync = new AsyncQueue(true);
            lifecycleSync.enqueue(async () => { throw new Error("Test error"); });
            let p = lifecycleSync.enqueue(async () => Promise.resolve());
            // The chain became useless.  Any subsequent enqueued function will not execute because they attach to 
            // a rejected promise.
            await expect(p).rejects.toThrow();
            await lifecycleSync.resetError();
            p = lifecycleSync.enqueue(async () => Promise.resolve());
            await expect(p).resolves.toBeUndefined();
        });
    });
    describe("transferTo", () => {
        test("Should transfer the chain to another queue and mark this queue as disposed.", async () => {
            const lifecycleSync1 = new AsyncQueue(true);
            const lifecycleSync2 = new AsyncQueue(true);
            const fn1 = async () => { throw new Error("Stop the queue!"); };
            const fn2 = async () => { };

            lifecycleSync1.enqueue(fn1);
            lifecycleSync1.transferTo(lifecycleSync2);
            const p = lifecycleSync2.enqueue(fn2);

            await delay();

            await expect(p).rejects.toThrow();
            await lifecycleSync2.resetError();
        });
        test("Should throw an error if the queue has been transferred.", async () => {
            const lifecycleSync1 = new AsyncQueue();
            const lifecycleSync2 = new AsyncQueue();
            lifecycleSync1.transferTo(lifecycleSync2);
            expect(() => lifecycleSync1.enqueue(async () => Promise.resolve())).toThrow();
        });
        test("Should protect the chain if this queue is in abort-on-error mode and the other one is not.", async () => {
            const lifecycleSync1 = new AsyncQueue(true);
            const lifecycleSync2 = new AsyncQueue(false);
            const fn1 = async () => { throw new Error("Stop the queue!"); };
            const fn2 = async () => { };

            lifecycleSync1.enqueue(fn1);
            lifecycleSync1.transferTo(lifecycleSync2);
            const p = lifecycleSync2.enqueue(fn2);

            await delay();

            await expect(p).resolves.toBeUndefined();
        });
    });
});
