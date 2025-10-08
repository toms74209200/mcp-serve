import { expect, test } from "vitest";

test(
  "when listing resources then returns docs from directory",
  async () => {
    const command = new Deno.Command("deno", {
      args: ["run", "-A", "--no-check", `${Deno.cwd()}/main.ts`, "docs"],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });
    const child = command.spawn();

    const writer = child.stdin.getWriter();
    const reader = child.stdout.pipeThrough(new TextDecoderStream())
      .getReader();

    const readLines = async () => {
      const line = await reader.read();
      if (line.done) {
        return;
      }
      try {
        return JSON.parse(line.value);
      } catch {
        return await readLines();
      }
    };

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        id: "init-1",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      }) + "\n",
    ));

    await readLines();

    await writer.write(new TextEncoder().encode(
      JSON.stringify({
        jsonrpc: "2.0",
        id: "list-1",
        method: "resources/list",
      }) + "\n",
    ));

    const actual = await readLines();

    expect(actual.result.resources).toBeInstanceOf(Array);
    expect(actual.result.resources.length).toBeGreaterThan(0);
    expect(actual.result.resources[0].uri).toMatch(/^docs:\/\//);

    await writer.close();
    child.kill("SIGTERM");
    await child.status;
  },
  1000,
);
