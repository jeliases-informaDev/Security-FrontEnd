'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { useLicencia } from '@/modules/licencias/context/LicenciaContext';
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
  const { usuario: usuarioActual } = useAuth();
  const { bolsa } = useLicencia();
  const activas = empresas.filter((empresa) => empresa.activa);
  const [mostrarClave, setMostrarClave] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const esAdminEmpresa = usuarioActual?.rol?.toUpperCase() === 'ADMINISTRADOR_EMPRESA';

  // Si es Administrador de Empresa: no se muestra el rol ADMINISTRADOR universal (solo USUARIO, SUPERVISOR, ADMINISTRADOR_EMPRESA)
  const rolesDisponibles = esAdminEmpresa
    ? roles.filter((r) => r.codigo.toUpperCase() !== 'ADMINISTRADOR')
    : roles;

  // Empresa predeterminada para el Administrador de Empresa
  const empresaAdmin = bolsa?.empresaNombre || (activas.length === 1 ? activas[0].nombre : '');

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombres: '',
      apePat: '',
      apeMat: '',
      cargo: '',
      correo: '',
      empresa: esAdminEmpresa ? empresaAdmin : (activas.length === 1 ? activas[0].nombre : ''),
      rolCodigo: rolesDisponibles.find((rol) => rol.codigo === 'USUARIO')?.codigo ?? rolesDisponibles[0]?.codigo ?? '',
      usuario: '',
      clave: generarClave(),
    },
  });

  const siglaElegida = activas.find((e) => e.nombre === watch('empresa'))?.sigla?.toLowerCase() ?? null;

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
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const dataResp = (err as { response?: { data?: { message?: string; mensaje?: string } } })?.response?.data;

      // HTTP 409 (Conflict): Cupo máximo alcanzado
      if (status === 409) {
        setErrorGeneral(
          dataResp?.message ||
          dataResp?.mensaje ||
          'Se ha alcanzado el cupo máximo de usuarios activos permitidos en tu empresa. Desactiva usuarios inactivos o solicita una ampliación de cupo.'
        );
        return;
      }

      const mensaje = mensajeDeError(err, 'No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.');
      if (/nombre de usuario/i.test(mensaje)) setError('usuario', { message: mensaje });
      else if (/correo/i.test(mensaje)) setError('correo', { message: mensaje });
      else setErrorGeneral(mensaje);
    }
  });

  const clase = (error?: string) => `${campo} ${error ? campoError : ''}`;

  return (
    <form onSubmit={crear} noValidate className="space-y-6">
      {/* Contador de cupo de usuarios */}
      {bolsa && (
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 px-4 py-2.5 text-xs text-muted">
          <Users className="h-4 w-4 text-brand" />
          <span>
            Usuarios activos: <strong className="text-ink tabular-nums">{bolsa.usuariosActivos} de {bolsa.cupoUsuarios} permitidos</strong>
          </span>
          {bolsa.usuariosActivos >= bolsa.cupoUsuarios && (
            <span className="badge badge-warn ml-auto text-[10px]">Cupo completo</span>
          )}
        </div>
      )}

      {errorGeneral && (
        <p role="alert" className="rounded-lg border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
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
          {/* Si es Administrador de Empresa: no mostrar selector de empresas (se crea automáticamente en la suya) */}
          {esAdminEmpresa ? (
            <input type="hidden" {...register('empresa')} value={empresaAdmin} />
          ) : (
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
          )}

          <Campo id="rolCodigo" texto="Rol" error={errors.rolCodigo?.message}>
            <select id="rolCodigo" className={clase(errors.rolCodigo?.message)} {...register('rolCodigo')}>
              <option value="">Elige un rol</option>
              {rolesDisponibles.map((rol) => (
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
          <Campo id="usuario" texto="Usuario" error={errors.usuario?.message} ayuda={siglaElegida ? `Se guardará como ${siglaElegida}.usuario: la sigla de la empresa va delante y la persona no tiene que escribirla. Puede entrar con su correo.` : 'La persona también podrá entrar con su correo.'}>
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-white text-muted transition hover:bg-surface-2"
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
        <button type="submit" disabled={isSubmitting || (activas.length === 0 && !esAdminEmpresa)} className={botonPrimario}>
          {isSubmitting ? 'Creando…' : 'Crear cuenta'}
        </button>
      </div>
    </form>
  );
}
