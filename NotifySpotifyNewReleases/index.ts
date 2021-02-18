import { AzureFunction, Context } from "@azure/functions";
import { Client } from "@line/bot-sdk";
import { SpotifyWebApi } from "spotify-web-api-ts";
import { EXCLUDES } from "./constants";
import { notifyNewReleases } from "./line";
import { getFollowedArtists, getNewReleases } from "./spotify";

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
  const timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log("Timer function is running late!");
  }
  context.log("Timer trigger function ran!", timeStamp, process.version);

  const spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: "https://github.com/yudai-nkt/sbotify",
  });
  const accessToken = (
    await spotify.getRefreshedAccessToken(process.env.SPOTIFY_REFRESH_TOKEN)
  ).access_token;
  spotify.setAccessToken(accessToken);

  const line = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  });

  const artists = await getFollowedArtists(spotify);
  const newReleases = [];
  for (const artist of artists.filter(
    (artist) => !EXCLUDES.includes(artist.name)
  )) {
    const newReleasePerArtist = await getNewReleases(spotify, artist);
    newReleases.push(...newReleasePerArtist);
  }
  const newReleasesDedup = [
    ...new Map(newReleases.map((album) => [album.id, album])).values(),
  ];

  await notifyNewReleases(line, process.env.LINE_ID, newReleasesDedup);

  if (newReleasesDedup.length >= 1) {
    context.log(newReleasesDedup);
  } else {
    context.log("No release found today.");
  }
};

export default timerTrigger;
