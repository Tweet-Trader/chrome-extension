import TwitterBot from "../components/TwitterBot.svelte";

// Some global styles on the page
import "./styles.css";

const observer = new MutationObserver((mutations) => {
  if (mutations.length === 0) return;
  const sidebarColumn = document.querySelector('[data-testid="sidebarColumn"]');
  const trending = document.querySelector('[aria-label="Trending"]');
  if (sidebarColumn && trending) {
    const firstChild = trending.firstChild as unknown as Element;
    const elementsToDelete = [...Array(firstChild.childElementCount - 1).keys()]
      .map((i) => firstChild.children.item(i + 1)!);
    for (const ele of elementsToDelete) {
      ele.remove();
    }

    observer.disconnect();
    new TwitterBot({ target: sidebarColumn });
  }
})

observer.observe(document.body, { childList: true, subtree: true });
