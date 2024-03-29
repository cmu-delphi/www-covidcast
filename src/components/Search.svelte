<script>
  import { createEventDispatcher } from 'svelte';
  import {
    prepareUserEnteredText,
    toSearchItems,
    createHighlighter,
    limitListItems,
    matchItems,
  } from './searchHelpers';

  const dispatch = createEventDispatcher();

  // the list of items  the user can select from
  export let items;

  // field of each item that's used for the labels in the list
  export let labelFieldName = undefined;

  export let labelFunction = function (item) {
    if (!item) {
      return '';
    }
    return labelFieldName ? item[labelFieldName] : item;
  };
  export let keywordFunction = labelFunction;
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
  export let id = undefined;

  export let selectOnClick = false;

  export let icon = 'search';
  /**
   * whether clearing is possible
   */
  export let clear = true;

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

  /**
   * @type {string}
   */
  let text;
  let minCharsToSearchReached = minCharactersToSearch <= 1;

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

  $: {
    onSelectedItemChanged(selectedItem);
  }

  /**
   * @type HTMLInputElement
   */
  let inputRef;
  /**
   * @type HTMLElement
   */
  let listRef;

  // UI state
  let opened = false;

  // view model
  $: listItems = toSearchItems(items, keywordFunction, labelFunction);

  let matchingItems = [];
  let highlightMatchingIndex = -1;
  let matchingStartIndex = 0;
  $: filteredListItems = limitListItems(matchingItems, matchingStartIndex, maxItemsToShowInList);
  $: hiddenMatchingItems = matchingItems.length - filteredListItems.length + matchingStartIndex;

  $: selectedLabelLookup = new Set((selectedItems || []).map(labelFunction));

  function resetItems() {
    matchingStartIndex = 0;
    matchingItems =
      selectedLabelLookup.size > 0 ? listItems.filter((d) => !selectedLabelLookup.has(d.label)) : listItems;
  }

  let highlighter = String;

  function search() {
    const textFiltered = prepareUserEnteredText(text);
    minCharsToSearchReached =
      textFiltered.length > 0 && (minCharactersToSearch <= 1 || textFiltered.length > minCharactersToSearch);

    if (!minCharsToSearchReached) {
      resetItems();
      close();
      return;
    }

    highlighter = createHighlighter(textFiltered);
    matchingStartIndex = 0;
    matchingItems = matchItems(listItems, textFiltered, selectedLabelLookup);
  }

  // $: text, search();

  function selectItem() {
    const listItem = matchingItems[highlightMatchingIndex];
    selectedItem = listItem.item;
    close();
  }

  function changeHighlight(newIndex) {
    open();
    const clamped = Math.max(Math.min(newIndex, matchingItems.length - 1), 0);
    if (highlightMatchingIndex === clamped) {
      return;
    }
    highlightMatchingIndex = clamped;
    const endVisible = matchingStartIndex + filteredListItems.length - 1;
    if (highlightMatchingIndex < matchingStartIndex) {
      matchingStartIndex = highlightMatchingIndex;
    } else if (highlightMatchingIndex > endVisible) {
      matchingStartIndex = highlightMatchingIndex - filteredListItems.length + 1;
    }
    highlight();
  }

  function highlight() {
    const el = listRef.querySelector('.uk-active');
    if (el && typeof el.scrollIntoViewIfNeeded === 'function') {
      el.scrollIntoViewIfNeeded();
    }
  }

  function onListItemClick(listItem) {
    selectedItem = listItem.item;
    close();
  }

  function onResetItem() {
    selectedItem = undefined;
    close();
  }

  function onContainerClick(e) {
    e.stopPropagation();
    highlight();
  }

  function onKeyDown(e) {
    switch (e.key) {
      case 'Tab':
        if (opened) {
          e.preventDefault();
          if (e.shiftKey) {
            changeHighlight(highlightMatchingIndex + 1);
          } else {
            changeHighlight(highlightMatchingIndex - 1);
          }
        }
        break;
      case 'Home':
        e.preventDefault();
        changeHighlight(0);
        break;
      case 'End':
        e.preventDefault();
        changeHighlight(matchingItems.length - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        changeHighlight(highlightMatchingIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        changeHighlight(highlightMatchingIndex - 1);
        break;
      case 'PageUp':
        e.preventDefault();
        changeHighlight(highlightMatchingIndex - maxItemsToShowInList);
        break;
      case 'PageDown':
        e.preventDefault();
        changeHighlight(highlightMatchingIndex + maxItemsToShowInList);
        break;
      case 'Escape':
        e.preventDefault();
        onEsc();
        break;
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
    highlightMatchingIndex = 0;
    matchingStartIndex = 0;
    open();
  }

  function onInputClick() {
    resetListToAllItemsAndOpen();

    if (modern || selectOnClick) {
      // select the whole field upon click
      inputRef.select();
    }
  }

  function onEsc(e) {
    //if (text) return clear();
    e.stopPropagation();
    if (opened) {
      inputRef.focus();
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
      for (let i = 0; i < filteredListItems.length; i++) {
        const listItem = filteredListItems[i];
        if (selectedItem == listItem.item) {
          highlightMatchingIndex = i;
          highlight();
          break;
        }
      }
    }
  }

  function open() {
    // check if the search text has more than the min chars required
    if (!minCharsToSearchReached || opened) {
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
</script>

<div
  class="{className} uk-search search-box"
  class:uk-search-default={!multiple}
  class:search-multiple={multiple}
  class:modern
  on:click={onContainerClick}
>
  {#if title && modern}
    <div class="search-label">{title}</div>
  {/if}
  {#if !multiple}
    <span class="uk-search-icon search-icon" class:modern data-uk-icon="icon: {icon}" />
    <input
      {id}
      class="uk-search-input"
      class:modern
      class:modern__small={modern === 'small'}
      {placeholder}
      {name}
      {disabled}
      {title}
      type="text"
      aria-label={placeholder}
      bind:this={inputRef}
      bind:value={text}
      on:input={onInput}
      on:focus={onFocus}
      on:keydown={onKeyDown}
      on:click={onInputClick}
      on:keypress={onKeyPress}
    />
    {#if clear}
      <button
        class="uk-search-icon clear-button"
        class:hidden={!text}
        class:modern
        on:click={onResetItem}
        title="Clear Search Field"
        data-uk-icon="icon: close"
      />
    {/if}
  {:else}
    <span class="uk-search-icon search-multiple-icon search-icon" data-uk-icon="icon: {icon}" class:modern />

    {#each selectedItems as selectedItem}
      <div class="search-tag">
        <span>{labelFunction(selectedItem)}</span>
        <button
          class=""
          data-uk-icon="icon: close"
          on:click={() => removeItem(selectedItem)}
          title="Remove selectecd item"
        />
      </div>
    {/each}

    {#if !multiple || selectedItems.length < maxSelections}
      <input
        class="uk-search-input search-multiple-input"
        class:modern
        class:modern__small={modern === 'small'}
        {placeholder}
        {name}
        {disabled}
        {title}
        aria-label={placeholder}
        bind:this={inputRef}
        bind:value={text}
        on:input={onInput}
        on:focus={onFocus}
        on:keydown={onKeyDown}
        on:click={onInputClick}
        on:keypress={onKeyPress}
      />
    {/if}
    <button
      class="uk-search-icon clear-button"
      class:modern
      class:hidden={selectedItems.length === 0}
      on:click={onResetItem}
      title="Clear Search Field"
      data-uk-icon="icon: close"
    />
  {/if}

  <div class="uk-dropdown uk-dropdown-bottom-left search-box-list" class:uk-open={opened} bind:this={listRef}>
    <ul class="uk-nav uk-dropdown-nav">
      {#if filteredListItems && filteredListItems.length > 0}
        {#each filteredListItems as listItem, i (listItem.key)}
          <li class:uk-active={i + matchingStartIndex === highlightMatchingIndex}>
            <slot
              name="entry"
              label={highlighter(listItem.label)}
              {listItem}
              item={listItem.item}
              onClick={() => onListItemClick(listItem)}
            >
              <a
                href="?region={listItem.item ? listItem.item.id : ''}"
                class="search-box-link"
                on:click|preventDefault={() => onListItemClick(listItem)}
              >
                {@html highlighter(listItem.label)}
              </a>
            </slot>
          </li>
        {/each}
        {#if hiddenMatchingItems}
          <li class="uk-nav-divider" />
          <li class="more-results">&hellip; {hiddenMatchingItems} results not shown</li>
        {/if}
      {:else}
        <li class="uk-nav-header">{noResultsText}</li>
      {/if}
    </ul>
  </div>
</div>

<svelte:window on:click={close} />

<style>
  .search-box {
    width: unset;
    display: block;
  }

  .search-multiple {
    display: flex;
    min-height: 40px;
    background: transparent;
    border: 1px solid #e5e5e5;
    position: relative;
    flex-wrap: wrap;
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

  .search-box-list :global(.search-box-link) {
    display: inline-block;
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
    white-space: nowrap;
  }

  /* modern styles for survey dashboard */
  .search-box.modern {
    background: white;
    flex: 2 1 auto;
  }
  .search-icon.modern {
    left: 0;
  }
  .clear-button.modern {
    right: 0;
  }
  .uk-dropdown {
    position: absolute;
    display: none;
    z-index: 1020;
  }
  .uk-dropdown.uk-open {
    display: block;
  }
  .uk-search-input.modern {
    background: white;
    font-weight: 400;
    height: 50px;
    font-size: 0.75rem;
    line-height: 1rem;
    padding-left: 35px !important;
    padding-top: 10px;
    padding-bottom: 10px;
    border-radius: 3px;
    border: 1px solid #d3d4d8;
  }

  .uk-search-input.modern__small {
    height: 52px;
    padding-left: 50px !important;
    padding-top: 4px;
    padding-bottom: 4px;
  }

  .search-label {
    font-size: 0.75rem;
    line-height: 1;
    position: absolute;
    top: -0.6rem;
    left: 24px;
    background: white;
    font-weight: 400;
    border-radius: 3px;
    padding: 2px;
  }
</style>
