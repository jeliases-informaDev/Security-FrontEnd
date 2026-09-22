'use client';

import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import {
  listasNegativasService,
  HistorialConsultaResponse,
} from '@/modules/listas_negativas/services/listasNegativasService';

const TIPO_LISTA_STYLES: Record<string, string> = {
  PEP: 'text-blue-700',
  ACTOS_ILICITOS: 'text-red-700',
  NOTICIAS: 'text-amber-700',
  INTERNACIONAL: 'text-purple-700',
};

function formatearFechaHora(fecha: string): string {
  return new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface HistorialBusquedasProps {
  onVerDetalle: (entidadId: number) => void;
  recargarClave: number;
}

export function HistorialBusquedas({ onVerDetalle, recargarClave }: HistorialBusquedasProps) {
  const [items, setItems] = useState<HistorialConsultaResponse[]>([]);
  const [pagina, setPagina] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarMas = async () => {
    setCargando(true);
    try {
      const data = await listasNegativasService.obtenerHistorial(pagina + 1);
      setItems((prev) => [...prev, ...data.content]);
      setHayMas(!data.last);
      setPagina(pagina + 1);
    } catch {
      // Sin historial disponible o backend no accesible: no bloquea el resto de la pantalla
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let cancelado = false;
    // Patron de fetch-en-mount documentado por React (react.dev/learn/synchronizing-with-effects);
    // "cargando" ya arranca en true, esto solo lo restaura al recargar via recargarClave.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true);

    listasNegativasService
      .obtenerHistorial(0)
      .then((data) => {
        if (cancelado) return;
        setItems(data.content);
        setHayMas(!data.last);
        setPagina(0);
      })
      .catch(() => {
        // Sin historial disponible o backend no accesible: no bloquea el resto de la pantalla
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [recargarClave]);

  if (!cargando && items.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-brand-muted" />
        <h2 className="text-sm font-semibold text-brand-ink">Mis búsquedas recientes</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 divide-y divide-slate-100">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onVerDetalle(item.resultado.entidadId)}
            className="w-full flex items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-slate-50 transition"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-brand-ink truncate">
                {item.resultado.nombreCompleto}
              </p>
              <p className="text-xs text-brand-muted">
                {item.resultado.tipoDocumento ?? 'Doc.'}: {item.resultado.documento}
              </p>
            </div>
            <div className="text-right shrink-0">
              {item.resultado.manchas[0] && (
                <p
                  className={`text-xs font-medium ${
                    TIPO_LISTA_STYLES[item.resultado.manchas[0].tipoListaCodigo ?? ''] ??
                    'text-slate-600'
                  }`}
                >
                  {item.resultado.manchas[0].tipoListaNombre}
                  {item.resultado.manchas.length > 1 ? ` +${item.resultado.manchas.length - 1}` : ''}
                </p>
              )}
              <p className="text-xs text-brand-muted mt-0.5">
                {formatearFechaHora(item.fechaConsulta)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {hayMas && (
        <div className="text-center mt-4">
          <button
            onClick={cargarMas}
            disabled={cargando}
            className="px-5 py-2 text-sm font-medium text-brand-navy hover:underline disabled:opacity-60"
          >
            {cargando ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}
    </section>
  );
}
