// transfernode.js

const axios = require("axios");

const {

  EmbedBuilder,

  ActionRowBuilder,

  StringSelectMenuBuilder,

  ComponentType,

} = require("discord.js");

const fs = require("fs");

require("dotenv").config();

module.exports = {

  name: "transfernode",

  description:

    "Admin only — move a server to another node. Usage: v!transfernode <server-name|owner-email|discordID>",

  async executePrefix(message, args, client) {

    // Admin check

    const isAdmin = message.member.roles.cache.has(process.env.Admin_ROLE_ID);

    if (!isAdmin) return message.reply("🚫 You don't have permission to use this command!");

    if (!args.length)

      return message.reply(

        "⚠️ Usage: `v!transfernode <server-name|owner-email|discordID>`\nExample: `v!transfernode myserver` or `v!transfernode user@domain.com`"

      );

    const search = args[0].trim();

    try {

      // Resolve search -> email if discordID provided and linked

      let searchEmail = search;

      if (!search.includes("@")) {

        // try reading links

        const linksFile = process.env.LINKS_FILE || "./data/user_links.json";

        if (fs.existsSync(linksFile)) {

          const links = JSON.parse(fs.readFileSync(linksFile, "utf8"));

          if (links[search] && links[search].email) searchEmail = links[search].email;

        }

      }

      // Fetch all servers (application endpoint used in other commands)

      const allServersRes = await axios.get(`${process.env.Dash_URL}/api/application/servers`, {

        headers: { Authorization: `Bearer ${process.env.DASH_API}` },

      });

      const allServers = (allServersRes.data && allServersRes.data.data) || [];

      // Filter servers by name contains OR owner email equals searchEmail

      const matches = allServers.filter((srv) => {

        const s = srv.attributes || {};

        const name = String(s.name || "").toLowerCase();

        const owner = String(s.user || s.user_email || "").toLowerCase();

        return name.includes(search.toLowerCase()) || owner === (searchEmail || "").toLowerCase();

      });

      if (!matches.length) {

        return message.reply("📭 No servers matched your search. Try different name or owner email/ID.");

      }

      // Prepare server select (limit 25)

      const serverOptions = matches.slice(0, 25).map((srv) => {

        const s = srv.attributes;

        const label = (s.name || `Server-${s.id}`).slice(0, 90);

        const desc = `ID:${s.id} • Owner:${s.user || s.user_email || "Unknown"}`;

        return { label, description: desc.slice(0, 100), value: String(s.id) };

      });

      const serverMenu = new StringSelectMenuBuilder()

        .setCustomId("select-server-for-node-transfer")

        .setPlaceholder("📋 Select server to move")

        .addOptions(serverOptions);

      const serverRow = new ActionRowBuilder().addComponents(serverMenu);

      const chooseEmbed = new EmbedBuilder()

        .setTitle(`${process.env.Name || "Vortex Host"} — Choose Server to Move`)

        .setDescription(

          `Found **${matches.length}** matching servers. Select the server you want to move to another node.`

        )

        .setColor(0x11cbcb)

        .setThumbnail(process.env.Icon)

        .setFooter({

          text: `Action by: ${message.author.tag} | Prefix: v! | Okami.buzz | ${new Date().toLocaleTimeString(

            "en-IN",

            { timeZone: "Asia/Kolkata" }

          )}`,

        })

        .setTimestamp();

      const sent = await message.reply({ embeds: [chooseEmbed], components: [serverRow] });

      const serverCollector = sent.createMessageComponentCollector({

        componentType: ComponentType.StringSelect,

        time: 30000,

      });

      serverCollector.on("collect", async (interaction) => {

        if (interaction.user.id !== message.author.id)

          return interaction.reply({ content: "⚠️ Only the admin who ran the command can select.", ephemeral: true });

        await interaction.deferUpdate();

        const serverId = interaction.values[0];

        // Fetch node list

        let nodes = [];

        try {

          const nodesRes = await axios.get(`${process.env.Dash_URL}/api/nodes`, {

            headers: { Authorization: `Bearer ${process.env.DASH_API}` },

          });

          nodes = (nodesRes.data && nodesRes.data.data) || [];

        } catch (err) {

          console.error("Nodes fetch error:", err);

          const errEmbed = new EmbedBuilder()

            .setTitle("🚫 Cannot fetch nodes")

            .setColor(0xff3333)

            .setDescription("Failed to fetch nodes from panel. Check Dash_URL and DASH_API.")

            .setTimestamp();

          return sent.edit({ embeds: [errEmbed], components: [] });

        }

        if (!nodes.length) {

          return sent.edit({

            embeds: [

              new EmbedBuilder()

                .setTitle("📭 No nodes found")

                .setColor(0xffcc00)

                .setDescription("Panel returned no available nodes to transfer to."),

            ],

            components: [],

          });

        }

        // Build node select options

        const nodeOptions = nodes.slice(0, 25).map((n) => {

          const a = n.attributes || {};

          const label = (a.name || `Node-${a.id}`).slice(0, 90);

          const description = `ID:${a.id} • Location:${a.location || "Unknown"}`;

          return { label, description: String(description).slice(0, 100), value: String(a.id) };

        });

        const nodeMenu = new StringSelectMenuBuilder()

          .setCustomId("select-target-node")

          .setPlaceholder("🛰️ Select target node")

          .addOptions(nodeOptions);

        const nodeRow = new ActionRowBuilder().addComponents(nodeMenu);

        const nodeEmbed = new EmbedBuilder()

          .setTitle(`${process.env.Name || "Vortex Host"} — Select Target Node`)

          .setDescription(`Server ID: \`${serverId}\` selected. Now choose the node to transfer this server to.`)

          .setColor(0x00bfff)

          .setThumbnail(process.env.Icon)

          .setFooter({

            text: `Action by: ${message.author.tag} | ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`,

          })

          .setTimestamp();

        // Edit message to show node select

        await sent.edit({ embeds: [nodeEmbed], components: [nodeRow] });

        // Collect node selection

        const nodeCollector = sent.createMessageComponentCollector({

          componentType: ComponentType.StringSelect,

          time: 30000,

        });

        nodeCollector.on("collect", async (nodeInteraction) => {

          if (nodeInteraction.user.id !== message.author.id)

            return nodeInteraction.reply({ content: "⚠️ Only the admin who ran the command can select.", ephemeral: true });

          await nodeInteraction.deferUpdate();

          const targetNodeId = nodeInteraction.values[0];

          // Confirm action embed

          const confirmEmbed = new EmbedBuilder()

            .setTitle("⚠️ Confirm Node Transfer")

            .setDescription(

              `You're about to move **Server ID: \`${serverId}\`** → **Node ID: \`${targetNodeId}\`**.\n\n` +

                "This action may require the panel to re-provision the server. Continue?"

            )

            .setColor(0xffa500)

            .setFooter({ text: `Requested by: ${message.author.tag}` })

            .setTimestamp();

          await sent.edit({ embeds: [confirmEmbed], components: [] });

          // final confirm prompt in chat

          const prompt = await message.channel.send(

            `${message.author}, type \`yes\` to confirm moving server \`${serverId}\` to node \`${targetNodeId}\` (30s).`

          );

          const filter = (m) => m.author.id === message.author.id;

          const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000 });

          if (!collected.size || collected.first().content.toLowerCase() !== "yes") {

            await message.channel.send("❌ Node transfer cancelled.");

            // restore a small status embed

            const cancelled = new EmbedBuilder()

              .setTitle("❌ Transfer Cancelled")

              .setColor(0xff4444)

              .setDescription("Node transfer was cancelled by the admin or timed out.");

            return sent.edit({ embeds: [cancelled], components: [] }).catch(() => {});

          }

          // Perform the node transfer API call

          try {

            // NOTE: Adjust this endpoint/body if your panel uses a different route.

            // Using a generic endpoint: POST /api/transfernode { server_id, node_id }

            const transferRes = await axios.post(

              `${process.env.Dash_URL}/api/transfernode`,

              { server_id: serverId, node_id: targetNodeId },

              { headers: { Authorization: `Bearer ${process.env.DASH_API}` } }

            );

            // Success check (depends on panel response)

            if (transferRes.data && transferRes.data.status === "success") {

              const doneEmbed = new EmbedBuilder()

                .setTitle(`${process.env.Name || "Vortex Host"} — Node Transfer Complete ✅`)

                .setColor(0x00ff73)

                .setDescription(`Server \`${serverId}\` has been moved to node \`${targetNodeId}\`.`)

                .addFields(

                  { name: "Server ID", value: `\`${serverId}\``, inline: true },

                  { name: "Target Node", value: `\`${targetNodeId}\``, inline: true },

                  { name: "Requested By", value: `${message.author}`, inline: true }

                )

                .setTimestamp()

                .setFooter({

                  text: `Prefix: v! | Okami.buzz | Vortex Host | ${new Date().toLocaleTimeString("en-IN", {

                    timeZone: "Asia/Kolkata",

                  })}`,

                });

              await message.channel.send({ embeds: [doneEmbed] });

              // Optional: log to your log channel if provided

              const logChannelId = process.env.LOG_CHANNEL_ID;

              if (logChannelId) {

                const logChan = client.channels.cache.get(logChannelId);

                if (logChan) logChan.send({ embeds: [doneEmbed] }).catch(() => {});

              }

            } else {

              // Panel returned failure

              const failEmbed = new EmbedBuilder()

                .setTitle("❌ Transfer Failed")

                .setColor(0xff3333)

                .setDescription("Panel API returned an error while attempting the node transfer.")

                .addFields({ name: "Panel response", value: `\`\`\`${JSON.stringify(transferRes.data).slice(0, 1000)}\`\`\`` })

                .setTimestamp();

              await message.channel.send({ embeds: [failEmbed] });

            }

          } catch (err) {

            console.error("Node transfer API error:", err);

            const errEmbed = new EmbedBuilder()

              .setTitle("🚫 API Error")

              .setColor(0xff3333)

              .setDescription(

                "Failed to contact the panel for node transfer. Verify `Dash_URL`, `DASH_API` and endpoint path (`/api/transfernode`)."

              )

              .setTimestamp();

            await message.channel.send({ embeds: [errEmbed] });

          }

        }); // nodeCollector.collect end

      }); // serverCollector.collect end

      serverCollector.on("end", async () => {

        await sent.edit({ components: [] }).catch(() => {});

      });

    } catch (err) {

      console.error("TransferNode command error:", err);

      return message.reply("🚫 Error while processing request. Check panel connection and try again.");

    }

  },

};