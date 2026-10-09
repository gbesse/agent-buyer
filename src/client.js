import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

export class Client {
  constructor(command, cwd, env = {}) {
    if (
      !Array.isArray(command) ||
      !command.length ||
      command.some((x) => typeof x !== "string" || !x)
    )
      throw new Error("invalid_command");
    this.child = spawn(command[0], command.slice(1), {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["pipe", "pipe", "ignore"],
      shell: false,
    });
    this.pending = new Map();
    this.nextId = 1;
    createInterface({ input: this.child.stdout }).on("line", (line) => {
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        return;
      }
      const entry = this.pending.get(message.id);
      if (!entry) return;
      clearTimeout(entry.timer);
      this.pending.delete(message.id);
      message.error
        ? entry.reject(new Error("mcp_error"))
        : entry.resolve(message.result);
    });
    this.child.on("error", () => this.failAll());
    this.child.on("exit", () => this.failAll());
  }
  failAll() {
    for (const entry of this.pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(new Error("mcp_exit"));
    }
    this.pending.clear();
  }
  request(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("mcp_timeout"));
        this.child.kill();
      }, 5000);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(
        JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n",
      );
    });
  }
  async init() {
    await this.request("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "agent-buyer", version: "0.1.0" },
    });
    this.child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) +
        "\n",
    );
    return this.request("tools/list");
  }
  async catalog(tool) {
    const result = await this.request("tools/call", {
      name: tool,
      arguments: {},
    });
    if (result?.isError) throw new Error("catalog_error");
    const body = result?.content?.find((x) => x.type === "text")?.text;
    try {
      return JSON.parse(body);
    } catch {
      throw new Error("catalog_format");
    }
  }
  close() {
    this.child.stdin.end();
    this.child.kill();
  }
}
