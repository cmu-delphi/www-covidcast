<script>
  export let sensors = [];
  export let what = 'getting worse';
</script>

{#if !sensors}
  N/A are {what}.
{:else if sensors.length === 0}
  None are {what}.
{:else if sensors.length === 1}
  <a href="">"${sensors[0].name}"</a> is {what}.
{:else}
  {#each sensors.slice(0, sensors.length - 1) as w}
    <a href="">"{w.name}"</a>,
  {/each}
  and <a href="">"{sensors[sensors.length - 1].name}"</a> are {what}.
{/if}
