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
  results: Array<{
    siren: string;
    nom_complet: string;
    nom_raison_sociale: string;
    siege?: {
      siret?: string;
      tva_intra?: string;
      code_postal?: string;
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
            description: 'Statut juridique (SARL, SAS, SA, SASU, EURL, EI, etc.)',
            enum: [
              'SARL',
              'SAS',
              'SA',
              'SASU',
              'EURL',
              'EI',
              'SELARL',
              'SCI',
              'EIRL',
              'SCP',
              'SCM',
              'SNC',
              'GIE',
              'SCOP',
              'SCA',
            ],
          },
          employee_range: {
            type: 'string',
            description:
              "Tranche d'effectif (valeurs possibles : " +
              "'00' : 0 salarié, " +
              "'01' : 1 ou 2 salariés, " +
              "'02' : 3 à 5 salariés, " +
              "'03' : 6 à 9 salariés, " +
              "'11' : 10 à 19 salariés, " +
              "'12' : 20 à 49 salariés, " +
              "'21' : 50 à 99 salariés, " +
              "'22' : 100 à 199 salariés, " +
              "'31' : 200 à 249 salariés, " +
              "'32' : 250 à 499 salariés, " +
              "'41' : 500 à 999 salariés, " +
              "'42' : 1 000 à 1 999 salariés, " +
              "'51' : 2 000 à 4 999 salariés, " +
              "'52' : 5 000 à 9 999 salariés, " +
              "'53' : 10 000 salariés et plus)",
            enum: [
              '00',
              '01',
              '02',
              '03',
              '11',
              '12',
              '21',
              '22',
              '31',
              '32',
              '41',
              '42',
              '51',
              '52',
              '53',
            ],
          },
          company_category: {
            type: 'string',
            description:
              "Catégorie d'entreprise (PME: Petite ou Moyenne Entreprise, ETI: Entreprise de Taille Intermédiaire, GE: Grande Entreprise)",
            enum: ['PME', 'ETI', 'GE'],
          },
          sort_by: {
            type: 'string',
            description: 'Critère de tri (score, creation_date, name, relevance)',
            enum: ['score', 'creation_date', 'name', 'relevance'],
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
        ...(params.employee_range && { tranche_effectif_salarie: params.employee_range }),
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
      const searchParams = new URLSearchParams({
        q: identifier,
        page: '1',
        per_page: '1',
      });

      console.log(
        'Calling API:',
        `https://recherche-entreprises.api.gouv.fr/search?${searchParams.toString()}`
      );
      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?${searchParams.toString()}`
      );
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ message: 'Entreprise non trouvée', details: errorText }),
            },
          ],
        };
      }

      const responseText = await response.text();
      console.log('Response text:', responseText);
      const data = JSON.parse(responseText) as SearchResponse;

      // Vérifier si l'entreprise existe
      if (!data || !data.results || data.results.length === 0) {
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ message: 'Entreprise non trouvée' }) }],
        };
      }

      // Extraire les données de l'entreprise
      const companyData = data.results[0];
      if (!companyData || typeof companyData !== 'object') {
        return {
          isError: true,
          content: [
            { type: 'text', text: JSON.stringify({ message: 'Données entreprise incomplètes' }) },
          ],
        };
      }

      const formattedResponse = {
        siren: companyData.siren,
        siret: companyData.siege?.siret,
        nom_complet: companyData.nom_complet,
        raison_sociale: companyData.nom_raison_sociale,
        tva_intra: companyData.siege?.tva_intra || 'Non disponible',
        etat_administratif: companyData.etat_administratif,
        date_creation: companyData.date_creation,
        date_mise_a_jour: companyData.date_mise_a_jour,
        activite_principale: companyData.activite_principale,
        tranche_effectif_salarie: companyData.tranche_effectif_salarie,
        categorie_entreprise: companyData.categorie_entreprise,
        dirigeants: companyData.dirigeants || [],
        siege: companyData.siege || {},
        matching_etablissements: companyData.matching_etablissements || [],
      };

      const codePostal = companyData.siege?.code_postal
        ? String(companyData.siege.code_postal)
        : '';
      const title = isSiret
        ? `Détails de l'entreprise ${companyData.nom_complet} - ${codePostal}`
        : `Détails de l'entreprise ${companyData.nom_complet}`;

      return {
        isError: undefined,
        content: [
          {
            type: 'text',
            text: `${title}\n${JSON.stringify(formattedResponse, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Failed to fetch') {
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ message: 'Network Error' }) }],
        };
      }
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({ message: 'Network Error' }) }],
      };
    }
  }
}
