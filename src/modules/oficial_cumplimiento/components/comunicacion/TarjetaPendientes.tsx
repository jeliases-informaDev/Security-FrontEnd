'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Etiqueta } from '@/shared/ui/kit';
import { fechaCorta, plural } from '../../lib/formato';
import type { CatalogosOficial, Pendiente } from '../../services/oficialService';
import { Tarjeta } from '../piezas';
import { EtiquetaPlazo, textoDeDiasRestantes } from '../TarjetaPlazo';
import { ModalComunicarPendiente } from './ModalComunicarPendiente';

function FilaPendiente({ pendiente, puedeRegistrar, alRegistrar }: { pendiente: Pendiente; puedeRegistrar: boolean; alRegistrar: () => void }) {
  const plazo = pendiente.plazo;
  return (
    <li className="flex flex-col gap-2.5 rounded-xl border border-line bg-paper px-3.5 py-3">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-56">
          <p className="text-[15px] font-semibold leading-5 text-ink">{pendiente.titulo}</p>
          {pendiente.detalle && <p className="mt-0.5 whitespace-pre-line break-words text-sm text-muted">{pendiente.detalle}</p>}
        </div>
        {plazo && <EtiquetaPlazo plazo={plazo} className="shrink-0" />}
      </div>
      {plazo && (
        <p className="font-mono text-[11px] tracking-[0.02em] text-muted">
          Vence el {fechaCorta(plazo.vence)} · {textoDeDiasRestantes(plazo)}
          {!plazo.cuentaFeriados && ' · plazo estimado: no cuenta feriados'}
        </p>
      )}
      {puedeRegistrar && (
        <button type="button" onClick={alRegistrar} className="btn btn-secondary btn-sm self-start">
          <Send className="h-4 w-4" aria-hidden="true" /> Registrar comunicación<span className="sr-only">: {pendiente.titulo}</span>
        </button>
      )}
    </li>
  );
}

/**
 * Los pendientes con la UIF que todavía no se comunicaron (cambios de datos y remoción). Cada uno tiene su plazo y su botón
 * «Registrar comunicación», que abre la ventana para anotar cuándo se hizo. Si no hay ninguno, no se muestra nada.
 */
export function TarjetaPendientes({ pendientes, catalogos, puedeRegistrar, alGuardar, titulo = 'Pendientes con la UIF', descripcion = 'Lo que falta comunicarle a la UIF-Perú.' }: { pendientes: Pendiente[]; catalogos: CatalogosOficial; puedeRegistrar: boolean; alGuardar: () => void; titulo?: string; descripcion?: string }) {
  const [abierto, setAbierto] = useState<Pendiente | null>(null);
  const sinComunicar = pendientes.filter((p) => !p.comunicado);
  if (sinComunicar.length === 0) return null;

  return (
    <Tarjeta titulo={titulo} descripcion={descripcion} derecha={<Etiqueta tono="warn" className="shrink-0">{plural(sinComunicar.length, 'pendiente', 'pendientes')}</Etiqueta>} centrada className="!gap-3">
      <ul className="flex flex-col gap-2.5">
        {sinComunicar.map((pendiente) => (
          <FilaPendiente key={pendiente.id} pendiente={pendiente} puedeRegistrar={puedeRegistrar} alRegistrar={() => setAbierto(pendiente)} />
        ))}
      </ul>
      {abierto && (
        <ModalComunicarPendiente
          pendiente={abierto}
          catalogos={catalogos}
          onCerrar={() => setAbierto(null)}
          onGuardado={() => {
            setAbierto(null);
            alGuardar();
          }}
        />
      )}
    </Tarjeta>
  );
}
