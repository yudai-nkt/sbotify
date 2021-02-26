import { SpotifyWebApi } from "spotify-web-api-ts";
import {
  SimplifiedAlbum,
  SimplifiedArtist,
} from "spotify-web-api-ts/types/types/SpotifyObjects";

/**
 * Concatenated artists' names.
 * Format differs based on the number of artists given in the parameter.
 * @param artists - Array of artists whose names are concatenated.
 * @returns The concatenated name.
 */
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

/**
 * Get an array of the artists you follow.
 * @param client - Spotify API client in use.
 * @returns Array of the artists you follow.
 */
export const getFollowedArtists = async (
  client: SpotifyWebApi
): Promise<SimplifiedArtist[]> => {
  let iter = await client.follow.getFollowedArtists({ limit: 50 });
  const artists = iter.items;

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

/**
 * Get an array of the albums released by a specific artist on a specific date.
 * @param client - Spotify API client in use.
 * @param artist - Artist whose albums you are looking for.
 * @param releaseDate - Release date.
 * @returns Array of the albums that satisfy the conditions.
 *
 * @remarks
 *
 * This function currently assumes that an artist would not release more than 50 albums
 * in a day.
 */
export const getDiscographyReleasedOn = async (
  client: SpotifyWebApi,
  artist: SimplifiedArtist,
  releaseDate: Date
): Promise<SimplifiedAlbum[]> => {
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
    (album) => album.release_date === toJstString(releaseDate).substring(0, 10)
  );
  return newReleases;
};
