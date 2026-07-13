/* ============================================================
   LEVEL UP · Amortiguador de almacenamiento
   Debe cargarse ANTES de cualquier otro script (guardas de página
   y app.js), de forma síncrona, en TODAS las páginas.

   Problema que resuelve: en algunos Safari/iPhone (modo privado o
   "Bloquear todas las cookies") localStorage lanza excepción y la
   sesión no se puede guardar -> el usuario no puede iniciar sesión.

   Solución: si localStorage nativo falla, se reemplaza por un
   respaldo basado en window.name, que:
     - persiste entre navegaciones de páginas en la MISMA pestaña,
     - no lo bloquea el ajuste de cookies,
     - se limpia al cerrar la pestaña (sesión efímera, aceptable).
   Si localStorage nativo funciona, este script NO hace nada.
   ============================================================ */
(function () {
  function nativeWorks() {
    try {
      var k = '__ls_probe__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }
  if (nativeWorks()) return; // el almacenamiento normal sirve: no tocamos nada

  var PREFIX = '__levelup_ls__';
  function readSeed() {
    try {
      if (typeof window.name === 'string' && window.name.indexOf(PREFIX) === 0) {
        return JSON.parse(window.name.slice(PREFIX.length)) || {};
      }
    } catch (e) {}
    return {};
  }
  var store = readSeed();
  function flush() {
    try { window.name = PREFIX + JSON.stringify(store); } catch (e) {}
  }
  var shim = {
    getItem: function (k) {
      k = String(k);
      return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
    },
    setItem: function (k, v) { store[String(k)] = String(v); flush(); },
    removeItem: function (k) { delete store[String(k)]; flush(); },
    clear: function () { store = {}; flush(); },
    key: function (i) { return Object.keys(store)[i] != null ? Object.keys(store)[i] : null; },
  };
  try { Object.defineProperty(shim, 'length', { get: function () { return Object.keys(store).length; } }); } catch (e) {}

  try {
    Object.defineProperty(window, 'localStorage', { value: shim, configurable: true, writable: true });
  } catch (e) {
    try { window.localStorage = shim; } catch (e2) {}
  }
  // Marca para que la app sepa que está en modo respaldo (sesión efímera).
  try { window.__LEVELUP_STORAGE_FALLBACK__ = true; } catch (e) {}
})();
