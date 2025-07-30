import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import sortyapp from './assets/sortyapp.png';
import light from './assets/light.png';
import dark from './assets/dark.png';
import "./App.css";

function Dashboard() {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/signup");
  };

  // Extract tokens from URL or localStorage
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

  // Refresh token every 50 minutes
  useEffect(() => {
    if (!refreshToken) return;

    const interval = setInterval(() => {
      fetch(`https://sorted-spotify-backend.vercel.app/refresh_token?refresh_token=${refreshToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            setAccessToken(data.access_token);
            localStorage.setItem("access_token", data.access_token);
          }
        })
        .catch(err => {
          console.error("Failed to refresh token", err);
        });
    }, 50 * 60 * 1000); // every 50 minutes

    return () => clearInterval(interval);
  }, [refreshToken]);

  // Fetch user playlists using access_token
  useEffect(() => {
    if (!accessToken) return;

    const fetchPlaylists = async () => {
      try {
        const res = await fetch("https://api.spotify.com/v1/me/playlists", {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (res.status === 401 && refreshToken) {
      // Try refreshing token
          const refreshRes = await fetch(`https://sorted-spotify-backend.vercel.app/refresh_token?refresh_token=${refreshToken}`);
          const data = await refreshRes.json();
          if (data.access_token) {
            localStorage.setItem("access_token", data.access_token);
            setAccessToken(data.access_token);
          } else {
            logout(); // failed refresh
          }
          return;
        }

        const data = await res.json();
        setPlaylists(data.items || []);
      } catch (err) {
        console.error("Error fetching playlists:", err);
      }
    };

    fetchPlaylists();

  }, [accessToken]);

  // Sorting dropdown Handling
  const sortOptions = ["valence", "acousticness", "key", "danceablilty"];
  const [tracks, setTracks] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [sortBy, setSortBy] = useState("valence");

  useEffect(() => {
    if (!selectedPlaylistId || !accessToken) return;

    const fetchTracks = async () => {
      try {
        const res = await fetch(`https://api.spotify.com/v1/playlists/${selectedPlaylistId}/tracks`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        const data = await res.json();

        const trackItems = data.items
          .filter(item => item.track && item.track.id)
          .map(item => item.track);

        const ids = trackItems.map(track => track.id).join(',');

        const features = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

         const featuresData = await features.json();

        const enrichedTracks = trackItems.map(track => {
          const feature = featuresData.audio_features.find(f => f.id === track.id);
          return { ...track, feature};
        });

        enrichedTracks.sort((a, b) => {
          const aVal = a.feature?.[sortBy] ?? 0;
          const bVal = b.feature?.[sortBy] ?? 0;
          return bVal - aVal; // descending
        });

        setTracks(enrichedTracks);
      } catch (err) {
         console.log("error fetching track or audio features : ", err);
      }
    };

    fetchTracks();
  }, [selectedPlaylistId, accessToken]);

  return (
    <div className={darkMode ? 'app dark' : 'app'}>
      <header>
        <div className="navbar">
          <img src={sortyapp} alt="Logo" className="logo" />
          <button onClick={toSignup} className="sortbtn">Sort Now</button>
          <button onClick={() => setDarkMode(!darkMode)} className="sortbtn">
            <img src={darkMode ? light : dark} alt="Toggle Theme" className="lightdarklogo" />
          </button>
          <div className="option">≡</div>
        </div>
      </header>

      <h1>Your Spotify Playlists</h1>
      <button onClick={logout}>Logout</button>

      <ul>
        {playlists.map(pl => (
          <li
            key={pl.id}
            style={{ marginBottom: '1rem', listStyle: 'none' }}
            onClick={() => setSelectedPlaylistId(pl.id)}
          >
            <img
              src={pl.images[0]?.url}
              alt={pl.name}
              style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
            />
            <div>
              <strong>{pl.name}</strong> — {pl.tracks.total} tracks
            </div>

            {selectedPlaylistId === pl.id && (
              <div style={{ marginTop: "0.5rem" }}>
                <strong>Sort tracks by:</strong>
                <ul>
                  {sortOptions.map(option => (
                    <li
                      key={option}
                      onClick={(e) => {
                        e.stopPropagation(); // prevent re-triggering playlist click
                        setSortBy(option);
                      }}
                      style={{
                        cursor: "pointer",
                        fontWeight: option === sortBy ? "bold" : "normal"
                      }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>

      {selectedPlaylistId && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Tracks (Sorted by {sortBy})</h2>
          <ul>
            {tracks.map(track => (
              <li key={track.id}>
                🎵 {track.name} by {track.artists.map(a => a.name).join(", ")} — {track.feature?.[sortBy] ?? "N/A"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );}

export default Dashboard;
