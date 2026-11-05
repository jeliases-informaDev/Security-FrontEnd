'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authService } from '@/modules/auth/services/authService';
import { Aviso, Boton } from '@/shared/ui/kit';

// Entrada con la cuenta Sulotec (Keycloak, OpenID Connect con PKCE).
// Sin «code» en la dirección: arma el reto PKCE y manda a Keycloak.
// Con «code»: lo canjea en el servidor por la sesión del panel (la misma del login normal).
const CLAVE = 'plaft_sso_pkce';
const VIGENCIA_MS = 10 * 60_000;

interface Guardado { verificador: string; state: string; creado: number }

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const aleatorio = (largo: number) => {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const bytes = crypto.getRandomValues(new Uint8Array(largo));
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
};

const retoPkce = async (verificador: string) =>
  base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificador))));

function mensajeDe(err: unknown, respaldo: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err instanceof Error ? err.message : '') || respaldo;
}

export function SsoFlujo() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // El código de Keycloak solo sirve una vez: el efecto doble de React en desarrollo no debe repetir el flujo.
  const iniciado = useRef(false);

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;

    const consulta = new URLSearchParams(window.location.search);

    const leerGuardado = (): Guardado | null => {
      try {
        const crudo = sessionStorage.getItem(CLAVE);
        sessionStorage.removeItem(CLAVE);
        return crudo ? (JSON.parse(crudo) as Guardado) : null;
      } catch {
        return null;
      }
    };

    const canjear = async (code: string) => {
      const guardado = leerGuardado();
      if (!guardado || guardado.state !== consulta.get('state') || guardado.creado < Date.now() - VIGENCIA_MS) {
        throw new Error('El enlace de inicio de sesión no es válido o ya se usó. Vuelve a intentarlo.');
      }
      await authService.loginSso(code, guardado.verificador);
      router.replace('/overview');
    };

    const empezar = async () => {
      const config = await authService.ssoConfig();
      if (!config.activo) {
        router.replace('/login?sso=inactivo');
        return;
      }
      const verificador = aleatorio(64);
      const state = aleatorio(24);
      try {
        sessionStorage.setItem(CLAVE, JSON.stringify({ verificador, state, creado: Date.now() } satisfies Guardado));
      } catch {
        throw new Error('Tu navegador bloquea el almacenamiento de sesión. Entra con usuario y contraseña.');
      }
      const parametros = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: 'openid',
        code_challenge: await retoPkce(verificador),
        code_challenge_method: 'S256',
        state,
      });
      window.location.assign(new URL(`${config.issuer}/protocol/openid-connect/auth?${parametros.toString()}`).href);
    };

    const arrancar = async () => {
      try {
        if (consulta.get('error')) {
          sessionStorage.removeItem(CLAVE);
          throw new Error('Cancelaste el inicio de sesión en Sulotec o no se pudo completar.');
        }
        const code = consulta.get('code');
        if (code) await canjear(code);
        else await empezar();
      } catch (err) {
        setError(mensajeDe(err, 'No se pudo iniciar sesión con tu cuenta Sulotec.'));
      }
    };

    void arrancar();
  }, [router]);

  const reintentar = () => {
    try { sessionStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
    // Dirección limpia, sin código viejo: reinicia el flujo desde cero.
    window.location.assign(new URL('/sso', window.location.origin).href);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Aviso aviso={{ tipo: 'error', texto: error }} />
        <Boton className="w-full" onClick={reintentar}>Volver a intentar</Boton>
        <p className="text-center text-sm">
          <Link href="/login" className="font-medium text-brand-ink hover:underline">Entrar con usuario y contraseña</Link>
        </p>
      </div>
    );
  }

  return (
    <p role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden="true" />
      Entrando con tu cuenta Sulotec…
    </p>
  );
}
