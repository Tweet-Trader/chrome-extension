<script lang="ts">
  import { setContext } from 'svelte';
  import Button from '../Button.svelte';
  import Spinner from '../Icons/Spinner.svelte'

  // routes
  import Swap from './Swap.svelte'

  let address: `0x${string}`;

  const requestAddress = async () => {
    const connectedAddress = await chrome.runtime.sendMessage({ type: 'getAddress' })
    const requestedAddress = await chrome.runtime.sendMessage({ type: 'requestAddress' })
    if (connectedAddress) address = connectedAddress;
    else address = requestedAddress;
  }

  let getAddressPromise = (async () => {
    address = await chrome.runtime.sendMessage({ type: 'getAddress' })

    return address;
  })();
  export let nightMode;
  setContext('nightMode', nightMode);
</script>

<main class="fixed flex z-[2] top-[65px] w-[inherit] h-[85vh]" id="twitter-bot">
  {#await getAddressPromise}
    <section class="flex-grow flex justify-center items-center bg-slate-800 rounded-2xl">
      <Spinner />
    </section>
  {:then}
    {#if address}
      <Swap address={address} />
    {:else}
      <section class="flex-grow flex justify-center items-center bg-slate-800 rounded-2xl">
        <Button on:click={requestAddress} class="px-12" variant="secondary" >
          Connect Wallet
        </Button>
      </section>
    {/if}
  {/await}
</main>