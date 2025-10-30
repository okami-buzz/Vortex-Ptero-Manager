const { EmbedBuilder } = require("discord.js");

module.exports = {

  name: "ready",

  once: true,

  async execute(client) {

    console.log(`✅ ${client.user.tag} is now online and fully operational!`);

    // Channel where bot will send online status

    const logChannelId = "1430939327533158541";

    const channel = await client.channels.fetch(logChannelId).catch(() => null);

    // Create beautiful startup embed

    const startupEmbed = new EmbedBuilder()

      .setTitle("✅ Bot Online!")

      .setColor(0x11cbcb)

      .setDescription(

        `> **${client.user.username}** is now active and ready to manage your hosting panel!\n\n` +

        `**Prefix:** \`v!\`\n` +

        `**Status:** Online 🟢\n` +

        `**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`

      )

      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))

      .setFooter({ text: "Vortex Host | Okami.buzz" })

      .setTimestamp();

    if (channel) {

      channel.send({ embeds: [startupEmbed] }).catch(console.error);

    } else {

      console.warn("⚠️ Startup channel not found or missing permissions!");

    }

    // Rotating bot presence

    const statusArray = [

      { content: "Managing Vortex Servers ⚡", type: 3, status: "online" },

      { content: "v!help for commands 📜", type: 0, status: "dnd" },

      { content: "Vortex Panel 💻", type: 3, status: "idle" },

      { content: "v!createuser to add clients 👤", type: 0, status: "online" },

    ];

    async function pickPresence() {

      const option = Math.floor(Math.random() * statusArray.length);

      try {

        await client.user.setPresence({

          activities: [

            {

              name: statusArray[option].content,

              type: statusArray[option].type,

            },

          ],

          status: statusArray[option].status,

        });

      } catch (error) {

        console.error("❌ Failed to update presence:", error);

      }

    }

    // Change status every 20s

    pickPresence();

    setInterval(pickPresence, 20000);

    // Optional latency log

    setInterval(async () => {

      const ping = client.ws.ping;

      console.log(`📡 Current WebSocket Ping: ${ping}ms`);

    }, 60000);

  },

};
