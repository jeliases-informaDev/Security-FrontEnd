// Luces de alerta de la «Cabina de mando» de Inicio: una luz por área (Listas, Operaciones, Oficial, Denuncias, Scoring y Licencia).
// Archivo puro (sin React): recibe el resumen y devuelve las luces. Solo es presentación: cada color sale de lo que YA trae el
// servidor en el resumen, y los umbrales son los de abajo, escritos a la vista. No se inventa ninguna meta regulatoria: los
// plazos y las metas del negocio las calcula el servidor.
//
// Colores (de más a menos grave):
//   rojo  = hay algo vencido o sin decidir que necesita acción ya
//   ámbar = hay algo por atender o cerca de vencer
//   verde = nada pendiente
//   gris  = sin dato o sin movimiento en el periodo (no cuenta para el estado general)

import { ENLACE_LICENCIA } from '@/modules/licencias/lib/errores';
import type { CabinaInicio, CabinaLicencia, CabinaScoring, EscalaScoring, PlazoCabina, ResumenInicio } from '../services/inicioService';
import { esNumero, plural, porcentaje, puntajeTexto } from './formato';

export type EstadoLuz = 'verde' | 'ambar' | 'rojo' | 'gris';
export type AreaLuz = 'listas' | 'operaciones' | 'oficial' | 'denuncias' | 'scoring' | 'licencia';

export interface Luz {
  area: AreaLuz;
  etiqueta: string;
  estado: EstadoLuz;
  /** El motivo en una frase. Puede pasar a otra línea en pantallas angostas. */
  motivo: string;
  /** Ruta del módulo (o URL completa si `externo`). */
  enlace: string;
  externo: boolean;
}

// ------------------------------------------------------------
// Umbrales (solo del front)
// ------------------------------------------------------------

/** Un plazo que vence en menos de estos días enciende el ámbar; uno vencido, el rojo. */
export const DIAS_PLAZO_CERCANO = 3;
/** Combustible (tokens y usuarios): menos de este porcentaje restante es ámbar; menos del crítico, rojo. */
export const RESTANTE_BAJO_PCT = 20;
export const RESTANTE_CRITICO_PCT = 5;
/** La licencia que vence en este número de días (o menos) enciende el ámbar; vencida, el rojo. */
export const DIAS_LICENCIA_AVISO = 30;
/** Plazos de denuncias atendidos a tiempo: verde desde el primer corte, ámbar desde el segundo y rojo debajo (los mismos de la tarjeta «Canal de denuncias»). */
export const PLAZOS_VERDE_DESDE_PCT = 80;
export const PLAZOS_AMBAR_DESDE_PCT = 50;

// ------------------------------------------------------------
// Utilidades (también las usan los instrumentos)
// ------------------------------------------------------------

const GRAVEDAD: Record<EstadoLuz, number> = { rojo: 3, ambar: 2, verde: 1, gris: 0 };

/** Porcentaje que queda de un cupo (0 a 100); null si no hay total que valga. */
export function porcentajeRestante(usados: number | null | undefined, total: number | null | undefined): number | null {
  if (!esNumero(usados) || !esNumero(total) || total <= 0) return null;
  return Math.max(0, Math.min(100, ((total - usados) / total) * 100));
}

/** Color del combustible según lo que queda: ámbar con menos del 20 %, rojo con menos del 5 %. */
export function estadoRestante(restantePct: number | null): EstadoLuz {
  if (restantePct == null) return 'gris';
  if (restantePct < RESTANTE_CRITICO_PCT) return 'rojo';
  if (restantePct < RESTANTE_BAJO_PCT) return 'ambar';
  return 'verde';
}

/** Color de los plazos de denuncias atendidos a tiempo (mismos cortes que la tarjeta). */
export function estadoPlazosPct(pct: number | null | undefined): EstadoLuz {
  if (!esNumero(pct)) return 'gris';
  return pct >= PLAZOS_VERDE_DESDE_PCT ? 'verde' : pct >= PLAZOS_AMBAR_DESDE_PCT ? 'ambar' : 'rojo';
}

