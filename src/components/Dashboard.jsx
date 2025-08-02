import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import sortyapp from '../assets/sortyapp.png';
import light from '../assets/light.png';
import dark from '../assets/dark.png';
import "../App.css";

function Dashboard() {
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const logout = () => {
    localStorage.clear();
    navigate("/signup");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get("access_token") || localStorage.getItem("access_token");
    const refresh_token = params.get("refresh_token") || localStorage.getItem("refresh_token");

    if (!access_token || !refresh_token) {
      navigate("/signup");
      return;
    }

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    setAccessToken(access_token);
    setRefreshToken(refresh_token);
  }, [navigate]);

  useEffect(() => {
    if (!refreshToken) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`https://sorted-spotify-backend.vercel.app/refresh_token?refresh_token=${refreshToken}`);
        const data = await res.json();
        if (data.access_token) {
          setAccessToken(data.access_token);
          localStorage.setItem("access_token", data.access_token);
        }
      } catch (err) {
        console.error("Token refresh failed", err);
      }
    }, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshToken]);

  useEffect(() => {
    if (!accessToken) return;
    const fetchPlaylists = async () => {
      try {
        const res = await fetch("https://api.spotify.com/v1/me/playlists", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.status === 401) return logout();
        const data = await res.json();
        setPlaylists(data.items || []);
      } catch (err) {
        console.error("Failed to fetch playlists", err);
      }
    };
    fetchPlaylists();
  }, [accessToken]);

  useEffect(() => {
    if (!selectedPlaylistId || !accessToken) return;
    setIsLoading(true);

    const fetchTracks = async () => {
      try {
        const res = await fetch(`https://api.spotify.com/v1/playlists/${selectedPlaylistId}/tracks`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();

        const rawTracks = data.items
          .filter(item => item.track?.id)
          .map(item => item.track);

        setTracks(rawTracks);
      } catch (err) {
        console.error("Error fetching tracks", err);
      }
      setIsLoading(false);
    };

    fetchTracks();
  }, [selectedPlaylistId, accessToken]);

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <header>
        <div className="navbar">
          <img src={sortyapp} alt="Logo" className="logo" />
          <button onClick={logout} className="sortbtn">Logout</button>
          <button onClick={() => setDarkMode(!darkMode)} className="sortbtn">
            <img src={darkMode ? light : dark} alt="Toggle Theme" className="lightdarklogo" />
          </button>
        </div>
      </header>

      <h1>Your Spotify Playlists</h1>

      <ul>
        {playlists.map(pl => (
          <li key={pl.id} style={{ marginBottom: '2rem', cursor: 'pointer' }} onClick={() => setSelectedPlaylistId(pl.id)}>
            <img src={pl.images[0]?.url} alt={pl.name} style={{ width: 100, borderRadius: 8 }} />
            <div>
              <strong>{pl.name}</strong> — {pl.tracks.total} tracks
            </div>
          </li>
        ))}
      </ul>

      {selectedPlaylistId && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Tracks</h2>
          {isLoading ? (
            <p>Loading tracks...</p>
          ) : (
            <ul>
              {tracks.map(track => (
                <li key={track.id} style={{ marginBottom: "1rem" }}>
                  <div>
                    <strong>{track.name}</strong> by {track.artists.map(a => a.name).join(", ")}
                  </div>
                  <div>
                    Album: {track.album.name} | Released: {track.album.release_date}
                  </div>
                  {track.preview_url ? (
                    <audio controls src={track.preview_url}>
                      Your browser does not support the audio element.
                    </audio>
                  ) : (
                    <div style={{ fontStyle: "italic", color: "#888" }}>No preview available</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
