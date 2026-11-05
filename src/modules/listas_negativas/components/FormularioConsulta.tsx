'use client';

import { useState } from 'react';
import type { ComponentType, FormEvent, ReactNode, SVGProps } from 'react';
import { IdCard, Search, User } from 'lucide-react';
import { StyledSelect } from '@/shared/ui/StyledSelect';
import { Boton } from '@/shared/ui/kit';
import type { CatalogoListas, CuerpoConsulta } from '../services/listasNegativasService';
import { Segmentado } from './piezas';

type Icono = ComponentType<SVGProps<SVGSVGElement>>;

// Campos del diseño: 46 px de alto, radio 10, borde suave e icono a la izquierda.
const CAMPO = 'input h-[46px] rounded-[10px] border-line pl-[42px]';

function Campo({ id, etiqueta, icono: Icono, children }: { id: string; etiqueta: string; icono: Icono; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold leading-5 text-ink">{etiqueta}</label>
      <div className="relative">
        <Icono className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

interface Props {
  catalogo: CatalogoListas;
  buscando: boolean;
  /** Error de la última búsqueda (lo que dijo el servidor). */
  error: string | null;
  onBuscar: (cuerpo: CuerpoConsulta) => void;
}

/** Tarjeta «¿A quién consultas?»: tipo de consulta, nombres y apellidos, documento y el botón de búsqueda. */
export function FormularioConsulta({ catalogo, buscando, error, onBuscar }: Props) {
  const [tipoConsulta, setTipoConsulta] = useState(catalogo.tipoConsultaInicial);
  const [tipoDocumento, setTipoDocumento] = useState(catalogo.tipoDocumentoInicial);
  const [nombres, setNombres] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [documento, setDocumento] = useState('');
  const [errorDocumento, setErrorDocumento] = useState<string | null>(null);

  const tipoActual = catalogo.tiposConsulta.find((t) => t.codigo === tipoConsulta);
  const documentosPermitidos = catalogo.tiposDocumento.filter((d) => !tipoActual || tipoActual.tiposDocumento.includes(d.codigo));
  const infoDocumento = catalogo.tiposDocumento.find((d) => d.codigo === tipoDocumento);

  const cambiarTipoConsulta = (codigo: string) => {
    setTipoConsulta(codigo);
    // Si el tipo de documento elegido ya no vale para este tipo de consulta, vuelve al inicial.
    const nuevo = catalogo.tiposConsulta.find((t) => t.codigo === codigo);
    if (nuevo && !nuevo.tiposDocumento.includes(tipoDocumento)) {
      setTipoDocumento(catalogo.tipoDocumentoInicial);
      setDocumento('');
      setErrorDocumento(null);
    }
  };

  const cambiarTipoDocumento = (codigo: string) => {
    setTipoDocumento(codigo);
    setDocumento('');
    setErrorDocumento(null);
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const numero = documento.trim();
    if (numero && infoDocumento && !new RegExp(infoDocumento.patron).test(numero)) {
      setErrorDocumento(infoDocumento.ayuda);
      return;
    }
    setErrorDocumento(null);
    onBuscar({
      tipoConsulta,
      tipoDocumento,
      documento: numero || null,
      nombres: nombres.trim() || null,
      apellidoPaterno: apellidoPaterno.trim() || null,
      apellidoMaterno: apellidoMaterno.trim() || null,
    });
  };

  return (
    <form onSubmit={enviar} noValidate className="card flex flex-col gap-[18px] p-6" aria-label="Consulta de listas negativas">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <h2 className="text-[17px] font-semibold leading-[25.5px] tracking-[-0.01em] text-ink">¿A quién consultas?</h2>
        <Segmentado
          ariaLabel="¿A quién consultas?"
          valor={tipoConsulta}
          onCambiar={cambiarTipoConsulta}
          opciones={catalogo.tiposConsulta.map((t) => ({ valor: t.codigo, etiqueta: t.nombre }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo id="ln-nombres" etiqueta="Nombres / Razón social" icono={Search}>
          <input id="ln-nombres" className={CAMPO} placeholder="Ej. Juan Carlos" autoComplete="off" value={nombres} onChange={(e) => setNombres(e.target.value)} />
        </Campo>
        <Campo id="ln-paterno" etiqueta="Apellido paterno" icono={User}>
          <input id="ln-paterno" className={CAMPO} placeholder="Ej. García" autoComplete="off" value={apellidoPaterno} onChange={(e) => setApellidoPaterno(e.target.value)} />
        </Campo>
        <Campo id="ln-materno" etiqueta="Apellido materno" icono={User}>
          <input id="ln-materno" className={CAMPO} placeholder="Ej. López" autoComplete="off" value={apellidoMaterno} onChange={(e) => setApellidoMaterno(e.target.value)} />
        </Campo>
      </div>

      <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <span className="mb-2 block text-sm font-semibold leading-5 text-ink">Tipo de documento</span>
          <StyledSelect
            value={tipoDocumento}
            onChange={cambiarTipoDocumento}
            icono={IdCard}
            options={documentosPermitidos.map((d) => ({ value: d.codigo, label: d.nombre }))}
          />
        </div>
        <div>
          <Campo id="ln-documento" etiqueta="N.º de documento" icono={IdCard}>
            <input
              id="ln-documento"
              className={`${CAMPO} ${errorDocumento ? 'input-error' : ''}`}
              placeholder="Ej. 10001088"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={errorDocumento ? true : undefined}
              aria-describedby={errorDocumento ? 'ln-documento-error' : undefined}
              value={documento}
              onChange={(e) => { setDocumento(e.target.value); setErrorDocumento(null); }}
            />
          </Campo>
          {errorDocumento && <p id="ln-documento-error" className="error-text">{errorDocumento}</p>}
        </div>
        <div className="sm:pt-[28px]">
          <Boton type="submit" icono={Search} cargando={buscando} className="h-[46px] w-full text-[15px] sm:w-auto">
            {buscando ? 'Buscando…' : 'Realizar búsqueda'}
          </Boton>
        </div>
      </div>

      {error && <p role="alert" className="error-text -mt-1 text-sm">{error}</p>}
    </form>
  );
}
