import { BaseKind } from "@shougo/ddu-vim/kind";

import { ensure, is, type Predicate } from "@core/unknownutil";

import { type ActionArguments, ActionFlags } from "@shougo/ddu-vim/types";

export const isActionData = is.ObjectOf({
  sessionId: is.String,
  current: is.Boolean,
  windows: is.Number,
  createdAt: is.String,
  attached: is.Boolean,
}) satisfies Predicate<ActionData>;

export type ActionData = {
  sessionId: string;
  current: boolean;
  windows: number;
  createdAt: string;
  attached: boolean;
};

type Params = Record<never, never>;

async function print_error(denops: Denops, msg: string) {
  await denops.call(
    "ddu#util#print_error",
    msg,
    "ddu-kind-tmux",
  );
}

export class Kind extends BaseKind<Params> {
  actions = {
    switch: async (
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
      await denops.call("denops#notify", "ddu-kind-tmux", "switchSession", [
        data.sessionId,
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
      await denops.call("denops#notify", "ddu-kind-tmux", "killSession", [
        data.sessionId,
      ]);
      return ActionFlags.None;
    },
  };

  override params(): Params {
    return {};
  }
}
