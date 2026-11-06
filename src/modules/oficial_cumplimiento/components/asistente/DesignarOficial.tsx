'use client';

import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoOficial } from '@/shared/ui/iconos';
import { useCatalogosOficial, useEstadoOficial } from '../../hooks/useCarga';
import { EsqueletoPagina, ErrorPagina } from '../piezas';
import { Asistente } from './Asistente';

function Cabecera() {
  return <PageHeader antetitulo="Cumplimiento · UIF-Perú" icono={IconoOficial} titulo="Designar oficial de cumplimiento" sinLinea />;
}

/**
 * Entrada del asistente de designación (ruta `/oficial-cumplimiento/designar`): carga el estado y las opciones del servidor y
 * solo abre el asistente si el servidor dice que esta cuenta puede designar ahora.
 */
export function DesignarOficial() {
  const estado = useEstadoOficial();
  const catalogos = useCatalogosOficial();

  const error = estado.error ?? catalogos.error;
  if (error) {
    return (
      <PageShell ancho="amplio">
        <Cabecera />
        <ErrorPagina mensaje={error} onReintentar={() => { estado.recargar(); catalogos.recargar(); }} />
      </PageShell>
    );
  }

  if (!estado.datos || !catalogos.datos) {
    return (
      <PageShell ancho="amplio">
        <Cabecera />
        <EsqueletoPagina />
      </PageShell>
    );
  }

  if (!estado.datos.permisos.puedeDesignar) {
    const sinOficialAun = estado.datos.estado === 'SIN_OFICIAL' || estado.datos.estado === 'VACANTE';
    return (
      <PageShell ancho="amplio">
        <Cabecera />
        <ErrorPagina
          mensaje={sinOficialAun ? 'Tu cuenta puede ver esta información, pero no cambiarla. Eso lo hace el administrador de tu empresa.' : 'Tu empresa ya tiene un oficial de cumplimiento designado.'}
        />
      </PageShell>
    );
  }

  return <Asistente estado={estado.datos} catalogos={catalogos.datos} />;
}
