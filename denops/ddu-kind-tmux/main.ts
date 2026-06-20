import type { Denops } from "@denops/std";
import { ensure, is } from "@core/unknownutil";

export function main(denops: Denops) {
  denops.dispatcher = {
    async switchSession(uTarget: unknown) {
      const target = ensure(uTarget, is.String);
      const command = new Deno.Command("tmux", {
        args: ["switch-client", "-t", target],
        stdin: "null",
        stdout: "null",
        stderr: "null",
      });
      const proc = command.spawn();
      await proc.status;
    },
    async killSession(uTarget: unknown) {
      const target = ensure(uTarget, is.String);
      const command = new Deno.Command("tmux", {
        args: ["kill-session", "-t", target],
        stdin: "null",
        stdout: "null",
        stderr: "null",
      });
      const proc = command.spawn();
      await proc.status;
    },
    async selectPane(uTarget: unknown) {
      const target = ensure(uTarget, is.String);
      const command = new Deno.Command("tmux", {
        args: ["select-pane", "-t", target],
        stdin: "null",
        stdout: "null",
        stderr: "null",
      });
      const proc = command.spawn();
      await proc.status;
    },
    async killPane(uTarget: unknown) {
      const target = ensure(uTarget, is.String);
      const command = new Deno.Command("tmux", {
        args: ["kill-pane", "-t", target],
        stdin: "null",
        stdout: "null",
        stderr: "null",
      });
      const proc = command.spawn();
      await proc.status;
    },
  };
}
