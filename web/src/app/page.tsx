import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="content" className="px-6 pb-20 md:px-10">
        <section className="grid items-end gap-12 pt-8 md:grid-cols-[1.15fr_0.85fr] md:pt-16">
          <div>
            <p className="mb-6 text-xs font-medium tracking-[0.22em] text-mute uppercase">
              Ателье посадки · живая камера
            </p>
            <h1 className="font-display max-w-[14ch] text-[clamp(3.2rem,8vw,7.2rem)] leading-[0.9] tracking-[-0.04em]">
              Мы подберем Вам Вашу оправу
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-mute">
              Сфотографируйтесь сейчас Считаем межзрачковое расстояние и ширину лица в 3D,
              подбираем оправы с реальными размерами и ищем оптики на карте рядом с вами
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/capture"
                className="inline-flex min-h-12 items-center rounded-full bg-blood px-7 text-sm font-medium text-blood-fg"
              >
                Открыть камеру
              </Link>
              <Link href="/how" className="inline-flex min-h-12 items-center px-2 text-sm underline decoration-line underline-offset-4">
                Смотреть метод
              </Link>
            </div>
          </div>
          <aside className="relative overflow-hidden rounded-[2rem] bg-night p-8 text-paper">
            <p className="text-xs tracking-[0.2em] uppercase text-gold">Без подставок</p>
            <ul className="mt-8 space-y-5 text-sm leading-relaxed text-paper/80">
              <li>Лицо — только с вашей камеры</li>
              <li>Оправы — заводские коды размеров (eye / bridge / temple)</li>
              <li>Магазины — каталог оптик 2GIS, по GPS</li>
            </ul>
            <div className="mt-12 h-px bg-white/10" />
            <p className="mt-6 font-display text-4xl leading-none">IPD · 3D</p>
            <p className="mt-3 text-sm text-paper/55">Посадка считается по Landmark Mesh, не по «типу лица» из стока</p>
          </aside>
        </section>
      </main>
    </div>
  );
}
