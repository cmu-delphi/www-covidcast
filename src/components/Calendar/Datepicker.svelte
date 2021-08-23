<script>
  import Month from './Month.svelte';
  import NavBar from './NavBar.svelte';
  import Popover from './Popover.svelte';
  import { getMonths } from './lib/helpers';
  import { keyCodes, keyCodesArray } from './lib/keyCodes';
  import { onMount, createEventDispatcher } from 'svelte';
  import WeekLegend from './WeekLegend.svelte';

  const dispatch = createEventDispatcher();
  const today = new Date();

  let popover;

  export let className = '';
  export let offset = 0;
  export let start = new Date(1987, 0, 1);
  export let end = new Date(2030, 0, 1);
  export let selected = today;
  export let dateChosen = false;
  export let trigger = null;
  export let selectableCallback = null;
  export let weekStart = 0;

  export let style = '';

  export let pickWeek = false;

  // theming variables:
  export let buttonBackgroundColor = '#fff';
  export let buttonBorderColor = '#eee';
  export let buttonTextColor = '#333';
  export let highlightColor = '#d32d1f';
  export let dayBackgroundColor = 'none';
  export let dayTextColor = '#4a4a4a';
  export let dayHighlightedBackgroundColor = '#efefef';
  export let dayHighlightedTextColor = '#4a4a4a';

  let highlighted = today;
  let shouldShakeDate = false;
  let shakeHighlightTimeout;
  let month = today.getMonth();
  let year = today.getFullYear();

  let isOpen = false;

  today.setHours(0, 0, 0, 0);

  function assignmentHandler(formatted) {
    if (!trigger) return;
    trigger.innerHTML = formatted;
  }

  $: months = getMonths(start, end, selectableCallback, weekStart);

  let monthIndex = 0;
  $: {
    monthIndex = -1;
    for (let i = 0; i < months.length; i += 1) {
      if (months[i].month === month && months[i].year === year) {
        monthIndex = i;
      }
    }
    if (monthIndex < 0) {
      // date out of range, select the first or last one
      if (year < months[0].year || (year === months[0].year && month < months[0].month)) {
        monthIndex = 0;
      } else {
        // has to be larger than the last otherwise we would have an hit
        monthIndex = months.length - 1;
      }
    }
  }
  $: visibleMonth = months[monthIndex];

  $: visibleMonthId = year + month / 100;
  $: lastVisibleDate = visibleMonth.weeks[visibleMonth.weeks.length - 1].days[6].date;
  $: firstVisibleDate = visibleMonth.weeks[0].days[0].date;
  $: canIncrementMonth = monthIndex < months.length - 1;
  $: canDecrementMonth = monthIndex > 0;
  $: wrapperStyle = `
    --button-background-color: ${buttonBackgroundColor};
    --button-border-color: ${buttonBorderColor};
    --button-text-color: ${buttonTextColor};
    --highlight-color: ${highlightColor};
    --day-background-color: ${dayBackgroundColor};
    --day-text-color: ${dayTextColor};
    --day-highlighted-background-color: ${dayHighlightedBackgroundColor};
    --day-highlighted-text-color: ${dayHighlightedTextColor};
    ${style}
  `;

  export let formattedSelected;

  onMount(() => {
    month = selected.getMonth();
    year = selected.getFullYear();
  });

  function changeMonth(selectedMonth) {
    month = selectedMonth;
    highlighted = new Date(year, month, 1);
  }

  function incrementMonth(direction, day = 1) {
    if (direction === 1 && !canIncrementMonth) return;
    if (direction === -1 && !canDecrementMonth) return;
    let current = new Date(year, month, 1);
    current.setMonth(current.getMonth() + direction);
    month = current.getMonth();
    year = current.getFullYear();
    highlighted = new Date(year, month, day);
  }

  function getDefaultHighlighted() {
    return new Date(selected);
  }

  const getDay = (m, d, y) => {
    let theMonth = months.find((aMonth) => aMonth.month === m && aMonth.year === y);
    if (!theMonth) return null;
    // eslint-disable-next-line
    for (let i = 0; i < theMonth.weeks.length; ++i) {
      // eslint-disable-next-line
      for (let j = 0; j < theMonth.weeks[i].days.length; ++j) {
        let aDay = theMonth.weeks[i].days[j];
        if (aDay.month === m && aDay.day === d && aDay.year === y) return aDay;
      }
    }
    return null;
  };

  function incrementDayHighlighted(amount) {
    let proposedDate = new Date(highlighted);
    proposedDate.setDate(highlighted.getDate() + amount);
    let correspondingDayObj = getDay(proposedDate.getMonth(), proposedDate.getDate(), proposedDate.getFullYear());
    if (!correspondingDayObj || !correspondingDayObj.isInRange) return;
    highlighted = proposedDate;
    if (amount > 0 && highlighted > lastVisibleDate) {
      incrementMonth(1, highlighted.getDate());
    }
    if (amount < 0 && highlighted < firstVisibleDate) {
      incrementMonth(-1, highlighted.getDate());
    }
  }

  function checkIfVisibleDateIsSelectable(date) {
    const proposedDay = getDay(date.getMonth(), date.getDate(), date.getFullYear());
    return proposedDay && proposedDay.selectable;
  }

  function shakeDate(date) {
    clearTimeout(shakeHighlightTimeout);
    shouldShakeDate = date;
    shakeHighlightTimeout = setTimeout(() => {
      shouldShakeDate = false;
    }, 700);
  }

  function assignValueToTrigger(formatted) {
    assignmentHandler(formatted);
  }

  function registerSelection(chosen) {
    if (!checkIfVisibleDateIsSelectable(chosen)) return shakeDate(chosen);
    // eslint-disable-next-line
    close();
    selected = chosen;
    dateChosen = true;
    assignValueToTrigger(formattedSelected);
    return dispatch('dateSelected', { date: chosen });
  }

  function handleKeyPress(evt) {
    if (keyCodesArray.indexOf(evt.keyCode) === -1) return;
    evt.preventDefault();
    switch (evt.keyCode) {
      case keyCodes.left:
        if (!pickWeek) {
          incrementDayHighlighted(-1);
        }
        break;
      case keyCodes.up:
        incrementDayHighlighted(-7);
        break;
      case keyCodes.right:
        if (!pickWeek) {
          incrementDayHighlighted(1);
        }
        break;
      case keyCodes.down:
        incrementDayHighlighted(7);
        break;
      case keyCodes.pgup:
        incrementMonth(-1);
        break;
      case keyCodes.pgdown:
        incrementMonth(1);
        break;
      case keyCodes.escape:
        // eslint-disable-next-line
        close();
        break;
      case keyCodes.enter:
        registerSelection(highlighted);
        break;
      default:
        break;
    }
  }

  function registerClose() {
    document.removeEventListener('keydown', handleKeyPress);
    dispatch('close');
  }

  function close() {
    popover.close();
    registerClose();
  }

  function registerOpen() {
    highlighted = getDefaultHighlighted();
    month = selected.getMonth();
    year = selected.getFullYear();
    document.addEventListener('keydown', handleKeyPress);
    dispatch('open');
  }
