import TwitterBot from "../components/TwitterBot.svelte";

// Some global styles on the page
import "./styles.css";

const callback = async (mutationList: MutationRecord[]) => {
  const twitterBot = document.getElementById('twitter-bot');
  if (twitterBot) return // already exists so no need to search for it 
  for (const mutation of mutationList) {
    if (mutation.type === 'childList') {
      const sidebarColumn = document.querySelector('[data-testid="sidebarColumn"]');
      const trending = document.querySelector('[aria-label="Trending"]');
      const nightMode = await chrome.runtime.sendMessage({ type: 'getNightMode' })

      if (sidebarColumn && trending) {
        const firstChild = trending.firstChild as unknown as Element;
        const elementsToDelete = [...Array(firstChild.childElementCount - 1).keys()]
          .map((i) => firstChild.children.item(i + 1)!);
        for (const ele of elementsToDelete) {
          ele.remove();
        }

        new TwitterBot({ target: sidebarColumn as Element, props: { nightMode: Number(nightMode) }}); 
        break;
      }
    }
  }
}

const observer = new MutationObserver(callback);

observer.observe(document.body, { childList: true, subtree: true });
