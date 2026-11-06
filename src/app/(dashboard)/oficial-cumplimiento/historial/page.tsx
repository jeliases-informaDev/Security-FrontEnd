import { Suspense } from 'react';
import { PantallaHistorial } from '@/modules/oficial_cumplimiento/components/historial/PantallaHistorial';

export default function HistorialOficialPage() {
  // PantallaHistorial lee ?id=… de la dirección (un oficial anterior): useSearchParams exige Suspense al prerenderizar.
  return (
    <Suspense fallback={null}>
      <PantallaHistorial />
    </Suspense>
  );
}