/** Zona de riesgo de un puntaje según los cortes reales de la metodología (el corte pertenece a la zona de arriba). */
export function zonaDePuntaje(puntaje: number, escala: EscalaValida): 'bajo' | 'medio' | 'alto' {
  return puntaje >= escala.corteAlto ? 'alto' : puntaje >= escala.corteMedio ? 'medio' : 'bajo';
}

export interface EscalaValida {
  min: number;
  max: number;
  corteMedio: number;
  corteAlto: number;
}

/** La escala del scoring si trae sus cuatro números y están en orden; si no, null (no se inventan zonas). */
export function leerEscala(escala: EscalaScoring | null | undefined): EscalaValida | null {
  if (!escala) return null;
  const { min, max, corteMedio, corteAlto } = escala;
  if (!esNumero(min) || !esNumero(max) || !esNumero(corteMedio) || !esNumero(corteAlto)) return null;
  if (!(min < corteMedio && corteMedio < corteAlto && corteAlto < max)) return null;
  return { min, max, corteMedio, corteAlto };
}

/** «Hoy», «en 3 días» o «hace 2 días» (los días negativos ya vencieron). */
export function diasTexto(dias: number): string {
  if (dias === 0) return 'hoy';
  return dias > 0 ? `en ${plural(dias, 'día', 'días')}` : `hace ${plural(-dias, 'día', 'días')}`;
}

/** Solo rutas internas del front (empiezan con «/», sin «//»): el enlace viene del servidor y no se sigue a ciegas. */
export function rutaInterna(enlace: string | null | undefined): string | null {
  const ruta = (enlace ?? '').trim();
  return ruta.startsWith('/') && !ruta.startsWith('//') && !ruta.includes('\\') ? ruta : null;
}

// ------------------------------------------------------------
// Una luz por área
// ------------------------------------------------------------

interface Candidato {
  estado: EstadoLuz;
  motivo: string;
}

/**
 * Toma el motivo más grave y, si hay otro de la misma gravedad o de la que sigue (rojo o ámbar), lo suma tras un punto medio.
 * Con dos motivos la luz sigue cabiendo en dos líneas.
 */
function resolver(candidatos: Candidato[], vacio: Candidato): Pick<Luz, 'estado' | 'motivo'> {
  const activos = candidatos.filter((c) => c.estado === 'rojo' || c.estado === 'ambar').sort((a, b) => GRAVEDAD[b.estado] - GRAVEDAD[a.estado]);
  if (activos.length === 0) return candidatos.find((c) => c.estado === 'verde') ?? vacio;
  return { estado: activos[0].estado, motivo: activos.slice(0, 2).map((c) => c.motivo).join(' · ') };
}

/** Los plazos de ciertos tipos, sin los que no traen días. */
function plazosDe(cabina: CabinaInicio | null | undefined, tipos: readonly string[]): (PlazoCabina & { dias: number })[] {
  return (cabina?.plazos ?? []).filter((p): p is PlazoCabina & { dias: number } => !!p && esNumero(p.dias) && tipos.includes(String(p.tipo)));
}

/**
 * Candidatos de plazos: el vencido más urgente en rojo y, si no hay, el que vence en menos de 3 días en ámbar. Con `tope = 'ambar'`
 * (una revisión sugerida, que no es un plazo legal) lo vencido también queda en ámbar: una sugerencia atrasada no enciende el rojo.
 */
function candidatosDePlazos(plazos: (PlazoCabina & { dias: number })[], tope: 'rojo' | 'ambar' = 'rojo'): Candidato[] {
  const vencidos = plazos.filter((p) => p.dias < 0);
  const cercanos = plazos.filter((p) => p.dias >= 0 && p.dias < DIAS_PLAZO_CERCANO);
  const frase = (p: PlazoCabina & { dias: number }, extra: number) => {
    const titulo = (p.titulo ?? '').trim() || 'Plazo';
    return `${titulo} · ${p.dias < 0 ? 'venció' : 'vence'} ${diasTexto(p.dias)}${extra > 0 ? ` (y ${extra} más)` : ''}`;
  };
  const masUrgente = (lista: (PlazoCabina & { dias: number })[]) => [...lista].sort((a, b) => a.dias - b.dias)[0];
  const salida: Candidato[] = [];
  if (vencidos.length > 0) salida.push({ estado: tope, motivo: frase(masUrgente(vencidos), vencidos.length - 1) });
  if (cercanos.length > 0) salida.push({ estado: 'ambar', motivo: frase(masUrgente(cercanos), cercanos.length - 1) });
  return salida;
}

