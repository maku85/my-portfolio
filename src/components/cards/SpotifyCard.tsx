import React from "react";

const playlistUrl =
  "https://open.spotify.com/embed/playlist/2egffeuRciv9gP8Rb1lSOq";

const SpotifyCard: React.FC = () => {
  return (
    <div className="rounded-lg shadow-lg bg-white dark:bg-neutral-900 flex flex-col items-center">
      <iframe
        src={playlistUrl}
        width="100%"
        height="380"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded"
        title="Spotify Playlist"
      ></iframe>
    </div>
  );
};

export default SpotifyCard;
