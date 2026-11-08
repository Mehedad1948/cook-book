import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-12">
      <div className="text-center">
        <p className="text-7xl font-extrabold text-brand">۴۰۴</p>
        <h1 className="mt-2 text-2xl font-extrabold">این صفحه پیدا نشد</h1>
        <p className="mt-2 text-muted">شاید آدرس عوض شده یا هنوز اضافه نشده است.</p>
        <Link href="/recipes" className="btn btn-primary mt-6">دیدن دستور پخت‌ها</Link>
      </div>
    </div>
  );
}