function luzListas(r: ResumenInicio): Luz | null {
  const l = r.listas;
  if (!l) return null;
  const base = { area: 'listas', etiqueta: 'Listas negativas', enlace: '/listas-negativas', externo: false } as const;
  const criticas = l.criticasSinDecidir?.cantidad;
  // Una coincidencia crítica sin decidir siempre es rojo: el analista tiene que resolverla.
  if (esNumero(criticas) && criticas > 0) {
    const dias = l.criticasSinDecidir?.masAntiguaDias;
    const antigua = !esNumero(dias) ? '' : dias === 0 ? ' · la más antigua es de hoy' : ` · la más antigua, ${plural(dias, 'día', 'días')}`;
    return { ...base, estado: 'rojo', motivo: `${plural(criticas, 'coincidencia crítica', 'coincidencias críticas')} sin decidir${antigua}` };
  }
  if (!esNumero(l.consultas) || l.consultas <= 0) return { ...base, estado: 'gris', motivo: 'Sin consultas en el periodo' };
  return { ...base, estado: 'verde', motivo: 'Sin coincidencias críticas por decidir' };
}

function luzOperaciones(r: ResumenInicio): Luz | null {
  const o = r.operaciones;
  if (!o) return null;
  const base = { area: 'operaciones', etiqueta: 'Operaciones', enlace: '/operaciones', externo: false } as const;
  if (!esNumero(o.registros) || o.registros <= 0) return { ...base, estado: 'gris', motivo: 'Sin registros en el periodo' };

  const candidatos: Candidato[] = [];
  if (esNumero(o.inusuales) && o.inusuales > 0) candidatos.push({ estado: 'rojo', motivo: `${plural(o.inusuales, 'operación inusual', 'operaciones inusuales')} en análisis o con ROS` });
  candidatos.push(...candidatosDePlazos(plazosDe(r.cabina, ['REGISTRO_MENSUAL'])));
  const sinResponsable = (o.ultimos ?? []).filter((u) => u?.estado === 'SIN_RESPONSABLE').length;
  if (sinResponsable > 0) candidatos.push({ estado: 'ambar', motivo: `${sinResponsable} de los últimos registros sin responsable` });
  if (esNumero(o.mismoDiaPct) && esNumero(o.metaMismoDiaPct) && o.mismoDiaPct < o.metaMismoDiaPct) {
    candidatos.push({ estado: 'ambar', motivo: `Mismo día: ${porcentaje(o.mismoDiaPct)}% (meta ${porcentaje(o.metaMismoDiaPct)}%)` });
  }
  return { ...base, ...resolver(candidatos, { estado: 'verde', motivo: 'Sin inusuales ni pendientes' }) };
}

