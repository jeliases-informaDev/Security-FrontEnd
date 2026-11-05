'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Clock, History, Search, Upload } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso, Boton, Etiqueta } from '@/shared/ui/kit';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { mensajeDeFalla } from '@/modules/licencias/lib/consumo';
import {
  listasNegativasService,
  type BusquedaCandidatos,
  type CatalogoListas,
  type ConsultaResponse,
  type CuerpoConsulta,
} from '../services/listasNegativasService';
import { FormularioConsulta } from './FormularioConsulta';
import { ResultadoCargando, ResultadoConsulta, ResultadoInicial } from './ResultadoConsulta';
import { CandidatosLista } from './CandidatosLista';
import { DetalleLista } from './DetalleLista';

type Vista =
  | { fase: 'inicial' }
  | { fase: 'cargando'; texto: string }
  | { fase: 'candidatos'; busqueda: BusquedaCandidatos }
  | { fase: 'consulta'; consulta: ConsultaResponse };

// Botones de cabecera del diseño: 46 px de alto, texto de 15 px.
const BTN = 'h-[46px] text-[15px]';

/** Pantalla «Consulta» de Listas Negativas: formulario, resultado (o candidatos) y detalle por lista. */
export function ConsultaListas() {
  const idAbierto = useSearchParams().get('consulta');
  const [catalogo, setCatalogo] = useState<CatalogoListas | null>(null);
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>(idAbierto ? { fase: 'cargando', texto: 'Abriendo la consulta…' } : { fase: 'inicial' });
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [errorConsulta, setErrorConsulta] = useState<string | null>(null);
  const [candidatos, setCandidatos] = useState<BusquedaCandidatos | null>(null);
  const [abriendo, setAbriendo] = useState<number | null>(null);
  const [cargandoPagina, setCargandoPagina] = useState(false);

  const [intentoCatalogo, setIntentoCatalogo] = useState(0);

  useEffect(() => {
    let vigente = true;
    listasNegativasService
      .catalogo()
      .then((c) => { if (vigente) setCatalogo(c); })
      .catch((err: unknown) => { if (vigente) setErrorCatalogo(mensajeDe(err, 'No se pudo cargar el catálogo de listas.')); });
    return () => { vigente = false; };
  }, [intentoCatalogo]);

  const reintentarCatalogo = () => {
    setErrorCatalogo(null);
    setIntentoCatalogo((n) => n + 1);
  };

  // Una consulta del historial se abre con ?consulta=ID.
  useEffect(() => {
    if (!idAbierto) return;
    let vigente = true;
    listasNegativasService
      .obtener(Number(idAbierto))
      .then((consulta) => { if (vigente) setVista({ fase: 'consulta', consulta }); })
      .catch((err: unknown) => {
        if (!vigente) return;
        setErrorConsulta(mensajeDe(err, 'No se pudo abrir la consulta.'));
        setVista({ fase: 'inicial' });
      });
    return () => { vigente = false; };
  }, [idAbierto]);

  const buscar = async (cuerpo: CuerpoConsulta) => {
    setErrorBusqueda(null);
    setErrorConsulta(null);
    setCandidatos(null);
    setVista({ fase: 'cargando', texto: 'Consultando las listas…' });
    try {
      const respuesta = await listasNegativasService.consultar(cuerpo);
      if (respuesta.resultado === 'CONSULTA') {
        setVista({ fase: 'consulta', consulta: respuesta.consulta });
      } else {
        setCandidatos(respuesta.busqueda);
        setVista({ fase: 'candidatos', busqueda: respuesta.busqueda });
      }
    } catch (err) {
      // Con 402 el aviso global de tokens agotados ya sale: no se repite aquí.
      setErrorBusqueda(mensajeDeFalla(err, 'No se pudo completar la búsqueda. Inténtalo de nuevo en un momento.'));
      setVista({ fase: 'inicial' });
    }
  };

  const elegir = async (entidadId: number) => {
    if (!candidatos) return;
    setAbriendo(entidadId);
    setErrorConsulta(null);
    try {
      const consulta = await listasNegativasService.elegir(candidatos.id, entidadId);
      setVista({ fase: 'consulta', consulta });
    } catch (err) {
      setErrorConsulta(mensajeDeFalla(err, 'No se pudo abrir el resultado de esa persona.'));
    } finally {
      setAbriendo(null);
    }
  };

  const cambiarPagina = async (pagina: number) => {
    if (!candidatos) return;
    setCargandoPagina(true);
    setErrorConsulta(null);
    try {
      const siguiente = await listasNegativasService.candidatos(candidatos.id, pagina);
      setCandidatos(siguiente);
      setVista({ fase: 'candidatos', busqueda: siguiente });
    } catch (err) {
      setErrorConsulta(mensajeDeFalla(err, 'No se pudo cargar esa página de personas.'));
    } finally {
      setCargandoPagina(false);
    }
  };

  const consulta = vista.fase === 'consulta' ? vista.consulta : null;

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo="Debida diligencia"
        titulo="Listas negativas"
        descripcion="Consulta PEP, SUNAT, sanciones, listas de LA/FT y noticias en una sola búsqueda, y decide qué hacer con cada coincidencia."
        icono={Search}
        acciones={
          <>
            <Link href="/listas-negativas/historial" className={`btn btn-secondary ${BTN}`}>
              <History className="h-4 w-4" aria-hidden="true" /> Historial de consultas
            </Link>
            <Boton variante="secundario" icono={Clock} className={BTN} disabled title="Próximamente">
              Programar búsqueda <Etiqueta>Pronto</Etiqueta>
            </Boton>
            <Boton variante="secundario" icono={Upload} className={BTN} disabled title="Próximamente">
              Consulta masiva <Etiqueta>Pronto</Etiqueta>
            </Boton>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="flex min-w-0 flex-col gap-5">
          {errorCatalogo && (
            <Aviso aviso={{ tipo: 'error', texto: errorCatalogo }}>
              <button type="button" onClick={reintentarCatalogo} className="mt-1 text-sm font-semibold underline underline-offset-2">Reintentar</button>
            </Aviso>
          )}
          {errorConsulta && <Aviso aviso={{ tipo: 'error', texto: errorConsulta }} onCerrar={() => setErrorConsulta(null)} />}

          {catalogo ? (
            <FormularioConsulta catalogo={catalogo} buscando={vista.fase === 'cargando'} error={errorBusqueda} onBuscar={buscar} />
          ) : (
            !errorCatalogo && <div className="card h-[270px] p-6"><div className="skeleton h-full w-full rounded-2xl" aria-label="Cargando el formulario" /></div>
          )}

          {vista.fase === 'inicial' && <ResultadoInicial catalogo={catalogo} />}
          {vista.fase === 'cargando' && <ResultadoCargando texto={vista.texto} />}
          {vista.fase === 'candidatos' && (
            <CandidatosLista busqueda={vista.busqueda} abriendo={abriendo} cargandoPagina={cargandoPagina} onElegir={elegir} onCambiarPagina={cambiarPagina} />
          )}
          {vista.fase === 'consulta' && (
            <ResultadoConsulta
              key={vista.consulta.id}
              consulta={vista.consulta}
              onVolverACandidatos={candidatos && vista.consulta.busquedaId === candidatos.id ? () => setVista({ fase: 'candidatos', busqueda: candidatos }) : undefined}
              onActualizada={(actualizada) => setVista({ fase: 'consulta', consulta: actualizada })}
            />
          )}
        </div>

        <DetalleLista catalogo={catalogo} resultado={consulta ? consulta.resultado : null} />
      </div>
    </PageShell>
  );
}
