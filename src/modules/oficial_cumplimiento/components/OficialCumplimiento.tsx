'use client';

import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoOficial } from '@/shared/ui/iconos';
import { useCatalogosOficial, useEstadoOficial } from '../hooks/useCarga';
import { EsqueletoPagina, ErrorPagina } from './piezas';
import { SinOficial } from './SinOficial';

/** Cabecera neutra mientras se sabe en qué estado está la empresa (o si falló la carga). */
function CabeceraBase() {
  return <PageHeader antetitulo="Cumplimiento · UIF-Perú" icono={IconoOficial} titulo="Oficial de cumplimiento" sinLinea />;
}

/** Pantalla raíz del módulo: según el estado que entrega el servidor muestra OC 0, OC 7, OC 9 u OC 13. */
export function OficialCumplimiento() {
  const estado = useEstadoOficial();
  const catalogos = useCatalogosOficial();

  const error = estado.error ?? catalogos.error;
  if (error) {
    return (
      <PageShell ancho="amplio">
        <CabeceraBase />
        <ErrorPagina mensaje={error} onReintentar={() => { estado.recargar(); catalogos.recargar(); }} volverHref="/overview" volverTexto="Ir a la página principal" />
      </PageShell>
    );
  }

  if (!estado.datos || !catalogos.datos) {
    return (
      <PageShell ancho="amplio">
        <CabeceraBase />
        <EsqueletoPagina />
      </PageShell>
    );
  }

  switch (estado.datos.estado) {
    case 'SIN_OFICIAL':
      return <SinOficial estado={estado.datos} catalogos={catalogos.datos} />;
    default:
      return null;
  }
}
