<script lang="ts">
    import { Button } from "$lib/components/ui/button";
</script>

<Button
    variant="default"
    class="bg-blue-500 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
    on:click={() => alert("Button clicked!")}
>
    Click Me
</Button>