(function () {
  var cookieName = "taleex_theme=";
  var themeCookie = document.cookie.split("; ").find(function (entry) {
    return entry.indexOf(cookieName) === 0;
  });
  var theme = themeCookie ? themeCookie.substring(cookieName.length) : null;
  if (theme !== "dark" && theme !== "light") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  document.documentElement.classList.add(theme);
  document.documentElement.classList.remove(
    theme === "dark" ? "light" : "dark",
  );
})();
