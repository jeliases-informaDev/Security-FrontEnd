import { notFound } from 'next/navigation';
import { ArchivoGenerado } from '@/modules/operaciones/components/ArchivoGenerado';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <ArchivoGenerado id={id} />;
}
