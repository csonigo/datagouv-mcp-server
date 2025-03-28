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

interface GetCompanyDetailsParams {
  identifier: string; // SIREN (9 chiffres) ou SIRET (14 chiffres)
}

interface SearchResponse {
  page: number;
  total_pages: number;
  results: Array<Record<string, unknown>>;
}

interface CompanyDetailsResponse {
  results: Array<{
    siren: string;
    nom_complet: string;
    nom_raison_sociale: string;
    siege?: {
      siret?: string;
      tva_intra?: string;
      [key: string]: unknown;
    };
    etat_administratif: string;
    date_creation: string;
    date_mise_a_jour?: string;
    activite_principale: string;
    tranche_effectif_salarie?: string;
    categorie_entreprise?: string;
    dirigeants?: Array<Record<string, unknown>>;
    matching_etablissements?: Array<Record<string, unknown>>;
  }>;
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
    {
      name: 'get-company-details',
      description:
        "Récupérer les détails complets d'une entreprise par son identifiant SIREN (9 chiffres) ou SIRET (14 chiffres). Retourne :\n" +
        '- Identification : SIREN, SIRET, nom complet, raison sociale, numéro TVA\n' +
        '- Statut : état administratif, date de création, dernière modification\n' +
        "- Activité : activité principale, tranche d'effectif, catégorie d'entreprise\n" +
        '- Liste des dirigeants avec leurs informations\n' +
        '- Informations du siège social\n' +
        '- Liste des établissements',
      inputSchema: {
        type: 'object',
        properties: {
          identifier: {
            type: 'string',
            description: 'Identifiant SIREN (9 chiffres) ou SIRET (14 chiffres)',
            pattern: '^[0-9]{9}([0-9]{5})?$',
          },
        },
        required: ['identifier'],
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

  public async getCompanyDetails({ identifier }: GetCompanyDetailsParams): Promise<CallToolResult> {
    try {
      // Validation du format
      if (!identifier || typeof identifier !== 'string') {
        return {
          isError: true,
          content: [
            { type: 'text', text: JSON.stringify({ message: 'Format SIREN/SIRET invalide' }) },
          ],
        };
      }

      // Vérifier si c'est un SIREN (9 chiffres) ou un SIRET (14 chiffres)
      const isSiren = /^[0-9]{9}$/.test(identifier);
      const isSiret = /^[0-9]{14}$/.test(identifier);

      if (!isSiren && !isSiret) {
        return {
          isError: true,
          content: [
            { type: 'text', text: JSON.stringify({ message: 'Format SIREN/SIRET invalide' }) },
          ],
        };
      }

      // Vérifier les zéros au début pour SIREN uniquement
      if (isSiren && identifier.startsWith('0')) {
        return {
          isError: true,
          content: [
            { type: 'text', text: JSON.stringify({ message: 'Format SIREN/SIRET invalide' }) },
          ],
        };
      }

      // Appel à l'API
      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${identifier}`
      );
      const data = (await response.json()) as CompanyDetailsResponse;

      // Vérifier si l'entreprise existe
      if (!data.results || data.results.length === 0) {
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ message: 'Entreprise non trouvée' }) }],
        };
      }

      const company = data.results[0];
      if (!company) {
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ message: 'Entreprise non trouvée' }) }],
        };
      }

      // Formater la réponse pour une meilleure lisibilité
      const formattedResponse = {
        identification: {
          siren: company.siren,
          siret: company.siege?.siret,
          nom: company.nom_complet,
          raison_sociale: company.nom_raison_sociale,
          tva_intra: company.siege?.tva_intra || 'Non disponible',
        },
        statut: {
          etat_administratif: company.etat_administratif,
          date_creation: company.date_creation,
          derniere_modification: company.date_mise_a_jour,
        },
        activite: {
          principale: company.activite_principale,
          tranche_effectif: company.tranche_effectif_salarie,
          categorie: company.categorie_entreprise,
        },
        dirigeants: company.dirigeants || [],
        siege: company.siege || {},
        etablissements: company.matching_etablissements || [],
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(formattedResponse) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({ message: 'Erreur lors de la récupération des informations' }),
          },
        ],
      };
    }
  }
}
