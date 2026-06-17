import { linkHorizontal } from "d3-shape";

import { demoDag } from "@/lib/demo-repository";

type DagLink = {
  source: [number, number];
  target: [number, number];
};

const buildPath = linkHorizontal<DagLink, [number, number]>()
  .x((point) => point[0])
  .y((point) => point[1]);

export function getDagLinks() {
  return demoDag.flatMap((node) =>
    node.parents
      .map((parentHash) => {
        const parent = demoDag.find((candidate) => candidate.hash === parentHash);

        if (!parent) {
          return null;
        }

        return {
          id: `${node.hash}-${parentHash}`,
          path: buildPath({
            source: [parent.x, parent.y],
            target: [node.x, node.y],
          }),
        };
      })
      .filter((link): link is { id: string; path: string | null } => link !== null),
  );
}
