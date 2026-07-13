import { getSession, logOut } from "./auth.js";
import { getThemeLabel, initTheme, mountThemeSwitcher } from "./theme.js";

initTheme();
const themeSwitcher = mountThemeSwitcher();

const themeLabelEl = document.createElement("p");
themeLabelEl.id = "theme-label";
themeLabelEl.className = "hint";

const syncThemeLabel = (): void => {
  themeLabelEl.textContent = `Current theme: ${getThemeLabel()}`;
};

document.getElementById("user-email")?.after(themeLabelEl);
syncThemeLabel();
themeSwitcher.addEventListener("click", syncThemeLabel);

const emailEl = document.getElementById("user-email") as HTMLParagraphElement;
const logoutButton = document.getElementById("logout") as HTMLButtonElement;

const session = getSession();

if (!session) {
  window.location.replace("index.html");
} else {
  emailEl.textContent = session.email;
}

logoutButton.addEventListener("click", () => {
  logOut();
  window.location.href = "index.html";
});
