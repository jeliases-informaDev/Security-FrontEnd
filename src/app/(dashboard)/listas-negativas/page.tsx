import { Suspense } from 'react';
import { ConsultaListas } from '@/modules/listas_negativas/components/ConsultaListas';

export default function ListasNegativasPage() {
  // ConsultaListas lee ?consulta=… de la dirección: useSearchParams exige Suspense al prerenderizar.
  return (
    <Suspense fallback={null}>
      <ConsultaListas />
    </Suspense>
  );
}
