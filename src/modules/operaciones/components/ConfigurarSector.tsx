'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoAjustes, IconoInfo, IconoMas, IconoVisto } from '@/shared/ui/iconos';
import { StyledSelect } from '@/shared/ui/StyledSelect';
import { Aviso, Boton, Etiqueta, type AvisoDatos } from '@/shared/ui/kit';
import { textoDeFalla } from '../lib/errores';
import { decimalesDe, montoANumero, montoTexto } from '../lib/formato';
import { usd } from '../lib/formatoB';
import { useCarga } from '../lib/useCarga';
import { camposDeError, operacionesService, type CatalogosOperacion, type Configuracion, type SolicitudConfiguracion } from '../services/operacionesService';
import { CAMPO, CAMPO_BORDE, ErrorPagina, EsqueletoPagina, Interruptor, Tarjeta } from './piezas';
import { AREA_B, AreaAutoajustable, BTN_B, BTN_PB, CampoB, ChipArchivo, NotaLateral, REJILLA_B, SELECT_B } from './piezasB';
import { TipoCambioMensual } from './TipoCambioMensual';

const DESCRIPCION = 'Define tu actividad para saber qué operaciones deben registrarse y desde qué monto.';
const TITULO_TARJETA = 'text-[17px] font-semibold leading-[normal] tracking-[-0.01em] text-ink';

/** Lo que la persona escribe en el formulario (todo texto; al guardar se arma la solicitud). */
interface Borrador {
  sector: string;
  unRoPorActividad: boolean;
  monto: string;
  motivo: string;
  oficinas: string[];
}

function borradorDe(c: Configuracion): Borrador {
  return {
    sector: c.sector ?? '',
    unRoPorActividad: c.unRoPorActividad,
    monto: c.umbralInterno ? montoTexto(c.umbralInterno.montoUsd) : '',
    motivo: c.umbralInterno?.motivo ?? '',
    oficinas: c.oficinas,
  };
}

/** Lo mínimo que pide el servidor para guardar (él valida lo mismo y manda la última palabra). `maximoNorma` solo se conoce para el sector ya guardado. */
function faltas(b: Borrador, maximoNorma: number | null): Record<string, string> {
  const e: Record<string, string> = {};
  if (b.monto.trim() === '' && b.motivo.trim() === '') return e;
  const monto = montoANumero(b.monto);
  if (b.monto.trim() === '') e.monto = 'Escribe el monto desde el que registras.';
  else if (monto === null) e.monto = 'Escribe un monto válido, por ejemplo 20,000.00.';
  else if (decimalesDe(b.monto) > 2) e.monto = 'El monto admite hasta dos decimales.';
  else if (monto <= 0) e.monto = 'El monto debe ser mayor que cero.';
  else if (maximoNorma !== null && monto >= maximoNorma) e.monto = `Debe ser menor que el umbral de la norma (${usd(maximoNorma)}).`;
  if (b.motivo.trim() === '') e.motivo = 'Indica el motivo del umbral interno.';
  return e;
}

function solicitudDe(b: Borrador): SolicitudConfiguracion {
  const hayInterno = b.monto.trim() !== '' || b.motivo.trim() !== '';
  return {
    sector: b.sector || null,
    unRoPorActividad: b.unRoPorActividad,
    umbralInterno: hayInterno ? { montoUsd: montoANumero(b.monto) ?? 0, motivo: b.motivo.trim() } : null,
    oficinas: b.oficinas,
  };
}

/** Errores por campo del servidor → los campos de esta pantalla (`umbralInterno.montoUsd` → `monto`, `oficinas[2]` → `oficinas`). */
function erroresDelServidor(campos: Record<string, string>): Record<string, string> {
  const e: Record<string, string> = {};
  for (const [clave, mensaje] of Object.entries(campos)) {
    const campo = clave === 'umbralInterno.montoUsd' ? 'monto' : clave === 'umbralInterno.motivo' ? 'motivo' : clave.startsWith('oficinas') ? 'oficinas' : clave;
    if (!e[campo]) e[campo] = mensaje;
  }
  return e;
}

function Marco({ children }: { children: ReactNode }) {
  return (
    <PageShell ancho="amplio">
      <PageHeader antetitulo="Configuración del registro" titulo="Sector y umbrales" descripcion={DESCRIPCION} icono={IconoAjustes} sinLinea />
      {children}
    </PageShell>
  );
}

