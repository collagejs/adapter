<script lang="ts">
    import type { Snippet } from "svelte";

    type Props = Record<string, any> & {
        children?: Snippet<[Record<string, any>]>;
    };

    let {
        children,
        ...restProps
    }: Props = $props();
</script>
<div>Dummy</div>
{@render children?.(restProps)}
