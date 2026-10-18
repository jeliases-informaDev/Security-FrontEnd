'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Building2, Plus } from 'lucide-react';
import { administracionService, mensajeDeError, type Empresa } from '@/modules/administracion/services/administracionService';
import { Panel } from '@/shared/ui/PageShell';
import { Boton, Esqueleto, EstadoVacio, Etiqueta } from '@/shared/ui/kit';
import { AvisoBanner, type Aviso } from './AvisoBanner';
import { EditarRucModal } from './EditarRucModal';

const RUC = /^\d{11}$/;

interface EmpresasPanelProps {
  empresas: Empresa[] | null;
  cargando: boolean;
  error: string | null;
  onRecargar: () => void;
}

export function EmpresasPanel({ empresas, cargando, error, onRecargar }: EmpresasPanelProps) {
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorRuc, setErrorRuc] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [editando, setEditando] = useState<Empresa | null>(null);
  const [cambiando, setCambiando] = useState<number | null>(null);

  const agregar = async (evento: FormEvent) => {
    evento.preventDefault();
    const nombreLimpio = nombre.trim();
    const rucLimpio = ruc.trim();
    setErrorNombre(nombreLimpio === '' ? 'Escribe el nombre de la empresa.' : null);
    setErrorRuc(rucLimpio !== '' && !RUC.test(rucLimpio) ? 'El RUC debe tener 11 dígitos.' : null);
    if (nombreLimpio === '' || (rucLimpio !== '' && !RUC.test(rucLimpio))) return;

    setGuardando(true);
    setAviso(null);
    try {
      const creada = await administracionService.crearEmpresa(nombreLimpio, rucLimpio === '' ? null : rucLimpio);
      setNombre('');
      setRuc('');
      setAviso({ tipo: 'ok', texto: `Se agregó la empresa ${creada.nombre}. Ya puedes elegirla al crear cuentas.` });
      onRecargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeDeError(err, 'No se pudo agregar la empresa. Inténtalo de nuevo.') });
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstado = async (empresa: Empresa) => {
    setCambiando(empresa.id);
    setAviso(null);
    try {
      await administracionService.cambiarEstadoEmpresa(empresa.id, !empresa.activa);
      setAviso({
        tipo: 'ok',
        texto: empresa.activa
          ? `${empresa.nombre} ya no se ofrece al crear cuentas. Las cuentas que tiene siguen funcionando.`
          : `${empresa.nombre} vuelve a ofrecerse al crear cuentas.`,
      });
      onRecargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeDeError(err, 'No se pudo cambiar el estado de la empresa. Inténtalo de nuevo.') });
    } finally {
      setCambiando(null);
    }
  };

  return (
    <div className="space-y-6">
      {aviso && <AvisoBanner aviso={aviso} onCerrar={() => setAviso(null)} />}

      <Panel titulo="Agregar una empresa" descripcion="Las cuentas se asignan a una empresa y solo ven sus propios registros." relleno>
        <form onSubmit={agregar} noValidate className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[2fr_1fr_auto]">
          <div>
            <label htmlFor="empresa-nombre" className="label">Nombre</label>
            <input
              id="empresa-nombre"
              name="nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              autoComplete="off"
              placeholder="Tal como debe aparecer…"
              aria-invalid={Boolean(errorNombre)}
              className={`input ${errorNombre ? 'input-error' : ''}`}
            />
            {errorNombre && <p role="alert" className="error-text">{errorNombre}</p>}
          </div>
          <div>
            <label htmlFor="empresa-ruc" className="label">RUC (opcional)</label>
            <input
              id="empresa-ruc"
              name="ruc"
              value={ruc}
              onChange={(evento) => setRuc(evento.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              maxLength={11}
              autoComplete="off"
              spellCheck={false}
              placeholder="11 dígitos…"
              aria-invalid={Boolean(errorRuc)}
              className={`input font-mono ${errorRuc ? 'input-error' : ''}`}
            />
            {errorRuc && <p role="alert" className="error-text">{errorRuc}</p>}
          </div>
          <Boton type="submit" icono={Plus} cargando={guardando} className="sm:mt-7">{guardando ? 'Agregando…' : 'Agregar'}</Boton>
        </form>
        <p className="hint mt-3">
          El nombre no se puede cambiar después. Si te equivocas al escribirlo, agrega la empresa correcta, pasa las cuentas a ella y desactiva la anterior.
        </p>
      </Panel>

      {error ? (
        <Panel>
          <EstadoVacio icono={Building2} titulo="No se pudieron cargar las empresas" texto={error} accion={<Boton variante="secundario" onClick={onRecargar}>Reintentar</Boton>} />
        </Panel>
      ) : empresas === null ? (
        <Panel relleno>
          <Esqueleto lineas={4} />
        </Panel>
      ) : empresas.length === 0 ? (
        <Panel>
          <EstadoVacio icono={Building2} titulo="Todavía no hay empresas" texto="Agrega la primera arriba para poder crear cuentas." />
        </Panel>
      ) : (
        <Panel className={cargando ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
          <div className="overflow-x-auto">
            <table className="tabla min-w-[40rem]">
              <thead>
                <tr>
                  <th scope="col">Empresa</th>
                  <th scope="col">RUC</th>
                  <th scope="col" className="text-right">Cuentas</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((empresa) => (
                  <tr key={empresa.id} className={empresa.activa ? '' : 'opacity-70'}>
                    <td className="font-medium text-ink">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-ink" aria-hidden="true">
                          <Building2 className="h-4 w-4" />
                        </span>
                        {empresa.nombre}
                      </div>
                    </td>
                    <td className="font-mono text-[13px] text-muted">{empresa.ruc ?? '—'}</td>
                    <td className="text-right tabular-nums text-ink">{empresa.cuentas}</td>
                    <td>
                      <Etiqueta tono={empresa.activa ? 'ok' : 'neutral'} punto>{empresa.activa ? 'Activa' : 'Inactiva'}</Etiqueta>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => setEditando(empresa)} className="btn btn-ghost btn-sm whitespace-nowrap">Editar RUC</button>
                        <button type="button" onClick={() => alternarEstado(empresa)} disabled={cambiando === empresa.id} className="btn btn-ghost btn-sm whitespace-nowrap">
                          {empresa.activa ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {editando && (
        <EditarRucModal
          empresa={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={(empresa) => {
            setEditando(null);
            setAviso({ tipo: 'ok', texto: `Se guardó el RUC de ${empresa.nombre}.` });
            onRecargar();
          }}
        />
      )}
    </div>
  );
}
