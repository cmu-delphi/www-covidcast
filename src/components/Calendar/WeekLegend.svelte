<script>
  export let daysOfWeek = [
    ['Sunday', 'Sun'],
    ['Monday', 'Mon'],
    ['Tuesday', 'Tue'],
    ['Wednesday', 'Wed'],
    ['Thursday', 'Thu'],
    ['Friday', 'Fri'],
    ['Saturday', 'Sat'],
  ];

  export let weekStart = 0;

  $: sortedDaysOfWeek =
    weekStart === 0
      ? daysOfWeek
      : (() => {
          let dow = daysOfWeek.slice();
          dow.push(dow.shift());
          return dow;
        })();
</script>

<div class="legend">
  <span />
  {#each sortedDaysOfWeek as day}<span>{day[1]}</span>{/each}
</div>

<style>
  .legend {
    color: #4a4a4a;
    padding: 10px 0;
    margin-bottom: 5px;
    display: flex;
    justify-content: space-around;
  }

  .legend span {
    width: 12.5%;
    display: inline-block;
    text-align: center;
  }
</style>
