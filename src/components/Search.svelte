<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  // the list of items  the user can select from
  export let items;

  /**
   * custom filter for visible items
   * @type {(item) => boolean}
   */
  export let filterItem = null;

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
  export let selectedItems = null;
  $: multiple = selectedItems != null;
  export let maxSelections = Number.POSITIVE_INFINITY;

  /**
   * enable modern styling
   */
  export let modern = false;

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
  let filteredListItems = [];
  let hiddenFilteredListItems = 0;

  $: listItems = items.map((item) => ({
    // keywords representation of the item
    keywords: labelFunction(item).toLowerCase().trim(),
    // item label
    label: labelFunction(item),
    // store reference to the origial item
    item,
  }));
  $: selectedLabelLookup = new Set((selectedItems || []).map((s) => labelFunction(s)));

  function limitListItems(items) {
    if (maxItemsToShowInList <= 0 || items.length < maxItemsToShowInList) {
      return items;
    }
    return items.slice(0, maxItemsToShowInList);
  }

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

  function resetItems() {
    const matchingItems =
      selectedLabelLookup.size > 0 || filterItem != null
        ? listItems.filter((d) => !selectedLabelLookup.has(d.label) && (filterItem == null || filterItem(d.item)))
        : listItems;
    filteredListItems = limitListItems(matchingItems);
    hiddenFilteredListItems = matchingItems.length - filteredListItems.length;
  }

  function search() {
    const textFiltered = prepareUserEnteredText(text);

    if (textFiltered === '') {
      resetItems();
      closeIfMinCharsToSearchReached();
      return;
    }

    const searchWords = textFiltered.split(' ');
    const hlfilter = highlightFilter(textFiltered, ['label']);

    const matchingItems = listItems.filter((listItem) => {
      const itemKeywords = listItem.keywords;
      return (
        searchWords.every((searchWord) => itemKeywords.includes(searchWord)) &&
        !selectedLabelLookup.has(listItem.label) &&
        (filterItem == null || filterItem(listItem.item))
      );
    });

    filteredListItems = limitListItems(matchingItems).map(hlfilter);
    hiddenFilteredListItems = matchingItems.length - filteredListItems.length;
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

    if (modern) {
      // select the whole field upon click
      input.select();
    }
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
    resetItems();

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
</script>

<style>
  .search-box {
    width: unset;
    display: block;
  }

  .search-multiple {
    display: flex;
    height: 40px;
    background: transparent;
    border: 1px solid #e5e5e5;
    position: relative;
  }

  .search-multiple-icon {
    position: relative;
    width: 30px;
  }

  .search-multiple-input {
    width: unset;
  }

  .hidden {
    display: none;
  }

  .clear-button {
    z-index: 1;
    left: unset;
    right: 0;
    width: 30px;
  }

  .search-box-list {
    box-sizing: border-box;
    left: 0;
    top: 100%;
    min-width: 100%;
    margin-top: 2px;
    padding: 0 2px 6px 40px;
  }

  .more-results {
    color: #999;
  }

  .search-tag {
    padding: 1px 1px 1px 3px;
    margin: 2px;
    border: 2px solid #999;
    display: flex;
    align-items: center;
  }

  /* modern styles for survey dashboard */
  .search-box.modern {
    background: white;
    flex: 2 1 auto;
  }
  .search-icon.modern {
    left: 10px;
  }
  .clear-button.modern {
    right: 10px;
  }
  .uk-search-input.modern {
    background: white;
    font-weight: 600;
    letter-spacing: 3px;
    height: 64px;
    font-size: 1rem;
    line-height: 1.5rem;
    padding-left: 50px !important;
    padding-top: 10px;
    padding-bottom: 10px;
    border-radius: 3px;
    border: 1px solid #d3d4d8;
  }

  @media only screen and (max-width: 715px) {
    .uk-search-input.modern {
      letter-spacing: initial;
      font-size: 0.85rem;
    }
  }
</style>

<div
  class="{className} uk-search search-box"
  class:uk-search-default={!multiple}
  class:search-multiple={multiple}
  class:modern
  on:click={onContainerClick}>
  {#if !multiple}
    <span class="uk-search-icon search-icon" class:modern data-uk-icon="icon: search" />
    <input
      class="uk-search-input"
      class:modern
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
      class="uk-search-icon clear-button"
      class:hidden={!text}
      class:modern
      on:click={onResetItem}
      title="Clear Search Field"
      data-uk-icon="icon: close" />
  {:else}
    <span class="uk-search-icon search-multiple-icon search-icon" data-uk-icon="icon: search" class:modern />

    {#each selectedItems as selectedItem}
      <div class="search-tag" style="border-color: {colorFieldName ? selectedItem[colorFieldName] : undefined}">
        <span>{labelFunction(selectedItem)}</span>
        <button
          class=""
          data-uk-icon="icon: close"
          on:click={() => removeItem(selectedItem)}
          title="Remove selectecd item" />
      </div>
    {/each}

    {#if !multiple || selectedItems.length < maxSelections}
      <input
        class="uk-search-input search-multiple-input"
        class:modern
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
    {/if}
    <button
      class="uk-search-icon clear-button"
      class:modern
      class:hidden={selectedItems.length === 0}
      on:click={onResetItem}
      title="Clear Search Field"
      data-uk-icon="icon: close" />
  {/if}

  <div class="uk-dropdown uk-dropdown-bottom-left search-box-list" class:uk-open={opened} bind:this={list}>
    <ul class="uk-nav uk-dropdown-nav">
      {#if filteredListItems && filteredListItems.length > 0}
        {#each filteredListItems as listItem, i}
          <li class:uk-active={i === highlightIndex}>
            <a
              href="?region={listItem.item ? listItem.item.id : ''}"
              on:click|preventDefault={() => onListItemClick(listItem)}>
              {#if listItem.highlighted}
                {@html listItem.highlighted.label}
              {:else}
                {@html listItem.label}
              {/if}
            </a>
          </li>
        {/each}

        {#if hiddenFilteredListItems > 0}
          <li class="uk-nav-divider" />
          <li class="more-results">&hellip; {hiddenFilteredListItems} results not shown</li>
        {/if}
      {:else if noResultsText}
        <li class="uk-nav-header">{noResultsText}</li>
      {/if}
    </ul>
  </div>
</div>

<svelte:window on:click={onDocumentClick} />
