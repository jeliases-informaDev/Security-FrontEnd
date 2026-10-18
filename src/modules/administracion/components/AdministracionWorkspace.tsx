'use client';

import { useState } from 'react';
import { Settings2, ShieldOff } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { useRecurso } from '@/modules/administracion/hooks/useRecurso';
import { administracionService } from '@/modules/administracion/services/administracionService';
import { esAdministrador } from '@/shared/lib/modulos';
import { PageHeader, PageShell, Panel } from '@/shared/ui/PageShell';
import { EstadoVacio, Pestanas } from '@/shared/ui/kit';
import { CuentasPanel } from './CuentasPanel';
import { EmpresasPanel } from './EmpresasPanel';

type Pestana = 'cuentas' | 'empresas';

const DESCRIPCION =
  'Crea las cuentas de acceso y administra las empresas a las que pertenecen. Cada cuenta solo ve los registros de operaciones de su empresa.';

function Contenido({ usuarioActual }: { usuarioActual: string }) {
  const [pestana, setPestana] = useState<Pestana>('cuentas');
  const empresas = useRecurso(administracionService.listarEmpresas, 'No se pudo cargar la lista de empresas.');
  const cuentas = useRecurso(administracionService.listarCuentas, 'No se pudieron cargar las cuentas.');
  const roles = useRecurso(administracionService.listarRoles, 'No se pudieron cargar los roles.');

  // Crear una cuenta cambia el conteo de cuentas de las empresas, y al revés: se piden las dos listas.
  const recargarTodo = () => {
    cuentas.recargar();
    empresas.recargar();
  };

  return (
    <PageShell>
      <PageHeader antetitulo="Plataforma" icono={Settings2} titulo="Administración" sinLinea descripcion={DESCRIPCION} />

      <Pestanas
        ariaLabel="Secciones de administración"
        valor={pestana}
        onCambiar={setPestana}
        opciones={[
          { valor: 'cuentas', etiqueta: 'Cuentas', conteo: cuentas.datos?.length },
          { valor: 'empresas', etiqueta: 'Empresas', conteo: empresas.datos?.length },
        ]}
      />

      {pestana === 'cuentas' && (
        <CuentasPanel
          cuentas={cuentas.datos}
          cargando={cuentas.cargando}
          error={cuentas.error}
          empresas={empresas.datos ?? []}
          roles={roles.datos ?? []}
          listoParaCrear={empresas.datos !== null && roles.datos !== null}
          usuarioActual={usuarioActual}
          onRecargar={recargarTodo}
          onIrAEmpresas={() => setPestana('empresas')}
        />
      )}

      {pestana === 'empresas' && (
        <EmpresasPanel empresas={empresas.datos} cargando={empresas.cargando} error={empresas.error} onRecargar={recargarTodo} />
      )}
    </PageShell>
  );
}

export function AdministracionWorkspace() {
  const { usuario } = useAuth();

  if (!usuario) return null;

  // Las llamadas de esta pantalla solo las acepta el backend para administradores: a los demás ni se les piden.
  if (!esAdministrador(usuario)) {
    return (
      <PageShell>
        <PageHeader antetitulo="Plataforma" icono={Settings2} titulo="Administración" />
        <Panel>
          <EstadoVacio icono={ShieldOff} titulo="Esta sección es solo para administradores" texto="Si necesitas una cuenta nueva o cambiar la empresa de una, pídeselo a un administrador." />
        </Panel>
      </PageShell>
    );
  }

  return <Contenido usuarioActual={usuario.usuario} />;
}
