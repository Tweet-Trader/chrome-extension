<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
  import { getContext } from 'svelte'
  import { twMerge } from 'tailwind-merge';
  import { txt as txtBase } from '../utils'

  const txt = {
    0: {
      ...txtBase[0],
      border: `${txtBase[0].border} focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500`, 
    },
    1: {
      ...txtBase[1],
      border: `${txtBase[1].border} focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600`,
    },
    2: {
      ...txtBase[2],
      border: `${txtBase[2].border} focus:outline-none focus:border-sky-800 focus:ring-1 focus:ring-sky-800`,
    }
  }

  const nightMode: keyof typeof txt = getContext('nightMode');
  interface $$Props extends HTMLInputAttributes{}
  export let value: $$Props['value'] = '';
</script>

<input 
  {...$$restProps}
  class={twMerge(`flex p-3 rounded-md placeholder:${txt[nightMode].textSecondary} ${txt[nightMode].textPrimary} ${txt[nightMode].border} ${txt[nightMode].bgSecondary}`, $$props.class)}
  bind:value
  on:input
/>