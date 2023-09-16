<script lang="ts">
  import { getContext } from "svelte"
  import { formatUnits, parseUnits } from 'viem'
  import { z } from 'zod'
  import { storage } from '../storage';

  import Button from "./Button.svelte"
	import Input from "./Input.svelte";
	import LeadingInput from "./LeadingInput.svelte";
  import Spinner from "./Spinner.svelte";
  import { txt, debounce, trimNumber } from "../utils" 
  import { UINT_MAX, getAmountOut } from "../background/contractMethods";

  const schema = z.object({
    tokenAddress: z.string().length(42, { message: 'Token address must be 42 characters' }).startsWith('0x', { message: 'Token address must start with 0x'}), 
    swapType: z.union([z.literal('BUY'), z.literal('SELL')]),
    amountIn: z.string().refine((val) => Number(val) > 0, 'Must be greater than 0'),
    amountOut: z.string().refine((val) => Number(val) > 0, 'Must be greater than 0'), 
    slippage: z.number().positive({ message: 'Must be greater than 0' }),
  })

  const currency = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 3,
    currencyDisplay: 'narrowSymbol',
  })

  const nightMode: keyof typeof txt = getContext('nightMode');
  export let address: `0x${string}`;

  // form data
  let tokenAddress: `0x${string}`;
  let swapType: 'BUY' | 'SELL' = 'BUY';
  let amountIn: string;
  let amountOut: string;
  
  // token data
  let symbol: string = '--';
  let price: number = 0.00;
  let slippage: number = 0.5;
  let decimals: number;
  let isApproved: boolean = true;

  // wallet data
  let tokenBalance: bigint = 0n;
  let ethBalance: bigint = 0n;

  // promises
  let tokenDataPromise: ReturnType<typeof getTokenData>;
  let ethBalancePromise = (async () => {
    ethBalance = BigInt(await chrome.runtime.sendMessage({ type: 'getBalance', walletAddress: address }));

    return ethBalance;
  })();

  // form state
  let processing: boolean = false;
  let errorState: Record<string, string>;

  const onSubmit = async (e: Event) => {
    // validate swap data
    const parseResult = schema.safeParse({ tokenAddress, swapType, amountIn, amountOut, slippage: Number(slippage) })
    if (!parseResult.success) {
      errorState = parseResult.error.issues.reduce((acc, issue) => ({ ...acc, [issue.path[0]]: issue.message }), {}); 
      return
    }

    if (!isApproved) {
      const txHash = await chrome.runtime.sendMessage({ type: 'approve', walletAddress: address, tokenAddress });
      const receipt = await chrome.runtime.sendMessage({ type: 'waitForTransaction', txHash });
      isApproved = true;

      return txHash
    }

    // parse swap data
    const { twitterId } = await storage.get();
    const amount = parseUnits(amountIn, swapType === 'BUY' ? 18 : decimals).toString();
    console.log("amount when submitting: ", amount);
    const swapData = { twitterId, tokenAddress, amount, slippage, decimals, tokenPrice: price }

    // swap
    console.log("attempting to buy: ", swapData);
    processing = true;
    let txHash;
    if (swapType === 'BUY') txHash = await chrome.runtime.sendMessage({ type: 'buy', ...swapData });
    else txHash = await chrome.runtime.sendMessage({ type: 'sell', ...swapData });
    console.log("txHash: ", txHash);

    tokenBalance = BigInt(await chrome.runtime.sendMessage({ type: 'getTokenBalance', walletAddress: address, tokenAddress }))
    ethBalance = BigInt(await chrome.runtime.sendMessage({ type: 'getBalance', walletAddress: address }));
    console.log("token balance: ", tokenBalance);
    console.log("eth balance: ", ethBalance);
    processing = false;
  }

  const getTokenData = async (tokenAddress: `0x${string}`) => {
    // reset values first
    tokenBalance = 0n;
    symbol = '--';
    price = 0.00;
    decimals = 0;

    const { success } = schema.shape.tokenAddress.safeParse(tokenAddress)
    if (!success) return
    const token = await chrome.runtime.sendMessage({ type: 'getTokenData', walletAddress: address, tokenAddress });

    tokenBalance = BigInt(token.tokenBalance)
    symbol = token.symbol
    price = token.price
    decimals = token.decimals;
    isApproved = swapType === 'BUY' || BigInt(token.allowance) === BigInt(UINT_MAX);

    return token;
  }

  const getIsApproved = async () => {
    if (swapType === 'SELL') {
      const { success } = schema.shape.tokenAddress.safeParse(tokenAddress)
      if (!success) return false;
      const allowance = await chrome.runtime.sendMessage({ type: 'getAllowance', walletAddress: address, tokenAddress })
      console.log("allowance: ", allowance);
      return BigInt(allowance) === BigInt(UINT_MAX);
    }

    return true;
  }
  const handleTokenAddressInput = debounce(() => tokenDataPromise = getTokenData(tokenAddress), 300); 
  const handleAmountInInput = debounce(async () => { 
    let pair;

    if (schema.shape.tokenAddress.parse(tokenAddress)) pair = await chrome.runtime.sendMessage({ type: 'getPairAddress', tokenAddress });
    if (!pair) throw new Error('Pair Token not found');
    const token = await chrome.runtime.sendMessage({ type: 'getReserves', pair, tokenAddress })
    const decimals = swapType === 'BUY' ? 18 : await chrome.runtime.sendMessage({ type: 'getDecimals', tokenAddress })

    const [amountInReserves, amountOutReserves] = swapType === 'BUY' ? [token.wethReserves, token.tokenReserves] : [token.tokenReserves, token.wethReserves];
    const rawAmountOut = getAmountOut(parseUnits(String(amountIn), decimals), BigInt(amountInReserves), BigInt(amountOutReserves));
    // round to 2 decimal places
    amountOut = String(trimNumber(formatUnits(rawAmountOut, decimals)));
  } , 300);
  const handleSwapType = async (type: 'BUY' | 'SELL') => {
    if (swapType !== type) {
      const sub = amountIn;
      amountIn = amountOut;
      amountOut = sub;
      swapType = type;
    }

    isApproved = await getIsApproved()
  }
  const handleMaxInput = () => { 
    if (tokenBalance) {
      if (swapType === 'BUY') amountIn = formatUnits(BigInt(ethBalance), decimals)
      else  amountIn = formatUnits(tokenBalance, decimals)
      handleAmountInInput()
    }
  }
