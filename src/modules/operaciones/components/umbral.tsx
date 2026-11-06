'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { IconoAjustes, IconoAlerta, IconoInfo, IconoVisto } from '@/shared/ui/iconos';
import { montoANumero } from '../lib/formato';
import { tipoCambioTexto, usd } from '../lib/formatoB';
import { operacionesService, type EstadoUmbral, type SolicitudUmbral, type VerificacionUmbral } from '../services/operacionesService';
import { FilaValor, Tarjeta } from './piezas';
import { BTN_B } from './piezasB';

// Verificación de umbral (RO 2, 3, 4 y 5): el servidor decide el estado y escribe el mensaje; aquí solo se muestra.

type Tono = 'ok' | 'warn' | 'neutral';

const TONO: Record<EstadoUmbral, Tono> = {
  SI_SE_REGISTRA: 'ok',
  NO_ALCANZA_UMBRAL: 'neutral',
  SIN_MONTO: 'neutral',
  SIN_CONFIGURAR: 'warn',
  SIN_TIPO_DE_BIEN: 'warn',
  SIN_TIPO_DE_CAMBIO: 'warn',
};

const ROTULO: Record<EstadoUmbral, string> = {
  SI_SE_REGISTRA: 'Sí se registra',
  NO_ALCANZA_UMBRAL: 'No alcanza el umbral',
  SIN_MONTO: 'Sin monto',
  SIN_CONFIGURAR: 'Por configurar',
  SIN_TIPO_DE_BIEN: 'Sin tipo de bien',
  SIN_TIPO_DE_CAMBIO: 'Falta tipo de cambio',
};

/** Insignia del resultado de la verificación («SÍ SE REGISTRA», «SIN MONTO»…). */
export function ChipUmbral({ estado }: { estado: EstadoUmbral }) {
  return <span className={`badge badge-${TONO[estado]} !leading-[normal]`}>{ROTULO[estado]}</span>;
}

