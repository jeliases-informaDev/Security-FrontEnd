'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, FormProvider, get, useFieldArray, useForm, useFormContext, useWatch, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Trash2 } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { mensajeDeFalla } from '@/modules/licencias/lib/consumo';
import { IconoAjustes, IconoAyuda, IconoCandado, IconoMas, IconoRecibo, IconoVisto } from '@/shared/ui/iconos';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso, Boton, type AvisoDatos } from '@/shared/ui/kit';
import { StyledSelect } from '@/shared/ui/StyledSelect';
import { dejarAviso } from '../lib/aviso';
import {
  aSolicitud, beneficiarioVacio, crearEsquema, datosMinimos, detectarCambios, esJuridica, LIMITE_MOTIVO, pideTexto,
  valoresDesdeDetalle, valoresIniciales, type FormValues, type Legados,
} from '../lib/formulario';
import { fechaCorta, fechaHora, hoyIso } from '../lib/formato';
import {
  camposDeError, operacionesService,
  type CatalogosOperacion, type DetalleOperacion, type OpcionCodigo, type ProvinciaOpcion,
} from '../services/operacionesService';
import { BTN, BTN_P, BotonPronto, CAMPO, CAMPO_BORDE, Interruptor, Pronto, Tarjeta } from './piezas';

// ============================================================
// Piezas del formulario
// ============================================================

/** Antes de cada campo cambiado (solo al editar): ruta → texto anterior. */
const AntesContexto = createContext<Record<string, string>>({});
/** Nombres de los valores que ya no están en el catálogo (registros anteriores). */
const LegadosContexto = createContext<Legados>({});

type Ruta = FieldPath<FormValues>;

/**
 * Campo con su rótulo. Según el diseño (RO 2 y RO 3) el rótulo no dice «(opcional)» salvo en «Cuenta involucrada», que lo trae
 * escrito en su propio texto; en los demás campos opcionales se avisa solo a los lectores de pantalla. `aclaracion` también es
 * solo para ellos: distingue rótulos que el diseño repite (por ejemplo, los del representante legal).
 */
function Campo({ id, texto, ruta, opcional = false, aclaracion, error, children, className = '' }: { id: string; texto: string; ruta?: string; opcional?: boolean; aclaracion?: string; error?: string; children: ReactNode; className?: string }) {
  const antes = useContext(AntesContexto);
  const cambiado = ruta !== undefined && ruta in antes;
  return (
    <div className={`min-w-0 ${className} ${cambiado ? '[&_.input]:border-brand [&_.input]:ring-4 [&_.input]:ring-brand/10' : ''}`}>
      <label htmlFor={id} className="mb-2 flex items-center gap-2 text-sm font-semibold leading-[normal] text-ink">
        <span>{texto}{aclaracion && <span className="sr-only"> {aclaracion}</span>}{opcional && <span className="sr-only"> (opcional)</span>}</span>
        {cambiado && <span className="badge badge-brand !px-2 !py-0.5 !text-[10px]">Cambiado</span>}
      </label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className="error-text">{error}</p>}
      {cambiado && <p className="mt-1 break-words font-mono text-[11px] text-muted">Antes: {antes[ruta]}</p>}
    </div>
  );
}

function Texto({ ruta, id, texto, opcional, aclaracion, placeholder, tipo = 'text', className, inputClassName = '', deshabilitado = false }: { ruta: Ruta; id: string; texto: string; opcional?: boolean; aclaracion?: string; placeholder?: string; tipo?: string; className?: string; inputClassName?: string; deshabilitado?: boolean }) {
  const { register, formState: { errors } } = useFormContext<FormValues>();
  const error = get(errors, ruta)?.message as string | undefined;
  return (
    <Campo id={id} texto={texto} ruta={ruta} opcional={opcional} aclaracion={aclaracion} error={error} className={className}>
      <input id={id} type={tipo} placeholder={placeholder} autoComplete="off" disabled={deshabilitado} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className={`input ${CAMPO} ${error ? 'input-error' : CAMPO_BORDE} ${inputClassName}`} {...register(ruta)} />
    </Campo>
  );
}

