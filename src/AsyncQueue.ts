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
     * Flag indicating whether this queue has transferred its chain to another queue and should not be used anymore.
     */
    #disposed: boolean = false;
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
     * Guards against using this queue after it has been transferred.  If the queue has been transferred, an error is thrown.
     */
    _guardDisposed() {
        if (this.#disposed) {
            throw new Error("This queue has been transferred and cannot be used anymore.");
        }
    }
    /**
     * Enqueues an asynchronous function to be executed after the previous function in the queue has completed.
     * @param fn Asynchronous function to execute.
     * @returns The return value of the provided function.
     */
    enqueue<T extends (...args: any[]) => any>(fn: T): Promise<Awaited<ReturnType<T>>> {
        this._guardDisposed();
        const op = this.#chain.then(() => fn());
        if (this.#abortChainOnError) {
            this.#chain = op;
        }
        else {
            this.#chain = op.catch(() => { });
        }
        return op as Promise<Awaited<ReturnType<T>>>;
    }
    /**
     * Resets the error state of the chain, allowing new functions to be enqueued and executed after an error has 
     * occurred.
     */
    async resetError(): Promise<void> {
        this._guardDisposed();
        if (!this.#abortChainOnError) {
            throw new Error("resetError() is only applicable for abortable chains.  Your chain is healthy and does not need to be reset.");
        }
        try {
            await this.#chain;
        }
        catch { }
        this.#chain = Promise.resolve();
    }
    /**
     * Transfers the chain of this queue to another queue, marking this queue as disposed.
     * @param otherQueue The queue to transfer the chain to.
     */
    transferTo(otherQueue: AsyncQueue) {
        this._guardDisposed();
        // Protect the chain if this queue is in abort-on-error mode and the other one is not.
        if (this.#abortChainOnError && !otherQueue.#abortChainOnError) {
            otherQueue.#chain = this.#chain.catch(() => { });
        }
        else {
            otherQueue.#chain = this.#chain;            
        }
        this.#chain = undefined as any;
        this.#disposed = true;
    }
}
