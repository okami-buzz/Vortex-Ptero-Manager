// ======================================================
// ⚙️ VORTEX DEPLOY - PTERODACTYL API WRAPPER
// ⚡ Made by Okami | Asia/Kolkata
// ======================================================

import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const PANEL_URL = process.env.PANEL_URL;
const ADMIN_KEY = process.env.PANEL_API_KEY;

/**
 * 🔒 Generic function for all API requests
 */
async function request(endpoint, method = "GET", body = null) {
  try {
    const response = await fetch(`${PANEL_URL}/api/application/${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ADMIN_KEY}`,
      },
      body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("❌ API Error:", data.errors?.[0]?.detail || data);
      throw new Error(data.errors?.[0]?.detail || "Unknown API Error");
    }

    return data;
  } catch (err) {
    console.error(`❌ API Request Failed (${method} ${endpoint}):`, err.message);
    throw err;
  }
}

// ======================================================
// 🧩 USER FUNCTIONS
// ======================================================

export async function createUser({ username, email, firstName, lastName }) {
  const body = {
    username,
    email,
    first_name: firstName,
    last_name: lastName,
    language: "en",
  };
  return await request("users", "POST", body);
}

export async function getUser(id) {
  return await request(`users/${id}`, "GET");
}

export async function deleteUser(id) {
  return await request(`users/${id}`, "DELETE");
}

export async function listUsers() {
  return await request("users", "GET");
}

// ======================================================
// 🖥️ SERVER FUNCTIONS
// ======================================================

export async function createServer({ name, userId, eggId, nodeId, cpu, ram, disk }) {
  const body = {
    name,
    user: userId,
    egg: eggId,
    docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
    startup: "npm start",
    limits: { memory: ram, swap: 0, disk, io: 500, cpu },
    feature_limits: { databases: 1, allocations: 1 },
    environment: { STARTUP_CMD: "npm start" },
    deploy: { locations: [nodeId], dedicated_ip: false, port_range: [] },
    start_on_completion: true,
  };
  return await request("servers", "POST", body);
}

export async function deleteServer(id) {
  return await request(`servers/${id}`, "DELETE");
}

export async function listServers() {
  return await request("servers", "GET");
}

export async function getServer(id) {
  return await request(`servers/${id}`, "GET");
}

// ======================================================
// 🧠 NODE / SYSTEM FUNCTIONS
// ======================================================

export async function listNodes() {
  return await request("nodes", "GET");
}

export async function getNode(id) {
  return await request(`nodes/${id}`, "GET");
}

export async function getAllocations(nodeId) {
  return await request(`nodes/${nodeId}/allocations`, "GET");
}

// ======================================================
// ✅ READY TO USE FUNCTIONS
// Example:
// const newUser = await createUser({ username: "abinash", email: "test@mail.com", firstName: "Abi", lastName: "Nash" });
// ======================================================
