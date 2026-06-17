import Link from "next/link";
import { Fragment } from "react";

type RichTextProps = {
  org: string;
  repo: string;
  text: string;
};

const tokenPattern = /(@[a-z0-9-]+|#\d+|!\d+|r:[a-f0-9]{7,12})/gi;

export function RichText({ org, repo, text }: RichTextProps) {
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="rich-text">
      {paragraphs.map((paragraph, paragraphIndex) => (
        <p key={`${paragraphIndex}-${paragraph.slice(0, 20)}`}>
          {paragraph.split(tokenPattern).map((part, partIndex) => {
            if (!part) {
              return null;
            }

            if (part.startsWith("@")) {
              const username = part.slice(1).toLowerCase();
              return (
                <Link key={`${paragraphIndex}-${partIndex}`} className="inline-link" href={`/${org}/settings?member=${username}`}>
                  {part}
                </Link>
              );
            }

            if (part.startsWith("#")) {
              const issueNumber = part.slice(1);
              return (
                <Link key={`${paragraphIndex}-${partIndex}`} className="inline-link" href={`/${org}/${repo}/issues/${issueNumber}`}>
                  {part}
                </Link>
              );
            }

            if (part.startsWith("!")) {
              const changeRequestNumber = part.slice(1);
              return (
                <Link key={`${paragraphIndex}-${partIndex}`} className="inline-link" href={`/${org}/${repo}/cr/${changeRequestNumber}`}>
                  {part}
                </Link>
              );
            }

            if (part.startsWith("r:")) {
              const revision = part.slice(2);
              return (
                <Link key={`${paragraphIndex}-${partIndex}`} className="inline-link" href={`/${org}/${repo}/revisions/${revision}`}>
                  {part}
                </Link>
              );
            }

            return <Fragment key={`${paragraphIndex}-${partIndex}`}>{part}</Fragment>;
          })}
        </p>
      ))}
    </div>
  );
}
