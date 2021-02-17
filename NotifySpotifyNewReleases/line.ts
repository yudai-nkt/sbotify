import { Client, MessageAPIResponseBase } from "@line/bot-sdk";
import { SimplifiedAlbum } from "spotify-web-api-ts/types/types/SpotifyObjects";
import { concatArtistNames } from "./spotify";

export const notifyNewReleases = (
  client: Client,
  addressee: string,
  albums: SimplifiedAlbum[]
): Promise<MessageAPIResponseBase> => {
  if (albums.length >= 1) {
    const message = {
      type: "template" as const,
      altText: "New releases on Spotify found.",
      template: {
        type: "carousel" as const,
        columns: albums.map((album) => {
          return {
            thumbnailImageUrl: album.images[0].url,
            title: album.name.substring(0, 40),
            text: concatArtistNames(album.artists).substring(0, 60),
            actions: [
              {
                type: "uri" as const,
                label: "Open in Spotify",
                uri: album.external_urls.spotify,
              },
            ],
          };
        }),
        imageAspectRatio: "square" as const,
      },
    };
    return client.pushMessage(addressee, message);
  } else {
    return client.pushMessage(
      addressee,
      {
        type: "text",
        text: "No releases found today.",
      },
      false
    );
  }
};
