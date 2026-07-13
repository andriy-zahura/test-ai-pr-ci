const USERS_KEY = "auth_users";
const SESSION_KEY = "auth_session";

export interface AuthSession {
  email: string;
  loggedInAt: string;
}

type UserStore = Record<string, string>;

function readUsers(): UserStore {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    return {};
  }

    return parsed as UserStore;
  } catch {
    return {};
  }
}

function writeUsers(users: UserStore): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return false;
  }

  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(trimmed);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function signUp(email: string, password: string): string | null {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return "Enter a valid email address.";
  }

  if (!isValidPassword(password)) {
    return "Password must be at least 6 characters.";
  }

  const users = readUsers();
  if (users[normalizedEmail]) {
    return "An account with this email already exists.";
  }

  users[normalizedEmail] = password;
  writeUsers(users);
  createSession(normalizedEmail);
  return null;
}

export function logIn(email: string, password: string): string | null {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return "Enter a valid email address.";
  }

  const users = readUsers();
  const storedPassword = users[normalizedEmail];

  if (!storedPassword) {
    return "No account found for this email.";
  }

  if (storedPassword !== password) {
    return "Incorrect password.";
  }

  createSession(normalizedEmail);
  return null;
}

function createSession(email: string): void {
  const session: AuthSession = {
    email,
    loggedInAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("email" in parsed) ||
      typeof (parsed as AuthSession).email !== "string"
    ) {
      return null;
    }
    return parsed as AuthSession;
  } catch {
    return null;
  }
}

export function logOut(): void {
  localStorage.removeItem(SESSION_KEY);
}
