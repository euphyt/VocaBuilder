// App.tsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase_main";
import { Auth } from "./authentication";
import { SignOutButton } from "./signout";
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <Router>
      {loading ? (
        <p style={{ textAlign: "center", marginTop: 40 }}>Loading...</p>
      ) : (
        <Routes>
          <Route path="/login" element={!user ? <Auth /> : <Navigate to="/" />} />
          <Route path="/" element={user ? (<div><h1>Welcome, {user.email}</h1> <SignOutButton /></div>) : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
          


        </Routes>
      )}
    </Router>
  );
};

export default App;
