import { notFound } from 'next/navigation';
import { RegistroGuardado } from '@/modules/operaciones/components/RegistroGuardado';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <RegistroGuardado id={id} />;
}
