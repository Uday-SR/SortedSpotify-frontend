export const getRefreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    console.error("No refresh token found.");
    return;
  }

  const url = "https://your-backend.vercel.app/refresh_token";

  try {
    const res = await fetch(`${url}?refresh_token=${refreshToken}`);
    const data = await res.json();

    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }

    if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      
    }

  } catch (err) {
    console.error("Error refreshing token:", err);
  }
};