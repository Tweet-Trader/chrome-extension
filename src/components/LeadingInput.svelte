<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
  import Input from "./Input.svelte";
  import { txt } from "../utils";
  import { getContext } from 'svelte';
  import { twMerge } from 'tailwind-merge';

  const nightMode: keyof typeof txt = getContext('nightMode');
  interface $$Props extends HTMLInputAttributes { leadingText: string;}

  export let leadingText: $$Props['leadingText'] = '__';
  export let value: $$Props['value'] = '';
</script>

<div class="flex overflow-hidden">
  <span class={`flex items-center justify-center px-4 font-bold ${txt[nightMode].border} border-r-0 rounded-l-md min-w-[65px]`}>{leadingText}</span>
  <Input 
    {...$$restProps}
    class={twMerge("w-full rounded-l-none", $$props.class)}
    id="amountIn"
    type="text"
    inputmode="decimal"
    autocomplete="off"
    autocorrect="off"
    pattern="^[0-9]*[.,]?[0-9]*$"
    minlength={1}
    maxlength={79}
    placeholder="0.0"
    bind:value
    on:input
  />
</div> 

