import type { GatherArguments } from "@shougo/ddu-vim/source";
import type { Item } from "@shougo/ddu-vim/types";
import { BaseSource } from "@shougo/ddu-vim/source";

import * as fn from "@denops/std/function";

import { type ActionData } from "../../@ddu-kinds/tmux_session/main.ts";
import { iterLine } from "../../ddu-source-tmux/iter.ts";

type Params = Record<never, never>;

const sessionLinePattern =
  /^(\d+): (\d+) windows \(created ([^\)]+)\)( \(attached\))?/;
function parseSessionLine(line: string): ActionData | undefined {
  const parts = sessionLinePattern.exec(line);
  if (!parts) {
    console.log(`failed to parse a session line: ${line}`);
    return undefined;
  }
  const [_, sessionId, windows, createdAt, attached] = Array.from(parts);
  return {
    sessionId,
    current: false,
    windows: Number(windows),
    createdAt,
    attached: attached === " (attached)",
  };
}

export class Source extends BaseSource<Params, ActionData> {
  override kind = "tmux_session";

  override params() {
    return {};
  }

  override gather(
    { denops }: GatherArguments<Params>,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream<Item<ActionData>[]>({
      start: async (controller) => {
        const { status, stderr, stdout } = new Deno.Command("tmux", {
          args: ["list-sessions"],
          stdin: "null",
          stderr: "piped",
          stdout: "piped",
        }).spawn();

        for await (const line of iterLine(stdout)) {
          const session = parseSessionLine(line);
          if (!session) {
            continue;
          }
          const tmuxProfile = await fn.getenv(denops, "TMUX");
          const [_a, _b, currentSessionId] = tmuxProfile.split(",");
          const current = session.sessionId === currentSessionId;
          controller.enqueue([{
            word: (current ? "* " : "  ") + line,
            action: {
              ...session,
              current,
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
