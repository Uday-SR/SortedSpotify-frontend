import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [playlists, setPlaylists] = useState([]);
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

  return (
    <div>
      <h1>Your Spotify Playlists</h1>
      <button onClick={logout}>Logout</button>
      <ul>
        {playlists.map(pl => (
          <li key={pl.id}>{pl.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
