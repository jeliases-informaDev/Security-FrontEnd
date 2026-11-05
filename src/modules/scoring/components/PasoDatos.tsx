'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { isCancel } from 'axios';
import { AlertTriangle, ArrowLeft, ArrowRight, Briefcase, CreditCard, Globe, Info, Loader2, MapPin, Package, Paperclip, User, Wallet } from 'lucide-react';
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

type Icono = ComponentType<SVGProps<SVGSVGElement>>;

const ESPERA_MS = 450;

// A qué grupo del cálculo pertenece cada campo (para decir en la vista previa en cuál falta un dato).
const GRUPO_DE_CAMPO: Record<string, 'CLIENTES' | 'PRODUCTOS' | 'ZONA'> = {
  ocupacionId: 'CLIENTES',
  montoOperacion: 'CLIENTES',
  productoId: 'PRODUCTOS',
  canalId: 'PRODUCTOS',
  medioPagoId: 'PRODUCTOS',
  departamentoResidenciaId: 'ZONA',
  departamentoOperacionId: 'ZONA',
  paisFondosId: 'ZONA',
};

const ETIQUETA = 'mb-2 block text-sm font-semibold leading-5 text-ink';

function opciones(lista: OpcionCatalogo[]) {
  return lista.map((o) => ({ value: String(o.id), label: o.puntaje == null ? `${o.nombre} · sin puntaje` : o.nombre }));
}

function Bloque({ icono: Icono, titulo, peso, children }: { icono: Icono; titulo: string; peso?: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent" aria-hidden="true"><Icono className="h-4 w-4" /></span>
        <h3 className="flex-1 text-[17px] font-semibold tracking-[-0.01em] text-ink">{titulo}</h3>
        {peso != null && <span className="badge badge-neutral">{peso} % del puntaje</span>}
      </div>
      {children}
    </section>
  );
}

