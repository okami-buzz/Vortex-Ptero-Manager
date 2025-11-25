// ======================================================

// 🧩 VORTEX DEPLOY - /nodeslist Command (WORLD BEST EMBED)

// ⚡ Made by Okami | Asia/Kolkata

// ======================================================

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

import fetch from "node-fetch";

import dotenv from "dotenv";

dotenv.config();

export default {

  data: new SlashCommandBuilder()

    .setName("nodeslist")

    .setDescription("🗂️ Displays all nodes with live status, uptime & ping"),

  async execute(interaction) {

    await interaction.deferReply();

    const sendNodes = async () => {

      const panelData = await fetchNodesData();

      if (panelData.nodes.length === 0) {

        const embed = new EmbedBuilder()

          .setColor("Red")

          .setTitle("🧩 Nodes List")

          .setDescription("⚠️ No nodes found or panel offline.")

          .setFooter({ text: "⚡ Made by Okami | Vortex Deploy 👑" })

          .setTimestamp();

        if (!interaction.replied) {

          await interaction.editReply({ embeds: [embed] });

        } else {

          const msg = await interaction.fetchReply();

          await msg.edit({ embeds: [embed] });

        }

        return;

      }

      // Prepare nodes details with ping & uptime

      const nodesDetails = await Promise.all(

        panelData.nodes.map(async (n) => {

          const ping = await getNodePing(n.fqdn, n.port);

          return `🟢 **${n.name}**\n📍 Location: \`${n.location}\`\n💾 Memory: \`${n.memory}MB\` | Disk: \`${n.disk}MB\`\n⏱️ Uptime: \`${n.uptime}\`\n📡 Ping: \`${ping}ms\``;

        })

      );

      const embed = new EmbedBuilder()

        .setColor("Blue")

        .setTitle("🧩 VORTEX DEPLOY - Nodes List")

        .setDescription("💫 Live node status (refreshes every 10s) 🔄")

        .addFields(

          { name: "🧠 Total Nodes", value: `\`${panelData.nodes.length}\``, inline: true },

          { name: "📋 Nodes Details", value: nodesDetails.join("\n\n").slice(0, 1024) }

        )

        .setFooter({ text: "⚡ Made by Okami | Vortex Deploy 👑" })

        .setTimestamp();

      if (!interaction.replied) {

        await interaction.editReply({ embeds: [embed] });

      } else {

        const msg = await interaction.fetchReply();

        await msg.edit({ embeds: [embed] });

      }

    };

    // First send

    await sendNodes();

    // Auto-refresh every 10 sec

    const interval = setInterval(sendNodes, 10000);

    interaction.client.nodesIntervals = interaction.client.nodesIntervals || [];

    interaction.client.nodesIntervals.push(interval);

  },

};

// ======================================================

// 📡 FETCH NODES DATA

// ======================================================

async function fetchNodesData() {

  const base = process.env.PTERO_URL;

  const key = process.env.PTERO_API_KEY;

  try {

    const res = await fetch(`${base}/api/application/nodes`, {

      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },

    });

    if (!res.ok) throw new Error("Panel offline");

    const json = await res.json();

    const nodes = json.data.map((n) => ({

      id: n.attributes.id,

      name: n.attributes.name,

      fqdn: n.attributes.fqdn,

      port: n.attributes.daemon_listen,

      location: n.attributes.location_id,

      memory: n.attributes.memory,

      disk: n.attributes.disk,

      uptime: n.attributes.upload_size || "—", // Replace with real uptime if available

      status: "🟢 Online",

    }));

    return { status: "🟢 Online", nodes };

  } catch {

    return { status: "🔴 Offline", nodes: [] };

  }

}

// ======================================================

// 🕒 GET NODE PING (ms)

// ======================================================

async function getNodePing(fqdn, port) {

  const start = Date.now();

  try {

    await fetch(`http://${fqdn}:${port}`, { method: "HEAD", timeout: 5000 });

  } catch {}

  return Date.now() - start;

}