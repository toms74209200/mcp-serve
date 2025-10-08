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

test(
  "when reading resource then returns file content",
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
        id: "read-1",
        method: "resources/read",
        params: {
          uri: "docs://spec.md",
        },
      }) + "\n",
    ));

    const actual = await readLines();

    expect(actual.result.contents).toBeInstanceOf(Array);
    expect(actual.result.contents.length).toBeGreaterThan(0);
    expect(actual.result.contents[0].uri).toBe("docs://spec.md");
    expect(actual.result.contents[0].mimeType).toBe("text/plain");
    expect(actual.result.contents[0].text).toBeTruthy();

    await writer.close();
    child.kill("SIGTERM");
    await child.status;
  },
  1000,
);

test(
  "when reading non-existent resource then returns error",
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
        id: "read-1",
        method: "resources/read",
        params: {
          uri: "docs://non-existent.md",
        },
      }) + "\n",
    ));

    const actual = await readLines();

    expect(actual.error).toBeDefined();
    expect(actual.error.code).toBe(-32603);
    expect(actual.error.message).toContain("Resource not found");

    await writer.close();
    child.kill("SIGTERM");
    await child.status;
  },
  1000,
);

test(
  "when reading resource with invalid URI scheme then returns error",
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
        id: "read-1",
        method: "resources/read",
        params: {
          uri: "invalid://spec.md",
        },
      }) + "\n",
    ));

    const actual = await readLines();

    expect(actual.error).toBeDefined();
    expect(actual.error.code).toBe(-32603);
    expect(actual.error.message).toContain("Unsupported URI scheme");

    await writer.close();
    child.kill("SIGTERM");
    await child.status;
  },
  1000,
);