function Seleccion({ ruta, id, texto, opciones, placeholder = 'Elige una opción', opcional, aclaracion, className, deshabilitado = false, alCambiar }: { ruta: Ruta; id: string; texto: string; opciones: { value: string; label: string }[]; placeholder?: string; opcional?: boolean; aclaracion?: string; className?: string; deshabilitado?: boolean; alCambiar?: () => void }) {
  const { control, formState: { errors } } = useFormContext<FormValues>();
  const legados = useContext(LegadosContexto);
  const error = get(errors, ruta)?.message as string | undefined;
  return (
    <Controller
      control={control}
      name={ruta}
      render={({ field }) => {
        const actual = String(field.value ?? '');
        // Un valor guardado que ya no está en el catálogo se conserva y se muestra como está.
        const lista = actual && !opciones.some((o) => o.value === actual) ? [{ value: actual, label: legados[ruta] ?? actual }, ...opciones] : opciones;
        return (
          <Campo id={id} texto={texto} ruta={ruta} opcional={opcional} aclaracion={aclaracion} error={error} className={className}>
            <StyledSelect id={id} value={actual} options={lista} placeholder={placeholder} disabled={deshabilitado} error={!!error} className={`${CAMPO} ${error ? '' : CAMPO_BORDE}`} onChange={(v) => { field.onChange(v); alCambiar?.(); }} />
          </Campo>
        );
      }}
    />
  );
}

const aOpciones = (lista: OpcionCodigo[]) => lista.map((o) => ({ value: o.codigo, label: o.nombre }));

/** Campo que no se edita (lo pone el servidor): fondo suave y candado. */
function CampoBloqueado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-sm font-semibold leading-[normal] text-ink">{rotulo}</p>
      <div className="flex h-[46px] items-center gap-2.5 rounded-[10px] border border-line bg-paper px-3.5 text-[15px] text-ink">
        <IconoCandado className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden="true" />
        <span className="min-w-0 truncate">{valor}</span>
      </div>
    </div>
  );
}

// ---- Persona (quien realiza y, con el mismo molde, la representada) ----

function useProvincias(cat: CatalogosOperacion, departamento: string): ProvinciaOpcion[] {
  const idDepartamento = cat.departamentos.find((d) => d.nombre === departamento)?.id;
  const [cargadas, setCargadas] = useState<{ id: number; lista: ProvinciaOpcion[] } | null>(null);
  useEffect(() => {
    if (idDepartamento === undefined) return undefined;
    let vigente = true;
    operacionesService
      .provincias(idDepartamento)
      .then((lista) => { if (vigente) setCargadas({ id: idDepartamento, lista }); })
      .catch(() => { if (vigente) setCargadas({ id: idDepartamento, lista: [] }); });
    return () => { vigente = false; };
  }, [idDepartamento]);
  return idDepartamento !== undefined && cargadas?.id === idDepartamento ? cargadas.lista : [];
}

function DocumentoCampos({ prefijo, cat }: { prefijo: 'personaFisica' | 'personaRepresentada'; cat: CatalogosOperacion }) {
  const { control } = useFormContext<FormValues>();
  const tipo = useWatch({ control, name: `${prefijo}.tipoDocumento` });
  const tipos = aOpciones(cat.tiposDocumentoOperacion);
  return (
    <>
      <Seleccion ruta={`${prefijo}.tipoDocumento`} id={`${prefijo}-tipoDocumento`} texto="Tipo de documento" opciones={tipos} />
      {pideTexto(cat.tiposDocumentoOperacion, tipo)
        ? <Texto ruta={`${prefijo}.motivoSinDocumento`} id={`${prefijo}-motivoSinDocumento`} texto="Motivo por el que no tiene documento" placeholder="Escribe el motivo" />
        : <Texto ruta={`${prefijo}.numeroDocumento`} id={`${prefijo}-numeroDocumento`} texto="N.º de documento" placeholder="Ej. 10001088" />}
    </>
  );
}