/** Caja con el mensaje del resultado: verde si debe registrarse, ámbar si falta algo, gris en los demás casos. El texto pasa a otra línea si es largo. */
function CajaResultado({ tono, children }: { tono: Tono; children: ReactNode }) {
  const estilo = tono === 'ok' ? 'bg-ok-soft text-ok' : tono === 'warn' ? 'bg-warn-soft text-warn' : 'border border-line bg-paper text-muted';
  const Icono = tono === 'ok' ? IconoVisto : tono === 'warn' ? IconoAlerta : IconoInfo;
  return (
    <div role="status" className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 ${estilo}`}>
      <Icono className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 break-words text-sm font-medium leading-[normal]">{children}</p>
    </div>
  );
}

/** El mensaje del servidor solo se repite cuando algo falta; si ya dice «Sí se registra» o «No alcanza», la insignia basta. */
export const mensajeUtil = (v: VerificacionUmbral): string | null => (v.estado === 'SI_SE_REGISTRA' || v.estado === 'NO_ALCANZA_UMBRAL' ? null : v.mensaje);

/** «S/ 3.512345» (y, con euros, también lo que vale una unidad de la moneda), o la nota del servidor («No aplica (USD)»). */
function tipoCambioDe(v: VerificacionUmbral): string {
  if (!v.tipoCambio) return v.tipoCambioNota ?? '—';
  const base = `S/ ${tipoCambioTexto(v.tipoCambio.usd)}`;
  return v.tipoCambio.moneda != null ? `${base} · S/ ${tipoCambioTexto(v.tipoCambio.moneda)} por unidad` : base;
}

interface DatosOperacion {
  tipoOperacion: string;
  moneda: string;
  /** El monto tal como se escribe en el formulario. */
  monto: string;
  fechaOperacion: string;
}

/**
 * RO 2 y RO 3 · «Verificación de umbral»: calcula con el monto, el tipo de operación, la moneda y la fecha que se van escribiendo (un instante
 * después de dejar de escribir) y nunca bloquea el registro: es solo informativa. «Cambiar sector o umbral» abre RO 16 en otra pestaña para
 * no perder lo escrito; al volver a esta pestaña se calcula de nuevo.
 */
export function TarjetaVerificacionUmbral({ tipoOperacion, moneda, monto, fechaOperacion }: DatosOperacion) {
  const montoNumero = montoANumero(monto);
  const [recargas, setRecargas] = useState(0);
  const [respuesta, setRespuesta] = useState<{ clave: string; datos: VerificacionUmbral | null } | null>(null);
  const clave = JSON.stringify([tipoOperacion, moneda, montoNumero, fechaOperacion, recargas]);

  useEffect(() => {
    const alVolver = () => setRecargas((n) => n + 1);
    window.addEventListener('focus', alVolver);
    return () => window.removeEventListener('focus', alVolver);
  }, []);

  useEffect(() => {
    let vigente = true;
    const solicitud: SolicitudUmbral = { tipoOperacion: tipoOperacion || null, moneda: moneda || null, monto: montoNumero, fechaOperacion: fechaOperacion || null };
    const espera = setTimeout(() => {
      operacionesService
        .verificarUmbral(solicitud)
        .then((datos) => { if (vigente) setRespuesta({ clave, datos }); })
        .catch(() => { if (vigente) setRespuesta({ clave, datos: null }); });
    }, 400);
    return () => { vigente = false; clearTimeout(espera); };
  }, [clave, tipoOperacion, moneda, montoNumero, fechaOperacion]);

  const actual = respuesta?.clave === clave ? respuesta : null;
  const v = actual?.datos ?? (actual === null ? respuesta?.datos : null) ?? null;
  const fallo = actual !== null && actual.datos === null;

  // El servidor solo sabe lo que recibe: mientras falte el tipo o la moneda se avisa aquí, sin mostrar un resultado engañoso.
  const conMonto = montoNumero !== null && montoNumero > 0;
  const falta = conMonto && !tipoOperacion ? 'Elige el tipo de operación para saber si debe registrarse en el RO.' : conMonto && !moneda ? 'Elige la moneda para calcular el equivalente en dólares.' : null;

  let chip: ReactNode;
  let resultado: ReactNode;
  if (falta) {
    chip = <span className="badge badge-neutral !leading-[normal]">Faltan datos</span>;
    resultado = <CajaResultado tono="neutral">{falta}</CajaResultado>;
  } else if (v) {
    chip = <ChipUmbral estado={v.estado} />;
    resultado = <CajaResultado tono={TONO[v.estado]}>{v.mensaje}</CajaResultado>;
  } else if (fallo) {
    chip = <span className="badge badge-neutral !leading-[normal]">Sin verificar</span>;
    resultado = <CajaResultado tono="neutral">No se pudo calcular el umbral ahora. Puedes seguir: el servidor lo verifica al guardar.</CajaResultado>;
  } else {
    chip = undefined;
    resultado = <CajaResultado tono="neutral">Calculando el umbral…</CajaResultado>;
  }

  return (
    <Tarjeta espacio="gap-[14px]" titulo="Verificación de umbral" descripcion="Se calcula con el monto." derecha={chip}>
      <FilaValor etiqueta="Sector">{v ? (v.sectorNombre ?? 'Por configurar') : '—'}</FilaValor>
      <FilaValor etiqueta="Tipo de bien">{v?.tipoBienNombre ?? (tipoOperacion ? '—' : 'Elige un tipo')}</FilaValor>
      <FilaValor etiqueta="Umbral aplicable">{v?.umbralUsd != null ? `${usd(v.umbralUsd)}${v.umbralInterno ? ' (interno)' : ''}` : '—'}</FilaValor>
      <FilaValor etiqueta="Monto en US$">{v?.montoUsd != null ? usd(v.montoUsd) : '—'}</FilaValor>
      <FilaValor etiqueta="Tipo de cambio SBS">{v ? tipoCambioDe(v) : '—'}</FilaValor>
      {v?.tipoCambio && v.tipoCambioNota && <p className="-mt-1 text-xs leading-[normal] text-muted">{v.tipoCambioNota}</p>}
      {resultado}
      <div>
        <Link href="/operaciones/configuracion" target="_blank" rel="noopener noreferrer" className={`btn btn-secondary ${BTN_B}`}>
          <IconoAjustes className="h-4 w-4 shrink-0" aria-hidden="true" />
          Cambiar sector o umbral
          <span className="sr-only"> (se abre en otra pestaña)</span>
        </Link>
      </div>
    </Tarjeta>
  );
}

/**
 * RO 4 · Tarjeta «Umbral»: lo que se verificó al guardar el registro. Los registros anteriores a la verificación no la traen (`null`):
 * entonces solo se muestra el monto.
 */
export function TarjetaUmbralGuardado({ umbral, monto }: { umbral: VerificacionUmbral | null | undefined; monto: string }) {
  if (!umbral) {
    return (
      <Tarjeta espacio="gap-3" titulo="Umbral">
        <FilaValor etiqueta="Monto de la operación">{monto}</FilaValor>
      </Tarjeta>
    );
  }
  const nota = mensajeUtil(umbral);
  return (
    <Tarjeta espacio="gap-3" titulo="Umbral" descripcion="Verificado al guardar." derecha={<ChipUmbral estado={umbral.estado} />}>
      <FilaValor etiqueta="Umbral aplicable">{umbral.umbralUsd != null ? usd(umbral.umbralUsd) : '—'}</FilaValor>
      <FilaValor etiqueta="Monto de la operación">{umbral.montoUsd != null ? usd(umbral.montoUsd) : monto}</FilaValor>
      {nota && <p className="text-sm leading-[21px] text-muted">{nota}</p>}
    </Tarjeta>
  );
}
