# Research notes

Static website for **https://blog.chungpa.com/**.

## Upload

Extract the ZIP and upload its **contents** to the root of `leechungpa/blog`, including the empty `.nojekyll` file. Do not upload the ZIP itself or place everything inside another folder.

Use **Settings → Pages → Deploy from a branch → main → / (root)**. The custom domain and DNS have already been verified. Keep `CNAME` containing `blog.chungpa.com`; the DNS CNAME for `blog` points to `leechungpa.github.io`.

- `index.html` — post list at `/`.
- `0/index.html` — first post at `/0/`.
- `0/assets/` — files used by the first post; upload the entire directory.
- `robots.txt` and `sitemap.xml` — crawler access and canonical page URLs.

Empirical validation panels are closed on initial load. Their contents remain in the HTML and appear when clicked.

## Add a post

1. Create the next numbered directory, such as `1/`, containing `index.html` and its assets.
2. Add a normal link to `./1/` in the root post list, and update its `ItemList` structured data.
3. Set the new post's title, description, canonical URL, social metadata and article structured data to its own content and `https://blog.chungpa.com/1/` address.
4. Add the canonical URL to `sitemap.xml`. Update modification dates only when the corresponding page changes.

Numeric paths are valid. Google recommends descriptive URLs for readability; this site retains short numbered paths.

## Search discovery

After publishing, use [Google Search Console](https://search.google.com/search-console) to inspect `https://blog.chungpa.com/0/` and submit `https://blog.chungpa.com/sitemap.xml`.

`OAI-SearchBot` is explicitly allowed for ChatGPT search. It is separate from `GPTBot`, which concerns model training; the existing training-crawler preference is unchanged. Search access, canonical metadata and a sitemap support discovery but do not guarantee indexing, ranking or citations.

The article text is available in the initial HTML. No special AI text file or additional AI schema is required for Google's AI search features.

If the earlier copy at `https://github.chungpa.com/cl.html` remains online, set its canonical URL to `https://blog.chungpa.com/0/` or redirect it there. Update links on your research and publication pages to the new address.

## Documentation

- [GitHub Pages: custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Google: URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure)
- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [OpenAI: crawlers](https://developers.openai.com/api/docs/bots)
