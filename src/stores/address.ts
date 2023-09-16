import { writable } from "svelte/store";

export const address = writable<`0x${string}` | null>(null);