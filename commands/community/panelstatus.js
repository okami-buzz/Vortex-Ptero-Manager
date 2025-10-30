const { EmbedBuilder } = require("discord.js");

const axios = require("axios");

const fs = require("fs");

require("dotenv").config();

const DATA_FILE = "./panelstatus_messages.json"; // file to store message IDs

module.exports = {

  name: "panelstatus",

  description: "Show live panel & node status (auto-refresh every 1 minute)",

  async executePrefix(message, args, client) {

    // 🕐 Send initial loading message

    const sentMsg = await message.channel.send({

      embeds: [

        new EmbedBuilder()

          .setTitle("🌐 Checking Vortex Host Panel...")

          .setColor(0x3498db)

          .setDescription("Please wait, fetching live status...")

          .setThumbnail(process.env.Icon)

          .setFooter({ text: "Auto-refresh every 1 minute | Prefix: v!" }),

      ],

    });

    // Save this message ID for persistence

    let stored = [];

    if (fs.existsSync(DATA_FILE)) {

      try {

        stored = JSON.parse(fs.readFileSync(DATA_FILE));

      } catch {

        stored = [];

      }

    }

    stored.push({

      channelId: message.channel.id,

      messageId: sentMsg.id,

    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(stored, null, 2));

    const updateEmbed = async (msg) => {

      try {

        const response = await axios.get(`${process.env.Dash_URL}/api/nodes`, {

          headers: { Authorization: `Bearer ${process.env.DASH_API}` },

        });

        const nodes = response.data.data || [];

        const totalNodes = nodes.length;

        const onlineNodes = nodes.filter(

          (n) => n.attributes.maintenance_mode === false

        ).length;

        const embed = new EmbedBuilder()

          .setTitle("🟢 Vortex Host — Panel Online")

          .setColor(0x00ff73)

          .setDescription("✅ Panel is **online and responding** to API requests.")

          .addFields(

            { name: "🌍 Total Nodes", value: `${totalNodes}`, inline: true },

            { name: "⚙️ Online Nodes", value: `${onlineNodes}`, inline: true },

            {

              name: "🕒 Last Updated",

              value: `**${new Date().toLocaleString("en-IN", {

                timeZone: "Asia/Kolkata",

              })} (IST)**`,

            }

          )

          .setThumbnail(process.env.Icon)

          .setFooter({

            text: `Auto-updating every 1 minute | Prefix: v!`,

          });

        await msg.edit({ embeds: [embed] }).catch(() => {});

      } catch {

        const offlineEmbed = new EmbedBuilder()

          .setTitle("🔴 Vortex Host — Panel Offline")

          .setColor(0xff4444)

          .setDescription(

            "🚫 **Panel Offline** — Unable to reach the API or nodes are down.\nWe'll keep retrying every minute."

          )

          .addFields({

            name: "🕒 Last Checked",

            value: `**${new Date().toLocaleString("en-IN", {

              timeZone: "Asia/Kolkata",

            })} (IST)**`,

            inline: false,

          })

          .setThumbnail(process.env.Icon)

          .setFooter({

            text: `Retrying every 1 minute | Prefix: v!`,

          });

        await msg.edit({ embeds: [offlineEmbed] }).catch(() => {});

      }

    };

    await updateEmbed(sentMsg);

    setInterval(() => {

      if (!sentMsg.deleted) updateEmbed(sentMsg);

    }, 60 * 1000);

  },

  // 🧠 Reconnect all saved messages when bot restarts

  async onReady(client) {

    if (!fs.existsSync(DATA_FILE)) return;

    let stored;

    try {

      stored = JSON.parse(fs.readFileSync(DATA_FILE));

    } catch {

      stored = [];

    }

    for (const data of stored) {

      try {

        const channel = await client.channels.fetch(data.channelId);

        const msg = await channel.messages.fetch(data.messageId);

        setInterval(() => {

          if (!msg.deleted) {

            axios

              .get(`${process.env.Dash_URL}/api/nodes`, {

                headers: { Authorization: `Bearer ${process.env.DASH_API}` },

              })

              .then((response) => {

                const nodes = response.data.data || [];

                const totalNodes = nodes.length;

                const onlineNodes = nodes.filter(

                  (n) => n.attributes.maintenance_mode === false

                ).length;

                const embed = new EmbedBuilder()

                  .setTitle("🟢 Vortex Host — Panel Online")

                  .setColor(0x00ff73)

                  .setDescription("✅ Panel is **online and responding** to API requests.")

                  .addFields(

                    { name: "🌍 Total Nodes", value: `${totalNodes}`, inline: true },

                    { name: "⚙️ Online Nodes", value: `${onlineNodes}`, inline: true },

                    {

                      name: "🕒 Last Updated",

                      value: `**${new Date().toLocaleString("en-IN", {

                        timeZone: "Asia/Kolkata",

                      })} (IST)**`,

                    }

                  )

                  .setThumbnail(process.env.Icon)

                  .setFooter({ text: "Auto-updating every 1 minute | Prefix: v!" });

                msg.edit({ embeds: [embed] }).catch(() => {});

              })

              .catch(() => {});

          }

        }, 60 * 1000);

      } catch (err) {

        console.log("⚠️ Could not reconnect old message:", err.message);

      }

    }

  },

};