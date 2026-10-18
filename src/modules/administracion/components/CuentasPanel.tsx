'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, KeyRound, Plus, Search, SearchX, UserRound, Users } from 'lucide-react';
import { administracionService, mensajeDeError, type Cuenta, type Empresa, type Rol } from '@/modules/administracion/services/administracionService';
import { Modal } from '@/shared/ui/Modal';
import { Panel } from '@/shared/ui/PageShell';
import { Avatar, Boton, Esqueleto, EstadoVacio, Etiqueta, Paginacion } from '@/shared/ui/kit';
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
      <Panel className="aparece max-w-2xl" titulo="Cuenta creada" descripcion="Entrega estos datos a la persona antes de salir de esta pantalla." relleno>
        <div className="flex items-center gap-3">
          <Avatar nombre={cuenta.nombreCompleto || cuenta.usuario} tamano="lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{cuenta.nombreCompleto || cuenta.usuario}</p>
            <p className="text-sm text-muted">{[cuenta.rolNombre, cuenta.empresa].filter(Boolean).join(' · ') || 'Sin rol ni empresa'}</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface-2/60 p-4">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted"><UserRound className="h-3.5 w-3.5" aria-hidden="true" /> Usuario</dt>
            <dd className="mt-1 break-all font-mono text-[15px] text-ink">{cuenta.usuario}</dd>
          </div>
          <div className="rounded-xl border border-line bg-surface-2/60 p-4">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted"><KeyRound className="h-3.5 w-3.5" aria-hidden="true" /> Clave inicial</dt>
            <dd className="mt-1 break-all font-mono text-[15px] text-ink">{clave}</dd>
          </div>
        </dl>
        <p className="hint mt-3">La clave no se vuelve a mostrar: cópiala ahora.</p>

        {aviso && <AvisoBanner aviso={aviso} onCerrar={() => setAviso(null)} />}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Boton icono={copiado ? Check : Copy} onClick={() => copiarAcceso(cuenta, clave)}>{copiado ? 'Copiado' : 'Copiar datos de acceso'}</Boton>
          <Boton variante="secundario" onClick={() => { setAviso(null); setVista({ tipo: 'nueva' }); }}>Crear otra cuenta</Boton>
          <Boton variante="fantasma" onClick={() => { setAviso(null); setVista({ tipo: 'lista' }); }}>Volver a la lista</Boton>
        </div>
      </Panel>
    );
  }

  const hayFiltros = busqueda.trim() !== '' || filtroEmpresa !== '';

  return (
    <div>
      {aviso && <AvisoBanner aviso={aviso} onCerrar={() => setAviso(null)} />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[15rem] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => { setBusqueda(evento.target.value); setPagina(0); }}
            placeholder="Buscar por nombre, usuario, correo o empresa…"
            aria-label="Buscar cuentas"
            autoComplete="off"
            className="input pl-10"
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            value={filtroEmpresa}
            onChange={(evento) => { setFiltroEmpresa(evento.target.value); setPagina(0); }}
            aria-label="Filtrar por empresa"
            className="input"
          >
            <option value="">Todas las empresas</option>
            <option value={SIN_EMPRESA}>Sin empresa{sinEmpresa > 0 ? ` (${sinEmpresa})` : ''}</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.nombre}>{empresa.nombre}</option>
            ))}
          </select>
        </div>
        <Boton icono={Plus} onClick={() => { setAviso(null); setVista({ tipo: 'nueva' }); }} disabled={!listoParaCrear} title={listoParaCrear ? undefined : 'Cargando las empresas y los roles…'}>
          Nueva cuenta
        </Boton>
      </div>

      {error ? (
        <Panel>
          <EstadoVacio icono={Users} titulo="No se pudieron cargar las cuentas" texto={error} accion={<Boton variante="secundario" onClick={onRecargar}>Reintentar</Boton>} />
        </Panel>
      ) : cuentas === null ? (
        <Panel relleno>
          <Esqueleto lineas={6} />
        </Panel>
      ) : filtradas.length === 0 ? (
        <Panel>
          {cuentas.length === 0 ? (
            <EstadoVacio icono={Users} titulo="Todavía no hay cuentas" texto="Crea la primera con el botón «Nueva cuenta»." />
          ) : (
            <EstadoVacio
              icono={SearchX}
              titulo="Ninguna cuenta coincide con la búsqueda"
              texto="Prueba con otro nombre o quita los filtros."
              accion={hayFiltros ? <Boton variante="secundario" onClick={() => { setBusqueda(''); setFiltroEmpresa(''); setPagina(0); }}>Quitar los filtros</Boton> : undefined}
            />
          )}
        </Panel>
      ) : (
        <Panel className={cargando ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
          <div className="overflow-x-auto">
            <table className="tabla min-w-[52rem]">
              <thead>
                <tr>
                  <th scope="col">Cuenta</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Empresa</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((cuenta) => {
                  const propia = cuenta.usuario.toLowerCase() === usuarioActual.toLowerCase();
                  return (
                    <tr key={cuenta.id} className={cuenta.activo ? '' : 'opacity-70'}>
                      <td>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar nombre={cuenta.nombreCompleto || cuenta.usuario} tamano="sm" className={cuenta.activo ? '' : 'grayscale'} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">
                              {cuenta.nombreCompleto || cuenta.usuario}
                              {propia && <span className="ml-2 text-xs font-normal text-muted">(tú)</span>}
                            </p>
                            <p className="font-mono text-[13px] text-muted">{cuenta.usuario}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[14rem] truncate text-muted" title={cuenta.correo}>{cuenta.correo}</td>
                      <td>
                        {cuenta.empresa?.trim() ? (
                          <span className="text-ink">{cuenta.empresa}</span>
                        ) : (
                          <Etiqueta tono="warn" className="whitespace-nowrap">
                            <span title="Sin empresa no puede usar Registro de operaciones">Sin empresa</span>
                          </Etiqueta>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-muted">{cuenta.rolNombre ?? '—'}</td>
                      <td className="whitespace-nowrap">
                        <Etiqueta tono={cuenta.activo ? 'ok' : 'neutral'} punto>{cuenta.activo ? 'Activa' : 'Inactiva'}</Etiqueta>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => setEditando(cuenta)} className="btn btn-ghost btn-sm whitespace-nowrap">Editar</button>
                          {cuenta.activo ? (
                            <button
                              type="button"
                              onClick={() => setDesactivando(cuenta)}
                              disabled={propia || procesando === cuenta.id}
                              title={propia ? 'No puedes desactivar tu propia cuenta' : undefined}
                              className="btn btn-ghost btn-sm whitespace-nowrap"
                            >
                              Desactivar
                            </button>
                          ) : (
                            <button type="button" onClick={() => cambiarEstado(cuenta, true)} disabled={procesando === cuenta.id} className="btn btn-ghost btn-sm whitespace-nowrap">
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

          <Paginacion
            desde={desde}
            hasta={hasta}
            total={filtradas.length}
            pagina={paginaActual}
            totalPaginas={totalPaginas}
            onCambiar={setPagina}
            extra={filtradas.length !== cuentas.length ? ` (${cuentas.length} en total)` : null}
          />
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
              <Boton variante="secundario" onClick={() => setDesactivando(null)}>Cancelar</Boton>
              <Boton variante="peligro" onClick={() => cambiarEstado(desactivando, false)} cargando={procesando === desactivando.id}>
                {procesando === desactivando.id ? 'Desactivando…' : 'Desactivar'}
              </Boton>
            </>
          }
        >
          <p className="text-sm text-ink">No podrá entrar a la plataforma hasta que la actives de nuevo. Sus registros y su historial se conservan.</p>
        </Modal>
      )}
    </div>
  );
}
