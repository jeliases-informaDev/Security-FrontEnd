'use client';

import type { ReactNode } from 'react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoOficial } from '@/shared/ui/iconos';
import { useCatalogosOficial, useEstadoOficial, useFichaOficial } from '../hooks/useCarga';
import type { CatalogosOficial, EstadoOficial, FichaOficial } from '../services/oficialService';
import { EsqueletoPagina, ErrorPagina } from './piezas';

/** Lo que reciben las pantallas que trabajan sobre una designación: el estado de la empresa, las opciones del servidor y la ficha. */
export interface ContextoFicha {
  estado: EstadoOficial;
  catalogos: CatalogosOficial;
  ficha: FichaOficial;
  /** Vuelve a leer el estado y la ficha (después de guardar algo que cambia lo que se ve). */
  recargar: () => void;
}

/** Marco de una pantalla que todavía no tiene datos: la cabecera neutra y, debajo, el esqueleto o el error. */
export function MarcoCarga({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <PageShell ancho="amplio">
      <PageHeader antetitulo="Cumplimiento · UIF-Perú" icono={IconoOficial} titulo={titulo} sinLinea />
      {children}
    </PageShell>
  );
}

/**
 * Pantalla que esta cuenta no puede usar ahora: si solo puede ver, se le explica; si puede escribir, es que el estado del oficial
 * ya no admite la acción (`motivo`). Siempre hay salida de vuelta al módulo.
 */
export function AccesoDenegado({ titulo, puedeEscribir, motivo }: { titulo: string; puedeEscribir: boolean; motivo: string }) {
  return (
    <MarcoCarga titulo={titulo}>
      <ErrorPagina mensaje={puedeEscribir ? motivo : 'Tu cuenta puede ver esta información, pero no cambiarla. Eso lo hace el administrador de tu empresa.'} />
    </MarcoCarga>
  );
}

/** Lee el estado de la empresa y las opciones del módulo; mientras tanto muestra el esqueleto y, si falla, el error con «Reintentar». */
export function ConEstado({ titulo, children }: { titulo: string; children: (estado: EstadoOficial, catalogos: CatalogosOficial, recargar: () => void) => ReactNode }) {
  const estado = useEstadoOficial();
  const catalogos = useCatalogosOficial();
  const recargar = () => {
    estado.recargar();
    catalogos.recargar();
  };

  const error = estado.error ?? catalogos.error;
  if (error) return <MarcoCarga titulo={titulo}><ErrorPagina mensaje={error} onReintentar={recargar} /></MarcoCarga>;
  if (!estado.datos || !catalogos.datos) return <MarcoCarga titulo={titulo}><EsqueletoPagina /></MarcoCarga>;
  return <>{children(estado.datos, catalogos.datos, recargar)}</>;
}

/** Lee la ficha de una designación ya conocida (el estado y las opciones se leyeron antes). */
export function ConFichaDe({ id, titulo, estado, catalogos, recargarEstado, children }: { id: string; titulo: string; estado: EstadoOficial; catalogos: CatalogosOficial; recargarEstado: () => void; children: (contexto: ContextoFicha) => ReactNode }) {
  const ficha = useFichaOficial(id);
  const recargar = () => {
    ficha.recargar();
    recargarEstado();
  };

  if (ficha.error) return <MarcoCarga titulo={titulo}><ErrorPagina mensaje={ficha.error} onReintentar={recargar} /></MarcoCarga>;
  if (!ficha.datos) return <MarcoCarga titulo={titulo}><EsqueletoPagina /></MarcoCarga>;
  return <>{children({ estado, catalogos, ficha: ficha.datos, recargar })}</>;
}

/**
 * Lee el estado, las opciones y la ficha del titular de hoy (o de la designación `designacionId`, si se pide una anterior).
 * Sin oficial designado no hay ficha: se explica y se vuelve a la pantalla raíz del módulo.
 */
export function ConFicha({ titulo, designacionId, children }: { titulo: string; designacionId?: string | null; children: (contexto: ContextoFicha) => ReactNode }) {
  return (
    <ConEstado titulo={titulo}>
      {(estado, catalogos, recargar) => {
        const id = designacionId ?? estado.titular?.id ?? null;
        return id ? (
          <ConFichaDe id={id} titulo={titulo} estado={estado} catalogos={catalogos} recargarEstado={recargar}>{children}</ConFichaDe>
        ) : (
          <MarcoCarga titulo={titulo}>
            <ErrorPagina mensaje="Tu empresa todavía no tiene un oficial de cumplimiento designado." />
          </MarcoCarga>
        );
      }}
    </ConEstado>
  );
}
