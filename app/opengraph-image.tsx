import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { BRAND } from "@/lib/site";

export const alt = `${BRAND} | دستور پخت‌های دقیق ایرانی`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    title: "دستور پخت‌های دقیق ایرانی",
    eyebrow: "تا بار اول درست دربیاید",
    chips: ["مقدار دقیق", "نشانهٔ آماده شدن", "اشتباه‌های رایج"],
  });
}
