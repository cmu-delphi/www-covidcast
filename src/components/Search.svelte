<script>
  import IoIosSearch from 'svelte-icons/io/IoIosSearch.svelte';
  import IoIosClose from 'svelte-icons/io/IoIosClose.svelte';

  // the list of items  the user can select from
  export let items;

  // field of each item that's used for the labels in the list
  export let labelFieldName = undefined;
  export let keywordsFieldName = labelFieldName;
  export let valueFieldName = undefined;

  export let labelFunction = function (item) {
    if (item === undefined || item === null) {
      return '';
    }
    return labelFieldName ? item[labelFieldName] : item;
  };

  export let keywordsFunction = function (item) {
    if (item === undefined || item === null) {
      return '';
    }
    return keywordsFieldName ? item[keywordsFieldName] : item;
  };

  export let valueFunction = function (item) {
    if (item === undefined || item === null) {
      return item;
    }
    return valueFieldName ? item[valueFieldName] : item;
  };

  export let keywordsCleanFunction = function (keywords) {
    return keywords;
  };

  export let textCleanFunction = function (userEnteredText) {
    return userEnteredText;
  };

  export let beforeChange = function (oldSelectedItem, newSelectedItem) {
    return [oldSelectedItem, newSelectedItem];
  };
  export let onChange = function (newSelectedItem) {
    return newSelectedItem;
  };

  export let selectFirstIfEmpty = false;

  export let minCharactersToSearch = 1;
  export let maxItemsToShowInList = 0;
  export let noResultsText = 'No results found';

  function safeStringFunction(theFunction, argument) {
    if (typeof theFunction !== 'function') {
      console.error('Not a function: ' + theFunction + ', argument: ' + argument);
    }
    let originalResult;
    try {
      originalResult = theFunction(argument);
    } catch (error) {
      console.warn('Error executing Autocomplete function on value: ' + argument + ' function: ' + theFunction);
    }
    let result = originalResult;
    if (result === undefined || result === null) {
      result = '';
    }
    if (typeof result !== 'string') {
      result = result.toString();
    }
    return result;
  }

  function safeLabelFunction(item) {
    // console.log("labelFunction: " + labelFunction);
    // console.log("safeLabelFunction, item: " + item);
    return safeStringFunction(labelFunction, item);
  }

  function safeKeywordsFunction(item) {
    // console.log("safeKeywordsFunction");
    const keywords = safeStringFunction(keywordsFunction, item);
    let result = safeStringFunction(keywordsCleanFunction, keywords);
    result = result.toLowerCase().trim();
    if (debug) {
      console.log("Extracted keywords: '" + result + "' from item: " + JSON.stringify(item));
    }
    return result;
  }

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
  export let debug = false;

  // selected item state
  export let selectedItem = undefined;
  export let value = undefined;
  let text;
  let filteredTextLength = 0;

  function onSelectedItemChanged() {
    value = valueFunction(selectedItem);
    text = safeLabelFunction(selectedItem);
    onChange(selectedItem);
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

  let listItems = [];

  function prepareListItems() {
    let tStart;
    if (debug) {
      tStart = performance.now();
      console.log('prepare items to search');
      console.log('items: ' + JSON.stringify(items));
    }
    const length = items ? items.length : 0;
    listItems = new Array(length);

    if (length > 0) {
      items.forEach((item, i) => {
        listItems[i] = getListItem(item);
      });
    }

    if (debug) {
      const tEnd = performance.now();
      console.log(listItems.length + ' items to search prepared in ' + (tEnd - tStart) + ' milliseconds');
    }
  }

  function getListItem(item) {
    return {
      // keywords representation of the item
      keywords: safeKeywordsFunction(item),
      // item label
      label: safeLabelFunction(item),
      // store reference to the origial item
      item: item,
    };
  }

  $: items, prepareListItems();

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

    const cleanUserEnteredText = textCleanFunction(textFiltered);
    const textFilteredLowerCase = cleanUserEnteredText.toLowerCase().trim();

    if (debug) {
      console.log("Change user entered text '" + userEnteredText + "' into '" + textFilteredLowerCase + "'");
    }
    return textFilteredLowerCase;
  }

  function search() {
    let tStart;
    if (debug) {
      tStart = performance.now();
      console.log("Searching user entered text: '" + text + "'");
    }

    const textFiltered = prepareUserEnteredText(text);

    if (textFiltered === '') {
      filteredListItems = listItems;
      closeIfMinCharsToSearchReached();
      if (debug) {
        console.log('User entered text is empty set the list of items to all items');
      }
      return;
    }

    const searchWords = textFiltered.split(' ');

    let tempfilteredListItems = listItems.filter((listItem) => {
      const itemKeywords = listItem.keywords;

      let matches = 0;
      searchWords.forEach((searchWord) => {
        if (itemKeywords.includes(searchWord)) {
          matches++;
        }
      });

      return matches >= searchWords.length;
    });

    const hlfilter = highlightFilter(textFiltered, ['label']);
    const filteredListItemsHighlighted = tempfilteredListItems.map(hlfilter);

    filteredListItems = filteredListItemsHighlighted;
    closeIfMinCharsToSearchReached();
    if (debug) {
      const tEnd = performance.now();
      console.log('Search took ' + (tEnd - tStart) + ' milliseconds, found ' + filteredListItems.length + ' items');
    }
  }

  // $: text, search();

  function selectListItem(listItem) {
    if (debug) {
      console.log('selectListItem');
    }
    const newSelectedItem = listItem.item;
    if (beforeChange(selectedItem, newSelectedItem)) {
      selectedItem = newSelectedItem;
    }
  }

  function selectItem() {
    if (debug) {
      console.log('selectItem');
    }
    const listItem = filteredListItems[highlightIndex];
    selectListItem(listItem);
    close();
  }

  function up() {
    if (debug) {
      console.log('up');
    }

    open();
    if (highlightIndex > 0) highlightIndex--;
    highlight();
  }

  function down() {
    if (debug) {
      console.log('down');
    }

    open();
    if (highlightIndex < filteredListItems.length - 1) highlightIndex++;
    highlight();
  }

  function highlight() {
    if (debug) {
      console.log('highlight');
    }

    const query = '.selected';
    if (debug) {
      console.log('Seaching DOM element: ' + query + ' in ' + list);
    }
    const el = list.querySelector(query);
    if (el) {
      if (typeof el.scrollIntoViewIfNeeded === 'function') {
        if (debug) {
          console.log('Scrolling selected item into view');
        }
        el.scrollIntoViewIfNeeded();
      } else {
        if (debug) {
          console.warn('Could not scroll selected item into view, scrollIntoViewIfNeeded not supported');
        }
      }
    } else {
      if (debug) {
        console.warn('Selected item not found to scroll into view');
      }
    }
  }

  function onListItemClick(listItem) {
    if (debug) {
      console.log('onListItemClick');
    }

    selectListItem(listItem);
    close();
  }

  function onResetItem() {
    if (debug) {
      console.log('onResetItem');
    }

    selectListItem({ item: undefined });
    close();
  }

  function onContainerClick(e) {
    e.stopPropagation();
    if (debug) {
      console.log('onDocumentClick inside');
    }
    // resetListToAllItemsAndOpen();
    highlight();
  }

  function onDocumentClick(e) {
    if (debug) {
      console.log('onDocumentClick: ' + JSON.stringify(e.target));
    }
    if (debug) {
      console.log('onDocumentClick outside');
    }
    close();
  }

  function onKeyDown(e) {
    if (debug) {
      console.log('onKeyDown');
    }

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
    if (debug) {
      console.log('onKeyPress');
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      selectItem();
    }
  }

  function onInput(e) {
    if (debug) {
      console.log('onInput');
    }

    text = e.target.value;
    search();
    highlightIndex = 0;
    open();
  }

  function onInputClick() {
    if (debug) {
      console.log('onInputClick');
    }
    resetListToAllItemsAndOpen();
  }

  function onEsc(e) {
    if (debug) {
      console.log('onEsc');
    }

    //if (text) return clear();
    e.stopPropagation();
    if (opened) {
      input.focus();
      close();
    }
  }

  function onFocus() {
    if (debug) {
      console.log('onFocus');
    }

    resetListToAllItemsAndOpen();
  }

  function resetListToAllItemsAndOpen() {
    if (debug) {
      console.log('resetListToAllItemsAndOpen');
    }

    filteredListItems = listItems;

    open();

    // find selected item
    if (selectedItem) {
      if (debug) {
        console.log('Searching currently selected item: ' + JSON.stringify(selectedItem));
      }
      for (let i = 0; i < listItems.length; i++) {
        const listItem = listItems[i];
        if (debug) {
          console.log('Item ' + i + ': ' + JSON.stringify(listItem));
        }
        if (selectedItem == listItem.item) {
          highlightIndex = i;
          if (debug) {
            console.log('Found selected item: ' + i + ': ' + JSON.stringify(listItem));
          }
          highlight();
          break;
        }
      }
    }
  }

  function open() {
    if (debug) {
      console.log('open');
    }

    // check if the search text has more than the min chars required
    if (isMinCharsToSearchReached()) {
      return;
    }

    opened = true;
  }

  function close() {
    if (debug) {
      console.log('close');
    }
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
  /*
  function clear() {
    if (debug) {
      console.log('clear');
    }

    text = '';
    setTimeout(() => input.focus());
  }
  function onBlur() {
    if (debug) {
      console.log('onBlur');
    }
    close();
  }
  */

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
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;

    position: absolute;
    top: 0;
    right: 0;
    max-width: min(25em, 100%);
  }

  .autocomplete * {
    box-sizing: border-box;
  }

  .search-row {
    display: flex;
  }

  .search-button {
    color: #9b9b9b;
    width: 1.4em;
    margin: 0 0.2em;
    padding: 5px 0;
    display: flex;
    align-self: flex-start;
    align-items: center;
    border: none;
    background: none;
    flex: 0 0 1.4em;
  }

  .autocomplete-input {
    flex: 1 1 0;
    min-width: 12em;
    width: 20em;
    max-width: 30em;
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
    border-bottom: 1px solid var(--red);
  }

  .autocomplete-list {
    overflow-y: auto;
    z-index: 99;
    margin-left: 0.9em; /** search icon size */
    padding: 10px 0;
    top: 0px;
    max-height: calc(15 * (1rem + 10px) + 15px);
    user-select: none;
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
    margin-left: -1.6em;
  }

  /** mobile **/
  @media only screen and (max-width: 767px) {
    .autocomplete {
      max-width: 25em;
      left: 0;
      right: unset;
    }

    .autocomplete-input {
      transition: max-width, padding 0.25s ease;
    }

    .autocomplete.empty:not(.open) .autocomplete-input {
      max-width: 0;
      min-width: unset;
      padding: 5px 0;
    }
  }
</style>

<div class="{className} autocomplete select" on:click={onContainerClick} class:empty={!text} class:open={opened}>
  <div class="search-row">
    <button class="search-button" on:click={focusSearch} title="Show Search Field" aria-label="Show Search Field">
      <IoIosSearch />
    </button>
    <input
      type="text"
      size="5"
      class="autocomplete-input"
      {placeholder}
      {name}
      {disabled}
      {title}
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

  </div>

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
