"use client";

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";

import {
  Check,
  ChevronDown,
} from "lucide-react";


// ============================================================
// TIPOS
// ============================================================

export interface StyledSelectOption {
  value: string;
  label: string;
}

interface StyledSelectProps {
  value: string;

  options: StyledSelectOption[];

  onChange: (value: string) => void;

  placeholder?: string;

  disabled?: boolean;

  error?: boolean;
}


// ============================================================
// COMPONENTE
// ============================================================

export function StyledSelect({
  value,
  options,
  onChange,
  placeholder = "Seleccionar opción",
  disabled = false,
  error = false,
}: StyledSelectProps) {

  const selectedOption =
    options.find(
      (option) =>
        option.value === value
    ) ?? null;


  return (
    <Listbox
      value={value}
      onChange={onChange}
      disabled={disabled}
    >

      <div className="relative">

        {/* ====================================================
            CAMPO
        ==================================================== */}

        <ListboxButton
          className={`
            relative
            flex
            min-h-[52px]
            w-full
            items-center
            rounded-2xl
            border
            bg-white
            px-4
            pr-12
            text-left
            text-sm
            outline-none
            transition-all
            duration-200

            ${
              error
                ? `
                    border-red-400
                    focus:border-red-500
                    focus:ring-4
                    focus:ring-red-100
                  `
                : `
                    border-[#C6D0E2]
                    hover:border-[#547AA7]
                    focus:border-[#1B4589]
                    focus:ring-4
                    focus:ring-[#1B4589]/10
                  `
            }

            ${
              disabled
                ? `
                    cursor-not-allowed
                    bg-slate-50
                    text-slate-400
                  `
                : `
                    cursor-pointer
                    text-[#231F20]
                  `
            }
          `}
        >

          {/* TEXTO */}

          <span
            className={`
              block
              truncate

              ${
                selectedOption
                  ? "font-medium text-[#231F20]"
                  : "text-slate-400"
              }
            `}
          >
            {
              selectedOption
                ? selectedOption.label
                : placeholder
            }
          </span>


          {/* FLECHA */}

          <span
            className="
              pointer-events-none
              absolute
              inset-y-0
              right-4
              flex
              items-center
              text-[#547AA7]
            "
          >
            <ChevronDown
              size={18}
              strokeWidth={2}
            />
          </span>

        </ListboxButton>


        {/* ====================================================
            OPCIONES
        ==================================================== */}

        <ListboxOptions
          anchor="bottom"
          transition
          className="
            z-[100]
            mt-1.5
            max-h-56
            w-[var(--button-width)]
            overflow-y-auto

            rounded-2xl
            border
            border-[#E1E7F0]
            bg-white

            p-1.5

            shadow-[0_12px_30px_rgba(15,23,42,0.12)]

            outline-none

            transition
            duration-100
            ease-out

            data-[closed]:scale-[0.98]
            data-[closed]:opacity-0
          "
        >

          {
            options.map(
              (option) => (

                <ListboxOption
                  key={option.value}
                  value={option.value}
                  className="
                    group
                    relative

                    flex
                    cursor-pointer
                    select-none
                    items-center
                    justify-between

                    rounded-xl

                    px-3.5
                    py-2.5

                    text-sm
                    text-[#231F20]

                    outline-none

                    transition-colors

                    data-[focus]:bg-[#EEF4FC]
                    data-[focus]:text-[#1B4589]

                    data-[selected]:bg-[#F4F7FC]
                    data-[selected]:font-semibold
                    data-[selected]:text-[#1B4589]
                  "
                >

                  <span className="truncate">
                    {option.label}
                  </span>


                  <Check
                    size={16}
                    strokeWidth={2.5}
                    className="
                      hidden
                      shrink-0
                      text-[#1B4589]

                      group-data-[selected]:block
                    "
                  />

                </ListboxOption>

              )
            )
          }

        </ListboxOptions>

      </div>

    </Listbox>
  );
}