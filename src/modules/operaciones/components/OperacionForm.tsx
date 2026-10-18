'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  operacionesService,
  mensajeDeErrorOperaciones,
  type CatalogosOperacion,
  type DetalleOperacion,
  type Persona,
  type ProvinciaOpcion,
  type UsuarioOperacion,
} from '@/modules/operaciones/services/operacionesService';
import { Panel } from '@/shared/ui/PageShell';
import { botonPrimario, botonSecundario, campo, campoError, etiqueta, mensajeError } from '@/shared/ui/estilos';

// ============================================================
// FORMULARIO (todo son textos: se convierten al enviar)
// ============================================================

const personaEsquema = z.object({
  tipoDocumento: z.string(),
  numeroDocumento: z.string(),
  nombres: z.string(),
  apellidos: z.string(),
  fechaNacimiento: z.string(),
  nacionalidad: z.string(),
  telefono: z.string(),
  ocupacion: z.string(),
  domicilio: z.string(),
  codigoPostal: z.string(),
  departamento: z.string(),
  provincia: z.string(),
  distrito: z.string(),
});

const REQUERIDOS_PERSONA = [
  ['tipoDocumento', 'Elige el tipo de documento'],
  ['numeroDocumento', 'Escribe el número de documento'],
  ['nombres', 'Escribe los nombres'],
  ['apellidos', 'Escribe los apellidos'],
  ['fechaNacimiento', 'Indica la fecha de nacimiento'],
] as const;

const esquema = z
  .object({
    numeroRegistro: z.string().trim().min(1, 'Escribe el número de registro').max(50, 'Máximo 50 caracteres'),
    oficina: z.string().trim().min(1, 'Escribe la oficina'),
    fechaRegistro: z.string().min(1, 'Indica la fecha de registro'),
    personaFisica: personaEsquema,
    conRepresentada: z.boolean(),
    personaRepresentada: personaEsquema,
    operacion: z.object({
      fechaOperacion: z.string().min(1, 'Indica la fecha de la operación'),
      lugar: z.string(),
      modalidadPago: z.string().trim().min(1, 'Indica la modalidad de pago'),
      moneda: z.string().min(1, 'Elige la moneda'),
      monto: z.string().trim().min(1, 'Escribe el monto'),
      tipoOperacion: z.string().trim().min(1, 'Indica el tipo de operación'),
      cuenta1: z.string(),
      cuenta2: z.string(),
      cuenta3: z.string(),
    }),
    beneficiarios: z
      .array(
        z.object({
          nombre: z.string().trim().min(1, 'Escribe el nombre'),
          tipoDocumento: z.string().min(1, 'Elige el tipo de documento'),
          numeroDocumento: z.string().trim().min(1, 'Escribe el número de documento'),
          fechaNacimiento: z.string().min(1, 'Indica la fecha de nacimiento'),
        }),
      )
      .min(1, 'Agrega al menos un beneficiario'),
  })
  .superRefine((valores, ctx) => {
    const monto = Number(valores.operacion.monto.replace(',', '.'));
    if (valores.operacion.monto.trim() && !(monto > 0)) {
      ctx.addIssue({ code: 'custom', path: ['operacion', 'monto'], message: 'El monto debe ser un número mayor que cero' });
    }
    const validarPersona = (clave: 'personaFisica' | 'personaRepresentada') => {
      for (const [nombreCampo, mensaje] of REQUERIDOS_PERSONA) {
        if (!valores[clave][nombreCampo].trim()) ctx.addIssue({ code: 'custom', path: [clave, nombreCampo], message: mensaje });
      }
    };
    validarPersona('personaFisica');
    if (valores.conRepresentada) validarPersona('personaRepresentada');
  });

type FormValues = z.infer<typeof esquema>;
type PrefijoPersona = 'personaFisica' | 'personaRepresentada';

