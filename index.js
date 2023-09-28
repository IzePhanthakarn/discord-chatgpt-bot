// Packages used in the project
require("dotenv/config");
const { Client } = require("discord.js");
const { OpenAI } = require("openai");

// Create Instance of Discord Client
const client = new Client({
  intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"],
});

const IGNORE_PREFIX = "!";
const CHANNELS = [process.env.CHANNEL_ID];

// Bot connects successfully to Discord
client.on("ready", () => {
  console.log("The bot is online.");
});

// Create Instance of OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

// A new message has arrived in the Discord chat
client.on("messageCreate", async (message) => {
  // The message sender is a bot
  if (message.author.bot) return;
  // The message is start with IGNORE_PREFIX
  if (message.content.startsWith(IGNORE_PREFIX)) return;
  // Check channel and mentions to bot
  if (
    !CHANNELS.includes(message.channelId) &&
    !message.mentions.users.has(client.user.id)
  )
    return;

  // The bot will display the typing in the chat box
  await message.channel.sendTyping();

  const sendTypingInterval = setInterval(() => {
    message.channel.sendTyping();
  }, 5000);

  // Forward user-sent messages to OpenAI
  const response = await openai.chat.completions
    .create({
      model: "gpt-3.5-turbo",   // model of chat bot
      messages: [
        {
          role: "system",
          content: "Chat GPT is a friendly chatbot.",
        },
        {
          role: "user",
          content: message.content,
        },
      ],
    })
    .catch((error) => console.error("OpenAI Error:\n", error));

  clearInterval(sendTypingInterval);

  // Check response
  if (!response) {
    message.reply(
      "I'm having some trouble with the OpenAI API. Try again in a moment."
    );
    return;
  }

  // Divide text into chunks of up to 2000 characters
  const responseMessage = response.choices[0].message.content;
  const chunkSizeLimit = 2000;

  for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
    const chunk = responseMessage.substring(i, i + chunkSizeLimit);
    await message.reply(chunk);
  }
});

// Logging into Discord
client.login(process.env.TOKEN);