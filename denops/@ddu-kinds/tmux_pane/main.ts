import { BaseKind } from "@shougo/ddu-vim/kind";

import { ensure, is, type Predicate } from "@core/unknownutil";

import { type ActionArguments, ActionFlags } from "@shougo/ddu-vim/types";
import { Denops } from "@denops/std";

export const isActionData = is.ObjectOf({
  paneNr: is.String,
  width: is.Number,
  height: is.Number,
  historyCount: is.Number,
  historyLimit: is.Number,
  bytes: is.Number,
  paneId: is.String,
  active: is.Boolean,
}) satisfies Predicate<ActionData>;

export type ActionData = {
  paneNr: string;
  width: number;
  height: number;
  historyCount: number;
  historyLimit: number;
  bytes: number;
  paneId: string;
  active: boolean;
};

type Params = Record<never, never>;

async function print_error(denops: Denops, msg: string) {
  await denops.call("ddu#util#print_error", msg, "ddu-kind-tmux");
}

export class Kind extends BaseKind<Params> {
  actions = {
    select: async (
      { denops, items }: ActionArguments<Params>,
    ) => {
      if (items.length != 1) {
        print_error(
          denops,
          "invalid action calling: it can accept only one item",
        );
        return ActionFlags.RestoreCursor;
      }
      if (!process.env.TMUX || process.env.TMUX === "") {
        print_error(
          denops,
          "invalid action calling: it can be called in tmux process",
        );
      }

      const item = items[0];
      const data = ensure(item.action, isActionData);
      await denops.call("denops#notify", "ddu-kind-tmux", "selectPane", [
        data.paneNr,
      ]);
      return ActionFlags.None;
    },
    kill: async (
      { denops, items }: ActionArguments<Params>,
    ) => {
      if (items.length != 1) {
        await denops.call(
          "ddu#util#print_error",
          "invalid action calling: it can accept only one item",
          "ddu-kind-tmux",
        );
        return ActionFlags.RestoreCursor;
      }

      const item = items[0];
      const data = ensure(item.action, isActionData);
      await denops.call("denops#notify", "ddu-kind-tmux", "killPane", [
        data.paneNr,
      ]);
      return ActionFlags.None;
    },
  };

  override params(): Params {
    return {};
  }
}
