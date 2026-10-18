'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import type { ResultadoBusquedaResponse } from '@/modules/listas_negativas/services/listasNegativasService';
import { ManchaCard, formatearFecha } from '@/modules/listas_negativas/components/ManchaCard';
import { Modal } from '@/shared/ui/Modal';
import { Avatar, Boton } from '@/shared/ui/kit';

// Colores del PDF (los mismos del sistema visual): marca, tinta, texto secundario y línea.
const PDF_MARCA: [number, number, number] = [15, 118, 110];
const PDF_TINTA: [number, number, number] = [16, 24, 40];
const PDF_SECUNDARIO: [number, number, number] = [91, 103, 120];
const PDF_LINEA: [number, number, number] = [226, 231, 239];

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
  const { usuario } = useAuth();
  const [descargando, setDescargando] = useState(false);
  const fechaNacimientoRegistro = persona.fechaNacimientoRegistro ? formatearFecha(persona.fechaNacimientoRegistro) : null;
  const tipo = persona.tipoEntidad === 'JURIDICA' ? 'Persona jurídica' : 'Persona natural';

  const descargarPdf = async () => {
    setDescargando(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const margen = 18;
      let y = 20;

      doc.setFontSize(16);
      doc.setTextColor(...PDF_MARCA);
      doc.text('Reporte de Listas Negativas', margen, y);

      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(...PDF_SECUNDARIO);
      doc.text(`Usuario: ${usuario?.nombreCompleto ?? usuario?.usuario ?? '—'}`, margen, y);
      y += 5;
      doc.text(`Fecha de generación: ${new Date().toLocaleString('es-PE')}`, margen, y);

      y += 10;
      doc.setDrawColor(...PDF_LINEA);
      doc.line(margen, y, 210 - margen, y);

      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(...PDF_TINTA);
      doc.text(persona.nombreCompleto, margen, y);

      y += 6;
      doc.setFontSize(10);
      doc.setTextColor(...PDF_SECUNDARIO);
      doc.text(`${persona.tipoDocumento ?? 'Documento'}: ${persona.documento}${persona.pais ? ` · ${persona.pais}` : ''} · ${tipo}`, margen, y);

      const datosAdicionales = [
        persona.apellidoPaterno && `Apellido paterno: ${persona.apellidoPaterno}`,
        persona.apellidoMaterno && `Apellido materno: ${persona.apellidoMaterno}`,
        persona.nombres && `Nombres: ${persona.nombres}`,
        persona.pasaporte && `Pasaporte: ${persona.pasaporte}`,
        persona.alias && `Alias: ${persona.alias}`,
        fechaNacimientoRegistro && `Fecha de nacimiento/registro: ${fechaNacimientoRegistro}`,
      ].filter(Boolean) as string[];

      datosAdicionales.forEach((linea) => {
        y += 5;
        doc.text(linea, margen, y);
      });

      persona.manchas.forEach((mancha) => {
        y += 10;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(...PDF_MARCA);
        doc.text(`• ${mancha.tipoListaNombre ?? mancha.tipoListaCodigo}`, margen, y);

        y += 5;
        doc.setTextColor(...PDF_SECUNDARIO);
        doc.text(`${formatearFecha(mancha.fechaRegistro)}${mancha.fechaHasta ? ` – ${formatearFecha(mancha.fechaHasta)}` : ''}`, margen + 4, y);

        y += 5;
        doc.setTextColor(...PDF_TINTA);
        const detalle = mancha.cargo || mancha.institucion ? [mancha.cargo, mancha.institucion].filter(Boolean).join(' — ') : mancha.descripcion ?? '';
        const lineas = doc.splitTextToSize(detalle, 210 - margen * 2 - 4);
        doc.text(lineas, margen + 4, y);
        y += (lineas.length - 1) * 5;
      });

      doc.save(`listas-negativas-${persona.documento}.pdf`);
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
