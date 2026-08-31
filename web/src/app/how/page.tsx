import { SiteHeader } from "@/components/site-header";

export default function HowPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="content" className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-5xl tracking-tight">Как считается посадка</h1>
        <p className="mt-6 text-base leading-relaxed text-mute">
          FRAME оценивает размер головы по сетке лица с камеры. Это не рецепт, не диагноз и не замена приёма
          у офтальмолога.
        </p>
        <ol className="mt-10 space-y-8 text-base leading-relaxed text-mute">
          <li>
            <strong className="text-ink">Съёмка.</strong> Браузер берёт живой кадр. Стоковые портреты не используются.
            Пока нет анфаса при свете спереди, мерки не считаем.
          </li>
          <li>
            <strong className="text-ink">Сетка лица.</strong> MediaPipe Face Landmarker даёт трёхмерные точки, включая
            радужку. По ним оцениваем межзрачковое расстояние и ширину лица в миллиметрах.
          </li>
          <li>
            <strong className="text-ink">Оправа.</strong> На лице — фотореалистичная 3D-модель, снятая с физической
            пары очков (Khronos Sample Assets, CC BY 4.0), не нарисованный силуэт. Размер подгоняется под ваш IPD.
            Наличие конкретной модели в салоне уточняйте на месте.
          </li>
          <li>
            <strong className="text-ink">Оптики.</strong> Ближайшие салоны — из каталога 2GIS/ODOS по GPS. Если
            геолокацию не дали, выберите город сами: чужой город подставлять не будем.
          </li>
        </ol>
      </main>
    </div>
  );
}
