'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowRight, Gavel, Newspaper, Search, ShieldAlert, Users, Zap } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { scoringService, type ClienteScoring, type EstadoLista, type TipoPersona } from '../services/scoringService';
import { esBolsaAgotada, mensajeDe } from '@/modules/licencias/lib/errores';
import { Aviso, Boton, EstadoVacio } from '@/shared/ui/kit';
import { StyledSelect } from '@/shared/ui/StyledSelect';
import { fechaConsulta } from '../lib/formato';

/** Superficie del paso: tarjeta con relleno de 24 y título en 17 semibold, sin línea bajo el título (como en Figma). */
function Tarjeta({ titulo, descripcion, children, className = '' }: { titulo?: string; descripcion?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card aparece flex flex-col gap-4 p-6 ${className}`}>
      {titulo && <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{titulo}</h2>}
      {descripcion && <p className="text-[15px] text-muted">{descripcion}</p>}
      {children}
    </section>
  );
}

function iniciales(nombre: string): string {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '·';
}

interface Props {
  seleccion: ClienteScoring | null;
  onSeleccionar: (cliente: ClienteScoring | null) => void;
  onContinuar: () => void;
}

type Icono = ComponentType<SVGProps<SVGSVGElement>>;

const OPCIONES_PERSONA = [
  { value: 'NATURAL', label: 'Persona natural' },
  { value: 'JURIDICA', label: 'Persona jurídica' },
];
const OPCIONES_DOCUMENTO = [
  { value: 'DNI', label: 'DNI' },
  { value: 'RUC', label: 'RUC' },
  { value: 'CE', label: 'Carné de extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
];

/** Estado de una fila de la consulta: si no se revisó se dice «Sin dato», nunca «Sin coincidencias». */
function EstadoFila({ estado, tipo }: { estado: EstadoLista; tipo: 'alerta' | 'nota' }) {
  if (!estado.revisado || estado.coincidencias == null) return <span className="badge badge-neutral shrink-0">Sin dato</span>;
  if (estado.coincidencias === 0) return <span className="badge badge-ok shrink-0">Sin coincidencias</span>;
  if (tipo === 'nota') return <span className="badge badge-neutral">{estado.coincidencias} {estado.coincidencias === 1 ? 'nota' : 'notas'}</span>;
  return <span className="badge badge-bad">{estado.coincidencias} {estado.coincidencias === 1 ? 'coincidencia' : 'coincidencias'}</span>;
}

function FilaConsulta({ icono: Icono, titulo, detalle, estado, tipo = 'alerta' }: { icono: Icono; titulo: string; detalle: string; estado: EstadoLista; tipo?: 'alerta' | 'nota' }) {
  const hay = estado.revisado && (estado.coincidencias ?? 0) > 0 && tipo === 'alerta';
  const ok = estado.revisado && estado.coincidencias === 0 && tipo === 'alerta';
  return (
    <li className="flex items-center gap-3.5 py-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${hay ? 'bg-bad-soft text-bad' : ok ? 'bg-ok-soft text-ok' : 'bg-paper text-muted'}`} aria-hidden="true">
        <Icono className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium leading-[22px] text-ink">{titulo}</p>
        <p className="text-[13px] leading-[22px] text-muted">{detalle}</p>
      </div>
      <EstadoFila estado={estado} tipo={tipo} />
    </li>
  );
}

