/* ============================================================
   LEVEL UP · Almacenamiento resiliente (window.LS)
   Debe cargarse como PRIMER script en TODAS las páginas, de forma
   síncrona (antes de las guardas de página y de app.js).

   Problema: en algunos Safari/iPhone (modo privado o "Bloquear todas
   las cookies") localStorage lanza excepción — o ni siquiera se puede
   leer — y la sesión no se puede guardar; el usuario no entra.

   Solución: la app usa SIEMPRE window.LS en vez de localStorage.
   LS usa el localStorage nativo cuando funciona, y si está bloqueado
   cae a un respaldo basado en window.name, que:
     - persiste entre navegaciones de páginas en la MISMA pestaña,
     - no lo bloquea el ajuste de cookies,
     - se limpia al cerrar la pestaña (sesión efímera, aceptable).
   Este enfoque NO depende de poder reemplazar window.localStorage
   (cosa que Safari a veces no permite).
   ============================================================ */
(function () {
  var PREFIX = '__levelup_ls__';
  var _ns = null;
  function nameStore() {
    if (_ns) return _ns;
    var store = {};
    try {
      if (typeof window.name === 'string' && window.name.indexOf(PREFIX) === 0) {
        store = JSON.parse(window.name.slice(PREFIX.length)) || {};
      }
    } catch (e) {}
    function flush() { try { window.name = PREFIX + JSON.stringify(store); } catch (e) {} }
    _ns = {
      getItem: function (k) { k = String(k); return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem: function (k, v) { store[String(k)] = String(v); flush(); },
      removeItem: function (k) { delete store[String(k)]; flush(); },
    };
    return _ns;
  }

  var nativeOk = false;
  try {
    var k = '__ls_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    nativeOk = true;
  } catch (e) { nativeOk = false; }

  if (nativeOk) {
    // Nativo sirve: úsalo, pero con red de seguridad por si falla puntualmente.
    window.LS = {
      getItem: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return nameStore().getItem(k); } },
      setItem: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { nameStore().setItem(k, v); } },
      removeItem: function (k) { try { window.localStorage.removeItem(k); } catch (e) { nameStore().removeItem(k); } },
    };
  } else {
    // Nativo bloqueado: respaldo en window.name (persiste en la pestaña).
    window.LS = nameStore();
    try { window.__LEVELUP_STORAGE_FALLBACK__ = true; } catch (e) {}
  }
})();
