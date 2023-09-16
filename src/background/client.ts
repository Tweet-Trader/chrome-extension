import {createPublicClient, http } from "viem";
import { foundry } from './chains';

export const publicClient = createPublicClient({
  chain: foundry,
  transport: http(import.meta.env.VITE_TRANSPORT_URL),
})
