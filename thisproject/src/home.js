// Home.js
import React from "react";
//import { useNavigate } from "react-router-dom";
import GrabWord from "./getword";
import SignOutButton from "./signout";
import { Link } from "react-router-dom";
// This component displays today's word and allows navigation to the dashboard
function Home({ user, today, daysPassedInt }) {

    return (
        <div>
        <p>{today.toDateString()}</p>
        <GrabWord id={daysPassedInt} />
        <br />
        <p style={{ marginTop: 16 }}>
            <Link to="/dashboard">To History and Favorites →</Link>

        </p>
        <p>Signed in as {user.email}</p>
        <SignOutButton />
        <br />
      
        </div>
    );
}

export default Home;
