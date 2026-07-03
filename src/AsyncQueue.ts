/**
 * A utility class that allows you to enqueue asynchronous functions to be executed in order, 
 * ensuring that each function is executed only after the previous one has completed.
 * 
 * Usage of this class prevents race conditions.
 */
export class AsyncQueue {
    /**
     * Promise chain's tail pointer.
     */
    #chain: Promise<any> = Promise.resolve();
    /**
     * Flag indicating whether to abort the chain on error. If set to true, the chain will stop executing further 
     * functions if any function in the chain throws an error.
     * @default false
     */
    #abortChainOnError: boolean;
    /**
     * Initializes a new instance of this class.
     * 
     * ### Aborting the Chain
     * 
     * Under the default (no chain abortion) behavior, if a function throws an error, the chain swallows the error and 
     * continues executing the remaining functions in the queue.  The important part here:  Swallows the error.
     * 
     * If the chain is told to abort on error, the error will linger on inside the runtime until the last enqueued 
     * function has been awaited, causing *UnhandledPromiseRejection* warnings.
     * 
     * To both avoid the warnings and return to a healthy state, call `resetError()` after the chain has been aborted.
     * @param abortChainOnError Configures the queue to abort the entire remaining chain if a link in the chain throws.
     */
    constructor(abortChainOnError: boolean = false) {
        this.#abortChainOnError = abortChainOnError;
    }
    /**
     * Enqueues an asynchronous function to be executed after the previous function in the queue has completed.
     * @param fn Asynchronous function to execute.
     * @returns The return value of the provided function.
     */
    enqueue<T extends (...args: any[]) => any>(fn: T): ReturnType<T> {
        const op = this.#chain.then(() => fn());
        if (this.#abortChainOnError) {
            this.#chain = op;
        }
        else {
            this.#chain = op.catch(() => { });
        }
        return op as ReturnType<T>;
    }
    /**
     * Resets the error state of the chain, allowing new functions to be enqueued and executed after an error has 
     * occurred.
     */
    async resetError(): Promise<void> {
        if (!this.#abortChainOnError) {
            throw new Error("resetError() is only applicable for abortable chains.  Your chain is healthy and does not need to be reset.");
        }
        try {
            await this.#chain;
        }
        catch { }
        this.#chain = Promise.resolve();
    }
}