function TarjetaCliente({ cliente, onCambiar, onContinuar }: { cliente: ClienteScoring; onCambiar: () => void; onContinuar: () => void }) {
  const c = cliente.consulta;
  const persona = cliente.tipoPersona === 'JURIDICA' ? 'Persona jurídica' : 'Persona natural';
  const alto = (cliente.condicion?.puntaje ?? 0) >= 4;
  return (
    <Tarjeta>
      <div className="flex flex-wrap items-center gap-4 border-b border-line pb-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent" aria-hidden="true">{iniciales(cliente.nombre)}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold leading-[25px] tracking-[-0.01em] text-ink">{cliente.nombre}</p>
          <p className="rotulo mt-0.5">{cliente.tipoDocumento} {cliente.documento} · {persona}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {cliente.condicion && alto && (
            <span className="badge badge-bad"><AlertTriangle className="h-3 w-3" aria-hidden="true" />{cliente.condicion.etiqueta}</span>
          )}
          <span className="badge badge-neutral">{cliente.entidadId != null ? 'Registrado' : 'Cliente nuevo'}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <p className="eyebrow">Consulta automática de listas</p>
        {c.fecha && <span className="badge badge-neutral"><Zap className="h-3 w-3" aria-hidden="true" />{fechaConsulta(c.fecha)}</span>}
      </div>
      <ul>
        <FilaConsulta icono={ShieldAlert} titulo="Personas expuestas políticamente" detalle="En funciones o hasta 5 años después del cargo" estado={c.pep} />
        <FilaConsulta icono={Users} titulo="Parientes y empresas vinculadas a un PEP" detalle="Hasta 2.º grado, cónyuge y empresas con PEP al 25 % o más" estado={c.vinculados} />
        <FilaConsulta icono={Gavel} titulo="Sanciones y listas LA/FT" detalle="ONU, OFAC y listas penales" estado={c.sanciones} />
        <FilaConsulta icono={Newspaper} titulo="Noticias y medios" detalle="Notas periodísticas asociadas al nombre" estado={c.noticias} tipo="nota" />
      </ul>

      <div className="flex flex-wrap justify-end gap-3">
        <Boton variante="secundario" onClick={onCambiar}>Cambiar cliente</Boton>
        <Boton onClick={onContinuar}>Continuar a datos<ArrowRight className="h-4 w-4" aria-hidden="true" /></Boton>
      </div>
    </Tarjeta>
  );
}

