export function firebaseAuthMessage(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: string }).code)
      : "";

  switch (code) {
    case "auth/configuration-not-found":
      return "Firebase Authentication is not enabled yet. In Firebase Console, open Authentication, click Get started, then enable Email/Password and Google.";
    case "auth/invalid-api-key":
      return "The Firebase API key is invalid. Check NEXT_PUBLIC_FIREBASE_API_KEY.";
    case "auth/operation-not-allowed":
      return "This sign-in method is turned off. Enable it under Authentication → Sign-in method.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account already exists for that email. Sign in instead.";
    case "auth/weak-password":
      return "Choose a password with at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized. Add localhost in Authentication → Settings → Authorized domains.";
    default:
      return error instanceof Error ? error.message : "Unable to authenticate.";
  }
}
