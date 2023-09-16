<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { cn } from "../utils";
  import { cva, type VariantProps } from "class-variance-authority";

  const buttonVariants = cva('inline-flex items-center justify-center font-medium rounded-full transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
    {
      variants: {
        variant: {
          default: 'bg-sky-500 text-white hover:bg-sky-500/90',
          secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/90',
          danger: 'bg-red-500 text-white hover:bg-red-500/90',
          outline: 'border border-sky-500 bg-transparent text-sky-500 hover:bg-sky-500/20',
        },
        size: {
          default: 'min-w-[78px] min-h-[32px] px-4 py-2',
        }
      },
    }
  )

  interface $$Props extends HTMLButtonAttributes, VariantProps<typeof buttonVariants>{}

  export let variant: $$Props['variant'] = 'default';
  export let size: $$Props['size'] = 'default';
</script>

<button {...$$props} class={cn(buttonVariants({ variant, size, class: $$props.class }))} on:click>
  <slot/>
</button>
