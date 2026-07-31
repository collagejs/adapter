<script lang="ts">
    import { browser } from "$app/environment";
    import Piece, { piece } from "$lib/Piece/Piece.svelte";
    import { buildTestPiece } from "$lib/testing/piece-building.js";
    import type { CorePiece } from "@collagejs/core";

    const pinPadModule = "http://localhost:6100/piece.js";

    const pinPadPiece = browser
        ? import(/* @vite-ignore */ pinPadModule).then((m) => {
              return m.pinPadPiece("http://localhost:6100/") as CorePiece<{
                  initialPin?: string;
                  pinDispatched?: (pin: string) => void;
              }>;
          })
        : Promise.resolve({
              mount: (t) => Promise.resolve(() => Promise.resolve()),
          } satisfies CorePiece<{
              initialPin?: string;
              pinDispatched?: (pin: string) => void;
          }>);
    let userPin = $state("");

    function onPinDispatched(pin: string) {
        userPin = pin;
    }

    const pieceProps = $state({
        foo: "bar",
        count: 42,
    });
    const corePiece = buildTestPiece(
        {
            mount: () => {
                console.debug("TestPiece: mount called");
            },
            unmount: () => {
                console.debug("TestPiece: unmount called");
            },
            update: (props) => {
                console.debug("TestPiece: update called with props:", props);
            },
        },
        {
            remountable: true,
        },
        () => Promise.resolve("unsupported"),
    );
    let bgColor = $state("#aaaaaa");
    const containerStyle = $derived(`background-color: ${bgColor};`);
    let mountPiece = $state(true);
    let shadowOption = $state("0");
    let shadow = $derived.by<false | ShadowRootInit>(() => {
        switch (shadowOption) {
            case "0":
                return false;
            case "1":
                return { mode: "open" };
            case "2":
                return { mode: "closed" };
            default:
                throw new Error(`Invalid shadow option: ${shadowOption}`);
        }
    });
</script>

<main class="content">
    <h1>Welcome to CollageJS!</h1>
    <p>
        What you see below inside the dashed box is a "piece" rendered using
        CollageJS. The piece itself is <strong>not</strong> a Svelte component. This
        piece is built using plain JavaScript and DOM operations. It supports property
        updating.
    </p>
    <p>
        In short: You're looking at a Svelte project that has successfully
        rendered a non-Svelte micro-frontend. Yes, the code itself is not coming
        from from a separate HTTP server, but the piece is still a fully
        isolated micro-frontend that could be loaded from anywhere.
    </p>
    <p>
        To learn more, read the <a
            href="https://collagejs.dev"
            target="_blank"
            rel="noopener noreferrer"
        >
            CollageJS documentation
        </a>.
    </p>
    <button
        type="button"
        class="button is-primary"
        onclick={() => (mountPiece = !mountPiece)}
    >
        Toggle Piece
    </button>
    {#if browser && mountPiece}
        <Piece
            {...piece(corePiece, {
                shadow,
                containerProps: { class: "code", style: containerStyle },
                lifecycleLogging: import.meta.env.DEV,
            })}
            {...pieceProps}
        />
    {/if}
    <h2>Change Piece Properties</h2>
    <label>
        foo:
        <input type="text" bind:value={pieceProps.foo} />
    </label>
    <label>
        count:
        <input type="number" bind:value={pieceProps.count} />
    </label>
    <h2>Change Container Style</h2>
    <label>
        Background color:
        <input type="color" bind:value={bgColor} />
    </label>
    <h2>Shadow Options</h2>
    <div class="controls">
        <label>
            <input
                type="radio"
                name="shadow"
                value="0"
                bind:group={shadowOption}
            />
            No Shadow
        </label>
        <label>
            <input
                type="radio"
                name="shadow"
                value="1"
                bind:group={shadowOption}
            />
            Open Shadow
        </label>
        <label>
            <input
                type="radio"
                name="shadow"
                value="2"
                bind:group={shadowOption}
            />
            Closed Shadow
        </label>
    </div>
    <section>
        <h2>Pin Pad Piece</h2>
        <p>This is a Svelte piece with the Svelte runtime bundled.</p>
        {#if browser}
            <Piece
                {...piece(pinPadPiece, { shadow: true, containerProps: {} })}
                pinDispatched={onPinDispatched}
            />
        {/if}
        <p>User Pin: <strong>{userPin}</strong></p>
    </section>
</main>

<style>
    :global .code {
        display: block !important;
        font-family: monospace;
        font-size: x-large;
        border: 0.3em dashed black;
        margin: 1rem;
        padding: 1rem;
        & > pre {
            margin: 0;
        }
    }
</style>
