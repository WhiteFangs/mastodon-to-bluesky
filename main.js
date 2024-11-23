require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { RichText, AtpAgent } = require("@atproto/api");
const axios = require("axios");
const he = require('he');
const express = require('express');
const app = express();
const port = 8000;

// Mastodon credentials
const mastodonInstance = process.env.MASTODON_INSTANCE;
const mastodonUser = process.env.MASTODON_USER;

async function main() {
  // Bluesky agent
  const agent = new AtpAgent({ service: process.env.BLUESKY_ENDPOINT });
  const loginResponse = await agent.login({
    identifier: process.env.BLUESKY_HANDLE,
    password: process.env.BLUESKY_PASSWORD,
  });
  if (!loginResponse.success) console.error("🔒 login failed");

  // File to store the last processed Mastodon post ID
  const lastProcessedPostIdFile = path.join(
    __dirname,
    "data",
    "lastProcessedPostId.txt"
  );

  // Variable to store the last processed Mastodon post ID
  let lastProcessedPostId = loadLastProcessedPostId();

  // Function to load the last processed post ID from the file
  function loadLastProcessedPostId() {
    try {
      return fs.readFileSync(lastProcessedPostIdFile, "utf8").trim();
    } catch (error) {
      console.error("Error loading last processed post ID:", error);
      return null;
    }
  }

  // Function to save the last processed post ID to the file
  function saveLastProcessedPostId() {
    try {
      fs.writeFileSync(lastProcessedPostIdFile, `${lastProcessedPostId}`);
    } catch (error) {
      console.error("Error saving last processed post ID:", error);
    }
  }

  async function createBlueskyMessage(text) {
    const richText = new RichText({ text });
    await richText.detectFacets(agent);

    return {
      text: richText.text,
      facets: richText.facets
    };
  }

  async function postToBluesky(textParts) {
    const blueskyMessage = await createBlueskyMessage(textParts[0]);
    const rootMessageResponse = await agent.post(blueskyMessage);

    if (textParts.length === 1) return;

    let replyMessageResponse = null
    for (let index = 1; index < textParts.length; index++) {
      replyMessageResponse = await agent.post({
        ...(await createBlueskyMessage(textParts[index])),
        reply: {
          root: rootMessageResponse,
          parent: replyMessageResponse ?? rootMessageResponse,
        }
      });
    }  
  }

  function sanitizeHtml(input) {
    const withoutHtml = input.replace(/<[^>]*>/g, "");
    const decodeQuotes = he.decode(withoutHtml);
    const addSpace = decodeQuotes.replace(/(https?:\/\/)/g, ' $1');
    return addSpace;
  }

  function splitText(text, maxLength) {
    // Split the text by spaces
    const words = text.split(" ");

    let result = [];
    let currentChunk = "";

    for (const word of words) {
        // Add the current word to the current chunk
        const potentialChunk = `${currentChunk} ${word}`.trim();

        if (potentialChunk.length <= maxLength) {
            // If the current chunk is still under max length, add the word
            currentChunk = potentialChunk;
        } else {
            // Otherwise, add the current chunk to the result and start a new chunk
            result.push(currentChunk);
            currentChunk = word;
        }
    }

    // Add the last chunk to the result
    result.push(currentChunk);

    return result;
  }

  // Function to periodically fetch new Mastodon posts
  async function fetchNewPosts() {
    const response = await axios.get(
      `${mastodonInstance}/users/${mastodonUser}/outbox?page=true`
    );

    const reversed = response.data.orderedItems
      .filter((item) => item.object.type === "Note")
      .filter((item) => item.object.inReplyTo === null)
      .reverse();

    let newTimestampId = 0;

    reversed.forEach((item) => {
      const currentTimestampId = Date.parse(item.published);

      if (currentTimestampId > newTimestampId) {
        newTimestampId = currentTimestampId;
      }

      if (currentTimestampId > lastProcessedPostId && lastProcessedPostId != 0) {
        try {
          console.log('📧 posting to BlueSky', currentTimestampId)
          const textParts = splitText(sanitizeHtml(item.object.content), 300);
          postToBluesky(textParts);
        } catch (error) {
          console.error('🔥 can\'t post to Bluesky', currentTimestampId, error)
        }
      }
    });

    if (newTimestampId > 0) {
      lastProcessedPostId = newTimestampId;
      saveLastProcessedPostId();
    }
  }

  fetchNewPosts();
  // Fetch new posts every 5 minutes (adjust as needed)
  setInterval(fetchNewPosts, (process.env.INTERVAL_MINUTES ?? 5) * 60 * 1000);
}

app.get('/', (req, res) => {
  res.json({
    message: 'Hello, world!',
  });
});

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});

main()
