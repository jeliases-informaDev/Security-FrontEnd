import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center max-w-2xl w-full">
        {/* Shield Icon genérico con SVG para no depender de librerías externas aún */}
        <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">
          Portal de Prevención y Cumplimiento
        </h1>
        <p className="text-slate-500 mb-10 text-sm leading-relaxed max-w-md mx-auto">
          Acceso corporativo para la gestión de riesgos normativos o registro anónimo en el Canal de Denuncias.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/login" 
            className="px-8 py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            Acceso Corporativo
          </Link>
          <Link 
            href="/denuncias/publico" 
            className="px-8 py-3.5 bg-white text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition shadow-sm"
          >
            Ir al Canal de Denuncias
          </Link>
        </div>
      </div>
      
      {/* Footer de seguridad discreto */}
      <div className="mt-12 text-center text-xs text-slate-400">
        <p>Entorno cifrado y auditado. Los accesos no autorizados serán registrados.</p>
      </div>
    </main>
  );
}