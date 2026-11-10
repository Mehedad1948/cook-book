import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { BRAND } from "@/lib/site";

export const alt = `${BRAND} | دستور پخت‌های دقیق ایرانی`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOg({
    title: BRAND,
    subtitle: "دستور پخت‌های دقیق ایرانی",
    showBrand: false,
    titleSize: 168,
  });
}
