'use client';

import { useState } from 'react';
import { Building2, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { useRecurso } from '@/modules/administracion/hooks/useRecurso';
import { administracionService } from '@/modules/administracion/services/administracionService';
import { esAdministrador } from '@/shared/lib/modulos';
import { PageHeader, PageShell, Panel } from '@/shared/ui/PageShell';
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

  const pestanas: { id: Pestana; nombre: string; icono: LucideIcon; total?: number }[] = [
    { id: 'cuentas', nombre: 'Cuentas', icono: UsersRound, total: cuentas.datos?.length },
    { id: 'empresas', nombre: 'Empresas', icono: Building2, total: empresas.datos?.length },
  ];

  return (
    <PageShell>
      <PageHeader titulo="Administración" sinLinea descripcion={DESCRIPCION} />

      <nav aria-label="Secciones de administración" className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-300/70">
        {pestanas.map((item) => {
          const Icono = item.icono;
          const activa = pestana === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPestana(item.id)}
              aria-current={activa ? 'page' : undefined}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm transition ${
                activa ? 'border-brand-navy font-medium text-brand-navy' : 'border-transparent text-brand-muted hover:border-slate-400 hover:text-brand-ink'
              }`}
            >
              <Icono className="h-4 w-4" aria-hidden="true" />
              {item.nombre}
              {item.total !== undefined && <span className="text-xs font-normal tabular-nums text-brand-muted">{item.total}</span>}
            </button>
          );
        })}
      </nav>

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
        <PageHeader titulo="Administración" />
        <Panel className="px-6 py-12 text-center">
          <p className="font-medium text-brand-ink">Esta sección es solo para administradores.</p>
          <p className="mt-1 text-sm text-brand-muted">Si necesitas una cuenta nueva o cambiar la empresa de una, pídeselo a un administrador.</p>
        </Panel>
      </PageShell>
    );
  }

  return <Contenido usuarioActual={usuario.usuario} />;
}
