'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Receipt } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import {
  operacionesService,
  mensajeDeErrorOperaciones,
  type OperacionItem,
  type UsuarioOperacion,
} from '@/modules/operaciones/services/operacionesService';
import { esAdministrador } from '@/shared/lib/modulos';
import { PageHeader, PageShell, Panel } from '@/shared/ui/PageShell';
import { Aviso, Boton, Esqueleto, EstadoVacio, type AvisoDatos } from '@/shared/ui/kit';
import { CambiarResponsableModal } from './CambiarResponsableModal';
import { OperacionForm } from './OperacionForm';
import { OperacionesLista } from './OperacionesLista';

type Vista = { tipo: 'lista' } | { tipo: 'nuevo' } | { tipo: 'editar'; id: number };

export function OperacionesWorkspace() {
  const { usuario } = useAuth();
  const [datosUsuario, setDatosUsuario] = useState<UsuarioOperacion | null>(null);
  const [errorUsuario, setErrorUsuario] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>({ tipo: 'lista' });
  const [version, setVersion] = useState(0);
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const [cambiandoResponsable, setCambiandoResponsable] = useState<OperacionItem | null>(null);
  // El listado del backend todavía no informa el responsable de cada registro: se recuerdan los que se cambian en esta sesión.
  const [asignados, setAsignados] = useState<Record<number, string>>({});

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

  const volverALaLista = (nuevoAviso?: AvisoDatos) => {
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
        antetitulo={listo ? datosUsuario.empresa : 'Registro de operaciones'}
        icono={Receipt}
        titulo={titulo}
        descripcion={descripcion}
        acciones={
          vista.tipo === 'lista' && listo ? (
            <Boton icono={Plus} onClick={() => { setAviso(null); setVista({ tipo: 'nuevo' }); }}>Nueva operación</Boton>
          ) : null
        }
      />

      {aviso && <Aviso aviso={aviso} onCerrar={() => setAviso(null)} className="mb-5" />}

      {errorUsuario && (
        <Panel>
          <EstadoVacio icono={Receipt} titulo="No se pudieron cargar tus datos" texto={errorUsuario} />
        </Panel>
      )}

      {!errorUsuario && datosUsuario === null && (
        <Panel relleno>
          <Esqueleto lineas={5} />
        </Panel>
      )}

      {sinEmpresa && (
        <Panel>
          <EstadoVacio
            icono={Building2}
            titulo="Tu usuario no tiene una empresa asignada"
            texto={
              esAdministrador(usuario) ? (
                <>Asígnatela en <Link href="/administracion" className="font-medium text-brand-ink underline underline-offset-2">Administración</Link> (Cuentas → Editar) para poder ver y registrar operaciones.</>
              ) : (
                'Pídele a un administrador que te la asigne para poder ver y registrar operaciones.'
              )
            }
          />
        </Panel>
      )}

      {listo && vista.tipo === 'lista' && (
        <OperacionesLista
          empresa={datosUsuario.empresa}
          version={version}
          asignados={asignados}
          onNuevo={() => setVista({ tipo: 'nuevo' })}
          onEditar={(id) => { setAviso(null); setVista({ tipo: 'editar', id }); }}
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
          onGuardado={(nombreCompleto) => {
            const { id, numeroRegistro } = cambiandoResponsable;
            setAsignados((actuales) => ({ ...actuales, [id]: nombreCompleto }));
            setCambiandoResponsable(null);
            setAviso({ tipo: 'ok', texto: `El responsable del registro ${numeroRegistro ?? id} ahora es ${nombreCompleto}.` });
            setVersion((actual) => actual + 1);
          }}
        />
      )}
    </PageShell>
  );
}
