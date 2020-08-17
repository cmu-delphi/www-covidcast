<script>
  import { regionSearchList } from '../../stores';
  import SWPAMapBoxWrapper from '../../components/MapBox/SWPAMapBoxWrapper';
  import OverviewWrapper from '../overview/OverviewWrapper.svelte';
  import { swpaLevelList } from '../../stores/constants';
</script>

<OverviewWrapper wrapperClass={SWPAMapBoxWrapper} regionSearchList={$regionSearchList} levelList={swpaLevelList} />
