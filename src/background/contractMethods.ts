import { encodeFunctionData, formatUnits, numberToHex } from 'viem'
import { publicClient } from "./client";
import { v2FactoryAbi } from '../abis/v2Factory'
import { pairAbi } from '../abis/pair'
import { getBasisPointsMultiplier } from '../utils';
import { twitterBotAbi } from '../abis/twitterBot';

const V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDC_PAIR = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";
export const UINT_MAX = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

export const getAddress = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [{ result: address }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    world: 'MAIN',
    func: async () => {
      const [address] = await window.ethereum.request({ method: 'eth_accounts' });

      return address;
    }
  })

  return address;
}

export const requestAddress = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [{ result: address }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    world: 'MAIN',
    func: async () => {
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });

      return address;
    }
  })

  return address;
}

export const getBalance = async (address: `0x${string}`) => {
  const balance = await publicClient.getBalance({ address });

  return balance.toString()
}

export const getPairAddress = async (tokenAddress: `0x${string}`) => {
  const pair = await publicClient.readContract({
    address: V2_FACTORY,
    abi: v2FactoryAbi,
    functionName: 'getPair',
    args: [tokenAddress, WETH],
  })

  return pair;
}

const fetchReserves = async (pair: `0x${string}`, tokenAddress: `0x${string}`) => {
	const [token0Reserves, token1Reserves] = await publicClient.readContract({
		address: pair,
		abi: pairAbi,
		functionName: 'getReserves',
	});

	return {
		tokenReserves: tokenAddress < WETH ? token0Reserves : token1Reserves,
		wethReserves: tokenAddress < WETH ? token1Reserves : token0Reserves,
	}
}

export const getReserves = async (pair: `0x${string}`, tokenAddress: `0x${string}`) => {
  const { tokenReserves, wethReserves } = await fetchReserves(pair, tokenAddress);

  return {
    tokenReserves: tokenReserves.toString(),
    wethReserves: wethReserves.toString(),
  }
}

export const getTokenBalance = async (walletAddress: `0x${string}`, tokenAddress: `0x${string}`) => {
	const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: [{ name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], inputs: [{ internalType: "address", name: "account", type: "address" }], stateMutability: "view", type: "function" }] as const,
    functionName: 'balanceOf',
    args: [walletAddress],
  })

  return balance.toString();
}

export const getSymbol = async (tokenAddress: `0x${string}`) => {
	const symbol = await publicClient.readContract({
		address: tokenAddress,
		abi: [{ name: "symbol", outputs: [{ internalType: "string", name: "", type: "string" }], inputs: [], stateMutability: "view", type: "function" }] as const,
		functionName: 'symbol',
	})

	return symbol;
}

export const getDecimals = async (tokenAddress: `0x${string}`) => {
  const decimals = await publicClient.readContract({
    address: tokenAddress,
    abi: [{ name: "decimals", outputs: [{ internalType: "uint8", name: "", type: "uint8" }], inputs: [], stateMutability: "view", type: "function" }] as const,
    functionName: 'decimals',
  })

  return decimals
}

export const getAllowance = async (walletAddress: `0x${string}`, tokenAddress: `0x${string}`) => {
  const allowance = await publicClient.readContract({
    account: walletAddress,
    address: tokenAddress,
    abi: [{ name: "allowance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], inputs: [{ internalType: "address", name: "owner", type: "address" }, { internalType: "address", name: "spender", type: "address" }], stateMutability: "view", type: "function" }] as const,
    functionName: 'allowance',
    args: [walletAddress, import.meta.env.VITE_TWITTER_BOT_ADDRESS],
  })

  return allowance.toString();
}

export const getAmountOut = (amountIn: bigint, reserveIn: bigint, reserveOut: bigint) => {
  if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) throw new Error('Insufficient Liquidity');
  const amountInWithFee = amountIn * BigInt(997);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * BigInt(1000) + amountInWithFee;

  return numerator / denominator;
}

export const getAmountIn = (amountOut: bigint, reserveIn: bigint, reserveOut: bigint) => {
  if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) throw new Error('Insufficient Liquidity');
  const numerator = reserveIn * amountOut * BigInt(1000);
  const denominator = (reserveOut - amountOut) * BigInt(997);

  return (numerator / denominator) + BigInt(1);
}

export type Reserve = { 
	tokenReserves: bigint;
	wethReserves: bigint;
};
export const getTokenPrice = (token: Reserve, usdc: Reserve, decimals: number) => {
	const usdcWethRatio = Number(formatUnits(usdc.tokenReserves as bigint, 6)) / Number(formatUnits(usdc.wethReserves as bigint, 18));
	const wethTokenRatio = Number(formatUnits(token.wethReserves as bigint, 18)) / Number(formatUnits(token.tokenReserves as bigint, decimals));

	return usdcWethRatio * wethTokenRatio;
}

export const getTokenData = async (walletAddress: `0x${string}`, tokenAddress: `0x${string}`) => {
  const pair = await getPairAddress(tokenAddress);
  if (!pair) throw new Error('Pair Token not found');
  const token = await fetchReserves(pair, tokenAddress);
  const usdc = await fetchReserves(USDC_PAIR, USDC);
  const decimals = await getDecimals(tokenAddress);
  const symbol = await getSymbol(tokenAddress);
  const price = getTokenPrice(token, usdc, decimals);
  const tokenBalance = await getTokenBalance(walletAddress, tokenAddress);
  const allowance = await getAllowance(walletAddress, tokenAddress);

  return {
    tokenBalance,
    symbol,
    price,
    decimals,
    allowance,
  }
}

