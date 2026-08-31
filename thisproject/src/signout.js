import { signOut } from "firebase/auth";
import { auth } from "./firebase_main";

export default function SignOutButton({ onSignOut }) {
  const handleClick = async () => {
    await signOut(auth); // log out from Firebase

  };

  return (
    <div>
      <button onClick={handleClick}>Sign Out</button>
    </div>
  );
}