</script>

<form on:submit|preventDefault={onSubmit} class={`flex-grow flex flex-col ${txt[nightMode].bg} rounded-2xl px-8 py-8 ${txt[nightMode].textPrimary} gap-y-10`}>
  <div class={`absolute inset-0 justify-center items-center bg-black/40 ${processing ? 'flex' : 'hidden'}`}>
    <Spinner />
  </div>

  <div class="flex items-center justify-between">
    <h1 class="text-xl font-bold">Swap</h1>

    {#await ethBalancePromise}
      <Button class={`text-xs bg-sky-600/80 focus:bg-sky-600`}>
        <Spinner />
      </Button>
    {:then}
      <Button type="button" class={`text-xs bg-sky-600/80 focus:bg-sky-600`} >{address.slice(0, 4)}...{address.slice(-4)} ({trimNumber(formatUnits(ethBalance, 18))} ETH)</Button>
    {/await}
  </div> 

  <div class="flex flex-col gap-y-2">
    <label for="tokenAddress" >Token Address</label>
    <div class="relative">
      <Input 
        class={`rounded-b-none w-full ${errorState?.tokenAddress && 'border-red-500'}`} 
        name="tokenAddress" 
        placeholder="Token Address" 
        bind:value={tokenAddress} 
        on:input={handleTokenAddressInput}
      />
      {#await tokenDataPromise}
        <div class={`flex px-4 py-1 rounded-md rounded-t-none justify-between ${txt[nightMode].bgSecondary} ${txt[nightMode].border} border-t-0`}>
          <span class={`${txt[nightMode].textSecondary} text-xs`}>-- ($0.00)</span>
          <span class={`${txt[nightMode].textSecondary} text-xs`}>BAL:</span>
        </div>
      {:then tokenData}
        <div class={`flex px-4 py-1 rounded-md rounded-t-none justify-between ${txt[nightMode].bgSecondary} ${txt[nightMode].border} border-t-0`}>
          <span class={`${tokenData ? txt[nightMode].textPrimary : txt[nightMode].textSecondary} text-xs`}>{symbol} ({currency.format(price)})</span>
          <span class={`${tokenData ? txt[nightMode].textPrimary : txt[nightMode].textSecondary} text-xs`}>BAL: {decimals ? trimNumber(formatUnits(tokenBalance, decimals)) : ''}</span>
        </div>
      {:catch error}
        <div class={`flex px-4 py-1 rounded-md rounded-t-none justify-between ${txt[nightMode].bgSecondary} ${txt[nightMode].border} border-t-0`}>
          <span class={`text-red-500 text-xs`}>{error.issues[0].message}</span>
        </div>
      {/await}
      {#if errorState?.tokenAddress}
        <span class="absolute -bottom-5 text-red-500 text-xs">{errorState.tokenAddress}</span> 
      {/if}
    </div> 
  </div>

  <div class={`relative flex p-[4px] rounded-md h-12 ${txt[nightMode].bgSecondary}`}>
    <div class={`absolute inset-0 flex items-center justify-around z-10`}>
      <button type='button' class={`flex-grow cursor-pointer text-center`} on:click={() => handleSwapType('BUY')}>BUY</button>
      <button type='button' class={`flex-grow cursor-pointer text-center`} on:click={() => handleSwapType('SELL')}>SELL</button>
    </div> 
    <div class={`bg-sky-600 w-1/2 rounded-md duration-200 transition-all ${swapType === 'BUY' ? 'translate-x-0' : 'translate-x-full'}`}/>
  </div>

  <div class="relative flex flex-col gap-y-2">
    <div class="flex items-baseline gap-x-2">
      <label for="amountIn" >You Pay</label>
      <Button type="button" variant="secondary" class="text-xs px-2 py-1 min-w-0 min-h-0" on:click={handleMaxInput} >MAX</Button>
    </div>
    <LeadingInput
      name="amountIn"
      class={errorState?.amountIn ? 'border-red-500' : ''}
      leadingText={swapType === 'BUY' ? 'ETH' : symbol}
      step="any"
      bind:value={amountIn}
      on:input={handleAmountInInput}
    />
    {#if errorState?.amountIn}
      <span class="absolute -bottom-5 text-red-500 text-xs">{errorState.amountIn}</span> 
    {/if}
  </div>

  <div class="relative flex flex-col gap-y-2">
    <label for="amountOut" >You Receive</label>
    <LeadingInput name="amountOut" class={errorState?.amountOut ? 'border-red-500' : ''} leadingText={swapType === 'SELL' ? 'ETH' : symbol} step="any" bind:value={amountOut} readonly/>
    {#if errorState?.amountOut}
      <span class="absolute -bottom-5 text-red-500 text-xs">{errorState.amountOut}</span> 
    {/if}
  </div>

  <div class="relative flex flex-col gap-y-2">
    <label for="slippage" >Slippage</label>
    <Input name="slippage" class={errorState?.slippage ? 'border-red-500' : ''} placeholder="0.5" bind:value={slippage} />
    {#if errorState?.slippage}
      <span class="absolute -bottom-5 text-red-500 text-xs">{errorState.slippage}</span> 
    {/if}
  </div>

  {#if isApproved}
    <Button class="self-center mt-2 w-full py-4 text-lg font-bold" type="submit" >
      Swap
    </Button>
  {:else}
    <Button class="self-center mt-2 w-full py-4 text-lg font-bold" type="submit" >
      Approve
    </Button>
  {/if}
</form>
 