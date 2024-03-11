import cheerio from "cheerio";
import fetch from "node-fetch";
import { lookup } from "mime-types";
import { URL_REGEX } from "@whiskeysockets/baileys";
import { apivisit } from "./kanghit.js";

const handler = async (m, { conn, text }) => {
  try {
    if (!text) throw "Input Pinterest URL or query";

    // Remove "SMH" from the end of the text if present
    text = text.endsWith("SMH") ? text.replace("SMH", "") : text;

    // Check if the input is a URL or a query
    let res = await pinterest(text);

    // Get the MIME type of the resource
    let mime = await lookup(res);

    // Send the appropriate response based on the MIME type
    if (text.match(URL_REGEX)) {
      await conn.sendMessage(
        m.chat,
        {
          [mime.split("/")[0]]: { url: res },
          caption: `SUCCESS DOWNLOAD: ${await shortUrl(res)}`,
        },
        { quoted: m },
      );
    } else {
      await conn.sendMessage(
        m.chat,
        { image: { url: res }, caption: `RESULT FROM: ${text}` },
        { quoted: m },
      );
    }

    await apivisit(); // Call apivisit function
  } catch (error) {
    throw error;
  }
};

handler.help = handler.alias = ["pinterest"].map((v) => v + " <url>");
handler.tags = ["downloader"];
handler.command = /^(pinterest|pin)$/i;

export default handler;

async function pinterest(input) {
  try {
    if (input.match(URL_REGEX)) {
      // If input is URL, scrape the download link from the page
      let res = await fetch(
        "https://www.expertsphp.com/facebook-video-downloader.php",
        {
          method: "post",
          body: new URLSearchParams(Object.entries({ url: input })),
        },
      );
      let $ = cheerio.load(await res.text());
      let data = $(
        'table[class="table table-condensed table-striped table-bordered"]',
      )
        .find("a")
        .attr("href");
      if (!data) throw "Unable to download post";
      return data;
    } else {
      // If input is query, fetch data from Pinterest API and get image URL
      let res = await fetch(
        `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${input}&data=%7B%22options%22%3A%7B%22isPrefetch%22%3Afalse%2C%22query%22%3A%22${input}%22%2C%22scope%22%3A%22pins%22%2C%22no_fetch_context_on_resource%22%3Afalse%7D%2C%22context%22%3A%7B%7D%7D&_=1619980301559`,
      );
      let json = await res.json();
      let data = json.resource_response.data.results;
      if (!data.length) throw `Query "${input}" not found`;
      return data[~~(Math.random() * data.length)].images.orig.url;
    }
  } catch (error) {
    throw error;
  }
}

async function shortUrl(url) {
  try {
    // Shorten the URL using TinyURL API
    let response = await fetch(`https://tinyurl.com/api-create.php?url=${url}`);
    return await response.text();
  } catch (error) {
    throw "Error shortening URL";
  }
}
