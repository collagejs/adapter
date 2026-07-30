#  <img src="https://raw.githubusercontent.com/collagejs/core/HEAD/src/logos/collagejs-48.svg" alt="CollageJS Logo" width="48" height="48" align="left">&nbsp;@collagejs/adapter

> Helper code used in the creation of official framework adapters

Whether you're creating an official or community-supported framework adapter for [CollageJS](https://collagejs.dev), this library can help out.  It contains code that helps streamline the development process, standardizing the framework adapter's behavior along the way.

## How to Use

Install the NPM package as a dependency:

```bash
npm install @collagejs/adapter
```

> ⚠️**IMPORTANT**:  If you're bundling the adapter, make sure you externalize `@collagejs/adapter`.  This way the adapter can benefit from patching without having to be re-bundled and re-published.

Now, consume what the library offers to create the framework adapter.  At least official framework adapters must follow the **framework adapter specification** (pending creation).

## What's Inside

### `AsyncQueue` Class

This is a class that creates a chain of promises with the promise-generating functions given to its `AsyncQueue.enqueue` function.  Every function enqueued will be placed as the last link in the chain of promises.  The function will therefore only execute after all previously linked promises in the chain of promises resolve.  This should fully avoid racing conditions.

Most framework adapters, however, should not use this class.  Instead, a more specialized class with more standardized code exists.  Keep reading.

### `CorePieceLcQueue` Class

This is the recommended class for framework adapters.  It extends the `AsyncQueue` class and provides additional functions with semantics for `CorePiece` objects.  It basically is a wrapper for the `MountedPiece` interface.  `MountedPiece` objects are the controllers of mounted core pieces.

| Function | Description |
| - | - |
| `mount()` | Enqueues the mounting of the `CorePiece` object given to it during construction. |
| `unmount()` | Enqueues the unmounting of the `CorePiece` object. |
| `update()` | Enqueues the updating of the `CorePiece` object. |
| `relocate()` | Enqueues the relocation of the `CorePiece` object's HTML root element(s). |

#### When Errors Occur

The `CorePieceLcQueue` class uses the `AsyncQueue` class in **abort-on-error** mode.  This means that if an error occurs in an enqueued function, the entire chain of promises will now reject.  This is the safer approach, but demands an extra step to recover from this:  The chain must be reset.

Any time an error in the chain is caught (say, while awaiting for an enqueued function), call `CorePieceLcQueue.resetError`.  This avoids lingering unhandled asynchronous errors in the runtime, and recreates the promise chain.

### `getPieceTarget` Function

It calculates the target DOM element according to the possible values of `shadow`, which is a property that should be available to all `Piece` components and that developers can use to mount pieces in shadow DOM.  The expected type for `shadow` is `boolean | ShadowRootInit`.

### `trivialRelocate` Function

This is used by `CorePieceLcQueue.relocate` unless the object instance had been given a custom relocation function.  This is a very simple algorithm that moves all HTML root elements found in the source element to the target element.
