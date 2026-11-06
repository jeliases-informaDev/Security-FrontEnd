'use client';

import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoOficial } from '@/shared/ui/iconos';
import { useCatalogosOficial, useEstadoOficial } from '../hooks/useCarga';
import { DesignacionGuardada } from './DesignacionGuardada';
import { FichaVista } from './ficha/FichaVista';
import { OficialResumen } from './OficialResumen';
import { ConFichaDe } from './PantallaCarga';
import { EsqueletoPagina, ErrorPagina } from './piezas';
import { SinOficial } from './SinOficial';

/** Cabecera neutra mientras se sabe en qué estado está la empresa (o si falló la carga). */
function CabeceraBase() {
  return <PageHeader antetitulo="Cumplimiento · UIF-Perú" icono={IconoOficial} titulo="Oficial de cumplimiento" sinLinea />;
}

function PantallaDeError({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <PageShell ancho="amplio">
      <CabeceraBase />
      <ErrorPagina mensaje={mensaje} onReintentar={onReintentar} volverHref="/overview" volverTexto="Ir a la página principal" />
    </PageShell>
  );
}

/**
 * Pantalla raíz del módulo: según el estado que entrega el servidor muestra OC 0 (sin oficial), OC 7 (designación guardada) u OC 9 (ficha,
 * en evaluación y vigente). El cargo vacante usa todavía una pantalla provisional hasta que esté OC 13.
 */
export function OficialCumplimiento() {
  const estado = useEstadoOficial();
  const catalogos = useCatalogosOficial();

  const recargar = () => {
    estado.recargar();
    catalogos.recargar();
  };

  const error = estado.error ?? catalogos.error;
  if (error) return <PantallaDeError mensaje={error} onReintentar={recargar} />;

  if (!estado.datos || !catalogos.datos) {
    return (
      <PageShell ancho="amplio">
        <CabeceraBase />
        <EsqueletoPagina />
      </PageShell>
    );
  }

  const datos = estado.datos;
  switch (datos.estado) {
    case 'SIN_OFICIAL':
      return <SinOficial estado={datos} catalogos={catalogos.datos} />;
    case 'PENDIENTE_COMUNICAR':
      return datos.titular
        ? <DesignacionGuardada estado={datos} titular={datos.titular} />
        : <PantallaDeError mensaje="No llegaron los datos del oficial designado. Inténtalo de nuevo." onReintentar={recargar} />;
    case 'EN_EVALUACION':
    case 'VIGENTE':
      return datos.titular ? (
        <ConFichaDe id={datos.titular.id} titulo="Oficial de cumplimiento" estado={datos} catalogos={catalogos.datos} recargarEstado={recargar}>
          {({ ficha, catalogos: opciones, recargar: alGuardar }) => <FichaVista ficha={ficha} catalogos={opciones} recargar={alGuardar} />}
        </ConFichaDe>
      ) : (
        <PantallaDeError mensaje="No llegaron los datos del oficial designado. Inténtalo de nuevo." onReintentar={recargar} />
      );
    default:
      return <OficialResumen estado={datos} />;
  }
}
