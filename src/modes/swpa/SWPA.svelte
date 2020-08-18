<script>
  import SWPAMapBoxWrapper from '../../components/MapBox/SWPAMapBoxWrapper';
  import OverviewWrapper from '../overview/OverviewWrapper.svelte';
  import { swpaLevelList } from '../../stores/constants';
  import { swpaNameInfos } from '../../maps';
</script>

<OverviewWrapper wrapperClass={SWPAMapBoxWrapper} regionSearchList={swpaNameInfos} levelList={swpaLevelList} />
