const { EmbedBuilder } = require("discord.js");

const axios = require("axios");

require("dotenv").config();

module.exports = {

  name: "status",

  description: "Show bot and panel uptime, latency, and online status (auto-refresh every 3 minutes).",

  async executePrefix(message, args, client) {

    // Send initial message (not a reply)

    const sentMsg = await message.channel.send({

      embeds: [

        new EmbedBuilder()

          .setTitle("⏳ Checking System Status...")

          .setDescription("Please wait while I fetch live details...")

          .setColor(0x3498db)

          .setThumbnail(process.env.Icon)

          .setFooter({ text: "Updating every 3 minutes | Prefix: v!" }),

      ],

    });

    // Store when the bot started (uptime tracking)

    const botStartTime = client.readyTimestamp;

    const updateStatus = async () => {

      const startPing = Date.now();

      let panelOnline = false;

      let panelUptime = "N/A";

      try {

        // Fetch panel API (ping test)

        await axios.get(`${process.env.Dash_URL}/api/nodes`, {

          headers: { Authorization: `Bearer ${process.env.DASH_API}` },

          timeout: 5000,

        });

        panelOnline = true;

      } catch {

        panelOnline = false;

      }

      // Calculate bot uptime

      const totalSeconds = Math.floor((Date.now() - botStartTime) / 1000);

      const days = Math.floor(totalSeconds / 86400);

      const hours = Math.floor((totalSeconds % 86400) / 3600);

      const minutes = Math.floor((totalSeconds % 3600) / 60);

      const seconds = totalSeconds % 60;

      const uptime = `${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m ${seconds}s`;

      const endPing = Date.now();

      const ping = endPing - startPing;

      // If panel is online, calculate uptime since last detected online time

      if (panelOnline) {

        if (!global.lastPanelOnlineTime) global.lastPanelOnlineTime = Date.now();

        const panelSeconds = Math.floor((Date.now() - global.lastPanelOnlineTime) / 1000);

        const pHours = Math.floor(panelSeconds / 3600);

        const pMinutes = Math.floor((panelSeconds % 3600) / 60);

        panelUptime = `${pHours}h ${pMinutes}m`;

      } else {

        global.lastPanelOnlineTime = null;

      }

      const embed = new EmbedBuilder()

        .setTitle("🌐 System Status — Vortex Host")

        .setColor(panelOnline ? 0x00ff73 : 0xff4444)

        .setThumbnail(process.env.Icon)

        .setDescription(

          panelOnline

            ? "✅ **Panel is online and responding to API requests.**"

            : "🔴 **Panel appears to be offline or unreachable.**"

        )

        .addFields(

          { name: "🤖 Bot Ping", value: `\`${ping}ms\``, inline: true },

          { name: "🕒 Bot Uptime", value: `\`${uptime}\``, inline: true },

          { name: "🖥️ Panel Status", value: panelOnline ? "`🟢 Online`" : "`🔴 Offline`", inline: true },

          { name: "⏱️ Panel Uptime", value: `\`${panelUptime}\``, inline: true },

          { name: "🗓️ Last Updated", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }

        )

        .setFooter({

          text: `Auto-updating every 3 minutes | Prefix: v! | ${new Date().toLocaleTimeString("en-IN", {

            timeZone: "Asia/Kolkata",

          })}`,

        });

      // Edit same embed (update in place)

      await sentMsg.edit({ embeds: [embed] }).catch(() => {});

    };

    // Run immediately and every 3 minutes

    await updateStatus();

    const interval = setInterval(async () => {

      if (!sentMsg.deleted) await updateStatus();

      else clearInterval(interval);

    }, 180000); // 3 minutes

  },

};