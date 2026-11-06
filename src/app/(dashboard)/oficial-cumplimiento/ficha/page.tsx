import { Suspense } from 'react';
import { PantallaFicha } from '@/modules/oficial_cumplimiento/components/ficha/PantallaFicha';

export default function FichaOficialPage() {
  // PantallaFicha lee ?id=… de la dirección (una designación anterior): useSearchParams exige Suspense al prerenderizar.
  return (
    <Suspense fallback={null}>
      <PantallaFicha />
    </Suspense>
  );
}
