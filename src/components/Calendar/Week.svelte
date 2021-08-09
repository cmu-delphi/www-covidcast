<script>
  import { areDatesEquivalent } from './lib/helpers';
  import { fly, fade } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  /**
   * @type {import('./lib/helpers').CalendarWeek}
   */
  export let week;
  export let selected;
  export let highlighted;
  export let shouldShakeDate;
  export let direction;
  export let pickWeek = false;

  function toWeekString(week) {
    return `W${week.week < 10 ? '0' : ''}${week.week}`;
  }
</script>

{#if pickWeek}
  <button
    class="week week--button click-button"
    in:fly|local={{ x: direction * 50, duration: 180, delay: 90 }}
    out:fade|local={{ duration: 180 }}
    type="button"
    class:is-today={week.isThisWeek}
    class:is-disabled={!week.selectable}
    class:selected={week.week.includes(selected)}
    class:highlighted={week.week.includes(highlighted)}
    class:shake-date={shouldShakeDate && week.week.includes(shouldShakeDate)}
    on:click={() => dispatch('dateSelected', week.firstDay)}
  >
    <div class="day--label week--label disabled">
      {toWeekString(week.week)}
    </div>
    {#each week.days as day}
      <div class="day" class:outside-month={!day.partOfMonth}>
        <div class="day--label disabled">
          {day.date.getDate()}
        </div>
      </div>
    {/each}
  </button>
{:else}
  <div class="week" in:fly|local={{ x: direction * 50, duration: 180, delay: 90 }} out:fade|local={{ duration: 180 }}>
    <div class="day--label week--label disabled" type="button">
      {toWeekString(week.week)}
    </div>
    {#each week.days as day}
      <div
        class="day"
        class:outside-month={!day.partOfMonth}
        class:is-today={day.isToday}
        class:is-disabled={!day.selectable}
      >
        <button
          class="day--label click-button"
          class:selected={areDatesEquivalent(day.date, selected)}
          class:highlighted={areDatesEquivalent(day.date, highlighted)}
          class:shake-date={shouldShakeDate && areDatesEquivalent(day.date, shouldShakeDate)}
          class:disabled={!day.selectable}
          type="button"
          on:click={() => dispatch('dateSelected', day.date)}
        >
          {day.date.getDate()}
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .week {
    padding: 0;
    margin: 0;
    display: flex;
    flex-flow: row;
    -webkit-flex-flow: row;
    justify-content: space-around;
    -ms-grid-column: 1;
    grid-column: 1;
    color: var(--day-text-color);
    font-weight: normal;
    text-align: center;
  }
  .week:nth-child(6n + 1) {
    -ms-grid-row: 1;
    grid-row: 1;
  }
  .week:nth-child(6n + 2) {
    -ms-grid-row: 2;
    grid-row: 2;
  }
  .week:nth-child(6n + 3) {
    -ms-grid-row: 3;
    grid-row: 3;
  }
  .week:nth-child(6n + 4) {
    -ms-grid-row: 4;
    grid-row: 4;
  }
  .week:nth-child(6n + 5) {
    -ms-grid-row: 5;
    grid-row: 5;
  }
  .week:nth-child(6n + 6) {
    -ms-grid-row: 6;
    grid-row: 6;
  }
  .day {
    margin: 2px;
    flex: 1 0 auto;
    height: auto;
    display: flex;
    flex-basis: 0;
  }
  .day.outside-month,
  .week.is-disabled,
  .day.is-disabled {
    opacity: 0.35;
  }
  .day:before {
    content: '';
    float: left;
    padding-top: 100%;
  }
  .click-button {
    border: 1px solid #fff;
    background: var(--day-background-color);
    cursor: pointer;
  }
  .day--label {
    display: flex;
    justify-content: center;
    flex-direction: column;
    width: 100%;
    position: relative;
    border-radius: 50%;
    margin: 10%;
    padding: 0;
    align-items: center;
    transition: all 100ms linear;
  }
  .week--label {
    width: unset;
    border-radius: 3px;
    margin: 2px;
  }
  .week:not(.week--button) .day--label.disabled {
    cursor: default;
  }
  @media (min-width: 480px) {
    .week--button.highlighted,
    .week--button:not(.disabled):hover,
    .day--label.highlighted,
    .day--label:not(.disabled):hover {
      background: var(--day-highlighted-background-color);
      border-color: var(--day-highlighted-background-color);
      color: var(--day-highlighted-text-color);
    }
  }
  .shake-date {
    animation: shake 0.4s 1 linear;
  }

  .week--button {
    transition: all 100ms linear;
    font-size: unset;
    align-items: stretch;
    border-radius: 3px;
  }

  .week--button.selected:hover,
  .week--button.selected,
  .week--button:active:not(.disabled),
  .day--label.selected:hover,
  .day--label.selected,
  .day--label:active:not(.disabled) {
    background-color: var(--highlight-color);
    border-color: var(--highlight-color);
    color: #fff;
  }

  .week.is-today,
  .week.is-today:hover,
  .day.is-today .day--label,
  .day.is-today .day--label:hover {
    opacity: 1;
    background: none;
    border-color: var(--highlight-color);
    color: #000;
  }

  @keyframes shake {
    0% {
      transform: translate(7px);
    }
    20% {
      transform: translate(-7px);
    }
    40% {
      transform: translate(3px);
    }
    60% {
      transform: translate(-3px);
    }
    80% {
      transform: translate(1px);
    }
    100% {
      transform: translate(0px);
    }
  }
</style>
