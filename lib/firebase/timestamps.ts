import { serverTimestamp as clientServerTimestamp } from "firebase/firestore";

export function firestoreNow() {
  return clientServerTimestamp();
}
