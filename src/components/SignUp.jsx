import { useState, useEffect } from "react";
import '../App.css';
import light from '../assets/light.png';
import dark from '../assets/dark.png';
import sortyapp from '../assets/sortyapp.png';
import { useNavigate } from "react-router-dom";

function SignUp() {
  const [darkMode, setDarkMode] = useState(false);
  const [mail, setMail] = useState('');

  const sendMail = () => {
    if(mail.trim() !== '') {
      setMail('');
    }
  };
  
  const handleSpotifyLogin = () => {
    window.location.href = "https://your-backend.vercel.app/login";
  }

  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      navigate('/dashboard');
    }
  }, []);

  return (
    <>
    <div className={darkMode ? 'app dark' : 'app'}>
      <header>
        <div className="navbar">
        
          <img src={sortyapp} alt="Logo" className="logo" />
        
          <button onClick={() => setDarkMode(!darkMode)} className="sortbtn">
              {darkMode ? <img src={light} alt="Logo" className="lightdarklogo" /> : <img src={dark} alt="Logo" className="lightdarklogo" />}
          </button>
              
        </div>
      </header>

      <hero className="hero">
        <h2>Sign In</h2>
      </hero>

      <main className="main1">

        <div className="boxtext1">
          <p>choose your preferred method</p>
          <input 
            type="email"  
            placeholder="Ex:abc@gmail" 
            value={mail}
            onChange={e => setMail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMail()}>
          </input>
          <button onClick={sendMail}>Enter</button>

          <p>or</p>

          <button className="boxtext2" onClick={handleSpotifyLogin}>Continue with Spotify</button><br/>
          <h3 className="boxtext2">Sign with Google</h3><br/>
          <h3 className="boxtext3">Sign with Apple</h3>

        </div>
      </main>

      <footer>

      </footer>
    </div>  
    </>
  )
}

export default SignUp;