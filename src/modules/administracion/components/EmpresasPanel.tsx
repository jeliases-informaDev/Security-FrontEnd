'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { administracionService, mensajeDeError, type Empresa } from '@/modules/administracion/services/administracionService';
import { Panel } from '@/shared/ui/PageShell';
import { botonPrimario, botonSecundario, botonTexto, campo, campoError, etiqueta, mensajeError } from '@/shared/ui/estilos';
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

      <Panel className="p-5 sm:p-6">
        <form onSubmit={agregar} noValidate className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[2fr_1fr_auto]">
          <div>
            <label htmlFor="empresa-nombre" className={etiqueta}>
              Nueva empresa
            </label>
            <input
              id="empresa-nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              autoComplete="off"
              placeholder="Nombre tal como debe aparecer"
              className={`${campo} ${errorNombre ? campoError : ''}`}
            />
            {errorNombre && (
              <p role="alert" className={mensajeError}>
                {errorNombre}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="empresa-ruc" className={etiqueta}>
              RUC (opcional)
            </label>
            <input
              id="empresa-ruc"
              value={ruc}
              onChange={(evento) => setRuc(evento.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              maxLength={11}
              autoComplete="off"
              className={`${campo} font-mono ${errorRuc ? campoError : ''}`}
            />
            {errorRuc && (
              <p role="alert" className={mensajeError}>
                {errorRuc}
              </p>
            )}
          </div>
          <button type="submit" disabled={guardando} className={`${botonPrimario} sm:mt-7`}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {guardando ? 'Agregando…' : 'Agregar'}
          </button>
        </form>
        <p className="mt-3 text-xs text-brand-muted">
          El nombre no se puede cambiar después. Si te equivocas al escribirlo, agrega la empresa correcta, pasa las cuentas a ella y desactiva la anterior.
        </p>
      </Panel>

      {error ? (
        <Panel className="px-6 py-10 text-center">
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
          <button type="button" onClick={onRecargar} className={`${botonSecundario} mt-4`}>
            Reintentar
          </button>
        </Panel>
      ) : empresas === null ? (
        <Panel className="px-6 py-12 text-center text-sm text-brand-muted">Cargando empresas…</Panel>
      ) : empresas.length === 0 ? (
        <Panel className="px-6 py-12 text-center">
          <p className="font-medium text-brand-ink">Todavía no hay empresas.</p>
          <p className="mt-1 text-sm text-brand-muted">Agrega la primera arriba para poder crear cuentas.</p>
        </Panel>
      ) : (
        <Panel className={`overflow-hidden ${cargando ? 'opacity-70' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-brand-muted">
                  <th scope="col" className="px-5 py-3">Empresa</th>
                  <th scope="col" className="px-3 py-3">RUC</th>
                  <th scope="col" className="px-3 py-3 text-right">Cuentas</th>
                  <th scope="col" className="px-3 py-3">Estado</th>
                  <th scope="col" className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empresas.map((empresa) => (
                  <tr key={empresa.id} className="transition hover:bg-slate-50">
                    <td className={`px-5 py-3 font-medium ${empresa.activa ? 'text-brand-ink' : 'text-slate-500'}`}>{empresa.nombre}</td>
                    <td className="px-3 py-3 font-mono text-[13px] text-brand-muted">{empresa.ruc ?? '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-brand-ink">{empresa.cuentas}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1.5 ${empresa.activa ? 'text-brand-ink' : 'text-slate-500'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${empresa.activa ? 'bg-emerald-500' : 'bg-slate-400'}`} aria-hidden="true" />
                        {empresa.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => setEditando(empresa)} className={`${botonTexto} whitespace-nowrap`}>
                          Editar RUC
                        </button>
                        <button
                          type="button"
                          onClick={() => alternarEstado(empresa)}
                          disabled={cambiando === empresa.id}
                          className={`${botonTexto} whitespace-nowrap disabled:opacity-50`}
                        >
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
