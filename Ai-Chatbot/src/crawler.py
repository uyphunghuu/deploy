#!/usr/bin/env python3
"""
Deep Web Crawler using Crawl4AI.
Crawls a URL with configurable depth (default=2), outputs clean markdown.

Usage:
    python -m src.crawler                           # Crawl all URLs from config
    python -m src.crawler <url>                     # Crawl single URL
    python -m src.crawler <url> --depth 3           # Custom depth
    python -m src.crawler --max-pages 100           # Limit pages per URL
"""

import asyncio
import argparse
from pathlib import Path
from urllib.parse import urlparse

from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig
from crawl4ai.deep_crawling import BFSDeepCrawlStrategy
from crawl4ai.content_scraping_strategy import LXMLWebScrapingStrategy


def build_output_filename(url: str) -> str:
    """Generate output filename from URL domain + path."""
    parsed = urlparse(url)
    domain = parsed.netloc.replace("www.", "").replace(".", "-")
    path_part = parsed.path.strip("/").replace("/", "-")
    if path_part:
        return f"{domain}-{path_part}.md"
    return f"{domain}.md"


async def crawl(url: str, depth: int = 2, max_pages: int | None = None, output: str = "/Users/dark_kazansky/Test Chatbot/documents/raw"):
    """
    Crawl a URL with BFS deep crawl strategy.
    Each crawled page is saved as a separate .md file.

    Args:
        url: Starting URL to crawl
        depth: How many levels deep to crawl (default: 2)
        max_pages: Maximum pages to crawl (default: None = unlimited)
        output: Output directory (default: /Users/dark_kazansky/Test Chatbot/documents/raw)
    """
    output_dir = Path(output)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"🕷️  Crawl4AI Deep Crawler")
    print(f"   URL:       {url}")
    print(f"   Depth:     {depth}")
    print(f"   Max pages: {'unlimited' if max_pages is None else max_pages}")
    print(f"   Output:    {output_dir}/")
    print(f"{'─' * 60}")

    # Configure deep crawl
    strategy_kwargs = {
        "max_depth": depth,
        "include_external": False,
    }
    if max_pages is not None:
        strategy_kwargs["max_pages"] = max_pages

    strategy = BFSDeepCrawlStrategy(**strategy_kwargs)

    browser_config = BrowserConfig(
        headless=True,
        verbose=False,
    )

    run_config = CrawlerRunConfig(
        deep_crawl_strategy=strategy,
        scraping_strategy=LXMLWebScrapingStrategy(),
        word_count_threshold=10,
        exclude_external_links=True,
        remove_overlay_elements=True,
        process_iframes=True,
        stream=True,
    )

    # Run the crawl
    saved_count = 0
    page_count = 0

    async with AsyncWebCrawler(config=browser_config) as crawler:
        async for result in await crawler.arun(url, config=run_config):
            page_count += 1
            depth_level = result.metadata.get("depth", 0)

            if result.success:
                page_url = result.url
                # Get markdown content
                markdown = ""
                if hasattr(result, "markdown"):
                    if hasattr(result.markdown, "fit_markdown") and result.markdown.fit_markdown:
                        markdown = result.markdown.fit_markdown
                    elif hasattr(result.markdown, "raw_markdown") and result.markdown.raw_markdown:
                        markdown = result.markdown.raw_markdown
                    elif isinstance(result.markdown, str):
                        markdown = result.markdown

                if markdown and len(markdown.strip()) > 50:
                    # Save each page as a separate file
                    filename = build_output_filename(page_url)
                    file_path = output_dir / filename

                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(f"# {page_url}\n\n")
                        f.write(f"> Source: {page_url}\n> Depth: {depth_level}\n\n---\n\n")
                        f.write(markdown.strip())
                        f.write("\n")

                    saved_count += 1
                    print(f"   ✅ [{page_count}] depth={depth_level} → {filename}")
                else:
                    print(f"   ⚠️  [{page_count}] depth={depth_level} {page_url[:80]} (no content)")
            else:
                print(f"   ❌ [{page_count}] depth={depth_level} {result.url[:80]} ({result.error_message})")

    print(f"{'─' * 60}")
    print(f"   Total pages crawled: {page_count}")
    print(f"   Files saved:         {saved_count}")
    print(f"   Output directory:    {output_dir}/")

    return saved_count


def main():
    parser = argparse.ArgumentParser(
        description="Deep crawl a URL and save as markdown",
        usage="python -m src.crawler [url] [options]",
    )
    parser.add_argument("url", nargs="?", default=None, help="URL to crawl (omit to crawl all URLs from config)")
    parser.add_argument("--depth", type=int, default=4, help="Crawl depth (default: 2)")
    parser.add_argument("--max-pages", type=int, default=None, help="Max pages to crawl (default: unlimited)")
    parser.add_argument("--output", "-o", type=str, default="/Users/dark_kazansky/Test Chatbot/documents/raw", help="Output directory (default: /Users/dark_kazansky/Test Chatbot/documents/raw)")

    args = parser.parse_args()

    if args.url:
        # Single URL mode
        asyncio.run(crawl(args.url, args.depth, args.max_pages, args.output))
    else:
        # Batch mode: crawl all URLs from config
        from src.config import urls as config_urls
        url_list = [u.strip() for u in config_urls.strip().splitlines() if u.strip()]

        if not url_list:
            print("❌ No URLs found in src/config.py")
            return

        print(f"🕷️  Batch crawl: {len(url_list)} URLs from config")
        print(f"{'─' * 60}")

        for i, url in enumerate(url_list, 1):
            print(f"\n[{i}/{len(url_list)}] {url}")
            asyncio.run(crawl(url, args.depth, args.max_pages, args.output))

        print(f"\n{'─' * 60}")
        print(f"✅ Batch complete: {len(url_list)} URLs crawled")


if __name__ == "__main__":
    main()
