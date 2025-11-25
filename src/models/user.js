// ======================================================
// 👤 VORTEX DEPLOY - User Model
// ⚡ Made by Okami | Asia/Kolkata
// ======================================================

import { EmbedBuilder } from "discord.js";

export default class User {
  constructor({ id, email, username, first_name, last_name, password, servers = [] }) {
    this.id = id;
    this.email = email;
    this.username = username;
    this.first_name = first_name;
    this.last_name = last_name;
    this.password = password;
    this.servers = servers; // Array of server IDs
  }

  // Returns professional embed of user info
  toEmbed() {
    return new EmbedBuilder()
      .setColor("Yellow")
      .setTitle(`👤 User Info - ${this.username}`)
      .addFields(
        { name: "🧾 Email", value: `\`${this.email}\``, inline: true },
        { name: "👤 Username", value: `\`${this.username}\``, inline: true },
        { name: "📝 First Name", value: `\`${this.first_name}\``, inline: true },
        { name: "📝 Last Name", value: `\`${this.last_name}\``, inline: true },
        { name: "🔑 Password", value: `\`${this.password}\``, inline: true },
        { name: "📦 Servers", value: this.servers.length ? this.servers.map(s => `\`${s}\``).join(", ") : "None", inline: false }
      )
      .setFooter({ text: "⚡ Made by Okami | Asia/Kolkata" })
      .setTimestamp();
  }

  // Helper: add a server ID to user
  addServer(serverId) {
    if (!this.servers.includes(serverId)) this.servers.push(serverId);
  }

  // Helper: remove a server ID from user
  removeServer(serverId) {
    this.servers = this.servers.filter(id => id !== serverId);
  }
}
