import { notFound } from 'next/navigation';
import { PrepararRos } from '@/modules/operaciones/components/PrepararRos';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <PrepararRos id={id} />;
}