/** Paso 1: buscar al cliente por documento (o registrarlo) y ver la consulta automática de listas. */
export function PasoCliente({ seleccion, onSeleccionar, onContinuar }: Props) {
  const [documento, setDocumento] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState<ClienteScoring | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [nuevo, setNuevo] = useState<{ tipoPersona: TipoPersona; tipoDocumento: string; documento: string; nombre: string }>({ tipoPersona: 'NATURAL', tipoDocumento: 'DNI', documento: '', nombre: '' });

  const buscar = async () => {
    const valor = documento.trim();
    if (!valor) return;
    setBuscando(true);
    setError(null);
    setNoEncontrado(null);
    try {
      const data = await scoringService.buscarCliente(valor);
      if (data.encontrado) {
        setRegistrando(false);
        onSeleccionar(data);
      } else {
        setNoEncontrado(data);
        setNuevo((n) => ({ ...n, documento: valor, tipoDocumento: valor.length === 11 ? 'RUC' : n.tipoDocumento, tipoPersona: valor.length === 11 ? 'JURIDICA' : n.tipoPersona }));
      }
    } catch (err: unknown) {
      setError(esBolsaAgotada(err) ? null : mensajeDe(err, 'No se pudo completar la búsqueda.'));
    } finally {
      setBuscando(false);
    }
  };

  const abrirRegistro = () => {
    setRegistrando(true);
    setNuevo((n) => ({ ...n, documento: n.documento || documento.trim() }));
  };

  const usarNuevo = () => {
    const consulta = noEncontrado?.consulta ?? {
      fecha: null,
      pep: { revisado: false, coincidencias: null },
      vinculados: { revisado: false, coincidencias: null },
      sanciones: { revisado: false, coincidencias: null },
      noticias: { revisado: false, coincidencias: null },
    };
    onSeleccionar({
      encontrado: false,
      entidadId: null,
      tipoPersona: nuevo.tipoPersona,
      tipoDocumento: nuevo.tipoDocumento,
      documento: nuevo.documento.trim(),
      nombre: nuevo.nombre.trim(),
      consulta,
      condicion: noEncontrado?.condicion ?? null,
      reglas: noEncontrado?.reglas ?? [],
    });
    setRegistrando(false);
  };

  const registroValido = nuevo.documento.trim() !== '' && nuevo.nombre.trim() !== '';
  const reglas = seleccion?.reglas ?? [];

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_23.75rem]">
      <div className="space-y-6">
        {error && <Aviso aviso={{ tipo: 'error', texto: error }} onCerrar={() => setError(null)} />}

        <Tarjeta titulo="1. Elige al cliente" descripcion="Busca por documento. Al encontrarlo, PLAFT consulta las listas negativas por ti.">
          <label htmlFor="sc-doc" className="label sr-only">Documento del cliente</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="sc-doc"
                type="text"
                className="input h-[52px] pl-11"
                placeholder="DNI, RUC o pasaporte"
                autoComplete="off"
                spellCheck={false}
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscar()}
              />
            </div>
            <Boton tamano="lg" icono={Search} cargando={buscando} disabled={!documento.trim()} onClick={buscar} className="shrink-0">{buscando ? 'Buscando…' : 'Buscar'}</Boton>
          </div>
          <p className="text-[15px] text-muted">
            ¿No aparece?{' '}
            <button type="button" onClick={abrirRegistro} className="text-sm font-semibold text-accent underline-offset-2 hover:underline">Registrar cliente nuevo</button>
          </p>

          {noEncontrado && !registrando && (
            <EstadoVacio
              className="mt-4 rounded-2xl bg-surface-2/60 py-8"
              icono={Search}
              titulo="Ese documento no está en la base de listas"
              texto="Puedes registrarlo como cliente nuevo: sus datos viajan con la evaluación."
              accion={<Boton variante="secundario" onClick={abrirRegistro}>Registrar cliente nuevo</Boton>}
            />
          )}

          {registrando && (
            <div className="mt-5 rounded-2xl border border-line bg-paper p-4 sm:p-5">
              <p className="mb-4 text-sm font-semibold text-ink">Cliente nuevo</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="label">Tipo de persona</span>
                  <StyledSelect value={nuevo.tipoPersona} options={OPCIONES_PERSONA} onChange={(v) => setNuevo({ ...nuevo, tipoPersona: v as TipoPersona })} />
                </div>
                <div>
                  <span className="label">Tipo de documento</span>
                  <StyledSelect value={nuevo.tipoDocumento} options={OPCIONES_DOCUMENTO} onChange={(v) => setNuevo({ ...nuevo, tipoDocumento: v })} />
                </div>
                <div>
                  <label htmlFor="sc-nuevo-doc" className="label">Número de documento</label>
                  <input id="sc-nuevo-doc" className="input font-mono" autoComplete="off" spellCheck={false} value={nuevo.documento} onChange={(e) => setNuevo({ ...nuevo, documento: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="sc-nuevo-nombre" className="label">{nuevo.tipoPersona === 'JURIDICA' ? 'Razón social' : 'Nombre completo'}</label>
                  <input id="sc-nuevo-nombre" className="input" autoComplete="off" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <Boton variante="fantasma" onClick={() => setRegistrando(false)}>Cancelar</Boton>
                <Boton disabled={!registroValido} onClick={usarNuevo}>Usar este cliente</Boton>
              </div>
            </div>
          )}
        </Tarjeta>

        {seleccion && !registrando && (
          <TarjetaCliente cliente={seleccion} onCambiar={() => onSeleccionar(null)} onContinuar={onContinuar} />
        )}
      </div>

      <aside className="space-y-4">
        <Tarjeta titulo="Qué ocurre al elegir al cliente">
          <ol className="space-y-4">
            {[
              ['Consulta las listas', 'PEP, parientes, sanciones y noticias, sin que tengas que ir a otro módulo.'],
              ['Consigue los datos', 'La condición de PEP y el historial de alertas se cargan de forma automática.'],
              ['Aplica reglas', 'Si hay coincidencia, el nivel mínimo queda fijado antes de calcular el promedio.'],
            ].map(([titulo, texto], i) => (
              <li key={titulo} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{i + 1}</span>
                <div>
                  <p className="text-[15px] font-medium leading-[22px] text-ink">{titulo}</p>
                  <p className="text-[13px] leading-[22px] text-muted">{texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </Tarjeta>

        {seleccion && reglas.length > 0 && (
          <div role="alert" className="aparece flex gap-3 rounded-[18px] bg-bad-soft p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-bad" aria-hidden="true" />
            <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium leading-[22px] text-bad">Esta coincidencia fijará el nivel en Alto</p>
            <ul className="mt-1 space-y-1 text-[13px] leading-[22px] text-ink">
              {reglas.map((r) => <li key={r.codigo}>{r.titulo}: {r.detalle}</li>)}
            </ul>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
