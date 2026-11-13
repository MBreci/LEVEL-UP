/**
 * Envuelve una promesa con un límite de tiempo: si la red se queda colgada
 * (portal cautivo, bloqueador que no cierra la conexión), rechaza en vez de
 * congelar la interfaz para siempre.
 */
export function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout:" + label)), ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}
