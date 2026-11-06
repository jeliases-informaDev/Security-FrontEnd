'use client';

import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoOficial } from '@/shared/ui/iconos';
import { useCatalogosOficial, useEstadoOficial } from '../hooks/useCarga';
import { DesignacionGuardada } from './DesignacionGuardada';
import { FichaVista } from './ficha/FichaVista';
import { ConFichaDe } from './PantallaCarga';
import { EsqueletoPagina, ErrorPagina } from './piezas';
import { SinOficial } from './SinOficial';
import { CargoVacante } from './vacante/CargoVacante';

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
 * Pantalla raíz del módulo: según el estado que entrega el servidor muestra OC 0 (sin oficial), OC 7 (designación guardada), OC 9 (ficha,
 * en evaluación y vigente) u OC 13 (cargo vacante).
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
      // Cargo vacante (el servidor siempre manda `vacancia` con este estado).
      return datos.vacancia
        ? <CargoVacante estado={datos} vacancia={datos.vacancia} catalogos={catalogos.datos} recargar={recargar} />
        : <PantallaDeError mensaje="No llegaron los datos del cargo vacante. Inténtalo de nuevo." onReintentar={recargar} />;
  }
}
