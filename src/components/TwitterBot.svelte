<script lang="ts">
  import { setContext } from 'svelte';
  import Button from './Button.svelte';
  import Spinner from './Spinner.svelte'

  // routes
  import Deposit from './Deposit.svelte';
  import Swap from './Swap.svelte'

  let address: `0x${string}`;
  let balance: string;

  const getTokensAndAddress = async (type: string) => {
    const isValid = await chrome.runtime.sendMessage({ type })

    if (isValid) {
      address = await chrome.runtime.sendMessage({ type: 'getAddress' })
      balance = await chrome.runtime.sendMessage({ type: 'getBalance', walletAddress: address })
    }

    return isValid
  }

  const handleSignIn = async () => {
    tokensAndAddressPromise = getTokensAndAddress('login')
  }

  let tokensAndAddressPromise = getTokensAndAddress('testTokens')
  export let nightMode;

  setContext('nightMode', nightMode);
</script>

<main class="fixed flex z-[2] top-[65px] w-[inherit] h-[85vh]" id="twitter-bot">
  <!-- LoadingScreen -->
  {#await tokensAndAddressPromise}
    <section class="flex-grow flex justify-center items-center bg-slate-800 rounded-2xl">
      <Spinner />
    </section>
  {:then tokensValid}
    {#if tokensValid}
      {#if balance === '0'}
        <Deposit />
      {:else}
        <Swap address={address} />
      {/if}
    {:else}
      <section class="flex-grow flex justify-center items-center bg-slate-800 rounded-2xl">
        <Button on:click={() => handleSignIn()} class="px-12" variant="secondary" >
          Sign in
        </Button>
      </section>
    {/if}
  {/await}
</main>