function PersonaFisicaCampos({ cat }: { cat: CatalogosOperacion }) {
  const { control, setValue } = useFormContext<FormValues>();
  const departamento = useWatch({ control, name: 'personaFisica.departamento' });
  const provincias = useProvincias(cat, departamento);
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-[18px] sm:grid-cols-2 lg:grid-cols-3">
      <DocumentoCampos prefijo="personaFisica" cat={cat} />
      <Texto ruta="personaFisica.fechaNacimiento" id="personaFisica-fechaNacimiento" texto="Fecha de nacimiento" tipo="date" opcional />
      <Texto ruta="personaFisica.nombres" id="personaFisica-nombres" texto="Nombres" placeholder="Ej. Juan Carlos" />
      <Texto ruta="personaFisica.apellidos" id="personaFisica-apellidos" texto="Apellidos" placeholder="Ej. García López" />
      <Seleccion ruta="personaFisica.nacionalidad" id="personaFisica-nacionalidad" texto="Nacionalidad" opcional placeholder="Elige un país" opciones={cat.paises.map((p) => ({ value: p.nombre, label: p.nombre }))} />
      <Texto ruta="personaFisica.telefono" id="personaFisica-telefono" texto="Teléfono" tipo="tel" opcional placeholder="Ej. 987 654 321" />
      <Seleccion ruta="personaFisica.ocupacion" id="personaFisica-ocupacion" texto="Ocupación" opcional placeholder="Elige una ocupación" opciones={cat.ocupaciones.map((o) => ({ value: o.nombre, label: o.nombre }))} />
      <Seleccion ruta="personaFisica.estadoCivil" id="personaFisica-estadoCivil" texto="Estado civil" opcional opciones={aOpciones(cat.estadosCiviles)} />
      <Texto ruta="personaFisica.domicilio" id="personaFisica-domicilio" texto="Domicilio" opcional placeholder="Calle, número y distrito" className="sm:col-span-2 lg:col-span-3" />
      <Seleccion ruta="personaFisica.departamento" id="personaFisica-departamento" texto="Departamento" opcional placeholder="Elige" opciones={cat.departamentos.map((d) => ({ value: d.nombre, label: d.nombre }))} alCambiar={() => setValue('personaFisica.provincia', '', { shouldDirty: true })} />
      <Seleccion ruta="personaFisica.provincia" id="personaFisica-provincia" texto="Provincia" opcional placeholder={departamento ? 'Elige una provincia' : 'Elige un departamento'} deshabilitado={!departamento} opciones={provincias.map((p) => ({ value: p.nombre, label: p.nombre }))} />
      <Texto ruta="personaFisica.distrito" id="personaFisica-distrito" texto="Distrito" opcional placeholder="Escribe el distrito" />
    </div>
  );
}

function PersonaRepresentadaCampos({ cat }: { cat: CatalogosOperacion }) {
  const { control } = useFormContext<FormValues>();
  const tipo = useWatch({ control, name: 'personaRepresentada.tipoDocumento' });
  const juridica = esJuridica({ tipoDocumento: tipo } as FormValues['personaRepresentada']);
  const tipos = aOpciones(cat.tiposDocumentoOperacion);
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-1 gap-x-4 gap-y-[18px] sm:grid-cols-2 lg:grid-cols-3">
        <DocumentoCampos prefijo="personaRepresentada" cat={cat} />
        {juridica ? (
          <>
            <Texto ruta="personaRepresentada.razonSocial" id="personaRepresentada-razonSocial" texto="Razón social" />
            <Texto ruta="personaRepresentada.representanteLegal" id="personaRepresentada-representanteLegal" texto="Representante legal" opcional />
            <Seleccion ruta="personaRepresentada.representanteTipoDocumento" id="personaRepresentada-representanteTipoDocumento" texto="Tipo de documento" aclaracion="del representante" opcional opciones={tipos} />
            <Texto ruta="personaRepresentada.representanteNumeroDocumento" id="personaRepresentada-representanteNumeroDocumento" texto="N.º de documento" aclaracion="del representante" opcional />
          </>
        ) : (
          <>
            <Texto ruta="personaRepresentada.nombres" id="personaRepresentada-nombres" texto="Nombres" />
            <Texto ruta="personaRepresentada.apellidos" id="personaRepresentada-apellidos" texto="Apellidos" />
          </>
        )}
      </div>
      {juridica && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-[18px] sm:grid-cols-2">
          <Texto ruta="personaRepresentada.accionistasMayores25" id="personaRepresentada-accionistasMayores25" texto="Accionistas con más del 25%" opcional />
          <Texto ruta="personaRepresentada.domicilioFiscal" id="personaRepresentada-domicilioFiscal" texto="Domicilio fiscal" opcional />
        </div>
      )}
    </div>
  );
}

