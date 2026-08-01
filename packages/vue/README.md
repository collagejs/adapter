# <img src="https://raw.githubusercontent.com/collagejs/core/HEAD/src/logos/collagejs-48.svg" alt="CollageJS Logo" width="48" height="48" align="left"> @collagejs/vue

> VueJS integration for the CollageJS micro-frontend library

[Online Documentation](https://collagejs.dev)

This is the official VueJS framework adapter from *CollageJS*. It is used for two complementary tasks:

1. Create `CorePiece` objects from Vue components.
2. Consume `CorePiece` objects (built with any framework or library) in Vue projects.

## Quickstart - Creating Pieces

Assuming you have a Vite-powered Vue project:

1. Install packages:
    ```bash
    npm install @collagejs/vue @collagejs/vite-css
    ```
2. Configure the plug-in:
    ```typescript
    ...
    import { cjsCssPlugin } from '@collagejs/vite-css';

    export default defineConfig({
        plugins: [..., cjsCssPlugin({
            serverPort: 6101,
            aim: false
        })],
        ...
    });
    ```
3. Add `src/piece.ts` to create and export a piece factory function:
    ```typescript
    import { buildPiece } from '@collagejs/vue';
    import MyComponent from './components/MyComponent.vue';
    // Optional CSS algorithm if you're not doing something else like CSS in JS.
    import { CssFactory } from '@collagejs/vite-css/ex';

    const css = new CssFactory(import.meta.url);

    export function myComponentFactory() {
        const piece = buildPiece(MyComponent, {
            // If needed.
            configureApp(app => {
                app.use(...);
                //etc.
            })
        });
        const { mount, relocate } = css.instantiate();
        return {
            ...piece,
            mount: [mount, piece.mount],
            relocate: [relocate, piece.relocate],
        };
    }
    ```

Done.  Import this factory function from outside this project using import maps, or distributing this code as an NPM package, etc.  The importer can mount the piece using a framework adapter or the core `mountPiece` function from `@collagejs/core`.

## Quickstart - Consuming Pieces

To consume or mount pieces is as simple as adding a Vue component.  The difficult part is setting up the source of the piece.

This is supposed to be a *quick* start, so let's go for the quickest (not recommended for production):

1. Somewhere in your code, import the piece module and get to the factory function:
    ```typescript
    const moduleUrl = 'http://localhost:6101/piece.js',
    const { myComponentFactory } = await import(/* @vite-ignore*/ moduleUrl);
    ```
2. During component setup (the component that will mount the piece), create a piece instance with the factory function:
    ```typescript
    const piece = myComponentFactory();
    ```
3. Import and use the Piece component:
    ```typescript
    import { Piece } from '@collagejs/vue';
    ```
    ```vue
    <template>
        <Piece :piece="piece" />
    </template>
    ```

This is it, in its most basic form.
