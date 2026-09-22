import {
  Search,
  MessageSquareWarning,
  Gauge,
  LayoutGrid,
  Receipt,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

export interface ModuloDashboard {
  codigo: string;
  nombre: string;
  descripcion: string;
  href: string;
  icono: LucideIcon;
  disponible: boolean;
}

export const MODULOS_DASHBOARD: ModuloDashboard[] = [
  {
    codigo: 'listas-negativas',
    nombre: 'Listas Negativas',
    descripcion: 'PEP, Actos Ilícitos, Noticias y Listas Internacionales',
    href: '/listas-negativas',
    icono: Search,
    disponible: true,
  },
  {
    codigo: 'denuncias',
    nombre: 'Canal de Denuncias',
    descripcion: 'Reportes anónimos y seguimiento de casos',
    href: '/denuncias',
    icono: MessageSquareWarning,
    disponible: false,
  },
  {
    codigo: 'scoring',
    nombre: 'Scoring de Riesgo',
    descripcion: 'Evaluación y debida diligencia de clientes',
    href: '/scoring',
    icono: Gauge,
    disponible: false,
  },
  {
    codigo: 'matriz-riesgos',
    nombre: 'Matrices de Riesgo',
    descripcion: 'Heatmaps de probabilidad e impacto',
    href: '/matriz-riesgos',
    icono: LayoutGrid,
    disponible: false,
  },
  {
    codigo: 'operaciones',
    nombre: 'Registro de Operaciones',
    descripcion: 'Bitácora transaccional y alertas UIF',
    href: '/operaciones',
    icono: Receipt,
    disponible: false,
  },
  {
    codigo: 'cursos',
    nombre: 'Cursos',
    descripcion: 'Capacitación en prevención de lavado de activos',
    href: '/cursos',
    icono: GraduationCap,
    disponible: false,
  },
];
