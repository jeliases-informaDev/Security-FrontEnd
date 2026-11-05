'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import type { ResultadoBusquedaResponse } from '@/modules/listas_negativas/services/listasNegativasService';
import { listasNegativasService } from '@/modules/listas_negativas/services/listasNegativasService';
import { ManchaCard, formatearFecha } from '@/modules/listas_negativas/components/ManchaCard';
import { Modal } from '@/shared/ui/Modal';
import { Avatar, Aviso, Boton } from '@/shared/ui/kit';

function Dato({ label, valor }: { label: string; valor: string | null | undefined }) {
  if (!valor) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-ink">{valor}</dd>
    </div>
  );
}

export function DetalleEntidadModal({ persona, onClose }: { persona: ResultadoBusquedaResponse; onClose: () => void }) {
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);
  const fechaNacimientoRegistro = persona.fechaNacimientoRegistro ? formatearFecha(persona.fechaNacimientoRegistro) : null;
  const tipo = persona.tipoEntidad === 'JURIDICA' ? 'Persona jurídica' : 'Persona natural';

  const descargarPdf = async () => {
    setErrorDescarga(null);
    setDescargando(true);
    try {
      const blob = await listasNegativasService.descargarPdf(persona.entidadId);

      // Crear enlace temporal para disparar la descarga en el navegador
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `listas-negativas-${persona.documento}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // El PDF no gasta tokens: cualquier falla es del reporte.
      setErrorDescarga('Error al generar el reporte en PDF. Inténtalo de nuevo en un momento.');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Modal
      titulo={persona.nombreCompleto}
      subtitulo={`${persona.tipoDocumento ?? 'Documento'}: ${persona.documento}${persona.pais ? ` · ${persona.pais}` : ''}`}
      onCerrar={onClose}
      tamano="md"
      pie={
        <Boton icono={Download} cargando={descargando} onClick={descargarPdf}>
          {descargando ? 'Generando…' : 'Descargar reporte (PDF)'}
        </Boton>
      }
    >
      {errorDescarga && (
        <Aviso
          aviso={{ tipo: 'error', texto: errorDescarga }}
          onCerrar={() => setErrorDescarga(null)}
        />
      )}

      <div className="flex items-center gap-3">
        <Avatar nombre={persona.nombreCompleto} tamano="lg" />
        <div>
          <span className="badge badge-neutral">{tipo}</span>
          <p className="mt-1 text-sm text-muted">
            {persona.manchas.length} registro{persona.manchas.length === 1 ? '' : 's'} en listas
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-line bg-surface-2/60 p-4 sm:grid-cols-3">
        <Dato label="Apellido paterno" valor={persona.apellidoPaterno} />
        <Dato label="Apellido materno" valor={persona.apellidoMaterno} />
        <Dato label="Nombres" valor={persona.nombres} />
        <Dato label="Pasaporte" valor={persona.pasaporte} />
        <Dato label="Alias" valor={persona.alias} />
        <Dato label="Fecha de nacimiento / registro" valor={fechaNacimientoRegistro} />
        <Dato label="Lugar de nacimiento" valor={persona.pais} />
      </dl>

      <div className="space-y-3">
        <p className="eyebrow">Registros encontrados</p>
        {persona.manchas.map((mancha) => <ManchaCard key={mancha.id} mancha={mancha} />)}
      </div>
    </Modal>
  );
}
