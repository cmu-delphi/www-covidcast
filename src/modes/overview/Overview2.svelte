<script>
  import { regionSearchList, levelList } from '../../stores';
  import USMapBoxWrapper from '../../components/MapBox/USMapBoxWrapper';
  import OverviewWrapper from './OverviewWrapper.svelte';
</script>

<OverviewWrapper wrapperClass={USMapBoxWrapper} regionSearchList={$regionSearchList} {levelList} />
