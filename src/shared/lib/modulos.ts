import {
  Search,
  MessageSquareWarning,
  Gauge,
  LayoutGrid,
  Receipt,
  GraduationCap,
  Settings2,
  type LucideIcon,
} from 'lucide-react';

export interface ModuloDashboard {
  codigo: string;
  nombre: string;
  descripcion: string;
  href: string;
  icono: LucideIcon;
  disponible: boolean;
  /** Solo lo ven (y lo pueden usar) las cuentas con rol de administrador. */
  soloAdministrador?: boolean;
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
    disponible: true,
  },
  {
    codigo: 'scoring',
    nombre: 'Scoring de Riesgo',
    descripcion: 'Evaluación y debida diligencia de clientes',
    href: '/scoring',
    icono: Gauge,
    disponible: true,
  },
  {
    codigo: 'matriz-riesgos',
    nombre: 'Matrices de Riesgo',
    descripcion: 'Heatmaps de probabilidad e impacto',
    href: '/matriz-riesgos',
    icono: LayoutGrid,
    disponible: true,
  },
  {
    codigo: 'operaciones',
    nombre: 'Registro de Operaciones',
    descripcion: 'Bitácora transaccional y alertas UIF',
    href: '/operaciones',
    icono: Receipt,
    disponible: true,
  },
  {
    codigo: 'cursos',
    nombre: 'Cursos',
    descripcion: 'Capacitación en prevención de lavado de activos',
    href: '/cursos',
    icono: GraduationCap,
    disponible: false,
  },
  {
    codigo: 'administracion',
    nombre: 'Administración',
    descripcion: 'Cuentas de acceso y empresas',
    href: '/administracion',
    icono: Settings2,
    disponible: true,
    soloAdministrador: true,
  },
];

/** ¿La cuenta es administradora? Se mira el código del rol y su nombre, como en el resto de la web. */
export function esAdministrador(usuario: { codigo?: string; rol?: string } | null | undefined): boolean {
  return [usuario?.codigo, usuario?.rol].some((valor) => valor?.trim().toUpperCase() === 'ADMINISTRADOR');
}

/** Módulos que le corresponden a la cuenta (los de administración solo los ve un administrador). */
export function modulosVisibles(usuario: { codigo?: string; rol?: string } | null | undefined): ModuloDashboard[] {
  return MODULOS_DASHBOARD.filter((modulo) => !modulo.soloAdministrador || esAdministrador(usuario));
}