/** RO 16 · /operaciones/configuracion — sector, umbral interno, oficinas y tipo de cambio. Todos pueden verlo; solo el administrador lo cambia. */
export function ConfigurarSector() {
  const carga = useCarga('configuracion', () => Promise.all([operacionesService.catalogos(), operacionesService.configuracion()]), 'No se pudo cargar la configuración del registro.');
  const [catalogos, inicial] = carga.datos ?? [null, null];
  if (!catalogos || !inicial) {
    return (
      <Marco>
        {carga.error ? <ErrorPagina mensaje={carga.error} onReintentar={carga.recargar} /> : <EsqueletoPagina />}
      </Marco>
    );
  }
  return <FormularioConfiguracion catalogos={catalogos} inicial={inicial} />;
}

/** Lista de oficinas de la empresa: se escriben una a una y se quitan con la ×. Sin repetir (sin distinguir mayúsculas), hasta 50 de hasta 100 caracteres. */
function EditorOficinas({ oficinas, onCambiar, deshabilitado, error }: { oficinas: string[]; onCambiar: (oficinas: string[]) => void; deshabilitado: boolean; error?: string }) {
  const [texto, setTexto] = useState('');
  const [problema, setProblema] = useState<string | null>(null);

  const agregar = () => {
    const nueva = texto.trim().replace(/\s+/g, ' ');
    if (nueva === '') return;
    if (nueva.length > 100) { setProblema('Máximo 100 caracteres.'); return; }
    if (oficinas.some((o) => o.toLowerCase() === nueva.toLowerCase())) { setProblema('Esa oficina ya está en la lista.'); return; }
    if (oficinas.length >= 50) { setProblema('Hasta 50 oficinas.'); return; }
    onCambiar([...oficinas, nueva]);
    setTexto('');
    setProblema(null);
  };

  const mensaje = problema ?? error;
  return (
    <div className="flex flex-col gap-3.5">
      {oficinas.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Oficinas de tu empresa">
          {oficinas.map((o) => (
            <li key={o} className="max-w-full"><ChipArchivo nombre={o} onQuitar={deshabilitado ? undefined : () => onCambiar(oficinas.filter((x) => x !== o))} /></li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-[21px] text-muted">Todavía no definiste oficinas: al registrar una operación la oficina se escribe a mano.</p>
      )}
      {!deshabilitado && (
        <div className="flex flex-wrap items-start gap-2.5">
          <div className="min-w-0 flex-1 basis-[220px]">
            <label htmlFor="cfg-oficina" className="sr-only">Nombre de la oficina</label>
            <input
              id="cfg-oficina"
              type="text"
              maxLength={100}
              autoComplete="off"
              placeholder="Ej. Sede Norte"
              value={texto}
              onChange={(e) => { setTexto(e.target.value); setProblema(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }}
              className={`input ${CAMPO} ${mensaje ? 'input-error' : CAMPO_BORDE}`}
              aria-invalid={mensaje ? true : undefined}
              aria-describedby={mensaje ? 'cfg-oficina-error' : undefined}
            />
          </div>
          <button type="button" onClick={agregar} disabled={texto.trim() === ''} className={`btn btn-secondary ${BTN_B}`}>
            <IconoMas className="h-4 w-4 shrink-0" aria-hidden="true" />
            Agregar oficina
          </button>
        </div>
      )}
      {mensaje && <p id="cfg-oficina-error" role="alert" className="error-text !mt-0">{mensaje}</p>}
    </div>
  );
}

function FormularioConfiguracion({ catalogos, inicial }: { catalogos: CatalogosOperacion; inicial: Configuracion }) {
  const [guardada, setGuardada] = useState<Configuracion>(inicial);
  const [b, setB] = useState<Borrador>(() => borradorDe(inicial));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const [guardando, setGuardando] = useState(false);

  const soloLectura = !guardada.puedeEditar;
  const bloqueado = soloLectura || guardando;
  const poner = (parche: Partial<Borrador>) => setB((anterior) => ({ ...anterior, ...parche }));
  const mostrarAviso = (nuevo: AvisoDatos) => {
    setAviso(nuevo);
    requestAnimationFrame(() => document.getElementById('aviso-configuracion')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  };

  // La norma que muestra la pantalla es la del sector ya guardado: con otro sector elegido, se ve al guardar.
  const sectorCambiado = b.sector !== (guardada.sector ?? '');
  const maximoNorma = !sectorCambiado && guardada.umbralesNorma.length > 0 ? Math.max(...guardada.umbralesNorma.map((u) => u.umbralUsd)) : null;

  const guardar = async () => {
    if (bloqueado) return;
    setAviso(null);
    const pendientes = faltas(b, maximoNorma);
    setErrores(pendientes);
    if (Object.keys(pendientes).length > 0) {
      mostrarAviso({ tipo: 'error', texto: 'Revisa los campos marcados en rojo.' });
      return;
    }
    setGuardando(true);
    try {
      const respuesta = await operacionesService.guardarConfiguracion(solicitudDe(b));
      setGuardada(respuesta);
      setB(borradorDe(respuesta));
      mostrarAviso({ tipo: 'ok', texto: 'Configuración guardada. Los registros que ya guardaste conservan su verificación de umbral.' });
    } catch (err) {
      const campos = camposDeError(err);
      if (campos) setErrores(erroresDelServidor(campos));
      const texto = textoDeFalla(err, 'No se pudo guardar la configuración. Revisa los datos e inténtalo de nuevo.');
      if (texto) mostrarAviso({ tipo: 'error', texto });
    } finally {
      setGuardando(false);
    }
  };

  const opcionesSector = catalogos.sectores.map((o) => ({
    value: o.codigo,
    label: o.nombre,
    // Sin `sector` en el catálogo = el servidor todavía no tiene los umbrales de ese sector.
    etiqueta: o.sector ? undefined : <Etiqueta className="!px-2 !py-px !leading-[normal]">Por configurar</Etiqueta>,
  }));
  const claseCampo = (campo: string) => `input ${CAMPO} ${errores[campo] ? 'input-error' : CAMPO_BORDE}`;
  const ariaError = (campo: string) => (errores[campo] ? { 'aria-invalid': true as const, 'aria-describedby': `cfg-${campo}-error` } : {});

  return (
    <Marco>
      <div className={REJILLA_B}>
        <form onSubmit={(e) => { e.preventDefault(); void guardar(); }} noValidate className="flex min-w-0 flex-col gap-5">
          {aviso && <div id="aviso-configuracion" className="scroll-mt-6"><Aviso aviso={aviso} onCerrar={() => setAviso(null)} /></div>}
          {soloLectura && <Aviso aviso={{ tipo: 'info', texto: 'Solo el administrador de tu empresa puede cambiar el sector y los umbrales. Tú puedes verlos.' }} />}

          <Tarjeta titulo="Tu actividad" descripcion="Cada actividad lleva su propio registro." espacio="gap-[18px]">
            <CampoB id="cfg-sector" texto="Sector" error={errores.sector}>
              <StyledSelect id="cfg-sector" value={b.sector} options={opcionesSector} onChange={(v) => poner({ sector: v })} placeholder="Elige tu sector" disabled={bloqueado} error={!!errores.sector} ajustar className={`${SELECT_B} ${errores.sector ? '' : CAMPO_BORDE}`} />
            </CampoB>
            <Interruptor id="cfg-un-ro" etiqueta="Llevar un RO por cada actividad" descripcion="Si tu empresa desarrolla más de una actividad, cada una tiene su registro." activo={b.unRoPorActividad} onCambiar={(v) => poner({ unRoPorActividad: v })} deshabilitado={bloqueado} />
          </Tarjeta>

          <section className="card overflow-hidden" aria-labelledby="cfg-norma-titulo">
            <div className="flex flex-col gap-1 px-5 pb-4 pt-[22px] sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <h2 id="cfg-norma-titulo" className={`min-w-0 ${TITULO_TARJETA}`}>Umbrales de la norma</h2>
                {guardada.porConfigurar && <Etiqueta className="!leading-[normal]">Por configurar</Etiqueta>}
              </div>
              <p className="text-sm leading-[normal] text-muted">Se registran las operaciones que igualan o superan estos montos (o su equivalente en otras monedas).</p>
              {sectorCambiado && <p className="hint !mt-1">Elegiste otro sector: sus umbrales aparecen cuando guardes la configuración.</p>}
            </div>
            {guardada.umbralesNorma.length > 0 ? (
              <>
                <div className="flex gap-4 bg-paper px-5 py-2.5 font-mono text-[11px] uppercase leading-[normal] tracking-[0.04em] text-muted sm:px-6">
                  <span className="min-w-0 flex-1">Tipo de bien</span>
                  <span>Umbral</span>
                </div>
                <ul>
                  {guardada.umbralesNorma.map((u, i) => (
                    <li key={u.tipoBien} className={`flex items-center gap-4 px-5 py-4 sm:px-6 ${i > 0 ? 'border-t border-line' : ''}`}>
                      <span className="min-w-0 flex-1 break-words text-[15px] font-medium leading-[normal] text-ink">{u.nombre}</span>
                      <span className="shrink-0 text-base font-bold leading-[normal] tabular-nums text-ink">{usd(u.umbralUsd)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="mx-5 mb-5 flex items-center gap-2.5 rounded-xl border border-line bg-paper px-3.5 py-3 sm:mx-6">
                <IconoInfo className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden="true" />
                <p className="min-w-0 flex-1 text-sm font-medium leading-[normal] text-muted">
                  {guardada.sector
                    ? 'Este sector todavía no tiene umbrales cargados en PLAFT. La verificación de umbral queda por configurar.'
                    : 'Elige tu sector y guarda la configuración para ver los umbrales de la norma.'}
                </p>
              </div>
            )}
            {guardada.notaUmbral && <p className="border-t border-line px-5 pb-5 pt-4 text-sm leading-[21px] text-muted sm:px-6">{guardada.notaUmbral}</p>}
          </section>

          <Tarjeta titulo="Umbral interno (opcional)" descripcion="Puedes registrar desde un monto menor al de la norma, según tu análisis de riesgo." espacio="gap-[18px]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CampoB id="cfg-monto" texto="Monto desde (US$)" error={errores.monto}>
                <input id="cfg-monto" type="text" inputMode="decimal" autoComplete="off" placeholder="Ej. 20,000.00" value={b.monto} onChange={(e) => poner({ monto: e.target.value })} disabled={bloqueado} className={claseCampo('monto')} {...ariaError('monto')} />
              </CampoB>
              <CampoB id="cfg-motivo" texto="Motivo" error={errores.motivo}>
                <AreaAutoajustable id="cfg-motivo" rows={1} maxLength={300} placeholder="Ej. Perfil de clientes con operaciones fraccionadas" value={b.motivo} onChange={(e) => poner({ motivo: e.target.value })} disabled={bloqueado} className={`input ${AREA_B} min-h-[46px] ${errores.motivo ? 'input-error' : CAMPO_BORDE}`} {...ariaError('motivo')} />
              </CampoB>
            </div>
            {maximoNorma !== null && <p className="text-xs leading-[normal] text-muted">Debe ser menor que el umbral más alto de la norma ({usd(maximoNorma)}). Si dejas ambos campos vacíos, se aplica solo el de la norma.</p>}
          </Tarjeta>

          <Tarjeta titulo="Oficinas (opcional)" descripcion="Si las defines, al registrar o editar una operación eliges la oficina de esta lista." espacio="gap-[18px]">
            <EditorOficinas oficinas={b.oficinas} onCambiar={(oficinas) => poner({ oficinas })} deshabilitado={bloqueado} error={errores.oficinas} />
          </Tarjeta>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
            <Link href="/operaciones" className={`btn btn-secondary ${BTN_B}`}>Cancelar</Link>
            <Boton type="submit" icono={IconoVisto} className={BTN_PB} cargando={guardando} disabled={soloLectura}>Guardar configuración</Boton>
          </div>
        </form>

        <div className="flex min-w-0 flex-col gap-4">
          <Tarjeta titulo="Tipo de cambio" espacio="gap-2.5">
            <p className="text-sm leading-[21px] text-ink/80">Para comparar montos en soles u otras monedas con el umbral en dólares se usa el tipo de cambio que establece el Reglamento de la Ley UIF (art. 24.4 b). Se guarda con cada registro.</p>
            <TipoCambioMensual />
          </Tarjeta>
          <Tarjeta titulo="Otros sectores" descripcion="Cada sector tiene sus propias reglas." espacio="gap-2.5">
            <p className="text-sm leading-[21px] text-ink/80">Por ejemplo, abogados y contadores registran todas las operaciones definidas en la norma, sin importar el monto.</p>
            <p className="font-mono text-[11px] leading-[normal] tracking-[0.04em] text-muted">Res. SBS 789-2018 · Título II</p>
          </Tarjeta>
          <NotaLateral rotulo="Antes de publicar">Confirma estos montos con la norma vigente de tu sector antes de activarlos.</NotaLateral>
        </div>
      </div>
    </Marco>
  );
}
