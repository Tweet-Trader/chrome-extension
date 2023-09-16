<script lang="ts">
  import { getContext } from 'svelte'
  import { twMerge } from 'tailwind-merge';
  import { txt } from '../utils'

  const nightMode: keyof typeof txt = getContext('nightMode');
</script>

<div class={twMerge(`flex p-3 rounded-md ${txt[nightMode].border} ${txt[nightMode].bgSecondary}`, $$props.class)}>
  <slot />
</div>