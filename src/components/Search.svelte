<script>
  import IoIosSearch from 'svelte-icons/io/IoIosSearch.svelte';
  import IoIosClose from 'svelte-icons/io/IoIosClose.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  // the list of items  the user can select from
  export let items;

  // field of each item that's used for the labels in the list
  export let labelFieldName = undefined;

  export let labelFunction = function (item) {
    if (item === undefined || item === null) {
      return '';
    }
    return labelFieldName ? item[labelFieldName] : item;
  };
  export let colorFieldName = undefined;

  export let selectFirstIfEmpty = false;

  export let minCharactersToSearch = 1;
  export let maxItemsToShowInList = 0;
  export let noResultsText = 'No results found';

  // the text displayed when no option is selected
  export let placeholder = undefined;
  // apply a className to the control
  export let className = '';
  // generate an HTML input with this name, containing the current value
  export let name = undefined;
  // adds the disabled tag to the HTML input
  export let disabled = false;
  // add the title to the HTML input
  export let title = undefined;

  // selected item state
  export let selectedItem = undefined;
  /**
   * @type {any[]}
   */
  export let selectedItems = [];
  $: multiple = selectedItems.length > 0;
  export let maxSelections = Number.POSITIVE_INFINITY;

  let text;
  let filteredTextLength = 0;

  function onSelectedItemChanged() {
    text = labelFunction(selectedItem);

    if (multiple) {
      if (selectedItem) {
        dispatch('add', selectedItem);
      }
      // reset just temporary
      selectedItem = null;
      text = '';
    } else {
      dispatch('change', selectedItem);
    }
  }

  function removeItem(item) {
    dispatch('remove', item);
  }

  $: selectedItem, onSelectedItemChanged();

  // HTML elements
  /**
   * @type HTMLInputElement
   */
  let input;
  let list;

  // UI state
  let opened = false;
  let highlightIndex = -1;

  // view model
  let filteredListItems;

  $: listItems = items
    .map((item) => ({
      // keywords representation of the item
      keywords: labelFunction(item).toLowerCase().trim(),
      // item label
      label: labelFunction(item),
      // store reference to the origial item
      item,
    }))
    .filter((d) => selectedItems.every((s) => d.label !== labelFunction(s)));

  function prepareUserEnteredText(userEnteredText) {
    if (userEnteredText === undefined || userEnteredText === null) {
      return '';
    }

    const textFiltered = userEnteredText.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, ' ').trim();

    filteredTextLength = textFiltered.length;

    if (minCharactersToSearch > 1) {
      if (filteredTextLength < minCharactersToSearch) {
        return '';
      }
    }
    return textFiltered.toLowerCase().trim();
  }

  function search() {
    const textFiltered = prepareUserEnteredText(text);

    if (textFiltered === '') {
      filteredListItems = listItems;
      closeIfMinCharsToSearchReached();
      return;
    }

    const searchWords = textFiltered.split(' ');

    const tempFilteredListItems = listItems.filter((listItem) => {
      const itemKeywords = listItem.keywords;
      return searchWords.every((searchWord) => itemKeywords.includes(searchWord));
    });

    const hlfilter = highlightFilter(textFiltered, ['label']);
    filteredListItems = tempFilteredListItems.map(hlfilter);
    closeIfMinCharsToSearchReached();
  }

  // $: text, search();

  function selectListItem(listItem) {
    selectedItem = listItem.item;
  }

  function selectItem() {
    const listItem = filteredListItems[highlightIndex];
    selectListItem(listItem);
    close();
  }

  function up() {
    open();
    if (highlightIndex > 0) highlightIndex--;
    highlight();
  }

  function down() {
    open();
    if (highlightIndex < filteredListItems.length - 1) highlightIndex++;
    highlight();
  }

  function highlight() {
    const query = '.selected';
    const el = list.querySelector(query);
    if (el) {
      if (typeof el.scrollIntoViewIfNeeded === 'function') {
        el.scrollIntoViewIfNeeded();
      }
    }
  }

  function onListItemClick(listItem) {
    selectListItem(listItem);
    close();
  }

  function onResetItem() {
    selectListItem({ item: undefined });
    close();
  }

  function onContainerClick(e) {
    e.stopPropagation();
    highlight();
  }

  function onDocumentClick() {
    close();
  }

  function onKeyDown(e) {
    let key = e.key;
    if (key === 'Tab' && e.shiftKey) key = 'ShiftTab';
    const fnmap = {
      Tab: opened ? down.bind(this) : null,
      ShiftTab: opened ? up.bind(this) : null,
      ArrowDown: down.bind(this),
      ArrowUp: up.bind(this),
      Escape: onEsc.bind(this),
    };
    const fn = fnmap[key];
    if (typeof fn === 'function') {
      e.preventDefault();
      fn(e);
    }
  }

  function onKeyPress(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      selectItem();
    }
  }

  function onInput(e) {
    text = e.target.value;
    search();
    highlightIndex = 0;
    open();
  }

  function onInputClick() {
    resetListToAllItemsAndOpen();
  }

  function onEsc(e) {
    //if (text) return clear();
    e.stopPropagation();
    if (opened) {
      input.focus();
      close();
    }
  }

  function onFocus() {
    resetListToAllItemsAndOpen();
  }

  function resetListToAllItemsAndOpen() {
    filteredListItems = listItems;

    open();

    // find selected item
    if (selectedItem) {
      for (let i = 0; i < listItems.length; i++) {
        const listItem = listItems[i];
        if (selectedItem == listItem.item) {
          highlightIndex = i;
          highlight();
          break;
        }
      }
    }
  }

  function open() {
    // check if the search text has more than the min chars required
    if (isMinCharsToSearchReached()) {
      return;
    }

    opened = true;
  }

  function close() {
    opened = false;

    if (!text && selectFirstIfEmpty) {
      // highlightFilter = 0;
      selectItem();
    }
  }

  function isMinCharsToSearchReached() {
    return minCharactersToSearch > 1 && filteredTextLength < minCharactersToSearch;
  }

  function closeIfMinCharsToSearchReached() {
    if (isMinCharsToSearchReached()) {
      close();
    }
  }

  // 'item number one'.replace(/(it)(.*)(nu)(.*)(one)/ig, '<b>$1</b>$2 <b>$3</b>$4 <b>$5</b>')
  function highlightFilter(q, fields) {
    const qs = '(' + q.trim().replace(/\s/g, ')(.*)(') + ')';
    const reg = new RegExp(qs, 'ig');
    let n = 1;
    const len = qs.split(')(').length + 1;
    let repl = '';
    for (; n < len; n++) repl += n % 2 ? `<b>$${n}</b>` : `$${n}`;

    return (i) => {
      const newI = Object.assign({ highlighted: {} }, i);
      if (fields) {
        fields.forEach((f) => {
          if (!newI[f]) return;
          newI.highlighted[f] = newI[f].replace(reg, repl);
        });
      }
      return newI;
    };
  }

  function focusSearch() {
    if (input) {
      input.focus();
    }
  }
