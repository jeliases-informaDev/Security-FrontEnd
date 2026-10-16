'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import {
  operacionesService,
  mensajeDeErrorOperaciones,
  type OperacionItem,
  type UsuarioOperacion,
} from '@/modules/operaciones/services/operacionesService';
import { PageHeader, PageShell, Panel } from '@/shared/ui/PageShell';
import { botonPrimario } from '@/shared/ui/estilos';
import { CambiarResponsableModal } from './CambiarResponsableModal';
import { OperacionForm } from './OperacionForm';
import { OperacionesLista } from './OperacionesLista';

type Vista = { tipo: 'lista' } | { tipo: 'nuevo' } | { tipo: 'editar'; id: number };
type Aviso = { tipo: 'ok' | 'error'; texto: string };

export function OperacionesWorkspace() {
  const { usuario } = useAuth();
  const [datosUsuario, setDatosUsuario] = useState<UsuarioOperacion | null>(null);
  const [errorUsuario, setErrorUsuario] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>({ tipo: 'lista' });
  const [version, setVersion] = useState(0);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [cambiandoResponsable, setCambiandoResponsable] = useState<OperacionItem | null>(null);

  // Los registros pertenecen a la empresa del usuario: primero se averigua cuál es.
  useEffect(() => {
    if (!usuario) return;
    let vigente = true;
    operacionesService
      .obtenerUsuario(usuario.usuario)
      .then((datos) => {
        if (vigente) setDatosUsuario(datos);
      })
      .catch((err) => {
        if (vigente) setErrorUsuario(mensajeDeErrorOperaciones(err, 'No se pudieron cargar los datos de tu usuario. Inténtalo de nuevo.'));
      });
    return () => {
      vigente = false;
    };
  }, [usuario]);

  const volverALaLista = (nuevoAviso?: Aviso) => {
    setVista({ tipo: 'lista' });
    setAviso(nuevoAviso ?? null);
    setVersion((actual) => actual + 1);
  };

  const descargarPdf = async (operacion: OperacionItem) => {
    setAviso(null);
    try {
      const archivo = await operacionesService.descargarPdf(operacion.id);
      const direccion = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = direccion;
      enlace.download = `${operacion.numeroRegistro ?? `operacion-${operacion.id}`}.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(direccion), 10_000);
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo generar el PDF de ese registro. Inténtalo de nuevo.' });
    }
  };

  const sinEmpresa = datosUsuario !== null && datosUsuario.empresa.trim() === '';
  const listo = datosUsuario !== null && !sinEmpresa;

  const titulo = vista.tipo === 'nuevo' ? 'Nueva operación' : vista.tipo === 'editar' ? 'Editar registro' : 'Registro de operaciones';
  const descripcion =
    vista.tipo === 'lista'
      ? 'Bitácora de las operaciones de tu empresa, con su responsable y el PDF de cada registro.'
      : 'Completa los datos del registro. Los campos con error se marcan al guardar.';

  return (
    <PageShell>
      <PageHeader
        titulo={titulo}
        descripcion={descripcion}
        acciones={
          vista.tipo === 'lista' && listo ? (
            <button
              type="button"
              onClick={() => {
                setAviso(null);
                setVista({ tipo: 'nuevo' });
              }}
              className={botonPrimario}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nueva operación
            </button>
          ) : null
        }
      />

      {aviso && (
        <div
          role={aviso.tipo === 'error' ? 'alert' : 'status'}
          className={`mb-5 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            aviso.tipo === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <p>{aviso.texto}</p>
          <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar el aviso" className="shrink-0 opacity-70 transition hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorUsuario && (
        <Panel className="px-6 py-10 text-center">
          <p role="alert" className="text-sm text-red-700">
            {errorUsuario}
          </p>
        </Panel>
      )}

      {!errorUsuario && datosUsuario === null && <Panel className="px-6 py-12 text-center text-sm text-brand-muted">Cargando…</Panel>}

      {sinEmpresa && (
        <Panel className="px-6 py-12 text-center">
          <p className="font-medium text-brand-ink">Tu usuario no tiene una empresa asignada.</p>
          <p className="mt-1 text-sm text-brand-muted">Pídele a un administrador que la configure para poder ver y registrar operaciones.</p>
        </Panel>
      )}

      {listo && vista.tipo === 'lista' && (
        <OperacionesLista
          empresa={datosUsuario.empresa}
          version={version}
          onNuevo={() => setVista({ tipo: 'nuevo' })}
          onEditar={(id) => {
            setAviso(null);
            setVista({ tipo: 'editar', id });
          }}
          onCambiarResponsable={setCambiandoResponsable}
          onDescargarPdf={descargarPdf}
        />
      )}

      {listo && vista.tipo === 'nuevo' && (
        <OperacionForm
          usuario={datosUsuario}
          onCancelar={() => volverALaLista()}
          onGuardado={(numeroRegistro) => volverALaLista({ tipo: 'ok', texto: `Se guardó el registro ${numeroRegistro}.` })}
        />
      )}

      {listo && vista.tipo === 'editar' && (
        <OperacionForm
          usuario={datosUsuario}
          id={vista.id}
          onCancelar={() => volverALaLista()}
          onGuardado={(numeroRegistro) => volverALaLista({ tipo: 'ok', texto: `Se guardaron los cambios del registro ${numeroRegistro}.` })}
        />
      )}

      {listo && cambiandoResponsable && (
        <CambiarResponsableModal
          operacion={cambiandoResponsable}
          empresa={datosUsuario.empresa}
          onCerrar={() => setCambiandoResponsable(null)}
          onGuardado={() => {
            setCambiandoResponsable(null);
            setAviso({ tipo: 'ok', texto: 'Se cambió el responsable del registro.' });
            setVersion((actual) => actual + 1);
          }}
        />
      )}
    </PageShell>
  );
}
