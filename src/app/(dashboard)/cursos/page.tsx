import { GraduationCap } from 'lucide-react';
import { PageHeader, PageShell, Panel } from '@/shared/ui/PageShell';
import { EstadoVacio } from '@/shared/ui/kit';

export default function CursosPage() {
  return (
    <PageShell>
      <PageHeader antetitulo="Capacitación" titulo="Cursos" icono={GraduationCap} descripcion="Capacitación en prevención de lavado de activos." />
      <Panel>
        <EstadoVacio icono={GraduationCap} titulo="Este módulo aún no está disponible" texto="Cuando esté listo, aquí encontrarás los cursos asignados a tu cuenta y tu avance en cada uno." />
      </Panel>
    </PageShell>
  );
}
