import { ExportarUif } from '@/modules/operaciones/components/ExportarUif';

/** El mes que llega en la dirección («?periodo=2026-10», por ejemplo desde un registro) solo vale si tiene la forma AAAA-MM. */
const PERIODO = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function Page({ searchParams }: { searchParams: Promise<{ periodo?: string | string[] }> }) {
  const { periodo } = await searchParams;
  return <ExportarUif periodoInicial={typeof periodo === 'string' && PERIODO.test(periodo) ? periodo : undefined} />;
}
