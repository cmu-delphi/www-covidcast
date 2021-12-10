<script>
  /* eslint-disable no-undef */
  import Search from '../../../components/Search.svelte';
  import { widgets } from '../state';
  export let value;
  export let readonly = false;
</script>

<div>
  <label for="widget-adder-w" class="uk-form-label">Widget</label>
  <input type="hidden" {value} name="type" />
  <Search
    id="widget-adder-w"
    placeholder="Select Widget"
    clear={false}
    items={widgets}
    title="Widget"
    icon="tv"
    selectOnClick
    disabled={readonly}
    selectedItem={widgets.find((d) => d.id === value) || widgets[0]}
    labelFieldName="name"
    maxItemsToShowInList={20}
    on:change={(e) => {
      value = e.detail.id || widgets[0].id;
    }}
  >
    <svelte:fragment slot="entry" let:item let:label let:onClick>
      <a href="?signal={item ? item.key : ''}" on:click|preventDefault={onClick} class="search-box-link">
        {@html label}
        {#if item}
          <span class="uk-badge widget-type" data-type={item.type}>{item.type}</span>
          {#each item.focus as f}
            {' '}<span class="uk-badge widget-focus" data-focus={f}>{f}</span>
          {/each}
        {/if}
      </a>
    </svelte:fragment>
  </Search>
</div>

<style>
  .uk-badge {
    font-size: 0.625rem;
    color: #666;
  }
  .widget-type[data-type='chart'] {
    background: #59a14f;
    color: white;
  }
  .widget-type[data-type='table'] {
    background: #af7aa1;
    color: white;
  }
  .widget-type[data-type='simple'] {
    background: #76b7b2;
    color: white;
  }
  .widget-type[data-type='advanced'] {
    background: #edc949;
  }
  .widget-focus[data-focus='time'] {
    background: #b3de69;
  }
  .widget-focus[data-focus='region'] {
    background: #fb8072;
    color: white;
  }
  .widget-focus[data-focus='indicator'] {
    background: #80b1d3;
    color: white;
  }
</style>
