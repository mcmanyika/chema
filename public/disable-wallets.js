(function () {
  function isWalletError(reason) {
    var text = String((reason && reason.message) || reason || "");
    return /metamask|failed to connect/i.test(text);
  }

  window.addEventListener(
    "unhandledrejection",
    function (event) {
      if (isWalletError(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  function noop() {
    return Promise.resolve([]);
  }

  function disableProvider(provider) {
    if (!provider || typeof provider !== "object") return;
    try {
      provider.request = noop;
      provider.enable = noop;
      provider.send = noop;
      provider.sendAsync = function (_payload, callback) {
        if (typeof callback === "function") callback(null, { result: [] });
      };
      provider.connect = noop;
    } catch (_err) {
      // The extension may freeze the provider object.
    }
  }

  function disableInjectedWallets() {
    var current = window.ethereum;
    disableProvider(current);
    if (current && Array.isArray(current.providers)) {
      current.providers.forEach(disableProvider);
    }
  }

  disableInjectedWallets();

  try {
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      get: function () {
        return undefined;
      },
      set: function () {},
    });
  } catch (_err) {
    try {
      window.ethereum = undefined;
    } catch (_ignored) {}
  }
})();
