<script lang="ts">
    import type { LayoutProps } from './$types.js';

    let { data, children }: LayoutProps = $props();
</script>

<main class="section">
   {@render children()}
</main>
