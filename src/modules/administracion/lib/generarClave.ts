// Sin caracteres que se confunden al leerlos (0/O, 1/l/I) para que la clave se pueda dictar o copiar sin errores.
const MAYUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MINUSCULAS = 'abcdefghijkmnopqrstuvwxyz';
const NUMEROS = '23456789';
const TODOS = MAYUSCULAS + MINUSCULAS + NUMEROS;

const aleatorio = (limite: number) => {
  const valores = new Uint32Array(1);
  // Se descartan los valores que sesgarían el reparto (el tope es el mayor múltiplo de `limite`).
  const tope = Math.floor(0x100000000 / limite) * limite;
  do {
    crypto.getRandomValues(valores);
  } while (valores[0] >= tope);
  return valores[0] % limite;
};

/** Clave aleatoria con al menos una mayúscula, una minúscula y un número. */
export function generarClave(largo = 12): string {
  const caracteres = [
    MAYUSCULAS[aleatorio(MAYUSCULAS.length)],
    MINUSCULAS[aleatorio(MINUSCULAS.length)],
    NUMEROS[aleatorio(NUMEROS.length)],
  ];
  while (caracteres.length < largo) caracteres.push(TODOS[aleatorio(TODOS.length)]);
  // Se mezclan para que las tres primeras posiciones no sean siempre mayúscula, minúscula y número.
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = aleatorio(i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }
  return caracteres.join('');
}
