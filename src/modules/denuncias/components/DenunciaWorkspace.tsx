"use client";

import {
  FilePlus2,
  Inbox,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import {
  useState,
} from "react";

import { useAuth } from "@/modules/auth/hooks/AuthProvider";

import {
  DenunciaForm,
} from "./form/DenunciaForm";

import {
  ConsultaDenuncia,
} from "./consulta/ConsultaDenuncia";

import {
  DenunciasRecibidas,
} from "./admin/DenunciasRecibidas";


// ============================================================
// TIPOS
// ============================================================

type VistaDenuncias =
  | "resumen"
  | "registrar"
  | "consultar"
  | "recibidas";


// ============================================================
// COMPONENTE
// ============================================================

export function DenunciaWorkspace() {

  // ==========================================================
  // USUARIO AUTENTICADO
  // ==========================================================

  const {
    usuario,
  } = useAuth();

  // ==========================================================
  // PERMISOS
  // ==========================================================

  const rol = usuario?.rol?.trim().toUpperCase();

  const puedeGestionarDenuncias =
    rol === "ADMINISTRADOR" ||
    rol === "SUPERVISOR";

  // ==========================================================
  // VISTA ACTUAL
  // ==========================================================

  const [
    vista,
    setVista,
  ] = useState<VistaDenuncias>(
    "resumen"
  );


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <main className="min-h-screen bg-[#F7F9FC] px-5 py-7 lg:px-8">

      <div className="mx-auto max-w-[1500px]">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="mb-7">

          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

            {/* TÍTULO */}

            <div>

              <div className="flex items-center gap-2">

                <span className="h-2.5 w-2.5 rounded-full bg-[#ED1C24]" />

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#547AA7]">
                  Canal de denuncias
                </p>

              </div>


              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#231F20] lg:text-4xl">
                Gestión confidencial de denuncias
              </h1>


              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 lg:text-base">

                {puedeGestionarDenuncias
                  ? (
                    <>
                      Registra nuevas denuncias, consulta su seguimiento
                      y gestiona las denuncias recibidas de acuerdo con
                      tus permisos.
                    </>
                  )
                  : (
                    <>
                      Registra una nueva denuncia o consulta el seguimiento
                      de una denuncia existente mediante su identificador
                      y PIN.
                    </>
                  )}

              </p>

            </div>


            {/* TARJETA CONFIDENCIAL */}

            <div className="flex max-w-md items-start gap-4 rounded-[24px] border border-[#E8ECF3] bg-white px-5 py-4 shadow-sm">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589]">

                <ShieldCheck
                  size={21}
                />

              </div>


              <div>

                <p className="text-sm font-bold text-[#231F20]">
                  Canal confidencial
                </p>


                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Puedes registrar una denuncia de forma identificada
                  o anónima.
                </p>

              </div>

            </div>

          </div>

        </header>


        {/* ====================================================
            NAVEGACIÓN
        ==================================================== */}

        <nav className="mb-7 overflow-x-auto">

          <div className="inline-flex min-w-full gap-2 rounded-[22px] border border-[#E8ECF3] bg-white p-2 md:min-w-0">

            {/* RESUMEN */}

            <button
              type="button"
              onClick={() =>
                setVista(
                  "resumen"
                )
              }
              className={`
                inline-flex
                flex-1
                items-center
                justify-center
                gap-2
                whitespace-nowrap
                rounded-2xl
                px-5 py-3
                text-sm
                font-semibold
                transition
                ${
                  vista === "resumen"
                    ? "bg-[#1B4589] text-white shadow-sm"
                    : "text-[#547AA7] hover:bg-[#F7F9FC] hover:text-[#1B4589]"
                }
              `}
            >

              <ShieldAlert
                size={17}
              />

              Resumen

            </button>


            {/* NUEVA DENUNCIA */}

            <button
              type="button"
              onClick={() =>
                setVista(
                  "registrar"
                )
              }
              className={`
                inline-flex
                flex-1
                items-center
                justify-center
                gap-2
                whitespace-nowrap
                rounded-2xl
                px-5 py-3
                text-sm
                font-semibold
                transition
                ${
                  vista === "registrar"
                    ? "bg-[#1B4589] text-white shadow-sm"
                    : "text-[#547AA7] hover:bg-[#F7F9FC] hover:text-[#1B4589]"
                }
              `}
            >

              <FilePlus2
                size={17}
              />

              Nueva denuncia

            </button>


            {/* CONSULTAR */}

            <button
              type="button"
              onClick={() =>
                setVista(
                  "consultar"
                )
              }
              className={`
                inline-flex
                flex-1
                items-center
                justify-center
                gap-2
                whitespace-nowrap
                rounded-2xl
                px-5 py-3
                text-sm
                font-semibold
                transition
                ${
                  vista === "consultar"
                    ? "bg-[#1B4589] text-white shadow-sm"
                    : "text-[#547AA7] hover:bg-[#F7F9FC] hover:text-[#1B4589]"
                }
              `}
            >

              <Search
                size={17}
              />

              Consultar denuncia

            </button>


            {/* DENUNCIAS RECIBIDAS */}

            {puedeGestionarDenuncias && (

              <button
                type="button"
                onClick={() =>
                  setVista(
                    "recibidas"
                  )
                }
                className={`
                  inline-flex
                  flex-1
                  items-center
                  justify-center
                  gap-2
                  whitespace-nowrap
                  rounded-2xl
                  px-5 py-3
                  text-sm
                  font-semibold
                  transition
                  ${
                    vista === "recibidas"
                      ? "bg-[#1B4589] text-white shadow-sm"
                      : "text-[#547AA7] hover:bg-[#F7F9FC] hover:text-[#1B4589]"
                  }
                `}
              >

                <Inbox
                  size={17}
                />

                Denuncias recibidas

              </button>

            )}

          </div>

        </nav>


        {/* ====================================================
            VISTA: RESUMEN
        ==================================================== */}

        {vista === "resumen" && (

          <div className="space-y-7">

            {/* BIENVENIDA */}

            <section className="rounded-[28px] border border-[#E8ECF3] bg-white px-6 py-5 lg:px-7 lg:py-6">

              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589]">

                  <ShieldAlert
                    size={21}
                  />

                </div>


                <div className="min-w-0">

                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                    Canal de denuncias
                  </p>


                  <h2 className="mt-1 text-xl font-bold text-[#231F20] lg:text-2xl">
                    ¿Qué deseas realizar?
                  </h2>


                  <p className="mt-1.5 max-w-5xl text-sm leading-5 text-slate-500">

                    {puedeGestionarDenuncias
                      ? (
                        <>
                          Utiliza este canal para registrar hechos,
                          consultar el seguimiento de una denuncia
                          o gestionar las denuncias que han sido recibidas.
                        </>
                      )
                      : (
                        <>
                          Utiliza este canal para registrar hechos o conductas
                          que requieran ser reportadas, o consulta el estado
                          de una denuncia registrada anteriormente.
                        </>
                      )}

                  </p>

                </div>

              </div>

            </section>


            {/* ACCIONES */}

            <div
              className={`
                grid
                gap-6
                ${
                  puedeGestionarDenuncias
                    ? "lg:grid-cols-3"
                    : "lg:grid-cols-2"
                }
              `}
            >

              {/* NUEVA DENUNCIA */}

              <button
                type="button"
                onClick={() =>
                  setVista(
                    "registrar"
                  )
                }
                className="
                  group
                  rounded-[28px]
                  border border-[#E8ECF3]
                  bg-white
                  p-6
                  text-left
                  transition
                  hover:-translate-y-0.5
                  hover:border-[#C6D0E2]
                  hover:shadow-lg
                  lg:p-8
                "
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589] transition group-hover:bg-[#1B4589] group-hover:text-white">

                  <FilePlus2
                    size={22}
                  />

                </div>


                <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                  Registrar
                </p>


                <h3 className="mt-2 text-2xl font-bold text-[#231F20]">
                  Nueva denuncia
                </h3>


                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  Registra una nueva denuncia indicando los hechos,
                  involucrados y receptor correspondiente.
                </p>


                <div className="mt-6 inline-flex items-center text-sm font-bold text-[#1B4589]">

                  Registrar denuncia

                  <span className="ml-2 transition group-hover:translate-x-1">
                    →
                  </span>

                </div>

              </button>


              {/* CONSULTAR */}

              <button
                type="button"
                onClick={() =>
                  setVista(
                    "consultar"
                  )
                }
                className="
                  group
                  rounded-[28px]
                  border border-[#E8ECF3]
                  bg-white
                  p-6
                  text-left
                  transition
                  hover:-translate-y-0.5
                  hover:border-[#C6D0E2]
                  hover:shadow-lg
                  lg:p-8
                "
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589] transition group-hover:bg-[#1B4589] group-hover:text-white">

                  <Search
                    size={22}
                  />

                </div>


                <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                  Seguimiento
                </p>


                <h3 className="mt-2 text-2xl font-bold text-[#231F20]">
                  Consultar denuncia
                </h3>


                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  Consulta el estado y el historial utilizando el
                  identificador y PIN entregados al registrar la denuncia.
                </p>


                <div className="mt-6 inline-flex items-center text-sm font-bold text-[#1B4589]">

                  Consultar seguimiento

                  <span className="ml-2 transition group-hover:translate-x-1">
                    →
                  </span>

                </div>

              </button>


              {/* DENUNCIAS RECIBIDAS */}

              {puedeGestionarDenuncias && (

                <button
                  type="button"
                  onClick={() =>
                    setVista(
                      "recibidas"
                    )
                  }
                  className="
                    group
                    rounded-[28px]
                    border border-[#E8ECF3]
                    bg-white
                    p-6
                    text-left
                    transition
                    hover:-translate-y-0.5
                    hover:border-[#C6D0E2]
                    hover:shadow-lg
                    lg:p-8
                  "
                >

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589] transition group-hover:bg-[#1B4589] group-hover:text-white">

                    <Inbox
                      size={22}
                    />

                  </div>


                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                    Gestión
                  </p>


                  <h3 className="mt-2 text-2xl font-bold text-[#231F20]">
                    Denuncias recibidas
                  </h3>


                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                    Revisa las denuncias asignadas, consulta sus evidencias,
                    historial y registra los avances de atención.
                  </p>


                  <div className="mt-6 inline-flex items-center text-sm font-bold text-[#1B4589]">

                    Gestionar denuncias

                    <span className="ml-2 transition group-hover:translate-x-1">
                      →
                    </span>

                  </div>

                </button>

              )}

            </div>


            {/* CÓMO FUNCIONA */}

            <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                  Proceso
                </p>


                <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                  ¿Cómo funciona?
                </h2>

              </div>


              <div className="mt-7 grid gap-5 md:grid-cols-3">

                {/* PASO 1 */}

                <div className="rounded-2xl bg-[#F7F9FC] p-5">

                  <span className="text-sm font-black text-[#1B4589]">
                    01
                  </span>


                  <p className="mt-3 text-sm font-bold text-[#231F20]">
                    Registra la denuncia
                  </p>


                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Completa la información necesaria y decide si deseas
                    identificarte o mantener el anonimato.
                  </p>

                </div>


                {/* PASO 2 */}

                <div className="rounded-2xl bg-[#F7F9FC] p-5">

                  <span className="text-sm font-black text-[#1B4589]">
                    02
                  </span>


                  <p className="mt-3 text-sm font-bold text-[#231F20]">
                    Guarda tus credenciales
                  </p>


                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Al finalizar recibirás un identificador y un PIN de
                    seguimiento.
                  </p>

                </div>


                {/* PASO 3 */}

                <div className="rounded-2xl bg-[#F7F9FC] p-5">

                  <span className="text-sm font-black text-[#1B4589]">
                    03
                  </span>


                  <p className="mt-3 text-sm font-bold text-[#231F20]">
                    Consulta el seguimiento
                  </p>


                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Utiliza el identificador y PIN para revisar el estado
                    y los movimientos registrados.
                  </p>

                </div>

              </div>

            </section>

          </div>

        )}


        {/* ====================================================
            VISTA: NUEVA DENUNCIA
        ==================================================== */}

        {vista === "registrar" && (

          <DenunciaForm />

        )}


        {/* ====================================================
            VISTA: CONSULTAR DENUNCIA
        ==================================================== */}

        {vista === "consultar" && (

          <ConsultaDenuncia />

        )}


        {/* ====================================================
            VISTA: DENUNCIAS RECIBIDAS
        ==================================================== */}

        {vista === "recibidas" &&
          puedeGestionarDenuncias && (

            <DenunciasRecibidas />

          )}

      </div>

    </main>
  );
}