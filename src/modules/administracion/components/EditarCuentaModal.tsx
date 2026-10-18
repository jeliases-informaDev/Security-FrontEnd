'use client';

import { useState } from 'react';
import { administracionService, mensajeDeError, type Cuenta, type Empresa, type Rol } from '@/modules/administracion/services/administracionService';
import { Modal } from '@/shared/ui/Modal';
import { botonPrimario, botonSecundario, campo, etiqueta } from '@/shared/ui/estilos';

interface EditarCuentaModalProps {
  cuenta: Cuenta;
  empresas: Empresa[];
  roles: Rol[];
  onCerrar: () => void;
  /** Recibe un resumen de lo que cambió, para mostrarlo en el aviso. */
  onGuardado: (resumen: string) => void;
}

/** Cambia la empresa y el rol de una cuenta. Solo se llama a la API por lo que realmente cambió. */
export function EditarCuentaModal({ cuenta, empresas, roles, onCerrar, onGuardado }: EditarCuentaModalProps) {
  const [empresa, setEmpresa] = useState(cuenta.empresa ?? '');
  const [rolCodigo, setRolCodigo] = useState(cuenta.rolCodigo ?? '');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Se ofrecen las empresas activas; la actual se conserva en la lista aunque ya esté inactiva (o no figure) para no perderla al editar.
  const activas = empresas.filter((item) => item.activa);
  const actual = cuenta.empresa ?? '';
  const hayActualFueraDeLista = actual !== '' && !activas.some((item) => item.nombre.toLowerCase() === actual.toLowerCase());

  const cambioEmpresa = empresa !== '' && empresa.toLowerCase() !== actual.toLowerCase();
  const cambioRol = rolCodigo !== '' && rolCodigo !== (cuenta.rolCodigo ?? '');

  const guardar = async () => {
    if (!cambioEmpresa && !cambioRol) {
      onCerrar();
      return;
    }
    setGuardando(true);
    setError(null);
    const cambios: string[] = [];
    try {
      if (cambioEmpresa) {
        await administracionService.cambiarEmpresaDeCuenta(cuenta.id, empresa);
        cambios.push(`empresa ${empresa}`);
      }
      if (cambioRol) {
        await administracionService.cambiarRolDeCuenta(cuenta.id, rolCodigo);
        cambios.push(`rol ${roles.find((rol) => rol.codigo === rolCodigo)?.nombre ?? rolCodigo}`);
      }
      onGuardado(cambios.join(' y '));
    } catch (err) {
      // Si la empresa ya se cambió y falló el rol, la lista se vuelve a pedir al cerrar para no mostrar datos viejos.
      setError(mensajeDeError(err, 'No se pudieron guardar los cambios. Inténtalo de nuevo.'));
      setGuardando(false);
      if (cambios.length > 0) onGuardado(cambios.join(' y '));
    }
  };

  return (
    <Modal
      titulo="Editar cuenta"
      subtitulo={`${cuenta.nombreCompleto || cuenta.usuario} · ${cuenta.usuario}`}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" onClick={onCerrar} className={botonSecundario}>
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={guardando || (!cambioEmpresa && !cambioRol)} className={botonPrimario}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div>
        <label htmlFor="cuenta-empresa" className={etiqueta}>
          Empresa
        </label>
        <select id="cuenta-empresa" value={empresa} onChange={(evento) => setEmpresa(evento.target.value)} disabled={guardando} className={campo}>
          {actual === '' && <option value="">Sin empresa: elige una</option>}
          {hayActualFueraDeLista && <option value={actual}>{actual} (no está en la lista)</option>}
          {activas.map((item) => (
            <option key={item.id} value={item.nombre}>
              {item.nombre}
            </option>
          ))}
        </select>
        {cambioEmpresa && actual !== '' && (
          <p className="mt-1.5 text-xs text-warn">
            Los registros de operaciones que esta cuenta ya hizo pasarán a la nueva empresa y dejarán de verse en {actual}.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="cuenta-rol" className={etiqueta}>
          Rol
        </label>
        <select id="cuenta-rol" value={rolCodigo} onChange={(evento) => setRolCodigo(evento.target.value)} disabled={guardando} className={campo}>
          {(cuenta.rolCodigo ?? '') === '' && <option value="">Sin rol: elige uno</option>}
          {roles.map((rol) => (
            <option key={rol.codigo} value={rol.codigo}>
              {rol.nombre}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-bad/20 bg-bad-soft px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
    </Modal>
  );
}