const hoy = () => new Date().toLocaleDateString('en-CA');
const sugerirNumeroRegistro = () => `OP-${hoy().replaceAll('-', '')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

const personaVacia = {
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  nacionalidad: 'Peruana',
  telefono: '',
  ocupacion: '',
  domicilio: '',
  codigoPostal: '',
  departamento: '',
  provincia: '',
  distrito: '',
};

const valoresIniciales = (): FormValues => ({
  numeroRegistro: sugerirNumeroRegistro(),
  oficina: '',
  fechaRegistro: hoy(),
  personaFisica: { ...personaVacia },
  conRepresentada: false,
  personaRepresentada: { ...personaVacia, nacionalidad: '' },
  operacion: {
    fechaOperacion: hoy(),
    lugar: '',
    modalidadPago: '',
    moneda: '',
    monto: '',
    tipoOperacion: '',
    cuenta1: '',
    cuenta2: '',
    cuenta3: '',
  },
  beneficiarios: [{ nombre: '', tipoDocumento: 'DNI', numeroDocumento: '', fechaNacimiento: '' }],
});

const textoDe = (valor: string | null | undefined) => valor ?? '';
const nuloSiVacio = (valor: string) => (valor.trim() === '' ? null : valor.trim());

const personaDesdeDetalle = (persona: Persona | null): FormValues['personaFisica'] => ({
  tipoDocumento: textoDe(persona?.tipoDocumento),
  numeroDocumento: textoDe(persona?.numeroDocumento),
  nombres: textoDe(persona?.nombres),
  apellidos: textoDe(persona?.apellidos),
  fechaNacimiento: textoDe(persona?.fechaNacimiento),
  nacionalidad: textoDe(persona?.nacionalidad),
  telefono: textoDe(persona?.telefono),
  ocupacion: textoDe(persona?.ocupacion),
  domicilio: textoDe(persona?.domicilio),
  codigoPostal: textoDe(persona?.codigoPostal),
  departamento: textoDe(persona?.departamento),
  provincia: textoDe(persona?.provincia),
  distrito: textoDe(persona?.distrito),
});

const valoresDesdeDetalle = (detalle: DetalleOperacion): FormValues => ({
  numeroRegistro: detalle.numeroRegistro,
  oficina: detalle.registro.oficina,
  fechaRegistro: detalle.registro.fechaRegistro,
  personaFisica: personaDesdeDetalle(detalle.personaFisica),
  conRepresentada: detalle.personaRepresentada !== null,
  personaRepresentada: personaDesdeDetalle(detalle.personaRepresentada),
  operacion: {
    fechaOperacion: detalle.operacion.fechaOperacion,
    lugar: textoDe(detalle.operacion.lugar),
    modalidadPago: detalle.operacion.modalidadPago,
    moneda: detalle.operacion.moneda,
    monto: String(detalle.operacion.monto),
    tipoOperacion: detalle.operacion.tipoOperacion,
    cuenta1: textoDe(detalle.operacion.cuenta1),
    cuenta2: textoDe(detalle.operacion.cuenta2),
    cuenta3: textoDe(detalle.operacion.cuenta3),
  },
  beneficiarios: detalle.beneficiarios.map((b) => ({ ...b })),
});

const aPersona = (p: FormValues['personaFisica']): Persona => ({
  tipoDocumento: p.tipoDocumento,
  numeroDocumento: p.numeroDocumento.trim(),
  nombres: p.nombres.trim(),
  apellidos: p.apellidos.trim(),
  fechaNacimiento: p.fechaNacimiento,
  nacionalidad: nuloSiVacio(p.nacionalidad),
  telefono: nuloSiVacio(p.telefono),
  ocupacion: nuloSiVacio(p.ocupacion),
  domicilio: nuloSiVacio(p.domicilio),
  codigoPostal: nuloSiVacio(p.codigoPostal),
  departamento: nuloSiVacio(p.departamento),
  provincia: nuloSiVacio(p.provincia),
  distrito: nuloSiVacio(p.distrito),
});

const aOperacion = (o: FormValues['operacion']) => ({
  fechaOperacion: o.fechaOperacion,
  lugar: nuloSiVacio(o.lugar),
  modalidadPago: o.modalidadPago.trim(),
  moneda: o.moneda,
  monto: Number(o.monto.replace(',', '.')),
  tipoOperacion: o.tipoOperacion.trim(),
  cuenta1: nuloSiVacio(o.cuenta1),
  cuenta2: nuloSiVacio(o.cuenta2),
  cuenta3: nuloSiVacio(o.cuenta3),
});

const MODALIDADES_PAGO = ['Efectivo', 'Transferencia', 'Cheque', 'Depósito en cuenta', 'Tarjeta', 'Otro'];
const TIPOS_OPERACION = ['Depósito', 'Retiro', 'Transferencia', 'Compra', 'Venta', 'Cambio de moneda', 'Otro'];

// ============================================================
// PIEZAS
// ============================================================

function Campo({ id, texto, error, children, className = '' }: { id: string; texto: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={etiqueta}>
        {texto}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className={mensajeError}>
          {error}
        </p>
      )}
    </div>
  );
}

function Seccion({ titulo, descripcion, children, acciones }: { titulo: string; descripcion?: string; children: ReactNode; acciones?: ReactNode }) {
  return (
    <Panel className="p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-brand-ink">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-sm text-brand-muted">{descripcion}</p>}
        </div>
        {acciones}
      </div>
      {children}
    </Panel>
  );
}

/** Opciones de un catálogo; si el valor ya guardado no está en el catálogo se conserva para no perderlo al editar. */
function Opciones({ valores, actual }: { valores: string[]; actual: string }) {
  const lista = actual && !valores.includes(actual) ? [actual, ...valores] : valores;
  return (
    <>
      <option value="">Elige una opción</option>
      {lista.map((valor) => (
        <option key={valor} value={valor}>
          {valor}
        </option>
      ))}
    </>
  );
}

function PersonaCampos({ prefijo, catalogos }: { prefijo: PrefijoPersona; catalogos: CatalogosOperacion | null }) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>();
  const errs = errors[prefijo];
  const departamento = useWatch({ control, name: `${prefijo}.departamento` });
  const provinciaActual = useWatch({ control, name: `${prefijo}.provincia` });
  const tipoDocumento = useWatch({ control, name: `${prefijo}.tipoDocumento` });
  const ocupacion = useWatch({ control, name: `${prefijo}.ocupacion` });
  // Las provincias dependen del departamento elegido; se guarda a cual departamento corresponden las cargadas.
  const [cargadas, setCargadas] = useState<{ idDepartamento: number; lista: ProvinciaOpcion[] } | null>(null);
  const idDepartamento = catalogos?.departamentos.find((d) => d.nombre === departamento)?.id;
  const provincias = idDepartamento !== undefined && cargadas?.idDepartamento === idDepartamento ? cargadas.lista : [];

  useEffect(() => {
    if (idDepartamento === undefined) return undefined;
    let vigente = true;
    operacionesService
      .obtenerProvincias(idDepartamento)
      .then((lista) => {
        if (vigente) setCargadas({ idDepartamento, lista });
      })
      .catch(() => {
        if (vigente) setCargadas({ idDepartamento, lista: [] });
      });
    return () => {
      vigente = false;
    };
  }, [idDepartamento]);

  const clase = (error?: string) => `${campo} ${error ? campoError : ''}`;
  const id = (nombre: string) => `${prefijo}-${nombre}`;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Campo id={id('tipoDocumento')} texto="Tipo de documento" error={errs?.tipoDocumento?.message}>
        <select id={id('tipoDocumento')} className={clase(errs?.tipoDocumento?.message)} {...register(`${prefijo}.tipoDocumento`)}>
          <Opciones valores={(catalogos?.tiposDocumento ?? []).map((t) => t.nombre)} actual={tipoDocumento} />
        </select>
      </Campo>
      <Campo id={id('numeroDocumento')} texto="Número de documento" error={errs?.numeroDocumento?.message}>
        <input id={id('numeroDocumento')} className={clase(errs?.numeroDocumento?.message)} {...register(`${prefijo}.numeroDocumento`)} />
      </Campo>
      <Campo id={id('fechaNacimiento')} texto="Fecha de nacimiento" error={errs?.fechaNacimiento?.message}>
        <input id={id('fechaNacimiento')} type="date" className={clase(errs?.fechaNacimiento?.message)} {...register(`${prefijo}.fechaNacimiento`)} />
      </Campo>
      <Campo id={id('nombres')} texto="Nombres" error={errs?.nombres?.message}>
        <input id={id('nombres')} autoComplete="off" className={clase(errs?.nombres?.message)} {...register(`${prefijo}.nombres`)} />
      </Campo>
      <Campo id={id('apellidos')} texto="Apellidos" error={errs?.apellidos?.message} className="sm:col-span-1 lg:col-span-2">
        <input id={id('apellidos')} autoComplete="off" className={clase(errs?.apellidos?.message)} {...register(`${prefijo}.apellidos`)} />
      </Campo>
      <Campo id={id('nacionalidad')} texto="Nacionalidad">
        <input id={id('nacionalidad')} className={campo} {...register(`${prefijo}.nacionalidad`)} />
      </Campo>
      <Campo id={id('telefono')} texto="Teléfono">
        <input id={id('telefono')} type="tel" className={campo} {...register(`${prefijo}.telefono`)} />
      </Campo>
      <Campo id={id('ocupacion')} texto="Ocupación">
        <select id={id('ocupacion')} className={campo} {...register(`${prefijo}.ocupacion`)}>
          <Opciones valores={(catalogos?.ocupaciones ?? []).map((o) => o.nombre)} actual={ocupacion} />
        </select>
      </Campo>
      <Campo id={id('domicilio')} texto="Domicilio" className="sm:col-span-2 lg:col-span-2">
        <input id={id('domicilio')} className={campo} {...register(`${prefijo}.domicilio`)} />
      </Campo>
      <Campo id={id('codigoPostal')} texto="Código postal">
        <input id={id('codigoPostal')} inputMode="numeric" className={campo} {...register(`${prefijo}.codigoPostal`)} />
      </Campo>
      <Campo id={id('departamento')} texto="Departamento">
        <select
          id={id('departamento')}
          className={campo}
          {...register(`${prefijo}.departamento`, { onChange: () => setValue(`${prefijo}.provincia`, '') })}
        >
          <Opciones valores={(catalogos?.departamentos ?? []).map((d) => d.nombre)} actual={departamento} />
        </select>
      </Campo>
      <Campo id={id('provincia')} texto="Provincia">
        <select id={id('provincia')} className={campo} disabled={!departamento} {...register(`${prefijo}.provincia`)}>
          <Opciones valores={provincias.map((p) => p.nombre)} actual={provinciaActual} />
        </select>
      </Campo>
      <Campo id={id('distrito')} texto="Distrito">
        <input id={id('distrito')} className={campo} {...register(`${prefijo}.distrito`)} />
      </Campo>
    </div>
  );
}

// ============================================================
// PANTALLA
// ============================================================

interface OperacionFormProps {
  usuario: UsuarioOperacion;
  /** Con id se edita ese registro; sin id se crea uno nuevo. */
  id?: number;
  onCancelar: () => void;
  onGuardado: (numeroRegistro: string) => void;
}

export function OperacionForm({ usuario, id, onCancelar, onGuardado }: OperacionFormProps) {
  const edicion = id !== undefined;
  const [catalogos, setCatalogos] = useState<CatalogosOperacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const metodos = useForm<FormValues>({ resolver: zodResolver(esquema), defaultValues: valoresIniciales() });
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = metodos;
  const { fields, append, remove } = useFieldArray({ control, name: 'beneficiarios' });

  useEffect(() => {
    let vigente = true;
    const carga = [operacionesService.obtenerCatalogos(), id !== undefined ? operacionesService.obtenerDetalle(id) : Promise.resolve(null)] as const;
    Promise.all(carga)
      .then(([listas, detalle]) => {
        if (!vigente) return;
        setCatalogos(listas);
        if (detalle) reset(valoresDesdeDetalle(detalle));
      })
      .catch((err) => {
        if (vigente) setErrorGeneral(mensajeDeErrorOperaciones(err, 'No se pudo cargar el formulario. Vuelve a la lista e inténtalo de nuevo.'));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [id, reset]);

  const conRepresentada = useWatch({ control, name: 'conRepresentada' });
  const monedaActual = useWatch({ control, name: 'operacion.moneda' });
  const beneficiariosVista = useWatch({ control, name: 'beneficiarios' });
  const monedas = (catalogos?.monedas ?? []).map((m) => `${m.codigo} — ${m.nombre}`);
  const tiposDocumento = (catalogos?.tiposDocumento ?? []).map((t) => t.nombre);

  const guardar = handleSubmit(async (valores) => {
    setErrorGeneral(null);
    try {
      const comun = {
        personaFisica: aPersona(valores.personaFisica),
        personaRepresentada: valores.conRepresentada ? aPersona(valores.personaRepresentada) : null,
        operacion: aOperacion(valores.operacion),
        beneficiarios: valores.beneficiarios.map((b) => ({
          nombre: b.nombre.trim(),
          tipoDocumento: b.tipoDocumento,
          numeroDocumento: b.numeroDocumento.trim(),
          fechaNacimiento: b.fechaNacimiento,
        })),
      };
      if (edicion) {
        await operacionesService.actualizar(id, {
          ...comun,
          registro: { oficina: valores.oficina.trim(), fechaRegistro: valores.fechaRegistro },
        });
        onGuardado(valores.numeroRegistro);
      } else {
        const respuesta = await operacionesService.registrar({
          ...comun,
          numeroRegistro: valores.numeroRegistro.trim(),
          registro: {
            usuarioId: usuario.id,
            usuario: usuario.usuario,
            empresa: usuario.empresa,
            oficina: valores.oficina.trim(),
            fechaRegistro: valores.fechaRegistro,
          },
        });
        onGuardado(respuesta.numeroRegistro);
      }
    } catch (err) {
      setErrorGeneral(mensajeDeErrorOperaciones(err, 'No se pudo guardar el registro. Revisa los datos e inténtalo de nuevo.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  if (cargando) {
    return (
      <Panel className="px-6 py-12 text-center text-sm text-brand-muted" >
        Cargando el formulario…
      </Panel>
    );
  }

  const clase = (error?: string) => `${campo} ${error ? campoError : ''}`;

  return (
    <FormProvider {...metodos}>
      <form onSubmit={guardar} noValidate className="space-y-6">
        {errorGeneral && (
          <p role="alert" className="rounded-lg border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
            {errorGeneral}
          </p>
        )}

        <Seccion titulo="Registro" descripcion={`Se guarda a nombre de ${usuario.usuario}, de ${usuario.empresa}.`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Campo id="numeroRegistro" texto="N.º de registro" error={errors.numeroRegistro?.message}>
              <input
                id="numeroRegistro"
                className={`${clase(errors.numeroRegistro?.message)} font-mono`}
                readOnly={edicion}
                aria-readonly={edicion}
                {...register('numeroRegistro')}
              />
            </Campo>
            <Campo id="oficina" texto="Oficina" error={errors.oficina?.message}>
              <input id="oficina" autoComplete="off" className={clase(errors.oficina?.message)} {...register('oficina')} />
            </Campo>
            <Campo id="fechaRegistro" texto="Fecha de registro" error={errors.fechaRegistro?.message}>
              <input id="fechaRegistro" type="date" className={clase(errors.fechaRegistro?.message)} {...register('fechaRegistro')} />
            </Campo>
          </div>
        </Seccion>

        <Seccion titulo="Persona física" descripcion="Quien realiza la operación.">
          <PersonaCampos prefijo="personaFisica" catalogos={catalogos} />
        </Seccion>

        <Seccion
          titulo="Persona representada"
          descripcion="Solo si la operación se hace en nombre de otra persona."
          acciones={
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input type="checkbox" className="h-4 w-4 rounded border-line-strong accent-[#12253d]" {...register('conRepresentada')} />
              Actúa en representación de otra persona
            </label>
          }
        >
          {conRepresentada ? <PersonaCampos prefijo="personaRepresentada" catalogos={catalogos} /> : <p className="text-sm text-brand-muted">No aplica para este registro.</p>}
        </Seccion>

        <Seccion titulo="Operación">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo id="fechaOperacion" texto="Fecha de la operación" error={errors.operacion?.fechaOperacion?.message}>
              <input id="fechaOperacion" type="date" className={clase(errors.operacion?.fechaOperacion?.message)} {...register('operacion.fechaOperacion')} />
            </Campo>
            <Campo id="lugar" texto="Lugar">
              <input id="lugar" className={campo} {...register('operacion.lugar')} />
            </Campo>
            <Campo id="tipoOperacion" texto="Tipo de operación" error={errors.operacion?.tipoOperacion?.message}>
              <input id="tipoOperacion" list="tipos-operacion" autoComplete="off" className={clase(errors.operacion?.tipoOperacion?.message)} {...register('operacion.tipoOperacion')} />
              <datalist id="tipos-operacion">
                {TIPOS_OPERACION.map((tipo) => (
                  <option key={tipo} value={tipo} />
                ))}
              </datalist>
            </Campo>
            <Campo id="modalidadPago" texto="Modalidad de pago" error={errors.operacion?.modalidadPago?.message}>
              <input id="modalidadPago" list="modalidades-pago" autoComplete="off" className={clase(errors.operacion?.modalidadPago?.message)} {...register('operacion.modalidadPago')} />
              <datalist id="modalidades-pago">
                {MODALIDADES_PAGO.map((modalidad) => (
                  <option key={modalidad} value={modalidad} />
                ))}
              </datalist>
            </Campo>
            <Campo id="moneda" texto="Moneda" error={errors.operacion?.moneda?.message}>
              <select id="moneda" className={clase(errors.operacion?.moneda?.message)} {...register('operacion.moneda')}>
                <Opciones valores={monedas} actual={monedaActual} />
              </select>
            </Campo>
            <Campo id="monto" texto="Monto" error={errors.operacion?.monto?.message}>
              <input id="monto" inputMode="decimal" placeholder="0.00" className={`${clase(errors.operacion?.monto?.message)} tabular-nums`} {...register('operacion.monto')} />
            </Campo>
            <Campo id="cuenta1" texto="Cuenta 1">
              <input id="cuenta1" className={`${campo} font-mono`} {...register('operacion.cuenta1')} />
            </Campo>
            <Campo id="cuenta2" texto="Cuenta 2">
              <input id="cuenta2" className={`${campo} font-mono`} {...register('operacion.cuenta2')} />
            </Campo>
            <Campo id="cuenta3" texto="Cuenta 3">
              <input id="cuenta3" className={`${campo} font-mono`} {...register('operacion.cuenta3')} />
            </Campo>
          </div>
        </Seccion>

        <Seccion
          titulo="Beneficiarios"
          descripcion="Al menos uno."
          acciones={
            <button
              type="button"
              onClick={() => append({ nombre: '', tipoDocumento: 'DNI', numeroDocumento: '', fechaNacimiento: '' })}
              className={botonSecundario}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar beneficiario
            </button>
          }
        >
          <div className="space-y-4">
            {fields.map((campoLista, indice) => {
              const errs = errors.beneficiarios?.[indice];
              return (
                <div key={campoLista.id} className="grid grid-cols-1 items-start gap-4 rounded-lg border border-line bg-surface-2/60 p-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
                  <Campo id={`beneficiario-${indice}-nombre`} texto="Nombre completo" error={errs?.nombre?.message}>
                    <input id={`beneficiario-${indice}-nombre`} autoComplete="off" className={clase(errs?.nombre?.message)} {...register(`beneficiarios.${indice}.nombre`)} />
                  </Campo>
                  <Campo id={`beneficiario-${indice}-tipo`} texto="Tipo de documento" error={errs?.tipoDocumento?.message}>
                    <select id={`beneficiario-${indice}-tipo`} className={clase(errs?.tipoDocumento?.message)} {...register(`beneficiarios.${indice}.tipoDocumento`)}>
                      <Opciones valores={tiposDocumento} actual={beneficiariosVista?.[indice]?.tipoDocumento ?? ''} />
                    </select>
                  </Campo>
                  <Campo id={`beneficiario-${indice}-numero`} texto="Número de documento" error={errs?.numeroDocumento?.message}>
                    <input id={`beneficiario-${indice}-numero`} className={clase(errs?.numeroDocumento?.message)} {...register(`beneficiarios.${indice}.numeroDocumento`)} />
                  </Campo>
                  <Campo id={`beneficiario-${indice}-nacimiento`} texto="Fecha de nacimiento" error={errs?.fechaNacimiento?.message}>
                    <input id={`beneficiario-${indice}-nacimiento`} type="date" className={clase(errs?.fechaNacimiento?.message)} {...register(`beneficiarios.${indice}.fechaNacimiento`)} />
                  </Campo>
                  <button
                    type="button"
                    onClick={() => remove(indice)}
                    disabled={fields.length === 1}
                    aria-label={`Quitar el beneficiario ${indice + 1}`}
                    title={fields.length === 1 ? 'Debe quedar al menos un beneficiario' : 'Quitar beneficiario'}
                    className="mt-0 flex h-10 w-10 items-center justify-center self-end rounded-lg text-muted transition hover:bg-bad-soft hover:text-bad disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted sm:mt-7 sm:self-start"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
          {typeof errors.beneficiarios?.message === 'string' && <p className={mensajeError}>{errors.beneficiarios.message}</p>}
        </Seccion>

        <div className="flex justify-end gap-2 pb-2">
          <button type="button" onClick={onCancelar} className={botonSecundario}>
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className={botonPrimario}>
            {isSubmitting ? 'Guardando…' : edicion ? 'Guardar cambios' : 'Guardar registro'}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
