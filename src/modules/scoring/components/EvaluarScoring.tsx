'use client';

import { useEffect, useState } from 'react';
import { FileText, History } from 'lucide-react';
import { scoringService, type CatalogosScoring, type ClienteScoring, type FilaHistorial, type ResultadoScoring } from '../services/scoringService';
import { useLicencia } from '@/modules/licencias/context/LicenciaContext';
import { esBolsaAgotada, mensajeDe } from '@/modules/licencias/lib/errores';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso, Boton, Esqueleto } from '@/shared/ui/kit';
import { IconoMedidor } from '@/shared/ui/iconos';
import { FORM_VACIO, aDatosEvaluacion, fechaLargaDe, type FormDatos } from '../lib/formato';
import { PasosScoring } from './PasosScoring';
import { PasoCliente } from './PasoCliente';
import { PasoDatos } from './PasoDatos';
import { PasoResultado } from './PasoResultado';
import { EvaluacionAntigua, HistorialScoring, esAntigua } from './HistorialScoring';

type Vista = 'flujo' | 'historial' | 'antigua';

/** Scoring de riesgo en tres pasos: Cliente → Datos → Resultado (metodología del 29 de octubre de 2026). */
export function EvaluarScoring() {
  const { refrescar } = useLicencia();
  const [catalogos, setCatalogos] = useState<CatalogosScoring | null>(null);
  const [vista, setVista] = useState<Vista>('flujo');
  const [seleccion, setSeleccion] = useState<ClienteScoring | null>(null);
  const [enDatos, setEnDatos] = useState(false);
  const [form, setForm] = useState<FormDatos>(FORM_VACIO);
  const [resultado, setResultado] = useState<ResultadoScoring | null>(null);
  const [filaAntigua, setFilaAntigua] = useState<FilaHistorial | null>(null);
  const [abriendoId, setAbriendoId] = useState<number | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    scoringService
      .obtenerCatalogos()
      .then((data) => {
        if (cancelado) return;
        setCatalogos(data);
        // El país de los fondos empieza en Perú (el grupo 1 de la metodología).
        const peru = data.paises.find((p) => p.grupo === 1);
        if (peru) setForm((f) => (f.paisFondosId ? f : { ...f, paisFondosId: String(peru.id) }));
      })
      .catch((err: unknown) => { if (!cancelado) setError(mensajeDe(err, 'No se pudieron cargar los catálogos de scoring.')); });
    return () => { cancelado = true; };
  }, []);

  const paisInicial = (c: CatalogosScoring | null): FormDatos => {
    const peru = c?.paises.find((p) => p.grupo === 1);
    return peru ? { ...FORM_VACIO, paisFondosId: String(peru.id) } : FORM_VACIO;
  };

  const calcular = async () => {
    if (!seleccion) return;
    setCalculando(true);
    setError(null);
    try {
      const data = await scoringService.evaluar(aDatosEvaluacion(form, seleccion));
      setResultado(data);
      // Evaluar descuenta tokens según la tarifa de Sulotec: se actualiza el medidor.
      void refrescar();
    } catch (err: unknown) {
      // Con 402 el aviso global de tokens agotados ya sale: no se repite el mensaje aquí.
      setError(esBolsaAgotada(err) ? null : mensajeDe(err, 'No se pudo completar la evaluación.'));
    } finally {
      setCalculando(false);
    }
  };

  const reiniciar = () => {
    setSeleccion(null);
    setEnDatos(false);
    setResultado(null);
    setForm(paisInicial(catalogos));
    setError(null);
    setVista('flujo');
  };

  const abrirDelHistorial = async (fila: FilaHistorial) => {
    if (esAntigua(fila)) {
      setFilaAntigua(fila);
      setVista('antigua');
      return;
    }
    setAbriendoId(fila.id);
    setError(null);
    try {
      setResultado(await scoringService.obtener(fila.id));
      setSeleccion(null);
      setEnDatos(false);
      setVista('flujo');
    } catch (err: unknown) {
      setError(mensajeDe(err, 'No se pudo abrir la evaluación.'));
    } finally {
      setAbriendoId(null);
    }
  };

  const paso: 0 | 1 | 2 = resultado ? 2 : seleccion && enDatos ? 1 : 0;
  const enHistorial = vista !== 'flujo';

  const descripcion = enHistorial
    ? 'Las evaluaciones hechas, con su nivel, su puntaje y la decisión que se tomó.'
    : paso === 0
      ? 'Califica el riesgo de LA/FT de un cliente con ocho factores. Las reglas fijan un nivel mínimo cuando la norma lo exige.'
      : paso === 1
        ? 'Completa lo que PLAFT no puede traer solo. Cada grupo corresponde a un factor del art. 27 de la Res. SBS 789-2018.'
        : `Evaluación del ${fechaLargaDe(resultado?.fecha)}. Queda guardada con su fecha, su versión y quién decidió.`;

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo="Debida diligencia"
        icono={IconoMedidor}
        titulo="Scoring de riesgo"
        descripcion={descripcion}
        acciones={
          <>
            {!enHistorial && paso === 2 && (
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm text-muted" aria-disabled="true">
                <FileText className="h-4 w-4" aria-hidden="true" />Cómo se calcula (PDF)<span className="badge badge-neutral">Pronto</span>
              </span>
            )}
            {!enHistorial && <Boton variante="secundario" icono={History} onClick={() => setVista('historial')}>Historial de evaluaciones</Boton>}
          </>
        }
      />

      {error && <Aviso className="mb-6" aviso={{ tipo: 'error', texto: error }} onCerrar={() => setError(null)} />}

      {vista === 'historial' && <HistorialScoring abriendoId={abriendoId} onAbrir={abrirDelHistorial} onVolver={() => setVista('flujo')} />}
      {vista === 'antigua' && filaAntigua && <EvaluacionAntigua fila={filaAntigua} onVolver={() => setVista('historial')} />}

      {vista === 'flujo' && (
        <>
          <PasosScoring paso={paso} />
          {paso === 0 && (
            <PasoCliente
              seleccion={seleccion}
              onSeleccionar={setSeleccion}
              onContinuar={() => setEnDatos(true)}
            />
          )}
          {paso === 1 && seleccion && (catalogos ? (
            <PasoDatos
              catalogos={catalogos}
              cliente={seleccion}
              form={form}
              onCambiar={(parche) => setForm((f) => ({ ...f, ...parche }))}
              onVolver={() => setEnDatos(false)}
              onCambiarCliente={() => { setSeleccion(null); setEnDatos(false); }}
              onCalcular={calcular}
              calculando={calculando}
            />
          ) : (
            <Esqueleto lineas={6} />
          ))}
          {paso === 2 && resultado && <PasoResultado resultado={resultado} onResultado={setResultado} onOtro={reiniciar} />}
        </>
      )}
    </PageShell>
  );
}
