import type { GatherArguments } from "@shougo/ddu-vim/source";
import type { Item } from "@shougo/ddu-vim/types";
import { BaseSource } from "@shougo/ddu-vim/source";

import { type ActionData } from "../../@ddu-kinds/tmux_pane/main.ts";
import { iterLine } from "../../ddu-source-tmux/iter.ts";

type Params = Record<never, never>;

const paneLinePattern =
  /^(\d+): \[(\d+)x(\d+)\] \[history (\d+)\/(\d+), (\d+) bytes\] (%\d+)( \(active\))?/;
function parsePaneLine(line: string): ActionData | undefined {
  const parts = paneLinePattern.exec(line);
  if (!parts) {
    console.log(`failed to parse a pane line: ${line}`);
    return undefined;
  }
  const [_, paneNr, width, height, hisCnt, hisLim, bytes, paneId, active] =
    Array.from(parts);
  return {
    paneNr,
    width: Number(width),
    height: Number(height),
    historyCount: Number(hisCnt),
    historyLimit: Number(hisLim),
    bytes: Number(bytes),
    paneId,
    active: active === " (active)",
  };
}

export class Source extends BaseSource<Params, ActionData> {
  override kind = "tmux_pane";

  override params() {
    return {};
  }

  override gather(
    {}: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream<Item<ActionData>[]>({
      start: async (controller) => {
        const { status, stderr, stdout } = new Deno.Command("tmux", {
          args: ["list-panes"],
          stdin: "null",
          stderr: "piped",
          stdout: "piped",
        }).spawn();

        for await (const line of iterLine(stdout)) {
          const pane = parsePaneLine(line);
          if (!pane) {
            continue;
          }
          controller.enqueue([{
            word: (pane.active ? "* " : "  ") + line,
            action: {
              ...pane,
            },
          }]);
        }
        const result = await status;
        controller.close();
        if (!result.success) {
          for await (const line of iterLine(stderr)) {
            console.error(line);
          }
        }
      },
    });
  }
}