// ---- Ayuda de «Beneficiarios» (RO 2b) ----

function AyudaBeneficiarios() {
  return (
    <span className="group relative inline-flex">
      <button type="button" aria-label="Qué es un beneficiario" aria-describedby="ayuda-beneficiario" className="-ml-1 flex h-6 w-6 items-center justify-center rounded-full text-muted transition-colors hover:text-ink">
        <IconoAyuda className="h-4 w-4" aria-hidden="true" />
      </button>
      {/* En el diseño (RO 2b) el globo sale arriba del icono, alineado 14 px a su izquierda, de 300 px de ancho y sin flecha. */}
      <span id="ayuda-beneficiario" role="tooltip" className="pointer-events-none invisible absolute bottom-full left-[-14px] z-20 mb-2.5 flex w-[300px] max-w-[calc(100vw-3rem)] flex-col gap-1 rounded-[10px] bg-ink px-3.5 py-3 text-left text-paper opacity-0 shadow-[0_12px_32px_-18px_rgb(14_17_22/0.14)] transition-opacity max-sm:left-[-6.5rem] group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <span className="block text-sm font-semibold leading-5">Beneficiario</span>
        <span className="block text-[13px] leading-[22px]">La persona a favor de quien se realiza la operación: quien recibe el bien, el servicio o el dinero. Puede ser distinta de quien la realiza o de la persona representada. Debe haber al menos una.</span>
      </span>
    </span>
  );
}

// ============================================================
// Pantalla (alta y edición)
// ============================================================

interface Props {
  catalogos: CatalogosOperacion;
  /** Con detalle se edita ese registro; sin detalle se crea uno nuevo. */
  detalle?: DetalleOperacion;
}

const CIRCULOS = ['Persona que realiza', 'Operación y monto', 'Modalidad y moneda', 'Origen de los fondos', 'Al menos un beneficiario'];

