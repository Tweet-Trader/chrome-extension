<script lang="ts">
  import Button from "../Button.svelte"
  import { getContext } from "svelte"
  import { address as addressStore } from "../../stores/address";
  import { txt } from "../../utils"
	import Input from "../Input.svelte";
  import { parseEther, toHex } from 'viem'

  let ethAmount = '';
  let address: `0x${string}`;
  const nightMode: keyof typeof txt = getContext('nightMode')
  addressStore.subscribe((value) => {
    address = value!;
  })

  const deposit = async () => {
    const amount = toHex(parseEther(ethAmount))
    await chrome.runtime.sendMessage({ type: 'deposit', to: address, amount })
 }
</script>

<section class={`flex-grow flex flex-col justify-center ${txt[nightMode].bg} rounded-2xl px-8 py-4 ${txt[nightMode].textPrimary} gap-y-2`}>
  <h1 class="text-xl font-bold">Let's fund the wallet!</h1>
  <p class={`${txt[nightMode].textPrimary}/75 text-sm`}>
    Specify the amount of ETH to deposit into the wallet below
  </p>
  <Input class="mt-6" type="number" placeholder="1 ETH" bind:value={ethAmount} />
  <!-- <Button class="self-center mt-2" on:click={() => deposit(address, ethAmount)}> -->
  <Button class="self-center mt-2" on:click={() => deposit()}>
    Deposit
  </Button>
</section>
