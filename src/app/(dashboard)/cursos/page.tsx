import { PageHeader, PageShell, Panel } from '@/shared/ui/PageShell';

export default function CursosPage() {
  return (
    <PageShell>
      <PageHeader titulo="Cursos" descripcion="Capacitación en prevención de lavado de activos." />
      <Panel className="px-6 py-12 text-center">
        <p className="font-medium text-brand-ink">Este módulo aún no está disponible.</p>
        <p className="mt-1 text-sm text-brand-muted">Cuando esté listo, aquí encontrarás los cursos asignados.</p>
      </Panel>
    </PageShell>
  );
}
