import { redirect } from 'next/navigation';

// No hay portada: quien entra a la raiz va directo al login.
export default function Home() {
  redirect('/login');
}