function luzOficial(r: ResumenInicio): Luz | null {
  const o = r.oficial;
  if (!o) return null;
  const base = { area: 'oficial', etiqueta: 'Oficial', enlace: '/oficial-cumplimiento', externo: false } as const;

  const candidatos: Candidato[] = [];
  switch (o.estado) {
    case 'VACANTE':
      candidatos.push({ estado: 'rojo', motivo: 'El cargo de oficial de cumplimiento está vacante' });
      break;
    case 'SIN_OFICIAL':
      candidatos.push({ estado: 'ambar', motivo: 'Aún no hay oficial de cumplimiento designado' });
      break;
    case 'EN_EVALUACION':
      candidatos.push({ estado: 'ambar', motivo: 'Designación en evaluación' });
      break;
    case 'PENDIENTE_COMUNICAR':
      candidatos.push({ estado: 'ambar', motivo: 'Falta comunicar la designación a la UIF' });
      break;
    case 'VIGENTE': {
      if (o.alDia === false) candidatos.push({ estado: 'rojo', motivo: 'Pendientes vencidos con la UIF' });
      const d = o.declaraciones;
      if (d && esNumero(d.vigentes) && esNumero(d.total) && d.vigentes < d.total) {
        candidatos.push({ estado: 'ambar', motivo: `${d.vigentes} de ${d.total} declaraciones vigentes` });
      }
      candidatos.push({ estado: 'verde', motivo: o.alDia === true ? 'Oficial vigente y al día con la UIF' : 'Oficial de cumplimiento vigente' });
      break;
    }
    default:
      return { ...base, estado: 'gris', motivo: 'Sin dato del oficial de cumplimiento' };
  }
  candidatos.push(...candidatosDePlazos(plazosDe(r.cabina, ['COMUNICACION_UIF', 'VACANCIA_OFICIAL'])));
  // La revisión sugerida de la declaración jurada (12 meses desde la firma) no es un plazo legal: como mucho, ámbar.
  candidatos.push(...candidatosDePlazos(plazosDe(r.cabina, ['DECLARACION']), 'ambar'));
  return { ...base, ...resolver(candidatos, { estado: 'gris', motivo: 'Sin dato del oficial de cumplimiento' }) };
}

function luzDenuncias(r: ResumenInicio): Luz | null {
  const d = r.denuncias;
  if (!d) return null;
  const base = { area: 'denuncias', etiqueta: 'Denuncias', enlace: '/denuncias', externo: false } as const;
  const sinActividad = (!esNumero(d.recibidas) || d.recibidas <= 0) && (!esNumero(d.porAtender) || d.porAtender <= 0) && (!esNumero(d.vencidas) || d.vencidas <= 0);
  if (sinActividad) return { ...base, estado: 'gris', motivo: 'Sin denuncias en el periodo' };

  const candidatos: Candidato[] = [];
  const plazos = plazosDe(r.cabina, ['DENUNCIA']);
  const vencidasPlazo = plazos.filter((p) => p.dias < 0).length;
  // `vencidas` es la cuenta oficial del servidor; si no la manda, se usa la de los plazos.
  const vencidas = esNumero(d.vencidas) ? d.vencidas : vencidasPlazo;
  if (vencidas > 0) candidatos.push({ estado: 'rojo', motivo: `${plural(vencidas, 'denuncia vencida', 'denuncias vencidas')} sin cerrar` });
  const porVencer = plazos.filter((p) => p.dias >= 0 && p.dias < DIAS_PLAZO_CERCANO).length;
  if (porVencer > 0) candidatos.push({ estado: 'ambar', motivo: `${plural(porVencer, 'denuncia vence', 'denuncias vencen')} en menos de ${DIAS_PLAZO_CERCANO} días` });
  if (esNumero(d.sinAbrir) && d.sinAbrir > 0) candidatos.push({ estado: 'ambar', motivo: `${plural(d.sinAbrir, 'denuncia sin abrir', 'denuncias sin abrir')}` });
  const tonoPlazos = estadoPlazosPct(d.plazosATiempoPct);
  if ((tonoPlazos === 'rojo' || tonoPlazos === 'ambar') && esNumero(d.plazosATiempoPct)) {
    candidatos.push({ estado: tonoPlazos, motivo: `Solo ${porcentaje(d.plazosATiempoPct)}% de los plazos a tiempo` });
  }
  return { ...base, ...resolver(candidatos, { estado: 'verde', motivo: 'Sin denuncias vencidas ni por abrir' }) };
}

