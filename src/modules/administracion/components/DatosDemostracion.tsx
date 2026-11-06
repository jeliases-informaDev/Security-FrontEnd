'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mensajeDeError } from '@/modules/administracion/services/administracionService';
import { useResumenInicio } from '@/modules/inicio/hooks/useResumenInicio';
import { esDemoSinPermiso, inicioService, type ConteoDemo } from '@/modules/inicio/services/inicioService';
import { IconoDerecha } from '@/shared/ui/iconos';
import { Aviso, Boton, Etiqueta, type AvisoDatos } from '@/shared/ui/kit';
import { Modal } from '@/shared/ui/Modal';
import { Panel } from '@/shared/ui/PageShell';

/** Cómo se llama cada tipo de dato de demostración en una frase; lo que no se conoce se muestra con el nombre que manda el servidor. */
const NOMBRE_DEMO: Record<string, string> = {
  consultas: 'consultas de listas negativas',
  registros: 'registros de operaciones',
  denuncias: 'denuncias',
};

/** «312 consultas de listas negativas, 64 registros de operaciones y 24 denuncias»; vacío si no hay nada que contar. */
function conteoTexto(conteo: ConteoDemo | null | undefined): string {
  const partes = Object.entries(conteo ?? {})
    .filter(([, cantidad]) => typeof cantidad === 'number' && cantidad > 0)
    .map(([clave, cantidad]) => `${cantidad.toLocaleString('en-US')} ${NOMBRE_DEMO[clave] ?? clave}`);
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

/**
 * Datos de demostración (pie de Administración). Solo la ve el administrador universal: el servidor lo dice en
 * `resumen.demo.puedeGestionar`, y cualquier otra cuenta no ve nada. Cargarlos llena Inicio con datos de ejemplo de la empresa;
 * quitarlos borra únicamente lo que creó la demostración (el servidor lo tiene marcado), nunca datos reales.
 */
export function DatosDemostracion() {
  const { datos, recargar } = useResumenInicio();
  const [haciendo, setHaciendo] = useState<'cargar' | 'quitar' | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  // Lo último que contestó el servidor: así los botones cambian al instante, sin esperar a que se vuelva a pedir el resumen.
  const [cargadoAhora, setCargadoAhora] = useState<boolean | null>(null);

  if (!datos?.demo.puedeGestionar) return null;
  const cargado = cargadoAhora ?? datos.demo.cargado;

  const fallo = (error: unknown): AvisoDatos => ({
    tipo: 'error',
    texto: esDemoSinPermiso(error)
      ? 'Solo el administrador universal de Sulotec puede cargar o quitar los datos de demostración.'
      : mensajeDeError(error, 'No se pudo completar la acción. Inténtalo de nuevo.'),
  });

  const cargar = async () => {
    setHaciendo('cargar');
    setAviso(null);
    try {
      const respuesta = await inicioService.cargarDemo();
      setCargadoAhora(typeof respuesta.cargado === 'boolean' ? respuesta.cargado : true);
      const lista = conteoTexto(respuesta.creados);
      setAviso({
        tipo: 'ok',
        texto: respuesta.yaEstaba
          ? 'Los datos de demostración ya estaban cargados: no se duplicó nada.'
          : `Datos de demostración cargados${lista ? `: ${lista}` : ''}. Ya puedes verlos en Inicio.`,
      });
      recargar();
    } catch (error) {
      setAviso(fallo(error));
    } finally {
      setHaciendo(null);
    }
  };

  const quitar = async () => {
    setHaciendo('quitar');
    setAviso(null);
    try {
      const respuesta = await inicioService.quitarDemo();
      setCargadoAhora(typeof respuesta.cargado === 'boolean' ? respuesta.cargado : false);
      const lista = conteoTexto(respuesta.eliminados);
      setAviso({
        tipo: 'ok',
        texto: lista ? `Datos de demostración quitados: ${lista}. Los datos reales no se tocaron.` : 'No había datos de demostración que quitar.',
      });
      recargar();
    } catch (error) {
      setAviso(fallo(error));
    } finally {
      setHaciendo(null);
      setConfirmando(false);
    }
  };

  return (
    <Panel
      className="mt-8"
      titulo="Datos de demostración"
      descripcion="Llena Inicio con datos de ejemplo para mostrar el producto sin tocar los datos reales de la empresa."
      acciones={<Etiqueta tono={cargado ? 'ok' : 'neutral'} punto>{cargado ? 'Cargados' : 'Sin cargar'}</Etiqueta>}
      relleno
    >
      <p className="max-w-3xl text-sm leading-relaxed text-muted">
        Al cargarlos, Inicio muestra consultas, registros de operaciones y denuncias de ejemplo, repartidos entre este mes y el anterior. Al quitarlos se borra solo lo que creó
        la demostración (está marcado): los datos reales nunca se tocan.
      </p>

      {aviso && <Aviso className="mt-4" aviso={aviso} onCerrar={() => setAviso(null)} />}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Boton onClick={cargar} cargando={haciendo === 'cargar'} disabled={cargado || haciendo !== null}>
          Cargar datos de demostración
        </Boton>
        <Boton variante="secundario" onClick={() => setConfirmando(true)} disabled={!cargado || haciendo !== null}>
          Quitar datos de demostración
        </Boton>
        <Link href="/overview" className="btn btn-ghost">
          Ir a Inicio <IconoDerecha className="h-4 w-4" />
        </Link>
      </div>

      {confirmando && (
        <Modal
          titulo="Quitar datos de demostración"
          onCerrar={() => (haciendo === null ? setConfirmando(false) : undefined)}
          pie={
            <>
              <Boton variante="secundario" onClick={() => setConfirmando(false)} disabled={haciendo !== null}>Cancelar</Boton>
              <Boton variante="peligro" onClick={quitar} cargando={haciendo === 'quitar'}>
                {haciendo === 'quitar' ? 'Quitando…' : 'Quitar'}
              </Boton>
            </>
          }
        >
          <p className="text-sm text-ink">
            Se borrarán las consultas, los registros de operaciones y las denuncias de ejemplo que creó la demostración. Los datos reales no se tocan, y Inicio quedará sin esos
            ejemplos.
          </p>
        </Modal>
      )}
    </Panel>
  );
}
