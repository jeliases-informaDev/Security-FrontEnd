import { notFound } from 'next/navigation';
import { MarcarInusual } from '@/modules/operaciones/components/MarcarInusual';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <MarcarInusual id={id} />;
}
