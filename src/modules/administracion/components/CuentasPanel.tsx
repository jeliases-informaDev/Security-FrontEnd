'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Plus, Search } from 'lucide-react';
import { administracionService, mensajeDeError, type Cuenta, type Empresa, type Rol } from '@/modules/administracion/services/administracionService';
import { Modal } from '@/shared/ui/Modal';
import { Panel } from '@/shared/ui/PageShell';
import { botonPrimario, botonSecundario, botonTexto, campo } from '@/shared/ui/estilos';
import { AvisoBanner, type Aviso } from './AvisoBanner';
import { EditarCuentaModal } from './EditarCuentaModal';
import { NuevaCuentaForm } from './NuevaCuentaForm';

const POR_PAGINA = 15;
const SIN_EMPRESA = '__sin_empresa__';

// Para buscar sin importar mayúsculas ni tildes.
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Vista = { tipo: 'lista' } | { tipo: 'nueva' } | { tipo: 'creada'; cuenta: Cuenta; clave: string };

interface CuentasPanelProps {
  cuentas: Cuenta[] | null;
  cargando: boolean;
  error: string | null;
  empresas: Empresa[];
  roles: Rol[];
  /** Las empresas y los roles ya llegaron: hacen falta para elegirlos en el formulario. */
  listoParaCrear: boolean;
  /** Usuario con el que entró quien administra: no se le deja desactivar su propia cuenta. */
  usuarioActual: string;
  /** Vuelve a pedir las cuentas y las empresas (para que se actualicen los conteos). */
  onRecargar: () => void;
  onIrAEmpresas: () => void;
}