</script>

<style>
  .autocomplete {
    display: flex;
    position: relative;
  }

  .autocomplete * {
    box-sizing: border-box;
  }

  .search-button {
    color: #9b9b9b;
    width: 1.4em;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
  }
  .autocomplete-input {
    flex: 1 1 0;
    width: 100%;
    position: relative;
    font: inherit;
    padding: 5px 6px;
    /* for cmu style*/
    margin: 0;
    color: #111;
    outline: none;
    border: none;
    border-bottom: 1px solid transparent;
  }

  input.autocomplete-input:focus {
    outline: none !important;
    z-index: unset;
    border-bottom-color: var(--red);
  }

  .autocomplete-list {
    position: absolute;
    z-index: 2000;
    top: calc(100% - 6px);
    left: 0;
    width: 100%;
    overflow-y: auto;
    padding: 2px 0 0 1.8em;
    max-height: calc(15 * (1rem + 10px) + 15px);
    user-select: none;

    border-bottom-left-radius: 7px;
    border-bottom-right-radius: 7px;
    background-color: #ffffff;
    box-shadow: 0px 4px 4px rgba(151, 151, 151, 0.25);
  }
  .autocomplete-list:empty {
    padding: 0;
  }
  .autocomplete-list-item {
    padding: 5px 15px;
    color: #333;
    cursor: pointer;
    line-height: 1;

    border-radius: 5px;
    transition: all 0.1s ease-in;
  }

  .autocomplete-list-item:hover,
  .autocomplete-list-item.selected {
    color: #fff;
    background-color: var(--red);
  }

  .autocomplete-list-item-no-results {
    padding: 5px 15px;
    color: #999;
    line-height: 1;
  }

  .hidden {
    display: none;
  }
  .reset-button {
    z-index: 1;
  }

  .search-tags {
    font: inherit;
    color: #333;
    position: relative;
    display: flex;
    align-items: center;
  }
  .search-tag {
    padding: 1px;
    margin: 0 1px;
    border: 2px solid #999;
    border-radius: 4px;
    display: flex;
    align-items: center;
  }
</style>

<div
  class="{className} base-font-size container-style autocomplete"
  on:click={onContainerClick}
  class:empty={!text}
  class:open={opened}>
  <button class="search-button" on:click={focusSearch} title="Show Search Field" aria-label="Show Search Field">
    <IoIosSearch />
  </button>
  {#if multiple}
    <div class="search-tags">
      {#each selectedItems as selectedItem}
        <div class="search-tag" style="border-color: {colorFieldName ? selectedItem[colorFieldName] : undefined}">
          <span>{labelFunction(selectedItem)}</span>
          <button
            class="search-button reset-button"
            on:click={() => removeItem(selectedItem)}
            title="Remove selectecd item">
            <IoIosClose />
          </button>
        </div>
      {/each}
    </div>
  {/if}
  {#if !multiple || selectedItems.length < maxSelections}
    <input
      class="autocomplete-input"
      {placeholder}
      {name}
      {disabled}
      {title}
      aria-label={placeholder}
      bind:this={input}
      bind:value={text}
      on:input={onInput}
      on:focus={onFocus}
      on:keydown={onKeyDown}
      on:click={onInputClick}
      on:keypress={onKeyPress} />
    <button
      class="search-button reset-button"
      class:hidden={!text}
      on:click={onResetItem}
      title="Clear Search Field"
      aria-label="Clear Search Field">
      <IoIosClose />
    </button>
  {/if}
  <div class="autocomplete-list" class:hidden={!opened} bind:this={list}>
    {#if filteredListItems && filteredListItems.length > 0}
      {#each filteredListItems as listItem, i}
        {#if maxItemsToShowInList <= 0 || i < maxItemsToShowInList}
          <div
            class="autocomplete-list-item {i === highlightIndex ? 'selected' : ''}"
            on:click={() => onListItemClick(listItem)}>
            {#if listItem.highlighted}
              {@html listItem.highlighted.label}
            {:else}
              {@html listItem.label}
            {/if}
          </div>
        {/if}
      {/each}

      {#if maxItemsToShowInList > 0 && filteredListItems.length > maxItemsToShowInList}
        <div class="autocomplete-list-item-no-results">
          ...{filteredListItems.length - maxItemsToShowInList} results not shown
        </div>
      {/if}
    {:else if noResultsText}
      <div class="autocomplete-list-item-no-results">{noResultsText}</div>
    {/if}
  </div>
</div>

<svelte:window on:click={onDocumentClick} />
