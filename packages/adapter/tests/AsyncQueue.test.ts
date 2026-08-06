import { describe, test, expect } from "vitest";
import { AsyncQueue } from "../src/AsyncQueue.js";
import { delay } from "./utils.js";

describe("AsyncQueue", () => {
    describe("enqueue", () => {
        test("Should execute functions in order.", async () => {
            const asyncQueue = new AsyncQueue();
            let result = "";
            const fn1 = async () => { result += "1"; };
            const fn2 = async () => { result += "2"; };
            const fn3 = async () => { result += "3"; };

            asyncQueue.enqueue(fn1);
            asyncQueue.enqueue(fn2);
            asyncQueue.enqueue(fn3);

            await delay();

            expect(result).toBe("123");
        });
        test("Should return the promise of the enqueued function.", async () => {
            const asyncQueue = new AsyncQueue();
            const fn = async () => "test";
            const promise = asyncQueue.enqueue(fn);
            const result = await promise;
            expect(result).toBe("test");
        });
        test("An error in the chain should not prevent subsequent functions from executing.", async () => {
            const asyncQueue = new AsyncQueue();
            let result = "";
            const fn1 = async () => { result += "1"; };
            const fn2 = async () => { throw new Error("Test error"); };
            const fn3 = async () => { result += "3"; };

            asyncQueue.enqueue(fn1);
            asyncQueue.enqueue(fn2);
            asyncQueue.enqueue(fn3);

            await delay();

            expect(result).toBe("13");
        });
        test("Should return a promise that throws when awaited if the enqueued function throws.", async () => {
            const asyncQueue = new AsyncQueue();
            const fn = async () => { throw new Error("Test error"); };
            const promise = asyncQueue.enqueue(fn);
            await expect(promise).rejects.toThrow("Test error");
        });
        test("Should abort the chain if a function throws and abortChainOnError is true.", async () => {
            const asyncQueue = new AsyncQueue(true);
            let result = "";
            const fn1 = async () => { result += "1"; };
            const fn2 = async () => { throw new Error("Stop the queue!"); };
            const fn3 = async () => { result += "3"; };
            const fn4 = async () => { result += "4"; };

            asyncQueue.enqueue(fn1);
            asyncQueue.enqueue(fn2);
            asyncQueue.enqueue(fn3);
            asyncQueue.enqueue(fn4);
            await delay();
            // await expect(ep2).rejects.toThrow();
            expect(result).toBe("1");
            await asyncQueue.resetError();
        });
    });
    describe("resetError", () => {
        test("Should reset the error state of the chain.", async () => {
            const asyncQueue = new AsyncQueue(true);
            asyncQueue.enqueue(async () => { throw new Error("Test error"); });
            let p = asyncQueue.enqueue(async () => Promise.resolve());
            // The chain became useless.  Any subsequent enqueued function will not execute because they attach to 
            // a rejected promise.
            await expect(p).rejects.toThrow();
            await asyncQueue.resetError();
            p = asyncQueue.enqueue(async () => Promise.resolve());
            await expect(p).resolves.toBeUndefined();
        });
    });
    describe("transferTo", () => {
        test("Should transfer the chain to another queue and mark this queue as disposed.", async () => {
            const asyncQueue1 = new AsyncQueue(true);
            const asyncQueue2 = new AsyncQueue(true);
            const fn1 = async () => { throw new Error("Stop the queue!"); };
            const fn2 = async () => { };

            asyncQueue1.enqueue(fn1);
            asyncQueue1.transferTo(asyncQueue2);
            const p = asyncQueue2.enqueue(fn2);

            await delay();

            await expect(p).rejects.toThrow();
            await asyncQueue2.resetError();
        });
        test("Should throw an error if the queue has been transferred.", async () => {
            const asyncQueue1 = new AsyncQueue();
            const asyncQueue2 = new AsyncQueue();
            asyncQueue1.transferTo(asyncQueue2);
            expect(() => asyncQueue1.enqueue(async () => Promise.resolve())).toThrow();
        });
        test("Should protect the chain if this queue is in abort-on-error mode and the other one is not.", async () => {
            const asyncQueue1 = new AsyncQueue(true);
            const asyncQueue2 = new AsyncQueue(false);
            const fn1 = async () => { throw new Error("Stop the queue!"); };
            const fn2 = async () => { };

            asyncQueue1.enqueue(fn1);
            asyncQueue1.transferTo(asyncQueue2);
            const p = asyncQueue2.enqueue(fn2);

            await delay();

            await expect(p).resolves.toBeUndefined();
        });
    });
    describe("chain", () => {
        test("Should return the current promise chain of the queue.", async () => {
            const asyncQueue = new AsyncQueue();
            let result = "";
            const fn1 = async () => { result += "1"; };
            const fn2 = async () => { result += "2"; };
            const fn3 = async () => { result += "3"; };
            asyncQueue.enqueue(fn1);
            asyncQueue.enqueue(fn2);
            asyncQueue.enqueue(fn3);

            await asyncQueue.chain;

            expect(result).toBe("123");
        });
    });
});
