import type { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

interface SearchCompanyParams {
  query: string;
  page?: number;
  per_page?: number;
  postal_code?: string;
  naf_code?: string;
  creation_date_min?: string;
  creation_date_max?: string;
  legal_status?: string;
  employee_range?: string;
  company_category?: string;
  sort_by?: string;
  sort_order?: string;
}

interface SearchResponse {
  page: number;
  total_pages: number;
  results: Array<Record<string, unknown>>;
}

export class Tools {
  constructor() {}

  public static TOOLS: Tool[] = [
    {
      name: 'search-company',
      description: 'Rechercher des entreprises en France avec des filtres avancés',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: "Terme de recherche (nom de l'entreprise, dirigeant, adresse, etc.)",
          },
          page: {
            type: 'number',
            description: 'Numéro de page (défaut: 1)',
            default: 1,
          },
          per_page: {
            type: 'number',
            description: 'Nombre de résultats par page (défaut: 10, max: 20)',
            default: 10,
          },
          postal_code: {
            type: 'string',
            description: 'Code postal pour filtrer les résultats',
          },
          naf_code: {
            type: 'string',
            description: 'Code NAF pour filtrer les résultats',
          },
          creation_date_min: {
            type: 'string',
            description: 'Date de création minimale (format: YYYY-MM-DD)',
          },
          creation_date_max: {
            type: 'string',
            description: 'Date de création maximale (format: YYYY-MM-DD)',
          },
          legal_status: {
            type: 'string',
            description: 'Statut juridique (ex: SA, SAS, SARL, etc.)',
          },
          employee_range: {
            type: 'string',
            description: "Tranche d'effectif (ex: 0-9, 10-19, 20-49, etc.)",
          },
          company_category: {
            type: 'string',
            description: "Catégorie d'entreprise (ex: PME, GE, ETI)",
          },
          sort_by: {
            type: 'string',
            description: 'Critère de tri (score, creation_date, name)',
            enum: ['score', 'creation_date', 'name'],
          },
          sort_order: {
            type: 'string',
            description: 'Ordre de tri (asc ou desc)',
            enum: ['asc', 'desc'],
            default: 'desc',
          },
        },
        required: ['query'],
      },
    },
  ];

  public searchCompany = async (params: SearchCompanyParams): Promise<CallToolResult> => {
    try {
      const searchParams = new URLSearchParams({
        q: params.query,
        page: (params.page || 1).toString(),
        per_page: (params.per_page || 10).toString(),
        ...(params.postal_code && { postal_code: params.postal_code }),
        ...(params.naf_code && { naf_code: params.naf_code }),
        ...(params.creation_date_min && { creation_date_min: params.creation_date_min }),
        ...(params.creation_date_max && { creation_date_max: params.creation_date_max }),
        ...(params.legal_status && { legal_status: params.legal_status }),
        ...(params.employee_range && { employee_range: params.employee_range }),
        ...(params.company_category && { company_category: params.company_category }),
        ...(params.sort_by && { sort_by: params.sort_by }),
        ...(params.sort_order && { sort_order: params.sort_order }),
      });

      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?${searchParams.toString()}`
      );
      const data = (await response.json()) as SearchResponse;

      const content: CallToolResult['content'] = [
        {
          type: 'text',
          text: `Résultats de la recherche (page ${data.page} sur ${data.total_pages}):\n${JSON.stringify(data.results, null, 2)}`,
        },
      ];
      return { content };
    } catch (error) {
      console.error(error);
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(error) }],
      };
    }
  };
}
