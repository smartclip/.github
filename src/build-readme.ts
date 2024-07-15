import RssParser from "rss-parser";
import { readSync } from "to-vfile";
import { remark } from "remark";
import { zone } from "mdast-zone";
import { promisify } from "node:util";
import { writeFile } from "node:fs";
import { join } from "node:path";
import type { Root } from "mdast";

interface FeedItem {
  link: string;
  title: string;
}

const rssParser = new RssParser<{ items: FeedItem[] }>();
const readmePath = join(import.meta.dirname, "..", "profile", "README.md");

(async () => {
  const feed = await rssParser.parseURL(
    "https://careers.smartclip.tv/jobs.rss",
  );
  const file = await remark()
    .use(
      refreshBlogPosts(
        feed.items.filter(
          (item) =>
            !item.title.match(/say hello/gi) &&
            item.title.match(/(engineer|developer|architect|owner|manager)/gi),
        ),
      ),
    )
    .process(readSync(readmePath));
  await promisify(writeFile)(readmePath, String(file));
})();

function refreshBlogPosts(feedItems: FeedItem[]) {
  return () => (tree: Root) => {
    zone(tree, "jobs", (start, nodes, end) => {
      return [
        start,
        {
          type: "list",
          ordered: false,
          children: feedItems.map(({ link, title }) => {
            return {
              type: "listItem",
              children: [
                {
                  type: "paragraph",
                  children: [
                    {
                      type: "link",
                      url: link,
                      children: [{ type: "text", value: title }],
                    },
                  ],
                },
              ],
            };
          }),
        },
        end,
      ];
    });
  };
}
