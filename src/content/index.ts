import TwitterBot from "../components/Routes/TwitterBot.svelte";

// Some global styles on the page
import "./styles.css";

const callback = async (mutationList: MutationRecord[]) => {
  const twitterBot = document.getElementById('twitter-bot');
  if (twitterBot) return // already exists so no need to search for it 
  for (const mutation of mutationList) {
    if (mutation.type === 'childList') {
      const sidebarColumn = document.querySelector('[data-testid="sidebarColumn"]');
      const search = document.querySelector('[role="search"]') as unknown as HTMLElement;
      const nightMode = await chrome.runtime.sendMessage({ type: 'getNightMode' })

      if (sidebarColumn && search) {
        const elementToHide = sidebarColumn.firstChild as unknown as HTMLElement;
        sidebarColumn.prepend(search);

        search.style.position = 'fixed';
        search.style.top = '5px';
        search.style.width = 'inherit';
        search.style.zIndex = '999';

        // elementToHide.style.display = 'none';
        elementToHide?.remove();

        new TwitterBot({ target: sidebarColumn as Element, props: { nightMode: Number(nightMode) }}); 
        break;
      }
    }
  }
}

const observer = new MutationObserver(callback);

observer.observe(document.body, { childList: true, subtree: true });
