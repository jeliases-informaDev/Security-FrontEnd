'use client';

import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import type { ResultadoBusquedaResponse } from '@/modules/listas_negativas/services/listasNegativasService';
import { ManchaCard, formatearFecha } from '@/modules/listas_negativas/components/ManchaCard';

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function DetalleEntidadModal({
  persona,
  onClose,
}: {
  persona: ResultadoBusquedaResponse;
  onClose: () => void;
}) {
  const { usuario } = useAuth();
  const [descargando, setDescargando] = useState(false);

  const descargarPdf = async () => {
    setDescargando(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const margen = 18;
      let y = 20;

      doc.setFontSize(16);
      doc.setTextColor(18, 37, 61); // brand-navy
      doc.text('Reporte de Listas Negativas', margen, y);

      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(91, 101, 114); // brand-muted
      doc.text(`Usuario: ${usuario?.nombreCompleto ?? usuario?.usuario ?? '—'}`, margen, y);
      y += 5;
      doc.text(`Fecha de generación: ${new Date().toLocaleString('es-PE')}`, margen, y);

      y += 10;
      doc.setDrawColor(203, 211, 220); // brand line
      doc.line(margen, y, 210 - margen, y);

      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(26, 31, 39); // brand-ink
      doc.text(persona.nombreCompleto, margen, y);

      y += 6;
      doc.setFontSize(10);
      doc.setTextColor(91, 101, 114);
      doc.text(
        `${persona.tipoDocumento ?? 'Documento'}: ${persona.documento}${
          persona.pais ? ` · ${persona.pais}` : ''
        } · ${persona.tipoEntidad === 'JURIDICA' ? 'Persona jurídica' : 'Persona natural'}`,
        margen,
        y
      );

      persona.manchas.forEach((mancha) => {
        y += 10;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(18, 37, 61);
        doc.text(`• ${mancha.tipoListaNombre ?? mancha.tipoListaCodigo}`, margen, y);

        y += 5;
        doc.setTextColor(91, 101, 114);
        const fechas = `${formatearFecha(mancha.fechaRegistro)}${
          mancha.fechaHasta ? ` – ${formatearFecha(mancha.fechaHasta)}` : ''
        }`;
        doc.text(fechas, margen + 4, y);

        y += 5;
        doc.setTextColor(26, 31, 39);
        const detalle =
          mancha.cargo || mancha.institucion
            ? [mancha.cargo, mancha.institucion].filter(Boolean).join(' — ')
            : mancha.descripcion ?? '';
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
    <div
      className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-navy text-white text-sm font-semibold flex items-center justify-center shrink-0">
                {iniciales(persona.nombreCompleto) || '·'}
              </div>
              <div>
                <h2 className="text-base font-semibold text-brand-ink">
                  {persona.nombreCompleto}
                </h2>
                <p className="text-xs text-brand-muted">
                  {persona.tipoDocumento ?? 'Documento'}: {persona.documento}
                  {persona.pais ? ` · ${persona.pais}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="text-slate-400 hover:text-slate-600 transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {persona.manchas.map((mancha) => (
              <ManchaCard key={mancha.id} mancha={mancha} />
            ))}
          </div>

          <button
            onClick={descargarPdf}
            disabled={descargando}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-xl hover:bg-brand-navy-2 transition disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {descargando ? 'Generando…' : 'Descargar reporte (PDF)'}
          </button>
        </div>
      </div>
    </div>
  );
}
