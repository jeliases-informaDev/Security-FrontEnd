'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { administracionService, mensajeDeError, type Cuenta, type Empresa, type Rol } from '@/modules/administracion/services/administracionService';
import { generarClave } from '@/modules/administracion/lib/generarClave';
import { botonPrimario, botonSecundario, botonTexto, campo, campoError } from '@/shared/ui/estilos';
import { Campo, Seccion } from './Campo';

const esquema = z.object({
  nombres: z.string().trim().min(1, 'Escribe los nombres'),
  apePat: z.string().trim().min(1, 'Escribe el apellido paterno'),
  apeMat: z.string().trim(),
  cargo: z.string().trim(),
  correo: z.string().trim().min(1, 'Escribe el correo').email('Escribe un correo válido'),
  empresa: z.string().min(1, 'Elige la empresa'),
  rolCodigo: z.string().min(1, 'Elige el rol'),
  usuario: z
    .string()
    .trim()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[A-Za-z0-9._@-]+$/, 'Solo letras, números y . _ @ -'),
  clave: z.string().min(8, 'Mínimo 8 caracteres'),
});

type FormValues = z.infer<typeof esquema>;

interface NuevaCuentaFormProps {
  empresas: Empresa[];
  roles: Rol[];
  onCancelar: () => void;
  /** Recibe la cuenta creada y la clave inicial (solo se conoce en este momento). */
  onCreada: (cuenta: Cuenta, claveInicial: string) => void;
  onIrAEmpresas: () => void;
}

export function NuevaCuentaForm({ empresas, roles, onCancelar, onCreada, onIrAEmpresas }: NuevaCuentaFormProps) {
  const activas = empresas.filter((empresa) => empresa.activa);
  const [mostrarClave, setMostrarClave] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombres: '',
      apePat: '',
      apeMat: '',
      cargo: '',
      correo: '',
      empresa: activas.length === 1 ? activas[0].nombre : '',
      // El rol de menos permisos queda elegido de entrada; el administrador lo cambia si hace falta.
      rolCodigo: roles.find((rol) => rol.codigo === 'USUARIO')?.codigo ?? '',
      usuario: '',
      clave: generarClave(),
    },
  });

  const crear = handleSubmit(async (valores) => {
    setErrorGeneral(null);
    try {
      const cuenta = await administracionService.crearCuenta({
        usuario: valores.usuario.trim(),
        clave: valores.clave,
        correo: valores.correo.trim(),
        nombres: valores.nombres.trim(),
        apePat: valores.apePat.trim(),
        apeMat: valores.apeMat.trim() || undefined,
        cargo: valores.cargo.trim() || undefined,
        empresa: valores.empresa,
        rolCodigo: valores.rolCodigo,
      });
      onCreada(cuenta, valores.clave);
    } catch (err) {
      const mensaje = mensajeDeError(err, 'No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.');
      // El backend avisa con un solo mensaje cuando el usuario o el correo ya existen: se marca el campo que corresponde.
      if (/nombre de usuario/i.test(mensaje)) setError('usuario', { message: mensaje });
      else if (/correo/i.test(mensaje)) setError('correo', { message: mensaje });
      else setErrorGeneral(mensaje);
    }
  });

  const clase = (error?: string) => `${campo} ${error ? campoError : ''}`;

  return (
    <form onSubmit={crear} noValidate className="space-y-6">
      {errorGeneral && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorGeneral}
        </p>
      )}

      <Seccion titulo="Persona" descripcion="A quién pertenece la cuenta.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo id="nombres" texto="Nombres" error={errors.nombres?.message}>
            <input id="nombres" autoComplete="off" className={clase(errors.nombres?.message)} {...register('nombres')} />
          </Campo>
          <Campo id="apePat" texto="Apellido paterno" error={errors.apePat?.message}>
            <input id="apePat" autoComplete="off" className={clase(errors.apePat?.message)} {...register('apePat')} />
          </Campo>
          <Campo id="apeMat" texto="Apellido materno (opcional)">
            <input id="apeMat" autoComplete="off" className={campo} {...register('apeMat')} />
          </Campo>
          <Campo id="correo" texto="Correo" error={errors.correo?.message} className="lg:col-span-2">
            <input id="correo" type="email" autoComplete="off" className={clase(errors.correo?.message)} {...register('correo')} />
          </Campo>
          <Campo id="cargo" texto="Cargo (opcional)">
            <input id="cargo" autoComplete="off" className={campo} {...register('cargo')} />
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Empresa y permisos" descripcion="La cuenta solo verá los registros de su empresa.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo id="empresa" texto="Empresa" error={errors.empresa?.message}>
            <select id="empresa" className={clase(errors.empresa?.message)} disabled={activas.length === 0} {...register('empresa')}>
              <option value="">{activas.length === 0 ? 'No hay empresas activas' : 'Elige una empresa'}</option>
              {activas.map((empresa) => (
                <option key={empresa.id} value={empresa.nombre}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
            {activas.length === 0 && (
              <p className="mt-1.5 text-xs text-brand-muted">
                Primero agrega la empresa en{' '}
                <button type="button" onClick={onIrAEmpresas} className="font-medium text-brand-navy underline underline-offset-2">
                  Empresas
                </button>
                .
              </p>
            )}
          </Campo>
          <Campo id="rolCodigo" texto="Rol" error={errors.rolCodigo?.message}>
            <select id="rolCodigo" className={clase(errors.rolCodigo?.message)} {...register('rolCodigo')}>
              <option value="">Elige un rol</option>
              {roles.map((rol) => (
                <option key={rol.codigo} value={rol.codigo}>
                  {rol.nombre}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Acceso" descripcion="Con esto entrará a la plataforma. Cópialos antes de salir de esta pantalla: la clave no se vuelve a mostrar.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo id="usuario" texto="Usuario" error={errors.usuario?.message}>
            <input id="usuario" autoComplete="off" spellCheck={false} className={`${clase(errors.usuario?.message)} font-mono`} {...register('usuario')} />
          </Campo>
          <Campo id="clave" texto="Clave inicial" error={errors.clave?.message}>
            <div className="flex gap-2">
              <input
                id="clave"
                type={mostrarClave ? 'text' : 'password'}
                autoComplete="new-password"
                spellCheck={false}
                className={`${clase(errors.clave?.message)} font-mono`}
                {...register('clave')}
              />
              <button
                type="button"
                onClick={() => setMostrarClave((visible) => !visible)}
                aria-label={mostrarClave ? 'Ocultar la clave' : 'Mostrar la clave'}
                title={mostrarClave ? 'Ocultar la clave' : 'Mostrar la clave'}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
              >
                {mostrarClave ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setValue('clave', generarClave(), { shouldValidate: true })}
              className={`${botonTexto} mt-1.5 -ml-2`}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Generar otra clave
            </button>
          </Campo>
        </div>
      </Seccion>

      <div className="flex justify-end gap-2 pb-2">
        <button type="button" onClick={onCancelar} className={botonSecundario}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting || activas.length === 0} className={botonPrimario}>
          {isSubmitting ? 'Creando…' : 'Crear cuenta'}
        </button>
      </div>
    </form>
  );
}
