'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowRight, Gavel, IdCard, Newspaper, Search, ShieldAlert, Users } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { scoringService, type ClienteScoring, type EstadoLista, type TipoPersona } from '../services/scoringService';
import { esBolsaAgotada, mensajeDe } from '@/modules/licencias/lib/errores';
import { Panel } from '@/shared/ui/PageShell';
import { Avatar, Aviso, Boton, EstadoVacio } from '@/shared/ui/kit';
import { StyledSelect } from '@/shared/ui/StyledSelect';
import { fechaConsulta } from '../lib/formato';

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
  if (!estado.revisado || estado.coincidencias == null) return <span className="badge badge-neutral">Sin dato</span>;
  if (estado.coincidencias === 0) return <span className="badge badge-ok">Sin coincidencias</span>;
  if (tipo === 'nota') return <span className="badge badge-neutral">{estado.coincidencias} {estado.coincidencias === 1 ? 'nota' : 'notas'}</span>;
  return <span className="badge badge-bad">{estado.coincidencias} {estado.coincidencias === 1 ? 'coincidencia' : 'coincidencias'}</span>;
}

function FilaConsulta({ icono: Icono, titulo, detalle, estado, tipo = 'alerta' }: { icono: Icono; titulo: string; detalle: string; estado: EstadoLista; tipo?: 'alerta' | 'nota' }) {
  const hay = estado.revisado && (estado.coincidencias ?? 0) > 0 && tipo === 'alerta';
  const ok = estado.revisado && estado.coincidencias === 0 && tipo === 'alerta';
  return (
    <li className="flex items-center gap-4 py-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${hay ? 'bg-bad-soft text-bad' : ok ? 'bg-ok-soft text-ok' : 'bg-surface-2 text-muted'}`} aria-hidden="true">
        <Icono className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{titulo}</p>
        <p className="text-xs text-muted">{detalle}</p>
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
    <Panel className="aparece" relleno>
      <div className="flex flex-wrap items-center gap-4 border-b border-line pb-5">
        <Avatar nombre={cliente.nombre} tamano="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-ink">{cliente.nombre}</p>
          <p className="rotulo mt-0.5">{cliente.tipoDocumento} {cliente.documento} · {persona}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {cliente.condicion && alto && (
            <span className="badge badge-bad"><AlertTriangle className="h-3 w-3" aria-hidden="true" />{cliente.condicion.etiqueta}</span>
          )}
          <span className="badge badge-neutral">{cliente.entidadId != null ? 'Registrado' : 'Cliente nuevo'}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <p className="rotulo">Consulta automática de listas</p>
        {c.fecha && <span className="badge badge-neutral">{fechaConsulta(c.fecha)}</span>}
      </div>
      <ul className="divide-y divide-line">
        <FilaConsulta icono={ShieldAlert} titulo="Personas expuestas políticamente" detalle="En funciones o hasta 5 años después del cargo" estado={c.pep} />
        <FilaConsulta icono={Users} titulo="Parientes y empresas vinculadas a un PEP" detalle="Hasta 2.º grado, cónyuge y empresas con PEP al 25 % o más" estado={c.vinculados} />
        <FilaConsulta icono={Gavel} titulo="Sanciones y listas LA/FT" detalle="ONU, OFAC y listas penales" estado={c.sanciones} />
        <FilaConsulta icono={Newspaper} titulo="Noticias y medios" detalle="Notas periodísticas asociadas al nombre" estado={c.noticias} tipo="nota" />
      </ul>

      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <Boton variante="secundario" onClick={onCambiar}>Cambiar cliente</Boton>
        <Boton onClick={onContinuar}>Continuar a datos<ArrowRight className="h-4 w-4" aria-hidden="true" /></Boton>
      </div>
    </Panel>
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
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="space-y-6">
        {error && <Aviso aviso={{ tipo: 'error', texto: error }} onCerrar={() => setError(null)} />}

        <Panel className="aparece" titulo="1. Elige al cliente" descripcion="Busca por documento. Al encontrarlo, PLAFT consulta las listas negativas por ti." relleno>
          <label htmlFor="sc-doc" className="label sr-only">Documento del cliente</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <IdCard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden="true" />
              <input
                id="sc-doc"
                type="text"
                className="input h-[52px] pl-10 font-mono"
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
          <p className="mt-3 text-sm text-muted">
            ¿No aparece?{' '}
            <button type="button" onClick={abrirRegistro} className="font-semibold text-brand underline-offset-2 hover:underline">Registrar cliente nuevo</button>
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
        </Panel>

        {seleccion && !registrando && (
          <TarjetaCliente cliente={seleccion} onCambiar={() => onSeleccionar(null)} onContinuar={onContinuar} />
        )}
      </div>

      <aside className="space-y-4">
        <Panel className="aparece" titulo="Qué ocurre al elegir al cliente" relleno>
          <ol className="space-y-4">
            {[
              ['Consulta las listas', 'PEP, parientes, sanciones y noticias, sin que tengas que ir a otro módulo.'],
              ['Consigue los datos', 'La condición de PEP y el historial de alertas se cargan de forma automática.'],
              ['Aplica reglas', 'Si hay coincidencia, el nivel mínimo queda fijado antes de calcular el promedio.'],
            ].map(([titulo, texto], i) => (
              <li key={titulo} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-medium text-ink">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-ink">{titulo}</p>
                  <p className="text-xs leading-relaxed text-muted">{texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        {seleccion && reglas.length > 0 && (
          <div role="alert" className="aparece rounded-[20px] border border-bad/10 bg-bad-soft p-5 text-bad">
            <p className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />Esta coincidencia fijará el nivel en Alto</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink">
              {reglas.map((r) => <li key={r.codigo}>{r.titulo}: {r.detalle}</li>)}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
