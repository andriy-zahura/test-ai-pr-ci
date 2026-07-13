import { getSession, logIn, signUp } from "./auth.js";
import { initTheme, mountThemeSwitcher } from "./theme.js";

const form = document.getElementById("auth-form") as HTMLFormElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const errorBox = document.getElementById("error") as HTMLParagraphElement;
const submitButton = document.getElementById("submit") as HTMLButtonElement;
const toggleButton = document.getElementById("mode-toggle") as HTMLButtonElement;
const title = document.getElementById("form-title") as HTMLHeadingElement;
const subtitle = document.getElementById("form-subtitle") as HTMLParagraphElement;

let mode: "login" | "signup" = "login";

function setError(message: string): void {
  errorBox.textContent = message;
  errorBox.hidden = message.length === 0;
}

function updateModeUI(): void {
  const isLogin = mode === "login";
  title.textContent = isLogin ? "Welcome back" : "Create account";
  subtitle.textContent = isLogin
    ? "Sign in to continue."
    : "Sign up with email and password.";
  submitButton.textContent = isLogin ? "Sign in" : "Sign up";
  toggleButton.textContent = isLogin
    ? "Need an account? Sign up"
    : "Already have an account? Sign in";
  setError("");
}

function switchMode(): void {
  mode = mode === "login" ? "signup" : "login";
  updateModeUI();
}

initTheme();
mountThemeSwitcher();

if (getSession()) {
  window.location.replace("success.html");
}

toggleButton.addEventListener("click", () => {
  switchMode();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  setError("");

  const email = emailInput.value;
  const password = passwordInput.value;
  const error =
    mode === "login" ? logIn(email, password) : signUp(email, password);

  if (error) {
    setError(error);
    return;
  }

  window.location.href = "success.html";
});

updateModeUI();