/** RO 2 / RO 3 · Nueva operación y RO 6 · Editar registro (con motivo obligatorio y «Cambios detectados»). */
export function FormularioOperacion({ catalogos, detalle }: Props) {
  const router = useRouter();
  const { usuario } = useAuth();
  const edicion = detalle !== undefined;
  const [hoy] = useState(hoyIso);
  const [ahora] = useState(() => { const d = new Date(); return `${d.toLocaleDateString('en-CA')}T${d.toTimeString().slice(0, 5)}`; });
  const inicial = useMemo(() => (detalle ? valoresDesdeDetalle(detalle) : { valores: valoresIniciales(catalogos, hoyIso()), legados: {} as Legados }), [detalle, catalogos]);
  const esquema = useMemo(() => crearEsquema(catalogos, edicion ? inicial.valores : null, edicion), [catalogos, edicion, inicial]);
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);

  const metodos = useForm<FormValues>({ resolver: zodResolver(esquema), defaultValues: inicial.valores });
  const { control, register, handleSubmit, setError, formState: { errors, isSubmitting } } = metodos;
  const { fields, append, remove } = useFieldArray({ control, name: 'beneficiarios' });
  const valores = useWatch({ control }) as FormValues;

  const minimos = useMemo(() => datosMinimos(valores, catalogos), [valores, catalogos]);
  const cambios = useMemo(() => (edicion ? detectarCambios(inicial.valores, valores, catalogos, inicial.legados) : []), [edicion, inicial, valores, catalogos]);
  const antes = useMemo(() => Object.fromEntries(cambios.map((c) => [c.ruta, c.antes])), [cambios]);
  const motivo = valores.motivo ?? '';

  const mostrarAviso = useCallback((nuevo: AvisoDatos) => {
    setAviso(nuevo);
    requestAnimationFrame(() => document.getElementById('aviso-formulario')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  }, []);

  const guardar = handleSubmit(
    async (v) => {
      setAviso(null);
      const solicitud = aSolicitud(v, catalogos, edicion);
      try {
        if (detalle) {
          const r = await operacionesService.actualizar(detalle.id, solicitud);
          dejarAviso(`Registro actualizado: ${r.cambios.length} ${r.cambios.length === 1 ? 'cambio anotado' : 'cambios anotados'} en el historial.`);
          router.push(`/operaciones/${detalle.id}`);
        } else {
          const r = await operacionesService.registrar(solicitud);
          router.push(`/operaciones/${r.id}/guardado`);
        }
      } catch (err) {
        const campos = camposDeError(err);
        if (campos) {
          for (const [clave, mensaje] of Object.entries(campos)) {
            // «beneficiarios[0].nombre» del contrato es «beneficiarios.0.nombre» en el formulario.
            if (clave !== 'beneficiarios') setError(clave.replace(/\[(\d+)\]/g, '.$1') as Ruta, { type: 'server', message: mensaje });
          }
        }
        const texto = mensajeDeFalla(err, mensajeDe(err, 'No se pudo guardar el registro. Revisa los datos e inténtalo de nuevo.'));
        if (texto) mostrarAviso({ tipo: 'error', texto });
      }
    },
    () => {
      mostrarAviso({ tipo: 'error', texto: 'Revisa los campos marcados en rojo.' });
      setTimeout(() => document.querySelector<HTMLElement>('.input-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120);
    },
  );

  const fechaOperacionAnterior = !!valores.operacion?.fechaOperacion && valores.operacion.fechaOperacion < hoy && !edicion;
  const pideModalidad = pideTexto(catalogos.modalidadesPago, valores.operacion?.modalidadPago ?? '');
  const pideOrigen = pideTexto(catalogos.origenesFondos, valores.operacion?.origenFondos ?? '');
  const puedeGuardar = edicion ? cambios.length > 0 && motivo.trim() !== '' : minimos.every(Boolean);
  const volver = edicion ? `/operaciones/${detalle.id}` : '/operaciones';
  const errorBeneficiarios = (errors.beneficiarios?.message ?? errors.beneficiarios?.root?.message) as string | undefined;

  return (
    <FormProvider {...metodos}>
      <AntesContexto.Provider value={antes}>
        <LegadosContexto.Provider value={inicial.legados}>
          <PageShell ancho="amplio">
            <PageHeader
              antetitulo={edicion ? detalle.numeroRegistro : 'Registro de operaciones'}
              titulo={edicion ? 'Editar registro' : 'Nueva operación'}
              descripcion={edicion ? 'Cambia solo lo necesario. Cada cambio queda en el historial con tu usuario, la fecha y el motivo.' : `Completa los datos del registro. Los campos obligatorios se validan al guardar y el registro queda a nombre de ${usuario?.usuario ?? 'tu usuario'}.`}
              icono={IconoRecibo}
              sinLinea
            />

            <form onSubmit={guardar} noValidate className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_clamp(21.25rem,24vw,28.75rem)]">
              <div className="flex min-w-0 flex-col gap-5">
                {aviso && <div id="aviso-formulario" className="scroll-mt-6"><Aviso aviso={aviso} onCerrar={() => setAviso(null)} /></div>}

                {edicion && (
                  <div className="flex items-start gap-3 rounded-2xl bg-accent-soft px-5 py-4">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-ink">Los registros no se pueden borrar</p>
                      <p className="mt-0.5 text-sm text-muted">Puedes corregir datos, pero el valor anterior se conserva en el historial. Indica abajo el motivo del cambio.</p>
                    </div>
                  </div>
                )}

                <Tarjeta espacio="gap-[18px]" titulo="Registro" descripcion="El número y la fecha se asignan solos y no se pueden cambiar." derecha={<span className="badge badge-brand !leading-[normal]">Automático</span>}>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-[18px] sm:grid-cols-3">
                    <CampoBloqueado rotulo="N.º de registro" valor={edicion ? detalle.numeroRegistro : 'Se asigna al guardar'} />
                    <Texto ruta="registro.oficina" id="registro-oficina" texto="Oficina" placeholder="Ej. San Isidro" />
                    <CampoBloqueado rotulo="Fecha de registro" valor={(edicion ? fechaCorta(detalle.registro.fechaRegistro) : fechaCorta(hoy)) ?? ''} />
                  </div>
                </Tarjeta>

                <Tarjeta espacio="gap-[18px]" titulo="Persona que realiza la operación" descripcion="Quien se presenta a realizarla.">
                  <PersonaFisicaCampos cat={catalogos} />
                </Tarjeta>

                <Tarjeta
                  espacio="gap-[18px]"
                  className="!rounded-[22px]"
                  titulo="Persona representada"
                  descripcion="Solo si la operación se hace en nombre de otra persona, natural o jurídica."
                  derecha={<Controller control={control} name="conRepresentada" render={({ field }) => <Interruptor id="con-representada" activo={field.value} onCambiar={field.onChange} etiqueta="Actúa en representación" />} />}
                >
                  {valores.conRepresentada ? <PersonaRepresentadaCampos cat={catalogos} /> : <p className="text-sm leading-[normal] text-ink/50">No aplica para este registro. Actívalo para agregar sus datos.</p>}
                </Tarjeta>

                <Tarjeta espacio="gap-[18px]" titulo="Operación" descripcion="Qué se hizo, cuánto y cómo se pagó.">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-[18px] sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <Texto ruta="operacion.fechaOperacion" id="operacion-fechaOperacion" texto="Fecha de la operación" tipo="date" />
                      {fechaOperacionAnterior && <p className="mt-1 text-xs font-medium text-warn">Recuerda registrarla el mismo día en que ocurra.</p>}
                    </div>
                    <Texto ruta="operacion.lugar" id="operacion-lugar" texto="Lugar" opcional placeholder="Ej. Lima" />
                    <Seleccion ruta="operacion.tipoOperacion" id="operacion-tipoOperacion" texto="Tipo de operación" opciones={aOpciones(catalogos.tiposOperacion)} />
                    <Seleccion ruta="operacion.modalidadPago" id="operacion-modalidadPago" texto="Modalidad de pago" opciones={aOpciones(catalogos.modalidadesPago)} />
                    <Seleccion ruta="operacion.moneda" id="operacion-moneda" texto="Moneda" placeholder="Elige" opciones={catalogos.monedas.map((m) => ({ value: m.codigo, label: `${m.codigo} · ${m.nombre}` }))} />
                    <Texto ruta="operacion.monto" id="operacion-monto" texto="Monto" placeholder="Ej. 128,500.00" inputClassName="tabular-nums" />
                    {pideModalidad && <Texto ruta="operacion.modalidadPagoTexto" id="operacion-modalidadPagoTexto" texto="¿Cuál es la modalidad de pago?" placeholder="Descríbela" className="sm:col-span-2 lg:col-span-3" />}
                    <Seleccion ruta="operacion.origenFondos" id="operacion-origenFondos" texto="Origen de los fondos" opciones={aOpciones(catalogos.origenesFondos)} />
                    <Texto ruta="operacion.numeroComprobante" id="operacion-numeroComprobante" texto="N.º de comprobante" opcional placeholder="Ej. F001-004512" />
                    <Texto ruta="operacion.cuenta1" id="operacion-cuenta1" texto="Cuenta involucrada (opcional)" placeholder="Banco · N.º de cuenta" />
                    {pideOrigen && <Texto ruta="operacion.origenFondosTexto" id="operacion-origenFondosTexto" texto="¿Cuál es el origen de los fondos?" placeholder="Descríbelo" className="sm:col-span-2 lg:col-span-3" />}
                    <Texto ruta="operacion.descripcion" id="operacion-descripcion" texto="Descripción" opcional placeholder="Describe la operación en una frase" className="sm:col-span-2 lg:col-span-3" />
                  </div>
                </Tarjeta>

                <Tarjeta
                  espacio="gap-[18px]"
                  titulo={<span className="flex items-center gap-1.5">Beneficiarios <AyudaBeneficiarios /></span>}
                  descripcion="Al menos uno."
                >
                  <div className="flex flex-col gap-[18px]">
                    {fields.map((f, i) => (
                      <div key={f.id} className="rounded-xl border border-line bg-paper p-4">
                        <div className="mb-3.5 flex items-center justify-between gap-3">
                          <p className="font-mono text-xs leading-[normal] tracking-[0.04em] text-muted">Beneficiario {i + 1}</p>
                          {i > 0 && (
                            <button type="button" onClick={() => remove(i)} aria-label={`Quitar el beneficiario ${i + 1}`} className="-my-[9px] flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bad-soft hover:text-bad">
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                        <BeneficiarioCampos indice={i} cat={catalogos} />
                      </div>
                    ))}
                  </div>
                  {errorBeneficiarios && <p role="alert" className="error-text">{errorBeneficiarios}</p>}
                  <div>
                    <button type="button" onClick={() => append(beneficiarioVacio(catalogos))} className={`btn btn-secondary ${BTN}`}><IconoMas className="h-4 w-4" aria-hidden="true" /> Agregar beneficiario</button>
                  </div>
                </Tarjeta>

                {edicion && (
                  <Tarjeta titulo="Motivo del cambio" descripcion="Obligatorio para guardar." derecha={<span className="badge badge-critica">Obligatorio</span>}>
                    <div>
                      <label htmlFor="motivo" className="sr-only">Motivo del cambio</label>
                      <textarea id="motivo" rows={4} maxLength={LIMITE_MOTIVO} placeholder="Explica por qué haces este cambio" aria-invalid={errors.motivo ? true : undefined} aria-describedby="motivo-contador" className={`input h-auto min-h-[110px] py-3 ${errors.motivo ? 'input-error' : ''}`} {...register('motivo')} />
                      {errors.motivo && <p role="alert" className="error-text">{errors.motivo.message}</p>}
                      <p id="motivo-contador" className="mt-2 font-mono text-[11px] text-muted">{motivo.length} de {LIMITE_MOTIVO} caracteres</p>
                    </div>
                  </Tarjeta>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                  <Link href={volver} className={`btn btn-secondary ${BTN}`}>Cancelar</Link>
                  <Boton type="submit" icono={IconoVisto} className={`${BTN_P} disabled:opacity-40`} disabled={!puedeGuardar} cargando={isSubmitting}>{edicion ? 'Guardar cambios' : 'Guardar registro'}</Boton>
                </div>
              </div>

              <div className="flex flex-col gap-4 xl:sticky xl:top-4">
                {edicion ? (
                  <>
                    <Tarjeta titulo="Cambios detectados" descripcion={cambios.length === 0 ? 'Todavía no cambiaste nada.' : `${cambios.length} ${cambios.length === 1 ? 'campo modificado' : 'campos modificados'}.`}>
                      {cambios.length > 0 && (
                        <ul className="flex flex-col gap-2.5">
                          {cambios.map((c) => (
                            <li key={c.ruta} className="rounded-xl border border-line bg-white px-3.5 py-3">
                              <p className="rotulo">{c.etiqueta}</p>
                              <p className="mt-1 break-words text-sm"><span className="text-muted">{c.antes}</span> <span aria-label="cambia a" className="text-muted">→</span> <span className="font-semibold text-ink">{c.despues}</span></p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Tarjeta>
                    <Tarjeta titulo="Quién y cuándo">
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-baseline justify-between gap-4 text-sm"><span className="text-muted">Usuario</span><span className="font-medium text-ink">{usuario?.usuario}</span></div>
                        <div className="flex items-baseline justify-between gap-4 text-sm"><span className="text-muted">Fecha y hora</span><span className="font-medium tabular-nums text-ink">{fechaHora(ahora)}</span></div>
                        <div className="flex items-baseline justify-between gap-4 text-sm"><span className="text-muted">Se conserva el valor anterior</span><span className="font-medium text-ink">Sí</span></div>
                      </div>
                    </Tarjeta>
                  </>
                ) : (
                  <>
                    <Tarjeta espacio="gap-[14px]" titulo="Verificación de umbral" descripcion="Se calcula con el monto." derecha={<Pronto />}>
                      <div><BotonPronto icono={IconoAjustes} className={BTN}>Cambiar sector o umbral</BotonPronto></div>
                    </Tarjeta>
                    <Tarjeta espacio="gap-3" titulo="Datos mínimos" descripcion="Para poder guardar.">
                      <ul className="flex flex-col gap-3">
                        {CIRCULOS.map((c, i) => (
                          <li key={c} className={`flex items-center gap-2.5 text-[15px] font-medium leading-[normal] ${minimos[i] ? 'text-ink' : 'text-muted'}`}>
                            <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${minimos[i] ? 'bg-brand-soft text-brand' : 'border border-line text-transparent'}`} aria-hidden="true"><IconoVisto className="h-3 w-3" /></span>
                            {c}
                            <span className="sr-only">{minimos[i] ? ': completo' : ': falta'}</span>
                          </li>
                        ))}
                      </ul>
                    </Tarjeta>
                    <section className="card flex flex-col gap-2 rounded-[22px] px-5 py-[18px]">
                      <p className="font-mono text-[11px] uppercase leading-[normal] tracking-[0.04em] text-muted">Recuerda</p>
                      <p className="text-sm leading-[21px] text-ink/80">El registro se hace el mismo día de la operación. Después de guardarlo, cualquier cambio exige un motivo y queda en el historial.</p>
                    </section>
                  </>
                )}
              </div>
            </form>
          </PageShell>
        </LegadosContexto.Provider>
      </AntesContexto.Provider>
    </FormProvider>
  );
}

function BeneficiarioCampos({ indice, cat }: { indice: number; cat: CatalogosOperacion }) {
  const { control } = useFormContext<FormValues>();
  const tipo = useWatch({ control, name: `beneficiarios.${indice}.tipoDocumento` });
  const sinDocumento = pideTexto(cat.tiposDocumentoOperacion, tipo);
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-[18px] sm:grid-cols-2 lg:grid-cols-3">
      <Texto ruta={`beneficiarios.${indice}.nombre`} id={`beneficiarios-${indice}-nombre`} texto="Nombre completo o razón social" />
      <Seleccion ruta={`beneficiarios.${indice}.tipoDocumento`} id={`beneficiarios-${indice}-tipoDocumento`} texto="Tipo de documento" opciones={aOpciones(cat.tiposDocumentoOperacion)} />
      <Texto ruta={`beneficiarios.${indice}.numeroDocumento`} id={`beneficiarios-${indice}-numeroDocumento`} texto="N.º de documento" deshabilitado={sinDocumento} placeholder={sinDocumento ? 'No aplica' : undefined} />
    </div>
  );
}