export function CuentasPanel({ cuentas, cargando, error, empresas, roles, listoParaCrear, usuarioActual, onRecargar, onIrAEmpresas }: CuentasPanelProps) {
  const [vista, setVista] = useState<Vista>({ tipo: 'lista' });
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [editando, setEditando] = useState<Cuenta | null>(null);
  const [desactivando, setDesactivando] = useState<Cuenta | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [pagina, setPagina] = useState(0);
  const [copiado, setCopiado] = useState(false);

  const filtradas = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return (cuentas ?? []).filter((cuenta) => {
      const empresa = cuenta.empresa?.trim() ?? '';
      if (filtroEmpresa === SIN_EMPRESA && empresa !== '') return false;
      if (filtroEmpresa !== '' && filtroEmpresa !== SIN_EMPRESA && normalizar(empresa) !== normalizar(filtroEmpresa)) return false;
      if (termino === '') return true;
      return normalizar([cuenta.nombreCompleto, cuenta.usuario, cuenta.correo, empresa, cuenta.rolNombre ?? ''].join(' ')).includes(termino);
    });
  }, [cuentas, busqueda, filtroEmpresa]);

  const sinEmpresa = (cuentas ?? []).filter((cuenta) => !cuenta.empresa?.trim()).length;
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const visibles = filtradas.slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA);
  const desde = filtradas.length === 0 ? 0 : paginaActual * POR_PAGINA + 1;
  const hasta = Math.min((paginaActual + 1) * POR_PAGINA, filtradas.length);

  const cambiarEstado = async (cuenta: Cuenta, activo: boolean) => {
    setProcesando(cuenta.id);
    setAviso(null);
    try {
      await administracionService.cambiarEstadoCuenta(cuenta.id, activo);
      setAviso({
        tipo: 'ok',
        texto: activo ? `La cuenta ${cuenta.usuario} está activa de nuevo.` : `La cuenta ${cuenta.usuario} quedó desactivada: ya no puede entrar.`,
      });
      onRecargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeDeError(err, 'No se pudo cambiar el estado de la cuenta. Inténtalo de nuevo.') });
    } finally {
      setProcesando(null);
      setDesactivando(null);
    }
  };

  const copiarAcceso = async (cuenta: Cuenta, clave: string) => {
    const texto = `Plataforma: ${window.location.origin}\nUsuario: ${cuenta.usuario}\nClave: ${clave}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo copiar. Selecciona el usuario y la clave y cópialos a mano.' });
    }
  };

  if (vista.tipo === 'nueva') {
    return (
      <NuevaCuentaForm
        empresas={empresas}
        roles={roles}
        onCancelar={() => setVista({ tipo: 'lista' })}
        onCreada={(cuenta, clave) => {
          setCopiado(false);
          setVista({ tipo: 'creada', cuenta, clave });
          onRecargar();
        }}
        onIrAEmpresas={onIrAEmpresas}
      />
    );
  }

  if (vista.tipo === 'creada') {
    const { cuenta, clave } = vista;
    return (
      <Panel className="p-5 sm:p-6">
        <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Se creó la cuenta de <strong className="font-semibold">{cuenta.nombreCompleto || cuenta.usuario}</strong>.
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-brand-muted">Usuario</dt>
            <dd className="mt-1 font-mono text-[15px] text-brand-ink">{cuenta.usuario}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-brand-muted">Clave inicial</dt>
            <dd className="mt-1 font-mono text-[15px] text-brand-ink">{clave}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-brand-muted">Empresa</dt>
            <dd className="mt-1 text-brand-ink">{cuenta.empresa ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-brand-muted">Rol</dt>
            <dd className="mt-1 text-brand-ink">{cuenta.rolNombre ?? '—'}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-brand-muted">La clave no se vuelve a mostrar: cópiala y entrégasela a la persona antes de salir de esta pantalla.</p>

        {aviso && (
          <div className="mt-4">
            <AvisoBanner aviso={aviso} onCerrar={() => setAviso(null)} />
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => copiarAcceso(cuenta, clave)} className={botonPrimario}>
            {copiado ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copiado ? 'Copiado' : 'Copiar datos de acceso'}
          </button>
          <button type="button" onClick={() => { setAviso(null); setVista({ tipo: 'nueva' }); }} className={botonSecundario}>
            Crear otra cuenta
          </button>
          <button type="button" onClick={() => { setAviso(null); setVista({ tipo: 'lista' }); }} className={botonTexto}>
            Volver a la lista
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <div>
      {aviso && <AvisoBanner aviso={aviso} onCerrar={() => setAviso(null)} />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[15rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setPagina(0);
            }}
            placeholder="Buscar por nombre, usuario, correo o empresa"
            aria-label="Buscar cuentas"
            className={`${campo} pl-9`}
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            value={filtroEmpresa}
            onChange={(evento) => {
              setFiltroEmpresa(evento.target.value);
              setPagina(0);
            }}
            aria-label="Filtrar por empresa"
            className={campo}
          >
            <option value="">Todas las empresas</option>
            <option value={SIN_EMPRESA}>Sin empresa{sinEmpresa > 0 ? ` (${sinEmpresa})` : ''}</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.nombre}>
                {empresa.nombre}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => { setAviso(null); setVista({ tipo: 'nueva' }); }}
          disabled={!listoParaCrear}
          title={listoParaCrear ? undefined : 'Cargando las empresas y los roles…'}
          className={botonPrimario}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva cuenta
        </button>
      </div>

      {error ? (
        <Panel className="px-6 py-10 text-center">
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
          <button type="button" onClick={onRecargar} className={`${botonSecundario} mt-4`}>
            Reintentar
          </button>
        </Panel>
      ) : cuentas === null ? (
        <Panel className="px-6 py-12 text-center text-sm text-brand-muted">Cargando cuentas…</Panel>
      ) : filtradas.length === 0 ? (
        <Panel className="px-6 py-12 text-center">
          <p className="font-medium text-brand-ink">{cuentas.length === 0 ? 'Todavía no hay cuentas.' : 'Ninguna cuenta coincide con la búsqueda.'}</p>
          {cuentas.length > 0 && (
            <button type="button" onClick={() => { setBusqueda(''); setFiltroEmpresa(''); setPagina(0); }} className={`${botonSecundario} mt-4`}>
              Quitar los filtros
            </button>
          )}
        </Panel>
      ) : (
        <Panel className={`overflow-hidden ${cargando ? 'opacity-70' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-brand-muted">
                  <th scope="col" className="px-5 py-3">Cuenta</th>
                  <th scope="col" className="px-3 py-3">Correo</th>
                  <th scope="col" className="px-3 py-3">Empresa</th>
                  <th scope="col" className="px-3 py-3">Rol</th>
                  <th scope="col" className="px-3 py-3">Estado</th>
                  <th scope="col" className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibles.map((cuenta) => {
                  const propia = cuenta.usuario.toLowerCase() === usuarioActual.toLowerCase();
                  return (
                    <tr key={cuenta.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className={`font-medium ${cuenta.activo ? 'text-brand-ink' : 'text-slate-500'}`}>
                          {cuenta.nombreCompleto || cuenta.usuario}
                          {propia && <span className="ml-2 text-xs font-normal text-brand-muted">(tú)</span>}
                        </p>
                        <p className="font-mono text-[13px] text-brand-muted">{cuenta.usuario}</p>
                      </td>
                      <td className="max-w-[14rem] truncate px-3 py-3 text-brand-muted" title={cuenta.correo}>
                        {cuenta.correo}
                      </td>
                      <td className="px-3 py-3">
                        {cuenta.empresa?.trim() ? (
                          <span className="text-brand-ink">{cuenta.empresa}</span>
                        ) : (
                          <span className="text-amber-800" title="Sin empresa no puede usar Registro de operaciones">
                            Sin empresa
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-brand-muted">{cuenta.rolNombre ?? '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 ${cuenta.activo ? 'text-brand-ink' : 'text-slate-500'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cuenta.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true" />
                          {cuenta.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => setEditando(cuenta)} className={`${botonTexto} whitespace-nowrap`}>
                            Editar
                          </button>
                          {cuenta.activo ? (
                            <button
                              type="button"
                              onClick={() => setDesactivando(cuenta)}
                              disabled={propia || procesando === cuenta.id}
                              title={propia ? 'No puedes desactivar tu propia cuenta' : undefined}
                              className={`${botonTexto} whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40`}
                            >
                              Desactivar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => cambiarEstado(cuenta, true)}
                              disabled={procesando === cuenta.id}
                              className={`${botonTexto} whitespace-nowrap disabled:opacity-50`}
                            >
                              Activar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-sm text-brand-muted">
            <p aria-live="polite">
              Mostrando {desde}–{hasta} de {filtradas.length}
              {filtradas.length !== (cuentas?.length ?? 0) ? ` (${cuentas?.length ?? 0} en total)` : ''}
            </p>
            {totalPaginas > 1 && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPagina(Math.max(0, paginaActual - 1))} disabled={paginaActual === 0} className={botonSecundario}>
                  Anterior
                </button>
                <button type="button" onClick={() => setPagina(paginaActual + 1)} disabled={paginaActual + 1 >= totalPaginas} className={botonSecundario}>
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </Panel>
      )}

      {editando && (
        <EditarCuentaModal
          cuenta={editando}
          empresas={empresas}
          roles={roles}
          onCerrar={() => setEditando(null)}
          onGuardado={(resumen) => {
            const cuenta = editando;
            setEditando(null);
            setAviso({ tipo: 'ok', texto: `Se actualizó la cuenta ${cuenta.usuario}: ${resumen}.` });
            onRecargar();
          }}
        />
      )}

      {desactivando && (
        <Modal
          titulo="Desactivar cuenta"
          subtitulo={`${desactivando.nombreCompleto || desactivando.usuario} · ${desactivando.usuario}`}
          onCerrar={() => setDesactivando(null)}
          pie={
            <>
              <button type="button" onClick={() => setDesactivando(null)} className={botonSecundario}>
                Cancelar
              </button>
              <button type="button" onClick={() => cambiarEstado(desactivando, false)} disabled={procesando === desactivando.id} className={botonPrimario}>
                {procesando === desactivando.id ? 'Desactivando…' : 'Desactivar'}
              </button>
            </>
          }
        >
          <p className="text-sm text-brand-ink">No podrá entrar a la plataforma hasta que la actives de nuevo. Sus registros y su historial se conservan.</p>
        </Modal>
      )}
    </div>
  );
}
