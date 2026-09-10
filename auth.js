import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

(() => {
  const loginScreen = document.getElementById("loginScreen");
  const app = document.getElementById("app");
  const form = document.getElementById("loginForm");
  const email = document.getElementById("loginEmail");
  const password = document.getElementById("loginPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const confirmWrap = document.getElementById("confirmPasswordWrap");
  const error = document.getElementById("loginError");
  const toggle = document.getElementById("togglePassword");
  const forgot = document.getElementById("forgotPassword");
  const remember = document.getElementById("rememberMe");
  const logout = document.getElementById("logoutBtn");
  const authSwitch = document.getElementById("authSwitch");
  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");
  const authSubmit = document.getElementById("authSubmit");

  if (!loginScreen || !app || !form) return;

  const configReady = Object.values(firebaseConfig).every(value =>
    typeof value === "string" && value.trim() && !value.startsWith("PASTE_YOUR_")
  );

  let firebaseAuth = null;
  let signUpMode = false;

  function setError(message = "") {
    error.textContent = message;
  }

  function showApp(user) {
    loginScreen.hidden = true;
    app.hidden = false;

    const name = user.displayName || user.email?.split("@")[0] || "Student";
    const profileName = document.getElementById("profileName");
    const profileAvatar = document.getElementById("profileAvatar");
    const profileMeta = document.getElementById("profileMeta");

    if (profileName) profileName.textContent = name;
    if (profileAvatar) {
      profileAvatar.textContent = name
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    if (profileMeta) profileMeta.textContent = user.email || "Student";
    if (typeof window.navigate === "function") window.navigate("home");
  }

  function showLogin() {
    app.hidden = true;
    loginScreen.hidden = false;
    password.value = "";
    if (confirmPassword) confirmPassword.value = "";
    setError("");
    email.focus();
  }

  function setMode(isSignUp) {
    signUpMode = isSignUp;
    authTitle.textContent = isSignUp ? "Create your account" : "Welcome back";
    authSubtitle.textContent = isSignUp
      ? "Create your CampusOne student account."
      : "Sign in to access your campus services.";
    authSubmit.textContent = isSignUp ? "Create account" : "Sign in";
    authSwitch.textContent = isSignUp ? "Already have an account? Sign in" : "Create a new account";
    confirmWrap.hidden = !isSignUp;
    forgot.hidden = isSignUp;
    remember.closest(".remember").hidden = isSignUp;
    setError("");
  }

  function friendlyError(code) {
    const messages = {
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/missing-password": "Please enter your password.",
      "auth/weak-password": "Choose a stronger password with at least 6 characters.",
      "auth/email-already-in-use": "An account with this email already exists. Sign in instead.",
      "auth/invalid-credential": "The email or password is incorrect.",
      "auth/user-disabled": "This account has been disabled. Contact your administrator.",
      "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      "auth/network-request-failed": "Network error. Check your internet connection and try again.",
      "auth/operation-not-allowed": "Email/password authentication is not enabled in Firebase Console.",
      "auth/invalid-api-key": "The Firebase configuration is invalid. Check firebase-config.js."
    };
    return messages[code] || "Authentication failed. Please try again.";
  }

  if (!configReady) {
    showLogin();
    setError("Firebase is not connected yet. Open firebase-config.js and paste your Firebase Web App configuration.");
    return;
  }

  const firebaseApp = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(firebaseApp);

  toggle?.addEventListener("click", () => {
    const visible = password.type === "text";
    password.type = visible ? "password" : "text";
    toggle.textContent = visible ? "Show" : "Hide";
    toggle.setAttribute("aria-label", visible ? "Show password" : "Hide password");
  });

  authSwitch?.addEventListener("click", () => setMode(!signUpMode));

  form.addEventListener("submit", async event => {
    event.preventDefault();
    setError("");

    const value = email.value.trim().toLowerCase();
    const pass = password.value;

    if (!value) return setError("Please enter your email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return setError("Please enter a valid email address.");
    if (!pass) return setError("Please enter your password.");
    if (pass.length < 6) return setError("Password must contain at least 6 characters.");

    if (signUpMode) {
      if (pass !== confirmPassword.value) return setError("Passwords do not match.");
    }

    authSubmit.disabled = true;

    try {
      await setPersistence(firebaseAuth, signUpMode || remember.checked
        ? browserLocalPersistence
        : browserSessionPersistence);

      if (signUpMode) {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, value, pass);
        const displayName = value.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        await updateProfile(credential.user, { displayName });
        await sendEmailVerification(credential.user);
        setError("Account created. A verification email has been sent. Please verify your email, then sign in.");
        await signOut(firebaseAuth);
        setMode(false);
        password.value = "";
        return;
      }

      const credential = await signInWithEmailAndPassword(firebaseAuth, value, pass);
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        await signOut(firebaseAuth);
        setError("Please verify your email first. A new verification email has been sent.");
        return;
      }

      showApp(credential.user);
    } catch (err) {
      console.error(err);
      setError(friendlyError(err.code));
    } finally {
      authSubmit.disabled = false;
    }
  });

  forgot?.addEventListener("click", async () => {
    setError("");
    const value = email.value.trim().toLowerCase();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter your email address first, then select Forgot password.");
      email.focus();
      return;
    }
    forgot.disabled = true;
    try {
      await sendPasswordResetEmail(firebaseAuth, value);
      setError("Password reset email sent. Check your inbox and follow the instructions.");
    } catch (err) {
      console.error(err);
      setError(friendlyError(err.code));
    } finally {
      forgot.disabled = false;
    }
  });

  logout?.addEventListener("click", async () => {
    try {
      await signOut(firebaseAuth);
    } catch (err) {
      console.error(err);
      setError("Unable to sign out. Please try again.");
    }
  });

  onAuthStateChanged(firebaseAuth, user => {
    if (user && user.emailVerified) showApp(user);
    else showLogin();
  });

  setMode(false);
})();
