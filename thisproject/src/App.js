// App.js
import "./App.css";
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase_main";
import { Auth } from "./authentication";
//import SignOutButton from "./signout";
//import GrabWord from "./getword";
import Dashboard from "./Dashboard";
import Home from "./home";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const baseDate = new Date("2025-10-01");
  const today = new Date();
  const daysPassed = (today - baseDate) / 86400000; // divide by days
  const daysPassedInt = Math.floor(daysPassed);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login"element={<Auth />}/>
          <Route path="/dashboard"
            element={
              user ? (
                <Dashboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/"
            element={
              user ? (
                <Home user={user} today={today} daysPassedInt={daysPassedInt} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