</script>

<div class="datepicker {className}" class:open={isOpen} style={wrapperStyle}>
  <Popover bind:this={popover} bind:open={isOpen} {trigger} on:opened={registerOpen} on:closed={registerClose} {offset}>
    <div slot="trigger">
      <slot {selected} {formattedSelected}>
        {#if !trigger}<button class="calendar-button" type="button">{formattedSelected}</button>{/if}
      </slot>
    </div>
    <div class="calendar">
      <NavBar
        {month}
        {year}
        {canIncrementMonth}
        {canDecrementMonth}
        {start}
        {end}
        on:monthSelected={(e) => changeMonth(e.detail)}
        on:incrementMonth={(e) => incrementMonth(e.detail)}
      />
      <WeekLegend {weekStart} />
      <Month
        {visibleMonth}
        {selected}
        {highlighted}
        {shouldShakeDate}
        id={visibleMonthId}
        {pickWeek}
        on:dateSelected={(e) => registerSelection(e.detail)}
      />
    </div>
    <slot name="footer" {selected} />
  </Popover>
</div>

<style>
  .datepicker {
    display: inline-block;
    text-align: center;
    overflow: visible;
  }

  .calendar-button {
    padding: 10px 20px;
    border: 1px solid var(--button-border-color);
    display: block;
    text-align: center;
    width: 300px;
    text-decoration: none;
    cursor: pointer;
    background: var(--button-background-color);
    color: var(--button-text-color);
    border-radius: 7px;
    box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.1);
  }

  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  .calendar {
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    user-select: none;
    width: calc(100vw - 10px);
    padding: 10px;
    padding-top: 0;
    height: auto;
  }

  @media (min-width: 480px) {
    .calendar {
      width: 300px;
      max-width: 100%;
    }
  }
</style>