/** Mensaje bajo un campo: el bloqueo del servidor o, si la opción no tiene puntaje, el aviso de que no lo tiene. */
function Ayuda({ bloqueo, sinPuntaje, extra }: { bloqueo?: Bloqueo; sinPuntaje?: boolean; extra?: string | null }) {
  if (bloqueo) return <p className="mt-2 text-[13px] leading-[22px] text-bad" role="alert">{bloqueo.mensaje}</p>;
  if (sinPuntaje) return <p className="mt-2 text-[13px] leading-[22px] text-bad">Esta opción no tiene puntaje en la metodología: no se calcula ni se asume uno. Elige otra o consulta al oficial de cumplimiento.</p>;
  if (extra) return <p className="mt-2 text-[13px] leading-[22px] text-muted">{extra}</p>;
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
  const pesoDe = (codigo: string) => catalogos.grupos.find((g) => g.codigo === codigo)?.peso;
  const montoInvalido = form.monto.trim() !== '' && montoANumero(form.monto) === null;
  const puedeCalcular = !calculandoPrevia && !errorPrevia && !!previa && bloqueos.length === 0 && previa.puntaje != null && !montoInvalido;
  const faltan = (codigo: string) => bloqueos.filter((b) => GRUPO_DE_CAMPO[b.campo] === codigo).length;
  const escala = catalogos.bandas.length > 0 ? `${catalogos.bandas[0].desde} a ${catalogos.bandas[catalogos.bandas.length - 1].hasta}` : null;

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

  const grupos: { codigo: string; nombre: string; valor: number | null | undefined }[] = [
    { codigo: 'CLIENTES', nombre: 'Clientes', valor: previa?.grupos.clientes },
    { codigo: 'PRODUCTOS', nombre: 'Productos y servicios', valor: previa?.grupos.productos },
    { codigo: 'ZONA', nombre: 'Zona geográfica', valor: previa?.grupos.zona },
  ].map((g) => ({ ...g, nombre: catalogos.grupos.find((x) => x.codigo === g.codigo)?.nombre ?? g.nombre }));

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22.5rem]">
      <section className="card aparece flex flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center gap-3.5 rounded-[14px] bg-paper p-3.5">
          <Avatar nombre={cliente.nombre} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium leading-[22px] text-ink">{cliente.nombre}</p>
            <p className="rotulo">{cliente.tipoDocumento} {cliente.documento}</p>
          </div>
          {cliente.condicion && cliente.condicion.puntaje >= 4 && <span className="badge badge-bad"><AlertTriangle className="h-3 w-3" aria-hidden="true" />{cliente.condicion.etiqueta}</span>}
          <Boton variante="secundario" onClick={onCambiarCliente}>Cambiar cliente</Boton>
        </div>

        <Bloque icono={User} titulo="Cliente" peso={pesoDe('CLIENTES')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={ETIQUETA}>Ocupación o actividad económica</span>
              <StyledSelect icono={Briefcase} value={form.ocupacionId} options={opciones(catalogos.ocupaciones)} placeholder="Selecciona la ocupación" error={!!bloqueoDe('ocupacionId', form.ocupacionId !== '') || sinPuntaje(catalogos.ocupaciones, form.ocupacionId)} onChange={(v) => cambiar('ocupacionId', { ocupacionId: v })} />
              <Ayuda bloqueo={bloqueoDe('ocupacionId', form.ocupacionId !== '')} sinPuntaje={sinPuntaje(catalogos.ocupaciones, form.ocupacionId)} />
            </div>
            <div>
              <label htmlFor="sc-monto" className={`${ETIQUETA} flex items-center gap-1.5`}>
                Monto de la operación (S/)
                <span className="group relative inline-flex">
                  <button type="button" aria-label="Cómo se toma el monto" className="rounded-full text-muted hover:text-ink focus-visible:text-ink"><Info className="h-4 w-4" aria-hidden="true" /></button>
                  <span role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-72 -translate-x-3.5 flex-col gap-1 rounded-[10px] bg-ink px-3.5 py-3 text-paper shadow-lg group-focus-within:flex group-hover:flex">
                    <span className="text-sm font-semibold leading-5">Monto de la operación</span>
                    <span className="text-[13px] font-normal leading-[22px]">Cuánto dinero, en soles, se va a pagar o mover en esta operación. PLAFT lo suma al volumen real que ya tiene registrado de este cliente y lo compara con los cortes de monto y frecuencia.</span>
                  </span>
                </span>
              </label>
              <div className="relative">
                <Wallet className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  id="sc-monto"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  className={`input pl-11 tabular-nums ${bloqueoDe('montoOperacion', form.monto !== '') || montoInvalido ? 'input-error' : ''}`}
                  placeholder="0"
                  value={form.monto}
                  onChange={(e) => cambiar('montoOperacion', { monto: e.target.value })}
                />
              </div>
              {montoInvalido ? <p className="mt-2 text-[13px] leading-[22px] text-bad">Escribe solo números, por ejemplo 150000.</p> : <Ayuda bloqueo={bloqueoDe('montoOperacion', form.monto !== '')} extra={previa?.montoNota} />}
            </div>
            <div className="sm:col-span-2">
              <span className={ETIQUETA}>Sustento del origen de fondos</span>
              <input ref={archivo} type="file" accept="application/pdf,image/*" className="sr-only" id="sc-sustento" disabled={!catalogos.sustentoDisponible || subiendo} onChange={(e) => subir(e.target.files?.[0])} />
              <label
                htmlFor="sc-sustento"
                className={`flex max-w-[455px] items-center gap-2.5 rounded-xl border border-line bg-paper px-3.5 py-3 text-[15px] ${catalogos.sustentoDisponible ? 'cursor-pointer hover:border-line-strong' : 'cursor-not-allowed'}`}
              >
                {subiendo ? <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin" aria-hidden="true" /> : <Paperclip className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden="true" />}
                <span className={`min-w-0 flex-1 truncate ${form.sustentoNombre ? 'text-ink' : 'text-muted'}`}>{form.sustentoNombre ?? 'Adjuntar PDF o imagen'}</span>
                <span className="badge badge-neutral">{catalogos.sustentoDisponible ? 'Solo en efectivo' : 'Pronto'}</span>
              </label>
              {errorSustento && <p className="mt-2 text-[13px] leading-[22px] text-bad">{errorSustento}</p>}
              <p className="mt-2 max-w-[455px] text-[13px] leading-[22px] text-muted">
                {catalogos.sustentoDisponible
                  ? medioPago?.pideOrigenFondos ? 'Con este medio de pago conviene adjuntar el sustento del origen de los fondos.' : 'Se exige solo si el pago es en efectivo y llega al umbral de registro de operaciones.'
                  : 'Adjuntar el sustento estará disponible pronto. Por ahora no impide calcular.'}
              </p>
            </div>
          </div>
        </Bloque>

        <Bloque icono={Package} titulo="Productos y servicios" peso={pesoDe('PRODUCTOS')}>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <span className={ETIQUETA}>Producto o servicio</span>
              <StyledSelect icono={Package} value={form.productoId} options={opciones(catalogos.productos)} placeholder="Selecciona" error={!!bloqueoDe('productoId', form.productoId !== '') || sinPuntaje(catalogos.productos, form.productoId)} onChange={(v) => cambiar('productoId', { productoId: v })} />
              <Ayuda bloqueo={bloqueoDe('productoId', form.productoId !== '')} sinPuntaje={sinPuntaje(catalogos.productos, form.productoId)} />
            </div>
            <div>
              <span className={ETIQUETA}>Canal</span>
              <StyledSelect icono={User} value={form.canalId} options={opciones(catalogos.canales)} placeholder="Selecciona" error={!!bloqueoDe('canalId', form.canalId !== '') || sinPuntaje(catalogos.canales, form.canalId)} onChange={(v) => cambiar('canalId', { canalId: v })} />
              <Ayuda bloqueo={bloqueoDe('canalId', form.canalId !== '')} sinPuntaje={sinPuntaje(catalogos.canales, form.canalId)} />
            </div>
            <div>
              <span className={ETIQUETA}>Medio de pago</span>
              <StyledSelect icono={CreditCard} value={form.medioPagoId} options={opciones(catalogos.mediosPago)} placeholder="Selecciona" error={!!bloqueoDe('medioPagoId', form.medioPagoId !== '') || sinPuntaje(catalogos.mediosPago, form.medioPagoId)} onChange={(v) => cambiar('medioPagoId', { medioPagoId: v })} />
              <Ayuda bloqueo={bloqueoDe('medioPagoId', form.medioPagoId !== '')} sinPuntaje={sinPuntaje(catalogos.mediosPago, form.medioPagoId)} />
            </div>
          </div>
        </Bloque>

        <Bloque icono={MapPin} titulo="Zona geográfica" peso={pesoDe('ZONA')}>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <span className={ETIQUETA}>Departamento de residencia</span>
              <StyledSelect icono={MapPin} value={form.departamentoResidenciaId} options={opciones(catalogos.departamentos)} placeholder="Selecciona" error={!!bloqueoDe('departamentoResidenciaId', form.departamentoResidenciaId !== '') || sinPuntaje(catalogos.departamentos, form.departamentoResidenciaId)} onChange={(v) => cambiar('departamentoResidenciaId', { departamentoResidenciaId: v })} />
              <Ayuda bloqueo={bloqueoDe('departamentoResidenciaId', form.departamentoResidenciaId !== '')} sinPuntaje={sinPuntaje(catalogos.departamentos, form.departamentoResidenciaId)} />
            </div>
            <div>
              <span className={ETIQUETA}>Departamento de operación</span>
              <StyledSelect icono={MapPin} value={form.departamentoOperacionId} options={opciones(catalogos.departamentos)} placeholder="Selecciona" error={!!bloqueoDe('departamentoOperacionId', form.departamentoOperacionId !== '') || sinPuntaje(catalogos.departamentos, form.departamentoOperacionId)} onChange={(v) => cambiar('departamentoOperacionId', { departamentoOperacionId: v })} />
              <Ayuda bloqueo={bloqueoDe('departamentoOperacionId', form.departamentoOperacionId !== '')} sinPuntaje={sinPuntaje(catalogos.departamentos, form.departamentoOperacionId)} extra="Si es distinto, se usa el más alto." />
            </div>
            <div>
              <span className={ETIQUETA}>País de origen o destino de fondos</span>
              <StyledSelect icono={Globe} value={form.paisFondosId} options={catalogos.paises.map((p) => ({ value: String(p.id), label: p.nombre }))} placeholder="Selecciona" error={!!bloqueoDe('paisFondosId', form.paisFondosId !== '')} onChange={(v) => cambiar('paisFondosId', { paisFondosId: v })} />
              <Ayuda bloqueo={bloqueoDe('paisFondosId', form.paisFondosId !== '')} extra={paisElegido?.altoRiesgoGafi ? 'País de la lista de alto riesgo del GAFI: fija el nivel en Alto.' : null} />
            </div>
          </div>
        </Bloque>

        {errorPrevia && <Aviso aviso={{ tipo: 'error', texto: errorPrevia }} />}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Boton variante="secundario" icono={ArrowLeft} onClick={onVolver}>Volver</Boton>
          <Boton cargando={calculando} disabled={!puedeCalcular} onClick={onCalcular} className="disabled:!opacity-35">
            {calculando ? 'Calculando…' : 'Calcular scoring'}
            {!calculando && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Boton>
        </div>
      </section>

      <aside className="card aparece flex flex-col gap-3.5 p-6 xl:sticky xl:top-4" aria-live="polite">
        <h2 className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.01em] text-ink">
          Vista previa del cálculo
          {calculandoPrevia && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-label="Calculando" />}
        </h2>
        <p className="text-[13px] leading-[22px] text-muted">Promedio de los tres grupos del art. 27. El detalle de los ocho factores aparece en el resultado.</p>
        {grupos.map((g) => {
          const falta = faltan(g.codigo);
          const peso = pesoDe(g.codigo);
          return (
            <div key={g.codigo} className="flex items-center gap-2.5 rounded-[14px] bg-paper p-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium leading-[22px] text-ink">{g.nombre}</p>
                <p className={`rotulo ${falta > 0 && !calculandoPrevia ? '!text-bad' : ''}`}>
                  {falta > 0 && !calculandoPrevia ? `Falta ${falta} ${falta === 1 ? 'dato' : 'datos'}${peso != null ? ' · ' : ''}` : ''}{peso != null ? `Peso ${peso} %` : ''}
                </p>
              </div>
              <span className={`shrink-0 rounded-[14px] px-3 py-1 text-[15px] font-semibold tabular-nums ${g.valor == null && falta > 0 ? 'bg-bad-soft text-bad' : tonoPuntaje(g.valor ?? null)}`}>{g.valor == null ? '–' : puntajeTexto(g.valor)}</span>
            </div>
          );
        })}
        <div className="h-px bg-line" />
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold leading-5 text-ink">Puntaje provisional</p>
            <p className={`rotulo ${bloqueos.length > 0 && !calculandoPrevia ? '!text-bad' : ''}`}>
              {bloqueos.length > 0 && !calculandoPrevia ? `Falta ${bloqueos.length} ${bloqueos.length === 1 ? 'dato obligatorio' : 'datos obligatorios'}` : escala ? `Escala de ${escala}` : ''}
            </p>
          </div>
          <p className="text-[40px] font-semibold leading-[42px] tracking-[-0.015em] tabular-nums text-ink">{puntajeTexto(previa?.puntaje)}</p>
        </div>
        {previa?.formula ? (
          <p className="rotulo">{previa.formula}</p>
        ) : bloqueos.length > 0 && !calculandoPrevia ? (
          <p className="rotulo">No se promedia mientras falte un dato</p>
        ) : null}
        {bloqueos.length > 0 && !calculandoPrevia && (
          <div className="flex gap-2.5 rounded-[14px] bg-bad-soft p-4" role="status">
            <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-bad" aria-hidden="true" />
            <p className="text-[13px] leading-[22px] text-ink">El scoring no se calcula con datos incompletos. Completa o corrige los campos marcados para continuar.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
