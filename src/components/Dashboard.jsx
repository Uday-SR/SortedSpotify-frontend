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
  const [sortBy, setSortBy] = useState("valence");
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sortOptions = ["valence", "acousticness", "key", "danceability", "tempo"];

  const logout = () => {
    localStorage.clear();
    navigate("/signup");
  };

  // Get tokens from URL or localStorage
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

  // Refresh token every 50 mins
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

  // Fetch playlists
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

  // Fetch tracks and enrich with audio features
  useEffect(() => {
    if (!selectedPlaylistId || !accessToken) return;

    const fetchTracksAndFeatures = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`https://api.spotify.com/v1/playlists/${selectedPlaylistId}/tracks`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();

        const rawTracks = data.items
          .filter(item => item.track?.id)
          .map(item => item.track);

        const ids = rawTracks.map(track => track.id).join(',');
        const featuresRes = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        const featuresData = await featuresRes.json();

        const enriched = rawTracks.map(track => {
          const feature = featuresData.audio_features.find(f => f?.id === track.id);
          return { ...track, feature };
        });

        enriched.sort((a, b) => (b.feature?.[sortBy] ?? 0) - (a.feature?.[sortBy] ?? 0));

        setTracks(enriched);
      } catch (err) {
        console.error("Error fetching track/audio features:", err);
      }
      setIsLoading(false);
    };

    fetchTracksAndFeatures();
  }, [selectedPlaylistId, accessToken, sortBy]);

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
          <li
            key={pl.id}
            onClick={() => setSelectedPlaylistId(pl.id)}
            style={{ marginBottom: '1rem', cursor: 'pointer' }}
          >
            <img
              src={pl.images[0]?.url}
              alt={pl.name}
              style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
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
                        e.stopPropagation();
                        setSortBy(option);
                      }}
                      style={{
                        cursor: "pointer",
                        fontWeight: option === sortBy ? "bold" : "normal",
                        color: option === sortBy ? "green" : "inherit"
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
          {isLoading ? (
            <p>Loading tracks...</p>
          ) : (
            <ul>
              {tracks.map(track => (
                <li key={track.id}>
                  🎵 {track.name} by {track.artists.map(a => a.name).join(", ")} — {track.feature?.[sortBy] ?? "N/A"}
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
