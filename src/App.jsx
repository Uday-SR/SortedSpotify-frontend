import { useState, useEffect } from "react";
import './App.css';
import sortyapp from './assets/sortyapp.png';
import light from './assets/light.png';
import dark from './assets/dark.png';
import SignUp from "./components/SignUp";
import Dashboard from "./components/Dashboard";
import { useNavigate } from "react-router-dom"; 
import { getRefreshToken } from "./components/SpotifyAuth";

function App() {
  // Dark Mode and Light Mode
  const [darkMode, setDarkMode] = useState(false);

  //Navigate to signup from home
  const navigate = useNavigate();
  const toSignup = () => {
    navigate("/signup")
  }


  return (
    <div className={darkMode ? 'app dark' : 'app'}>

        <header>
          <div className="navbar">

            <img src={sortyapp} alt="Logo" className="logo" />

            <button onClick={toSignup} className="sortbtn">Sort Now</button>

            <button onClick={() => setDarkMode(!darkMode)} className="sortbtn">
                {darkMode ? <img src={light} alt="Logo" className="lightdarklogo" /> : <img src={dark} alt="Logo" className="lightdarklogo" />}
              </button>
          
            <div className="option">≡</div>
          </div>  
        </header>
      
        <hero>
      
          <div className="hero">

            {/* <img src={sortyapp} alt="Logo" className="logo" /> */}

            <div><h1>Welcome to Sorty</h1></div>

            <button onClick={toSignup} className="sortbtn">Try it Now</button>

            

          </div>

        </hero>

        <main>

          <div className="main">
            <div className="boxtext"><p>Sorty is a Free Spotify extension that helps you to sort your </p><p>music from the playlists according to various aspects</p>
              <p>Tempo</p>
              <p>Scales</p>
              <p>Emotion</p>
              <p>Artist</p>
            </div>

            <div>Here's the Tutorial Video</div>
          </div>

        </main>

        <footer>
          <div>
            made by uday
          </div>
        </footer>  
      
    </div>
  )
}

export default App;