function luzScoring(cabina: CabinaInicio | null | undefined): Luz | null {
  const s: CabinaScoring | null | undefined = cabina?.scoring;
  if (!s) return null;
  const base = { area: 'scoring', etiqueta: 'Scoring', enlace: '/scoring', externo: false } as const;
  const puntaje = s.puntajePromedio;
  if (!esNumero(puntaje) || !esNumero(s.evaluaciones) || s.evaluaciones <= 0) return { ...base, estado: 'gris', motivo: 'Sin evaluaciones en el periodo' };
  const escala = leerEscala(s.escala);
  if (!escala) return { ...base, estado: 'gris', motivo: 'Sin la escala del scoring para valorar el riesgo' };

  const zona = zonaDePuntaje(puntaje, escala);
  const altos = s.porNivel?.alto;
  const detalle = esNumero(altos) && altos > 0 ? ` · ${plural(altos, 'evaluación', 'evaluaciones')} en riesgo alto` : '';
  const texto = `Riesgo promedio ${zona} (${puntajeTexto(puntaje)})${detalle}`;
  return { ...base, estado: zona === 'alto' ? 'rojo' : zona === 'medio' ? 'ambar' : 'verde', motivo: texto };
}

function luzLicencia(cabina: CabinaInicio | null | undefined): Luz | null {
  if (!cabina) return null;
  const base = { area: 'licencia', etiqueta: 'Licencia', enlace: ENLACE_LICENCIA, externo: true } as const;
  const l: CabinaLicencia | null | undefined = cabina.licencia;
  // La licencia llega null para quien no es titular ni administrador universal, o si el servicio no contestó a tiempo.
  if (!l) return { ...base, estado: 'gris', motivo: 'Sin dato de la licencia' };

  const candidatos: Candidato[] = [];
  const tokens = porcentajeRestante(l.tokens?.usados, l.tokens?.total);
  const usuarios = porcentajeRestante(l.usuarios?.usados, l.usuarios?.cupo);
  const estadoTokens = estadoRestante(tokens);
  const estadoUsuarios = estadoRestante(usuarios);
  if (tokens != null && (estadoTokens === 'rojo' || estadoTokens === 'ambar')) candidatos.push({ estado: estadoTokens, motivo: `Quedan ${porcentaje(Math.round(tokens))}% de los tokens` });
  if (usuarios != null && (estadoUsuarios === 'rojo' || estadoUsuarios === 'ambar')) candidatos.push({ estado: estadoUsuarios, motivo: `Quedan ${porcentaje(Math.round(usuarios))}% del cupo de usuarios` });
  if (esNumero(l.diasRestantes)) {
    if (l.diasRestantes < 0) candidatos.push({ estado: 'rojo', motivo: `La licencia venció ${diasTexto(l.diasRestantes)}` });
    else if (l.diasRestantes <= DIAS_LICENCIA_AVISO) candidatos.push({ estado: 'ambar', motivo: `La licencia vence ${diasTexto(l.diasRestantes)}` });
  }
  const verde = tokens != null ? `Quedan ${porcentaje(Math.round(tokens))}% de los tokens${esNumero(l.diasRestantes) ? ` · vence ${diasTexto(l.diasRestantes)}` : ''}` : 'Licencia al día';
  return { ...base, ...resolver(candidatos, { estado: 'verde', motivo: verde }) };
}

/** Las luces de las áreas que la cuenta ve, en el orden Listas, Operaciones, Oficial, Denuncias, Scoring y Licencia. */
export function calcularLuces(resumen: ResumenInicio): Luz[] {
  return [luzListas(resumen), luzOperaciones(resumen), luzOficial(resumen), luzDenuncias(resumen), luzScoring(resumen.cabina), luzLicencia(resumen.cabina)].filter((l): l is Luz => l !== null);
}

export type ClaveEstadoGeneral = 'atencion' | 'revisar' | 'normal';

/** El estado general de la cabina: rojo si alguna luz es roja, ámbar si alguna es ámbar y «todo normal» si hay luces verdes y ninguna más grave. Sin luces con dato, null. */
export function estadoGeneral(luces: readonly Luz[]): { clave: ClaveEstadoGeneral; texto: string; estado: EstadoLuz } | null {
  if (luces.some((l) => l.estado === 'rojo')) return { clave: 'atencion', texto: 'ATENCIÓN', estado: 'rojo' };
  if (luces.some((l) => l.estado === 'ambar')) return { clave: 'revisar', texto: 'REVISAR', estado: 'ambar' };
  if (luces.some((l) => l.estado === 'verde')) return { clave: 'normal', texto: 'TODO NORMAL', estado: 'verde' };
  return null;
}
