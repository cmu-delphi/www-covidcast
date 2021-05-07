<script>
  import { getLevelInfo, levelList } from '../../../stores';

  /**
   * @type {import("../../../stores/params").RegionParam}
   */
  export let region;

  $: shownLevel = region.level === 'nation' ? 'state' : region.level;

  export let value = '';
</script>

<div>
  <label for="widget-adder-l" class="uk-form-label">Geographic Level</label>
  <select id="widget-adder-l" class="uk-select" name="level" {value}>
    <option value="">Use Configured ({getLevelInfo(shownLevel).label})</option>
    {#each levelList.slice(1) as level}
      <option value={level.id}>{level.label}</option>
    {/each}
  </select>
</div>
