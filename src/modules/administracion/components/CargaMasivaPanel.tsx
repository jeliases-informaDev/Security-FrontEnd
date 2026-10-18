'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ArrowLeft, Check, ClipboardList, Copy, Download, FileUp, MailCheck, UploadCloud } from 'lucide-react';
import {
  administracionService,
  mensajeDeError,
  type CargaMasivaRespuesta,
  type CuentaMasiva,
  type Empresa,
  type Rol,
} from '@/modules/administracion/services/administracionService';
import { Panel } from '@/shared/ui/PageShell';
import { Boton, Etiqueta } from '@/shared/ui/kit';
import { AvisoBanner, type Aviso } from './AvisoBanner';

const COLUMNAS = ['nombres', 'apellido paterno', 'apellido materno', 'correo', 'cargo', 'rol'] as const;
const EJEMPLO = 'Juan Carlos;Pérez;Quispe;jperez@empresa.pe;Analista;USUARIO';

interface CargaMasivaPanelProps {
  empresas: Empresa[];
  roles: Rol[];
  onVolver: () => void;
  /** Se crearon cuentas: hay que volver a pedir las listas. */
  onCreadas: () => void;
}

/** Divide una línea de CSV respetando comillas. */
function dividir(linea: string, separador: string): string[] {
  const celdas: string[] = [];
  let actual = '';
  let entreComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (entreComillas && linea[i + 1] === '"') { actual += '"'; i++; } else entreComillas = !entreComillas;
    } else if (c === separador && !entreComillas) {
      celdas.push(actual); actual = '';
    } else actual += c;
  }
  celdas.push(actual);
  return celdas.map((x) => x.trim());
}

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Convierte el texto pegado o el archivo en filas; detecta el separador y si la primera línea es el encabezado. */
function interpretar(texto: string, roles: Rol[]): { cuentas: CuentaMasiva[]; avisos: string[] } {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '');
  if (lineas.length === 0) return { cuentas: [], avisos: [] };
  const primera = lineas[0];
  const separador = [';', '\t', ','].reduce((mejor, s) => (primera.split(s).length > primera.split(mejor).length ? s : mejor), ';');
  const encabezado = normalizar(primera).includes('correo') || normalizar(primera).includes('nombres');
  const datos = encabezado ? lineas.slice(1) : lineas;
  const avisos: string[] = [];
  const porNombre = new Map(roles.map((r) => [normalizar(r.nombre), r.codigo]));
  const porCodigo = new Map(roles.map((r) => [r.codigo.toUpperCase(), r.codigo]));
  const cuentas = datos.map((linea, i) => {
    const c = dividir(linea, separador);
    if (c.length < 4) avisos.push(`Fila ${i + 1}: faltan columnas (se esperan ${COLUMNAS.length}: ${COLUMNAS.join(', ')}).`);
    const rolTexto = (c[5] ?? '').trim();
    const rol = porCodigo.get(rolTexto.toUpperCase()) ?? porNombre.get(normalizar(rolTexto)) ?? rolTexto;
    return { nombres: c[0] ?? '', apePat: c[1] ?? '', apeMat: c[2] || undefined, correo: c[3] ?? '', cargo: c[4] || undefined, rolCodigo: rol || 'USUARIO' };
  });
  return { cuentas, avisos };
}