export const waitForTransactionReceipt = async (txHash: `0x${string}`) => {
  const { transactionHash } = await publicClient.waitForTransactionReceipt({ hash: txHash });

  return transactionHash;
}

export const approve = async (walletAddress: `0x${string}`, tokenAddress: `0x${string}`) => {
  const { request: contractWriteRequest } = await publicClient.simulateContract({
    account: walletAddress,
    address: tokenAddress,
    abi: [{ name: "approve", outputs: [], inputs: [{ internalType: "address", name: "spender", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], stateMutability: "nonpayable", type: "function" }] as const,
    functionName: 'approve',
    args: [import.meta.env.VITE_TWITTER_BOT_ADDRESS, BigInt(UINT_MAX)],
  })
  const sendTransactionData = encodeFunctionData({
    abi: contractWriteRequest.abi,
    args: contractWriteRequest.args,
    functionName: contractWriteRequest.functionName,
  }) 

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [{ result: txHash }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    world: 'MAIN',
    func: async (from, to, data) => {
      const txHash = await window.ethereum.request({ method: 'eth_sendTransaction', params: [{
          from,
          to,
          data,
        }] 
      }); 

      return txHash;
    },
    args: [walletAddress, tokenAddress, sendTransactionData],
  })

  return txHash;
}

type SwapBody = {
  twitterId: string;
  tokenAddress: `0x${string}`;
  amount: string;
  slippage: number;
  decimals: number;
  tokenPrice: number;
}
export const buy = async (data: SwapBody) => {
  const { tokenAddress, amount, slippage } = data;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [{ result: address }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    world: 'MAIN',
    func: async () => {
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return address;
    },
  })

  const amountIn = BigInt(amount);
  const pair = await getPairAddress(tokenAddress);
  const token = await fetchReserves(pair, tokenAddress);
  console.log("data fetched")

  const amountOut = getAmountOut(amountIn, token.wethReserves, token.tokenReserves);
  const bp = getBasisPointsMultiplier(slippage);
  const amountOutMin = amountOut * BigInt((100 - slippage) * bp) / BigInt(100 * bp);
  console.log("data prepared");

  const { request: contractWriteRequest } = await publicClient.simulateContract({
    account: address,
    address: import.meta.env.VITE_TWITTER_BOT_ADDRESS,
    abi: twitterBotAbi,
    functionName: "buyTokens_v2Router",
    args: [tokenAddress, amountOutMin],
    value: amountIn,
  })

  const sendTransactionData = encodeFunctionData({
    abi: contractWriteRequest.abi,
    args: contractWriteRequest.args,
    functionName: contractWriteRequest.functionName,
  }) 
  console.log("send transaction: ", sendTransactionData)

  const [{ result: txHash }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    world: 'MAIN',
    func: async (from, to, data, value) => {
      const txHash = await window.ethereum.request({ method: 'eth_sendTransaction', params: [{
          from,
          to,
          data,
          value,
        }] 
      });

      return txHash;
    },
    args: [address, import.meta.env.VITE_TWITTER_BOT_ADDRESS, sendTransactionData, numberToHex(amountIn)]
  })
  console.log("tx hash: ", txHash);

  return txHash;
}

export const sell = async (data: SwapBody) => {
  const { tokenAddress, amount, slippage } = data;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [{ result: address }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    world: 'MAIN',
    func: async () => {
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return address;
    },
  })

  const amountIn = BigInt(amount);
  const pair = await getPairAddress(tokenAddress);
  const token = await fetchReserves(pair, tokenAddress);
  console.log("data fetched")

  const amountOut = getAmountOut(amountIn, token.tokenReserves, token.wethReserves);
  const bp = getBasisPointsMultiplier(slippage);
  console.log("bp: ", bp)
  console.log(100 - slippage);
  console.log((100 - slippage) * bp);
  console.log(100 * bp);
  const amountOutMin = amountOut * BigInt((100 - slippage) * bp) / BigInt(100 * bp);
  console.log("data prepared");

  console.log("amount out: ", amountOut.toString());
  console.log("amount out min: ", amountOutMin.toString());

  const { request: contractWriteRequest } = await publicClient.simulateContract({
    account: address,
    address: import.meta.env.VITE_TWITTER_BOT_ADDRESS,
    abi: twitterBotAbi,
    functionName: "sellTokens_v2Router",
    args: [tokenAddress, amountIn, amountOutMin],
  })

  const sendTransactionData = encodeFunctionData({
    abi: contractWriteRequest.abi,
    args: contractWriteRequest.args,
    functionName: contractWriteRequest.functionName,
  }) 
  console.log("send transaction: ", sendTransactionData)

  const [{ result: txHash }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    world: 'MAIN',
    func: async (from, to, data) => {
      const txHash = await window.ethereum.request({ method: 'eth_sendTransaction', params: [{
          from,
          to,
          data,
        }] 
      });

      return txHash;
    },
    args: [address, import.meta.env.VITE_TWITTER_BOT_ADDRESS, sendTransactionData]
  })
  console.log("tx hash: ", txHash);

  return txHash;
}