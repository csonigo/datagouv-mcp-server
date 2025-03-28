/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tools } from '../mcp/Tools.js';

describe('get-company-details', () => {
  let tools: Tools;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockFetch: any;

  beforeEach(() => {
    tools = new Tools();

    // Mock de la réponse de l'API
    mockFetch = vi.spyOn(global, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const urlString =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (urlString.includes('/search')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => {
            await Promise.resolve();
            return JSON.stringify({
              page: 1,
              total_pages: 1,
              results: [
                {
                  siren: '123456789',
                  nom_complet: 'CARREFOUR',
                  nom_raison_sociale: 'CARREFOUR',
                  siege: {
                    siret: '12345678901234',
                    tva_intra: 'FR12345678901',
                    code_postal: '75015',
                  },
                  etat_administratif: 'actif',
                  date_creation: '1959-01-01',
                  date_mise_a_jour: '2022-01-01',
                  activite_principale: 'Hypermarchés (4711F)',
                  tranche_effectif_salarie: '10000+',
                  categorie_entreprise: 'GE',
                  dirigeants: [
                    {
                      nom: 'DOE',
                      prenom: 'John',
                      fonction: 'PRÉSIDENT',
                      date_naissance: '1970-01-01',
                    },
                  ],
                  matching_etablissements: [
                    {
                      siret: '12345678901234',
                      enseigne: 'CARREFOUR PARIS 15',
                      adresse: '33 AVENUE EMILE ZOLA',
                      code_postal: '75015',
                      ville: 'PARIS',
                      est_siege: true,
                    },
                    {
                      siret: '12345678902345',
                      enseigne: 'CARREFOUR LYON',
                      adresse: '10 RUE DE LYON',
                      code_postal: '69001',
                      ville: 'LYON',
                      est_siege: false,
                    },
                  ],
                },
              ],
            });
          },
        } as Response);
      } else {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: async () => {
            await Promise.resolve();
            return JSON.stringify({ message: 'Entreprise non trouvée' });
          },
        } as Response);
      }
    });
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('Recherche par SIREN', () => {
    it("devrait récupérer les détails d'une entreprise par SIREN", async () => {
      const result = await tools.getCompanyDetails({ identifier: '123456789' });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);

      const content = result.content?.[0];
      expect(content?.type).toBe('text');
      expect(content?.text).toContain("Détails de l'entreprise CARREFOUR");

      // Vérifier que fetch a été appelé avec le bon endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://recherche-entreprises.api.gouv.fr/search')
      );
    });

    it('devrait formater correctement les détails', async () => {
      const result = await tools.getCompanyDetails({ identifier: '123456789' });
      const content = result.content?.[0];
      expect(content?.text).toContain('"siren": "123456789"');
      expect(content?.text).toContain('"raison_sociale": "CARREFOUR"');
      expect(content?.text).toContain('"etat_administratif": "actif"');
      expect(content?.text).toContain('"activite_principale": "Hypermarchés (4711F)"');
      expect(content?.text).toContain('"tranche_effectif_salarie": "10000+"');
      expect(content?.text).toContain('"dirigeants":');
      expect(content?.text).toContain('"matching_etablissements":');
    });
  });

  describe('Recherche par SIRET', () => {
    it("devrait récupérer les détails d'un établissement par SIRET", async () => {
      const result = await tools.getCompanyDetails({ identifier: '12345678901234' });
      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);

      const content = result.content?.[0];
      expect(content?.type).toBe('text');
      expect(content?.text).toContain("Détails de l'entreprise CARREFOUR - 75015");

      // Vérifier que fetch a été appelé avec le bon endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://recherche-entreprises.api.gouv.fr/search')
      );
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs HTTP', async () => {
      // Override du mock pour simuler une erreur réseau
      mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Failed to fetch')));

      const result = await tools.getCompanyDetails({ identifier: '999999999' });

      expect(result.isError).toBe(true);
      const content = result.content?.[0];
      expect(content?.text).toBe('{"message":"Network Error"}');
    });

    it('devrait gérer les erreurs réseau', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      const result = await tools.getCompanyDetails({ identifier: '123456789' });

      expect(result.isError).toBe(true);
      const content = result.content?.[0];
      expect(content?.text).toBe('{"message":"Network Error"}');
    });
  });

  describe('Validation des entrées', () => {
    it("devrait distinguer un SIREN d'un SIRET", async () => {
      await tools.getCompanyDetails({ identifier: '123456789' }); // SIREN
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('https://recherche-entreprises.api.gouv.fr/search')
      );

      await tools.getCompanyDetails({ identifier: '12345678901234' }); // SIRET
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('https://recherche-entreprises.api.gouv.fr/search')
      );
    });
  });
});
