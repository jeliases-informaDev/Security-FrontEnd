'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { isCancel } from 'axios';
import { AlertTriangle, ArrowLeft, ArrowRight, Info, Loader2, Package, Paperclip, User, MapPin } from 'lucide-react';
import {
  scoringService,
  type Bloqueo,
  type CatalogosScoring,
  type ClienteScoring,
  type OpcionCatalogo,
  type VistaPrevia,
} from '../services/scoringService';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { Avatar, Aviso, Boton } from '@/shared/ui/kit';
import { StyledSelect } from '@/shared/ui/StyledSelect';
import { aDatosEvaluacion, montoANumero, puntajeTexto, tonoPuntaje, type FormDatos } from '../lib/formato';

interface Props {
  catalogos: CatalogosScoring;
  cliente: ClienteScoring;
  form: FormDatos;
  onCambiar: (parche: Partial<FormDatos>) => void;
  onVolver: () => void;
  onCambiarCliente: () => void;
  onCalcular: () => void;
  calculando: boolean;
}

const ESPERA_MS = 450;

function opciones(lista: OpcionCatalogo[]) {
  return lista.map((o) => ({ value: String(o.id), label: o.puntaje == null ? `${o.nombre} · sin puntaje` : o.nombre }));
}

function Bloque({ icono: Icono, titulo, children }: { icono: typeof User; titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h3 className="mb-4 flex items-center gap-3 text-base font-semibold text-ink">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-ink" aria-hidden="true"><Icono className="h-4 w-4" /></span>
        {titulo}
      </h3>
      {children}
    </section>
  );
}

/** Mensaje bajo un campo: el bloqueo del servidor o, si la opción no tiene puntaje, el aviso de que no lo tiene. */
function Ayuda({ bloqueo, sinPuntaje, extra }: { bloqueo?: Bloqueo; sinPuntaje?: boolean; extra?: string | null }) {
  if (bloqueo) return <p className="error-text flex items-start gap-1.5" role="alert"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{bloqueo.mensaje}</p>;
  if (sinPuntaje) return <p className="error-text">Esta opción no tiene puntaje en la metodología: no se puede calcular con ella.</p>;
  if (extra) return <p className="hint">{extra}</p>;
  return null;
}

