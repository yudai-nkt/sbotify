import { SpotifyWebApi } from "spotify-web-api-ts";
import { SimplifiedArtist } from "spotify-web-api-ts/types/types/SpotifyObjects";

export const concatArtistNames = (artists: SimplifiedArtist[]): string => {
  const names = artists.map((artist) => artist.name);
  let concatNames: string;

  if (artists.length <= 2) {
    concatNames = names.join(" and ");
  } else {
    concatNames = `${names.slice(0, -1).join(", ")} and ${names.slice(-1)[0]}`;
  }
  return concatNames;
};

export const getFollowedArtists = async (client: SpotifyWebApi) => {
  let iter = await client.follow.getFollowedArtists({ limit: 50 });
  let artists = iter.items;

  while (iter.next !== null) {
    const curr = await client.follow.getFollowedArtists({
      limit: 50,
      after: iter.cursors.after,
    });

    artists.push(...curr.items);
    iter = curr;
  }

  return artists;
};

export const getNewReleases = async (
  client: SpotifyWebApi,
  artist: SimplifiedArtist
) => {
  const toJstString = (date: Date): string => {
    return new Date(date.getTime() + 9 * 60 * 60 * 1000)
      .toISOString()
      .replace(/Z$/, "+09:00");
  };
  const discography = await client.artists.getArtistAlbums(artist.id, {
    limit: 50,
    country: "JP",
  });
  const newReleases = discography.items.filter(
    (album) => album.release_date === toJstString(new Date()).substring(0, 10)
  );
  return newReleases;
};