export function CargaMasivaPanel({ empresas, roles, onVolver, onCreadas }: CargaMasivaPanelProps) {
  const activas = empresas.filter((e) => e.activa);
  const [empresa, setEmpresa] = useState(activas.length === 1 ? activas[0].nombre : '');
  const [texto, setTexto] = useState('');
  const [revision, setRevision] = useState<CargaMasivaRespuesta | null>(null);
  const [resultado, setResultado] = useState<CargaMasivaRespuesta | null>(null);
  const [ocupado, setOcupado] = useState<'revisar' | 'crear' | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [copiado, setCopiado] = useState(false);

  const { cuentas, avisos } = useMemo(() => interpretar(texto, roles), [texto, roles]);
  const siglaElegida = activas.find((e) => e.nombre === empresa)?.sigla ?? null;

  const descargarPlantilla = () => {
    const contenido = `${COLUMNAS.join(';')}\n${EJEMPLO}\n`;
    const url = URL.createObjectURL(new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'plantilla-cuentas.csv';
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const leerArchivo = async (evento: ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    setTexto(await archivo.text());
    setRevision(null);
    evento.target.value = '';
  };

  const enviar = async (soloValidar: boolean) => {
    if (!empresa) { setAviso({ tipo: 'error', texto: 'Elige la empresa.' }); return; }
    if (cuentas.length === 0) { setAviso({ tipo: 'error', texto: 'Pega las filas o sube el archivo.' }); return; }
    setOcupado(soloValidar ? 'revisar' : 'crear');
    setAviso(null);
    try {
      const respuesta = await administracionService.cargaMasiva({ empresa, soloValidar, cuentas });
      if (soloValidar || respuesta.creadas === 0) {
        setRevision(respuesta);
        if (!soloValidar) setAviso({ tipo: 'error', texto: 'No se creó ninguna cuenta: corrige las filas con error y vuelve a intentar.' });
      } else {
        setResultado(respuesta);
        onCreadas();
      }
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeDeError(err, 'No se pudo procesar la carga. Inténtalo de nuevo.') });
    } finally {
      setOcupado(null);
    }
  };

  const copiarClaves = async () => {
    if (!resultado) return;
    const lineas = resultado.filas
      .filter((f) => f.claveTemporal)
      .map((f) => `${f.nombreCompleto}\t${f.correo}\t${f.usuario}\t${f.claveTemporal}`);
    try {
      await navigator.clipboard.writeText(`Nombre\tCorreo\tUsuario\tClave temporal\n${lineas.join('\n')}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudo copiar. Selecciona la tabla y cópiala a mano.' });
    }
  };

  // ------------------------------------------------------------ resultado final
  if (resultado) {
    const conClave = resultado.filas.filter((f) => f.claveTemporal).length;
    return (
      <Panel className="aparece" titulo={`Se crearon ${resultado.creadas} cuentas en ${resultado.empresa}`} descripcion={resultado.invitacionesPorCorreo ? 'Cada persona recibió un correo con un enlace para crear su contraseña (vale 72 horas).' : 'El servidor no tiene correo de salida configurado: entrega a cada persona su clave temporal.'} relleno>
        {aviso && <AvisoBanner aviso={aviso} onCerrar={() => setAviso(null)} />}
        <div className="overflow-x-auto">
          <table className="tabla min-w-[40rem]">
            <thead>
              <tr>
                <th scope="col">Persona</th>
                <th scope="col">Correo</th>
                <th scope="col">Usuario interno</th>
                <th scope="col">{conClave > 0 ? 'Clave temporal' : 'Invitación'}</th>
              </tr>
            </thead>
            <tbody>
              {resultado.filas.map((f) => (
                <tr key={f.fila}>
                  <td className="font-medium text-ink">{f.nombreCompleto}</td>
                  <td className="text-muted">{f.correo}</td>
                  <td className="font-mono text-[13px] text-ink">{f.usuario}</td>
                  <td>
                    {f.claveTemporal ? (
                      <span className="font-mono text-[13px] text-ink">{f.claveTemporal}</span>
                    ) : f.invitacionEnviada ? (
                      <Etiqueta tono="ok"><MailCheck className="h-3.5 w-3.5" aria-hidden="true" /> Correo enviado</Etiqueta>
                    ) : (
                      <Etiqueta tono="warn">{f.mensaje ?? 'Sin invitación'}</Etiqueta>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {conClave > 0 && <p className="hint mt-3">Las claves temporales no se vuelven a mostrar: cópialas ahora. Cada persona puede cambiarla después con «¿Olvidaste tu contraseña?» cuando el correo esté configurado.</p>}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {conClave > 0 && <Boton icono={copiado ? Check : Copy} onClick={copiarClaves}>{copiado ? 'Copiado' : 'Copiar todas las claves'}</Boton>}
          <Boton variante="secundario" onClick={() => { setResultado(null); setRevision(null); setTexto(''); }}>Cargar otro grupo</Boton>
          <Boton variante="fantasma" icono={ArrowLeft} onClick={onVolver}>Volver a la lista</Boton>
        </div>
      </Panel>
    );
  }

  // ------------------------------------------------------------ carga y revisión
  const listas = revision?.listas ?? 0;
  const puedeCrear = revision !== null && revision.conError === 0 && listas > 0 && revision.total === cuentas.length;

  return (
    <div className="space-y-6">
      {aviso && <AvisoBanner aviso={aviso} onCerrar={() => setAviso(null)} />}

      <Panel titulo="Carga masiva de cuentas" descripcion="Elige la empresa, pega las filas de tu Excel (o sube un CSV) y revisa antes de crear. El usuario interno se arma solo con la sigla de la empresa; cada persona entra con su correo." relleno>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="masiva-empresa" className="label">Empresa</label>
            <select id="masiva-empresa" value={empresa} onChange={(e) => { setEmpresa(e.target.value); setRevision(null); }} className="input" disabled={activas.length === 0}>
              <option value="">{activas.length === 0 ? 'No hay empresas activas' : 'Elige una empresa'}</option>
              {activas.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}{e.sigla ? ` (${e.sigla})` : ''}</option>)}
            </select>
            {siglaElegida && <p className="hint">Los usuarios quedarán como <span className="font-mono">{siglaElegida.toLowerCase()}.correo</span> (por ejemplo <span className="font-mono">{siglaElegida.toLowerCase()}.jperez</span>).</p>}
          </div>
          <div className="flex items-end gap-2">
            <Boton variante="secundario" icono={Download} onClick={descargarPlantilla}>Plantilla CSV</Boton>
            <label className="btn btn-secondary cursor-pointer">
              <FileUp className="h-4 w-4" aria-hidden="true" /> Subir archivo
              <input type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" onChange={leerArchivo} />
            </label>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="masiva-texto" className="label">Filas (una persona por línea: {COLUMNAS.join(' · ')})</label>
          <textarea
            id="masiva-texto"
            value={texto}
            onChange={(e) => { setTexto(e.target.value); setRevision(null); }}
            rows={8}
            spellCheck={false}
            placeholder={`${COLUMNAS.join(';')}\n${EJEMPLO}`}
            className="input h-auto resize-y py-2.5 font-mono text-[13px]"
          />
          <p className="hint">Puedes copiar las celdas directamente desde Excel (se separan con tabulaciones) o usar punto y coma. Si la primera línea es el encabezado, se ignora. El rol puede ir por nombre o por código ({roles.map((r) => r.codigo).join(', ')}).</p>
          {avisos.length > 0 && <p role="alert" className="error-text">{avisos.slice(0, 3).join(' ')}</p>}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Boton variante="secundario" icono={ClipboardList} onClick={() => enviar(true)} cargando={ocupado === 'revisar'} disabled={cuentas.length === 0 || !empresa}>
            Revisar {cuentas.length > 0 ? `${cuentas.length} fila${cuentas.length === 1 ? '' : 's'}` : ''}
          </Boton>
          <Boton icono={UploadCloud} onClick={() => enviar(false)} cargando={ocupado === 'crear'} disabled={!puedeCrear} title={puedeCrear ? undefined : 'Primero revisa las filas; todas deben estar bien'}>
            Crear {listas > 0 ? `${listas} cuenta${listas === 1 ? '' : 's'}` : 'cuentas'}
          </Boton>
          <Boton variante="fantasma" icono={ArrowLeft} onClick={onVolver}>Volver</Boton>
        </div>
      </Panel>

      {revision && (
        <Panel titulo={revision.conError === 0 ? `Todo listo: ${revision.listas} cuenta${revision.listas === 1 ? '' : 's'} para crear` : `${revision.conError} fila${revision.conError === 1 ? '' : 's'} con error`} descripcion={revision.conError === 0 ? 'Revisa los datos y pulsa «Crear». Se crean todas o ninguna.' : 'Corrige las filas marcadas en tu archivo y vuelve a revisar.'}>
          <div className="overflow-x-auto">
            <table className="tabla min-w-[44rem]">
              <thead>
                <tr>
                  <th scope="col" className="num">Fila</th>
                  <th scope="col">Persona</th>
                  <th scope="col">Correo</th>
                  <th scope="col">Usuario interno</th>
                  <th scope="col">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {revision.filas.map((f) => (
                  <tr key={f.fila} className={f.estado === 'error' ? 'bg-bad-soft/40' : ''}>
                    <td className="num text-muted">{f.fila}</td>
                    <td className="font-medium text-ink">{f.nombreCompleto || '—'}</td>
                    <td className="text-muted">{f.correo || '—'}</td>
                    <td className="font-mono text-[13px] text-ink">{f.usuario ?? '—'}</td>
                    <td>{f.estado === 'error' ? <Etiqueta tono="bad">{f.mensaje}</Etiqueta> : <Etiqueta tono="ok" punto>Lista</Etiqueta>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
