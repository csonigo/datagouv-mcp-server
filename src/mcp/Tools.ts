import { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export class Tools {
    constructor() {
    }
  
    public static TOOLS: Tool[] = [
      {
        name: "search_company",
        description: "Find up to date information (name, address, list of directors, sector, etc.) about a company listed in France by providing a search query (name of the company, of the CEO, address, etc.)",
        inputSchema: {
            type: "object",
            properties: { query: { type: "string", description: "Search query (name of the company, of the CEO, address, etc.)" } },
            required: ["query"],
          },
      },
    ];

    public searchCompany = async (query: string) => {
        console.log("searchCompany", query);
        try {
            const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${query}&page=1&per_page=1`);
            const data = await response.json();

            const content: CallToolResult["content"] = [
                {
                    type: "text",
                    text: `Company found: ${JSON.stringify(data.results[0])}`,
                },
            ];
            return { content };
        } catch (error) {
            console.error(error);
            return {
                isError: true,
                content: [{ type: "text", text: JSON.stringify(error) }],
              };
        }
    }
}