/** Paso 2: los tres bloques de datos y, a la derecha, la vista previa del cálculo que pide el servidor. */
export function PasoDatos({ catalogos, cliente, form, onCambiar, onVolver, onCambiarCliente, onCalcular, calculando }: Props) {
  // La respuesta guarda los datos a los que corresponde: si ya no son los actuales, se está recalculando.
  const [respuesta, setRespuesta] = useState<{ para: unknown; previa: VistaPrevia | null; error: string | null } | null>(null);
  const [tocados, setTocados] = useState<Set<string>>(new Set());
  const [subiendo, setSubiendo] = useState(false);
  const [errorSustento, setErrorSustento] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement>(null);

  // La vista previa se pide con una pequeña espera, para no llamar en cada tecla; la respuesta vieja se descarta.
  const cuerpo = useMemo(() => aDatosEvaluacion(form, cliente), [form, cliente]);
  useEffect(() => {
    const control = new AbortController();
    const espera = setTimeout(() => {
      scoringService
        .vistaPrevia(cuerpo, control.signal)
        .then((data) => setRespuesta({ para: cuerpo, previa: data, error: null }))
        .catch((err: unknown) => {
          if (isCancel(err)) return;
          setRespuesta({ para: cuerpo, previa: null, error: mensajeDe(err, 'No se pudo calcular la vista previa.') });
        });
    }, ESPERA_MS);
    return () => { clearTimeout(espera); control.abort(); };
  }, [cuerpo]);
  const calculandoPrevia = respuesta?.para !== cuerpo;
  const previa = respuesta?.previa ?? null;
  const errorPrevia = calculandoPrevia ? null : respuesta?.error ?? null;

  const bloqueos = previa?.bloqueos ?? [];
  const bloqueoDe = (campo: string, tieneValor: boolean): Bloqueo | undefined => {
    const b = bloqueos.find((x) => x.campo === campo);
    return b && (tieneValor || tocados.has(campo)) ? b : undefined;
  };
  const cambiar = (campo: string, parche: Partial<FormDatos>) => {
    setTocados((t) => new Set(t).add(campo));
    onCambiar(parche);
  };
  const sinPuntaje = (lista: OpcionCatalogo[], id: string) => id !== '' && lista.find((o) => String(o.id) === id)?.puntaje === null;

  const medioPago = catalogos.mediosPago.find((m) => String(m.id) === form.medioPagoId);
  const paisElegido = catalogos.paises.find((p) => String(p.id) === form.paisFondosId);
  const montoInvalido = form.monto.trim() !== '' && montoANumero(form.monto) === null;
  const puedeCalcular = !calculandoPrevia && !errorPrevia && !!previa && bloqueos.length === 0 && previa.puntaje != null && !montoInvalido;

  const subir = async (file: File | undefined) => {
    if (!file) return;
    setSubiendo(true);
    setErrorSustento(null);
    try {
      const id = await scoringService.subirSustento(file);
      onCambiar({ sustentoId: id, sustentoNombre: file.name });
    } catch (err: unknown) {
      setErrorSustento(mensajeDe(err, 'No se pudo subir el archivo.'));
    } finally {
      setSubiendo(false);
      if (archivo.current) archivo.current.value = '';
    }
  };

  const grupos: [string, number | null | undefined][] = [
    ['Clientes', previa?.grupos.clientes],
    ['Productos y servicios', previa?.grupos.productos],
    ['Zona geográfica', previa?.grupos.zona],
  ];

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <section className="card aparece p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-line pb-5">
          <Avatar nombre={cliente.nombre} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{cliente.nombre}</p>
            <p className="rotulo">{cliente.tipoDocumento} {cliente.documento}</p>
          </div>
          {cliente.condicion && cliente.condicion.puntaje >= 4 && <span className="badge badge-bad"><AlertTriangle className="h-3 w-3" aria-hidden="true" />{cliente.condicion.etiqueta}</span>}
          <Boton variante="secundario" onClick={onCambiarCliente}>Cambiar cliente</Boton>
        </div>

        <div className="space-y-7">
          <Bloque icono={User} titulo="Cliente">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="label">Ocupación o actividad económica</span>
                <StyledSelect value={form.ocupacionId} options={opciones(catalogos.ocupaciones)} placeholder="Selecciona la ocupación" error={!!bloqueoDe('ocupacionId', form.ocupacionId !== '')} onChange={(v) => cambiar('ocupacionId', { ocupacionId: v })} />
                <Ayuda bloqueo={bloqueoDe('ocupacionId', form.ocupacionId !== '')} sinPuntaje={sinPuntaje(catalogos.ocupaciones, form.ocupacionId)} />
              </div>
              <div>
                <label htmlFor="sc-monto" className="label flex items-center gap-1.5">
                  Monto de la operación (S/)
                  <span className="group relative inline-flex">
                    <button type="button" aria-label="Cómo se toma el monto" className="rounded-full text-muted hover:text-ink focus-visible:text-ink"><Info className="h-3.5 w-3.5" aria-hidden="true" /></button>
                    <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-64 -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-xs font-normal leading-relaxed text-paper shadow-lg group-focus-within:block group-hover:block">
                      Se toma el mayor entre el monto de esta operación y el promedio mensual de los últimos 12 meses del cliente en el Registro de Operaciones.
                    </span>
                  </span>
                </label>
                <input
                  id="sc-monto"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  className={`input h-11 tabular-nums ${bloqueoDe('montoOperacion', form.monto !== '') || montoInvalido ? 'input-error' : ''}`}
                  placeholder="0"
                  value={form.monto}
                  onChange={(e) => cambiar('montoOperacion', { monto: e.target.value })}
                />
                {montoInvalido ? <p className="error-text">Escribe solo números, por ejemplo 150000.</p> : <Ayuda bloqueo={bloqueoDe('montoOperacion', form.monto !== '')} extra={previa?.montoNota} />}
              </div>
              <div className="sm:col-span-2">
                <span className="label">Sustento del origen de fondos</span>
                <input ref={archivo} type="file" accept="application/pdf,image/*" className="sr-only" id="sc-sustento" disabled={!catalogos.sustentoDisponible || subiendo} onChange={(e) => subir(e.target.files?.[0])} />
                <label
                  htmlFor="sc-sustento"
                  className={`flex h-[52px] max-w-xl items-center gap-3 rounded-xl border border-line-strong bg-surface px-4 text-sm ${catalogos.sustentoDisponible ? 'cursor-pointer hover:border-ink/30' : 'cursor-not-allowed bg-surface-2 text-faint'}`}
                >
                  {subiendo ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  <span className="min-w-0 flex-1 truncate">{form.sustentoNombre ?? 'Adjuntar PDF o imagen'}</span>
                  <span className="badge badge-neutral">{catalogos.sustentoDisponible ? 'Solo en efectivo' : 'Pronto'}</span>
                </label>
                {errorSustento && <p className="error-text">{errorSustento}</p>}
                <p className="hint">
                  {catalogos.sustentoDisponible
                    ? medioPago?.pideOrigenFondos ? 'Con este medio de pago conviene adjuntar el sustento del origen de los fondos.' : 'Se pide solo si el pago es en efectivo.'
                    : 'Adjuntar el sustento estará disponible pronto. Por ahora no impide calcular.'}
                </p>
              </div>
            </div>
          </Bloque>

          <Bloque icono={Package} titulo="Productos y servicios">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <span className="label">Producto o servicio</span>
                <StyledSelect value={form.productoId} options={opciones(catalogos.productos)} placeholder="Selecciona" error={!!bloqueoDe('productoId', form.productoId !== '')} onChange={(v) => cambiar('productoId', { productoId: v })} />
                <Ayuda bloqueo={bloqueoDe('productoId', form.productoId !== '')} sinPuntaje={sinPuntaje(catalogos.productos, form.productoId)} />
              </div>
              <div>
                <span className="label">Canal</span>
                <StyledSelect value={form.canalId} options={opciones(catalogos.canales)} placeholder="Selecciona" error={!!bloqueoDe('canalId', form.canalId !== '')} onChange={(v) => cambiar('canalId', { canalId: v })} />
                <Ayuda bloqueo={bloqueoDe('canalId', form.canalId !== '')} sinPuntaje={sinPuntaje(catalogos.canales, form.canalId)} />
              </div>
              <div>
                <span className="label">Medio de pago</span>
                <StyledSelect value={form.medioPagoId} options={opciones(catalogos.mediosPago)} placeholder="Selecciona" error={!!bloqueoDe('medioPagoId', form.medioPagoId !== '')} onChange={(v) => cambiar('medioPagoId', { medioPagoId: v })} />
                <Ayuda bloqueo={bloqueoDe('medioPagoId', form.medioPagoId !== '')} sinPuntaje={sinPuntaje(catalogos.mediosPago, form.medioPagoId)} />
              </div>
            </div>
          </Bloque>

          <Bloque icono={MapPin} titulo="Zona geográfica">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <span className="label">Departamento de residencia</span>
                <StyledSelect value={form.departamentoResidenciaId} options={opciones(catalogos.departamentos)} placeholder="Selecciona" error={!!bloqueoDe('departamentoResidenciaId', form.departamentoResidenciaId !== '')} onChange={(v) => cambiar('departamentoResidenciaId', { departamentoResidenciaId: v })} />
                <Ayuda bloqueo={bloqueoDe('departamentoResidenciaId', form.departamentoResidenciaId !== '')} sinPuntaje={sinPuntaje(catalogos.departamentos, form.departamentoResidenciaId)} />
              </div>
              <div>
                <span className="label">Departamento de operación</span>
                <StyledSelect value={form.departamentoOperacionId} options={opciones(catalogos.departamentos)} placeholder="Selecciona" error={!!bloqueoDe('departamentoOperacionId', form.departamentoOperacionId !== '')} onChange={(v) => cambiar('departamentoOperacionId', { departamentoOperacionId: v })} />
                <Ayuda bloqueo={bloqueoDe('departamentoOperacionId', form.departamentoOperacionId !== '')} sinPuntaje={sinPuntaje(catalogos.departamentos, form.departamentoOperacionId)} extra="Si es distinto, se usa el más alto." />
              </div>
              <div>
                <span className="label">País de origen o destino de fondos</span>
                <StyledSelect value={form.paisFondosId} options={catalogos.paises.map((p) => ({ value: String(p.id), label: p.nombre }))} placeholder="Selecciona" error={!!bloqueoDe('paisFondosId', form.paisFondosId !== '')} onChange={(v) => cambiar('paisFondosId', { paisFondosId: v })} />
                <Ayuda bloqueo={bloqueoDe('paisFondosId', form.paisFondosId !== '')} extra={paisElegido?.altoRiesgoGafi ? 'País de la lista de alto riesgo del GAFI: fija el nivel en Alto.' : null} />
              </div>
            </div>
          </Bloque>
        </div>

        {errorPrevia && <Aviso className="mt-6" aviso={{ tipo: 'error', texto: errorPrevia }} />}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Boton variante="secundario" icono={ArrowLeft} onClick={onVolver}>Volver</Boton>
          <div className="flex flex-wrap items-center gap-3">
            {!puedeCalcular && !calculandoPrevia && !errorPrevia && bloqueos.length > 0 && (
              <p className="text-xs text-muted" aria-live="polite">Completa o corrige los campos marcados para calcular.</p>
            )}
            <Boton tamano="lg" cargando={calculando} disabled={!puedeCalcular} onClick={onCalcular}>
              {calculando ? 'Calculando…' : 'Calcular scoring'}
              {!calculando && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </Boton>
          </div>
        </div>
      </section>

      <aside className="card aparece p-5 sm:p-6 xl:sticky xl:top-4" aria-live="polite">
        <h2 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
          Vista previa del cálculo
          {calculandoPrevia && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-label="Calculando" />}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">Promedio de los tres grupos. El detalle de los ocho factores aparece en el resultado.</p>
        <ul className="mt-4 space-y-3">
          {grupos.map(([nombre, valor]) => (
            <li key={nombre} className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink">{nombre}</span>
              <span className={`rounded-full px-3.5 py-1 text-sm font-medium tabular-nums ${tonoPuntaje(valor ?? null)}`}>{puntajeTexto(valor)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-sm text-ink">Puntaje provisional</p>
            <p className="rotulo">Escala de 1 a 4</p>
          </div>
          <p className="text-4xl font-semibold tabular-nums tracking-tight text-ink">{puntajeTexto(previa?.puntaje)}</p>
        </div>
        {previa?.formula && <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted">{previa.formula}</p>}
        {!previa?.puntaje && !calculandoPrevia && !errorPrevia && <p className="mt-3 text-xs text-muted">El puntaje aparece cuando están todos los datos.</p>}
      </aside>
    </div>
  );
}
