import { FirebaseError } from "firebase/app";

export function authErrorMessage(error: unknown): string {
  if (error instanceof Error && !(error instanceof FirebaseError)) {
    return error.message || "Váratlan hiba történt. Próbáld újra.";
  }
  if (!(error instanceof FirebaseError)) {
    return "Váratlan hiba történt. Próbáld újra.";
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "Ezzel az e-mail címmel már van fiókod. Jelentkezz be, vagy kérj új jelszót.";
    case "auth/invalid-email":
      return "Az e-mail cím formátuma nem megfelelő.";
    case "auth/weak-password":
      return "A jelszó túl gyenge. Használj legalább 6 karaktert.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Hibás e-mail cím vagy jelszó.";
    case "auth/too-many-requests":
      return "Túl sok próbálkozás történt. Várj néhány percet, majd próbáld újra.";
    case "auth/network-request-failed":
      return "Hálózati hiba történt. Ellenőrizd az internetkapcsolatot.";
    case "auth/user-disabled":
      return "Ez a felhasználói fiók le van tiltva.";
    default:
      return "A művelet nem sikerült. Próbáld újra.";
  }
}
