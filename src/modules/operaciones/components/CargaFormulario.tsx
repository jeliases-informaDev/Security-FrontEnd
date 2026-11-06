'use client';

import { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { esNoEncontrada, operacionesService, type CatalogosOperacion, type DetalleOperacion } from '../services/operacionesService';
import { FormularioOperacion } from './FormularioOperacion';
import { ErrorPagina, EsqueletoPagina } from './piezas';

interface Estado {
  catalogos: CatalogosOperacion;
  detalle?: DetalleOperacion;
}

/** Carga los catálogos (y el registro, al editar) y luego muestra el formulario; con carga y error propios. */
function useCarga(id: number | undefined) {
  const [intento, setIntento] = useState(0);
  const [respuesta, setRespuesta] = useState<{ clave: string; estado: Estado | null; error: string | null } | null>(null);
  const clave = `${id ?? 'nueva'}|${intento}`;

  useEffect(() => {
    let vigente = true;
    const pedida = `${id ?? 'nueva'}|${intento}`;
    Promise.all([operacionesService.catalogos(), id === undefined ? Promise.resolve(undefined) : operacionesService.detalle(id)])
      .then(([catalogos, detalle]) => { if (vigente) setRespuesta({ clave: pedida, estado: { catalogos, detalle }, error: null }); })
      .catch((err: unknown) => {
        if (vigente) setRespuesta({ clave: pedida, estado: null, error: esNoEncontrada(err) ? 'No encontramos ese registro. Puede que no exista o que no sea de tu empresa.' : mensajeDe(err, 'No se pudo cargar el formulario. Inténtalo de nuevo.') });
      });
    return () => { vigente = false; };
  }, [id, intento]);

  const actual = respuesta?.clave === clave ? respuesta : null;
  return { estado: actual?.estado ?? null, error: actual?.error ?? null, reintentar: () => setIntento((n) => n + 1) };
}

function Marco({ titulo, descripcion, children }: { titulo: string; descripcion: string; children: React.ReactNode }) {
  return (
    <PageShell ancho="amplio">
      <PageHeader antetitulo="Registro de operaciones" titulo={titulo} descripcion={descripcion} icono={Receipt} sinLinea />
      {children}
    </PageShell>
  );
}

/** RO 2 · /operaciones/nueva */
export function NuevaOperacion() {
  const { estado, error, reintentar } = useCarga(undefined);
  if (estado) return <FormularioOperacion catalogos={estado.catalogos} />;
  return (
    <Marco titulo="Nueva operación" descripcion="Completa los datos del registro. Los campos obligatorios se validan al guardar.">
      {error ? <ErrorPagina mensaje={error} onReintentar={reintentar} /> : <EsqueletoPagina />}
    </Marco>
  );
}

/** RO 6 · /operaciones/{id}/editar */
export function EditarOperacion({ id }: { id: number }) {
  const { estado, error, reintentar } = useCarga(id);
  if (estado?.detalle) return <FormularioOperacion catalogos={estado.catalogos} detalle={estado.detalle} />;
  return (
    <Marco titulo="Editar registro" descripcion="Cambia solo lo necesario. Cada cambio queda en el historial con tu usuario, la fecha y el motivo.">
      {error ? <ErrorPagina mensaje={error} onReintentar={reintentar} volverHref={`/operaciones/${id}`} volverTexto="Volver al registro" /> : <EsqueletoPagina />}
    </Marco>
  );
}
