import { AzureFunction, Context } from "@azure/functions";
import { Client } from "@line/bot-sdk";
import { SpotifyWebApi } from "spotify-web-api-ts";
import { SimplifiedAlbum } from "spotify-web-api-ts/types/types/SpotifyObjects";
import { DENONBU_PLAYLIST_ID, EXCLUDES } from "./constants";
import { notifyNewReleases } from "./line";
import {
  getFollowedArtists,
  getDiscographyReleasedOn,
  updatePlaylist,
} from "./spotify";

// Based on the doc: https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer?tabs=csharp#usage
type Timer = {
  schedule: Record<string, unknown>;
  scheduleStatus: {
    last: string;
    lastUpdated: string;
    next: string;
  };
  isPastDue: boolean;
};

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: Timer
): Promise<void> {
  const timestamp = new Date();

  if (myTimer.isPastDue) {
    context.log(`Timer function is running late (${timestamp.toISOString}).`);
  }

  const spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: "https://github.com/yudai-nkt/sbotify",
  });
  const accessToken = (
    await spotify.getRefreshedAccessToken(
      process.env.SPOTIFY_REFRESH_TOKEN ?? ""
    )
  ).access_token;
  spotify.setAccessToken(accessToken);

  const line = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "",
  });

  const artists = await getFollowedArtists(spotify);
  const todaysReleases: SimplifiedAlbum[] = [];
  for (const artist of artists.filter(
    (artist) => !EXCLUDES.includes(artist.name)
  )) {
    const todaysReleasesPerArtist = await getDiscographyReleasedOn(
      spotify,
      artist,
      timestamp
    );
    todaysReleases.push(...todaysReleasesPerArtist);
  }
  const todaysReleasesDedup = todaysReleases.filter(
    (release, idx) =>
      todaysReleases.findIndex((uniq) => uniq.id === release.id) === idx
  );

  await notifyNewReleases(line, process.env.LINE_ID ?? "", todaysReleasesDedup);

  await updatePlaylist(
    spotify,
    DENONBU_PLAYLIST_ID,
    todaysReleasesDedup,
    ({ artists }) => artists.map(({ name }) => name).includes("電音部")
  );

  if (todaysReleasesDedup.length >= 1) {
    context.log(JSON.stringify(todaysReleasesDedup, undefined, 2));
  } else {
    context.log("No release found today.");
  }
};

export default timerTrigger;
