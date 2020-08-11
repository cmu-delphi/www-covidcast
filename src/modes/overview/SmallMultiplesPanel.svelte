<script>
  import SmallMultiples from './SmallMultiples.svelte';
  import { publicSensors, earlySensors, lateSensors, currentRegionInfo, currentSensor } from '../../stores';
  import IoMdMap from 'svelte-icons/io/IoMdMap.svelte';
  import IoMdExpand from 'svelte-icons/io/IoMdExpand.svelte';
  import { createEventDispatcher } from 'svelte';
  import ExpandCollapse from '../../components/ExpandCollapse.svelte';

  const dispatch = createEventDispatcher();

  // initially collapsed
  const collapsed = [
    'ght-smoothed_search',
    'fb-survey-smoothed_hh_cmnty_cli',
    'indicator-combination-confirmed_7dav_incidence_num',
    'indicator-combination-deaths_7dav_incidence_num',
    'safegraph-full_time_work_prop',
    'safegraph-part_time_work_prop',
  ];

  export let detail = null;

  $: smSensors = [
    {
      id: 'public',
      label: 'Public Behavior',
      sensors: $publicSensors,
    },
    {
      id: 'early',
      label: 'Early Indicators',
      sensors: $earlySensors,
    },
    {
      id: 'late',
      label: 'Late Indicators',
      sensors: $lateSensors,
    },
  ];
</script>

<style>
  ul {
    list-style-type: none;
    padding: 0 0 0 0.25em;
  }

  h4,
  h5 {
    flex: 1 1 0;
    padding: 0;
  }

  .toolbar {
    display: flex;
    font-size: 0.7rem;
  }
</style>

<h3>{$currentRegionInfo ? $currentRegionInfo.display_name : 'No Region Selected'}</h3>
<ul class="root">
  {#each smSensors as sensorGroup}
    <ExpandCollapse let:collapsed={groupCollapsed}>
      <h4 slot="header">{sensorGroup.label}</h4>
      <ul>
        {#each sensorGroup.sensors as sensor}
          <ExpandCollapse let:collapsed collapsed={collapsed.includes(sensor.key)}>
            <h5 slot="header" title={sensor.tooltipText}>{sensor.name}</h5>
            <div slot="toolbar" class="toolbar">
              <button
                class="pg-button"
                title="Show in Map"
                on:click|stopPropagation={() => currentSensor.set(sensor.key)}
                class:active={$currentSensor === sensor.key}
                disabled={$currentSensor === sensor.key}>
                <IoMdMap />
              </button>
              <button
                class="pg-button"
                class:active={detail === sensor}
                on:click|stopPropagation={() => dispatch('show', detail === sensor ? null : sensor)}>
                <IoMdExpand />
              </button>
            </div>
            {#if !collapsed && !groupCollapsed}
              <SmallMultiples {sensor} />
            {/if}
          </ExpandCollapse>
        {/each}
      </ul>
    </ExpandCollapse>
  {/each}
</ul>
