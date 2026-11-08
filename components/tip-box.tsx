import type { Tip } from "@/lib/recipe/schema";
import { RichText } from "./rich-text";
import { WarnIcon } from "./icons";

/** Pure presentational: safe to import from client components. */
export function TipBox({ tip }: { tip: Tip }) {
  const warn = tip.kind === "احتیاط";
  return (
    <aside className="tipbox" role="note">
      <p>
        <span className="tip-label inline-flex items-center gap-1">
          {warn && <WarnIcon width={16} height={16} />}
          {tip.title ?? tip.kind}:
        </span>{" "}
        <RichText text={tip.text} />
      </p>
    </aside>
  );
}

