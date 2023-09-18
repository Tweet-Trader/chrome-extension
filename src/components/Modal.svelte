<script lang="ts">
  import type { HTMLDialogAttributes } from 'svelte/elements'
  import { twMerge } from 'tailwind-merge'

  interface $$Props extends HTMLDialogAttributes { showModal: boolean };

	let dialog: HTMLDialogElement; // HTMLDialogElement
	export let showModal: $$Props['showModal'];

	$: if (dialog && showModal) {
		console.log("should not be getting in here");
		dialog.showModal();
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
  class={twMerge("absolute inset-0 flex justify-center items-center rounded-lg", $$props.class)}
	bind:this={dialog}
	on:close={() => (showModal = false)}
	on:click|self={() => dialog.close()}
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div on:click|stopPropagation>
    <slot />
	</div>
</dialog>

<style>
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}

	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>