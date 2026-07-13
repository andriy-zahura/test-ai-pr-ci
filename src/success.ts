import { getSession, logOut } from "./auth.js";

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
