import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from 'fs';
import * as path from 'path';

const server = new Server(
  {
    name: "sandbox-files",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const sandboxRoot = process.env.SANDBOX_ROOT 
  ? path.resolve(process.cwd(), process.env.SANDBOX_ROOT)
  : path.resolve(process.cwd(), 'sandbox');

function resolveSafePath(filePath: string): string {
  // If the LLM passes an absolute path starting with /sandbox, strip it to make it relative
  let normalizedPath = filePath;
  if (normalizedPath.startsWith('/sandbox/')) {
    normalizedPath = normalizedPath.replace(/^\/sandbox\//, '');
  } else if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.replace(/^\//, '');
  }

  const absolutePath = path.resolve(sandboxRoot, normalizedPath);
  if (!absolutePath.startsWith(sandboxRoot)) {
    throw new Error(`Path ${filePath} is outside of sandbox boundary`);
  }
  return absolutePath;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_files",
        description: "List files in a directory within the sandbox",
        inputSchema: {
          type: "object",
          properties: {
            directory: {
              type: "string",
              description: "Directory path relative to sandbox root",
              default: "."
            }
          },
        },
      },
      {
        name: "read_file",
        description: "Read the contents of a file in the sandbox",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "File path relative to sandbox root"
            }
          },
          required: ["filePath"]
        }
      },
      {
        name: "write_file",
        description: "Write content to a file in the sandbox",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "File path relative to sandbox root"
            },
            content: {
              type: "string",
              description: "Content to write to the file"
            }
          },
          required: ["filePath", "content"]
        }
      },
      {
        name: "delete_file",
        description: "Delete a file in the sandbox",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "File path relative to sandbox root"
            }
          },
          required: ["filePath"]
        }
      },
      {
        name: "scan_file_for_secrets",
        description: "Scan a file for exposed secrets",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "File path relative to sandbox root"
            }
          },
          required: ["filePath"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "list_files") {
      const dirPath = args?.directory ? String(args.directory) : ".";
      const safePath = resolveSafePath(dirPath);
      
      if (!fs.existsSync(safePath)) {
        throw new Error(`Directory not found: ${dirPath}`);
      }
      
      const files = fs.readdirSync(safePath);
      return {
        content: [{ type: "text", text: JSON.stringify(files, null, 2) }]
      };
    } 
    
    else if (name === "read_file") {
      const filePath = String(args?.filePath);
      const safePath = resolveSafePath(filePath);
      
      if (!fs.existsSync(safePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const content = fs.readFileSync(safePath, 'utf8');
      return {
        content: [{ type: "text", text: content }]
      };
    }

    else if (name === "write_file") {
      const filePath = String(args?.filePath);
      const content = String(args?.content);
      const safePath = resolveSafePath(filePath);
      
      const dir = path.dirname(safePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(safePath, content, 'utf8');
      return {
        content: [{ type: "text", text: `Successfully wrote to ${filePath}` }]
      };
    }

    else if (name === "delete_file") {
      const filePath = String(args?.filePath);
      const safePath = resolveSafePath(filePath);
      
      if (!fs.existsSync(safePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      fs.unlinkSync(safePath);
      return {
        content: [{ type: "text", text: `Successfully deleted ${filePath}` }]
      };
    }

    else if (name === "scan_file_for_secrets") {
      const filePath = String(args?.filePath);
      const safePath = resolveSafePath(filePath);
      
      if (!fs.existsSync(safePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const content = fs.readFileSync(safePath, 'utf8');
      const apiKeyRegex = /(api[_-]?key|secret|password|token)\s*[:=]\s*([a-zA-Z0-9\-_]{8,})/gi;
      
      let match;
      const foundSecrets = [];
      while ((match = apiKeyRegex.exec(content)) !== null) {
        foundSecrets.push(`Found potential secret key matching '${match[1]}'`);
      }
      
      if (foundSecrets.length > 0) {
        return {
          content: [{ type: "text", text: `WARNING: Found ${foundSecrets.length} secrets in ${filePath}.\n` + foundSecrets.join('\n') }]
        };
      } else {
        return {
          content: [{ type: "text", text: `Clean. No secrets found in ${filePath}.` }]
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
    
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: error.message || "An unknown error occurred" }]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sandbox MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
