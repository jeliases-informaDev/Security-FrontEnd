import type { ComponentType, SVGProps } from 'react';
import {
  IconoAjustes,
  IconoBirrete,
  IconoClientes,
  IconoCuadricula,
  IconoInicio,
  IconoLupa,
  IconoMedidor,
  IconoMensaje,
  IconoOficial,
  IconoRecibo,
} from '@/shared/ui/iconos';

/** Icono de una opción: cualquier componente SVG (los del diseño están en shared/ui/iconos). */
export type IconoModulo = ComponentType<SVGProps<SVGSVGElement>>;

/** Grupos del menú lateral, en el orden en que se muestran. */
export const GRUPOS_MENU = ['Analítica', 'Riesgos', 'Registro', 'Procesos internos'] as const;
export type GrupoMenu = (typeof GRUPOS_MENU)[number];

export interface ModuloDashboard {
  codigo: string;
  nombre: string;
  descripcion: string;
  href: string;
  icono: IconoModulo;
  disponible: boolean;
  /** Grupo del menú lateral al que pertenece. */
  grupo: GrupoMenu;
  /** Rótulos cortos de su tarjeta en la página principal (qué hay dentro del módulo). */
  etiquetas?: string[];
  /** Solo lo ven (y lo pueden usar) las cuentas con rol de administrador. */
  soloAdministrador?: boolean;
}

/** Módulos de PLAFT. Los que aún no existen en el producto van con `disponible: false` y se muestran como «Pronto». */
export const MODULOS_DASHBOARD: ModuloDashboard[] = [
  {
    codigo: 'cursos',
    nombre: 'Cursos',
    descripcion: 'Capacitación en prevención de lavado de activos',
    href: '/cursos',
    icono: IconoBirrete,
    disponible: false,
    grupo: 'Analítica',
  },
  {
    codigo: 'listas-negativas',
    nombre: 'Listas Negativas',
    descripcion: 'PEP, Actos Ilícitos, Noticias y Listas Internacionales',
    href: '/listas-negativas',
    icono: IconoLupa,
    disponible: true,
    grupo: 'Riesgos',
  },
  {
    codigo: 'denuncias',
    nombre: 'Canal de Denuncias',
    descripcion: 'Reportes anónimos y seguimiento de casos',
    href: '/denuncias',
    icono: IconoMensaje,
    disponible: true,
    grupo: 'Riesgos',
    etiquetas: ['Anónimo', 'Casos'],
  },
  {
    codigo: 'scoring',
    nombre: 'Scoring de Riesgo',
    descripcion: 'Evaluación y debida diligencia de clientes',
    href: '/scoring',
    icono: IconoMedidor,
    disponible: true,
    grupo: 'Riesgos',
    etiquetas: ['Debida diligencia'],
  },
  {
    codigo: 'matriz-riesgos',
    nombre: 'Matrices de Riesgo',
    descripcion: 'Heatmaps de probabilidad e impacto',
    href: '/matriz-riesgos',
    icono: IconoCuadricula,
    disponible: true,
    grupo: 'Riesgos',
    etiquetas: ['Evaluaciones'],
  },
  {
    codigo: 'oficial-cumplimiento',
    nombre: 'Oficial de Cumplimiento',
    descripcion: 'Designación y comunicación a la UIF-Perú',
    href: '/oficial-cumplimiento',
    icono: IconoOficial,
    disponible: true,
    grupo: 'Registro',
    etiquetas: ['Designación', 'UIF'],
  },
  {
    codigo: 'clientes',
    nombre: 'Clientes',
    descripcion: 'Próximamente',
    href: '/clientes',
    icono: IconoClientes,
    disponible: false,
    grupo: 'Registro',
  },
  {
    codigo: 'operaciones',
    nombre: 'Registro de Operaciones',
    descripcion: 'Bitácora transaccional y alertas UIF',
    href: '/operaciones',
    icono: IconoRecibo,
    disponible: true,
    grupo: 'Registro',
    etiquetas: ['Registros', 'UIF'],
  },
  {
    codigo: 'administracion',
    nombre: 'Administración',
    descripcion: 'Cuentas de acceso y empresas',
    href: '/administracion',
    icono: IconoAjustes,
    disponible: true,
    grupo: 'Procesos internos',
    etiquetas: ['Cuentas', 'Empresas'],
    soloAdministrador: true,
  },
];

/** Opción del menú lateral: la página principal o un módulo. */
export interface OpcionMenu {
  codigo: string;
  nombre: string;
  href: string;
  icono: IconoModulo;
  disponible: boolean;
}

const PRINCIPAL: OpcionMenu = { codigo: 'principal', nombre: 'Principal', href: '/overview', icono: IconoInicio, disponible: true };

/** ¿La cuenta es administradora (Sulotec o Empresa)? */
export function esAdministrador(usuario: { codigo?: string; rol?: string } | null | undefined): boolean {
  return [usuario?.codigo, usuario?.rol].some((valor) => {
    const v = valor?.trim().toUpperCase();
    return v === 'ADMINISTRADOR' || v === 'ADMINISTRADOR_EMPRESA' || v === 'ADMIN_EMPRESA';
  });
}

/** Módulos que le corresponden a la cuenta (los de administración solo los ve un administrador). */
export function modulosVisibles(usuario: { codigo?: string; rol?: string } | null | undefined): ModuloDashboard[] {
  return MODULOS_DASHBOARD.filter((modulo) => !modulo.soloAdministrador || esAdministrador(usuario));
}

/** Menú lateral de la cuenta: la página principal y sus módulos, por grupo (un grupo sin opciones no se muestra). */
export function menuVisible(usuario: { codigo?: string; rol?: string } | null | undefined): { grupo: GrupoMenu; opciones: OpcionMenu[] }[] {
  const modulos = modulosVisibles(usuario);
  return GRUPOS_MENU.map((grupo) => ({
    grupo,
    opciones: [...(grupo === 'Analítica' ? [PRINCIPAL] : []), ...modulos.filter((m) => m.grupo === grupo)],
  })).filter((g) => g.opciones.length > 0);
}
