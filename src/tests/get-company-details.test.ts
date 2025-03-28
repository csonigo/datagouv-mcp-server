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

    // Mock de la réponse de l'API pour SIREN
    mockFetch = vi.spyOn(global, 'fetch').mockImplementation((url: URL | string) => {
      const urlString = url.toString();
      if (urlString.includes('/entreprises/')) {
        return Promise.resolve({
          ok: true,
          json: async () => {
            await Promise.resolve();
            return {
              siren: '123456789',
              nom_complet: 'CARREFOUR',
              nom_raison_sociale: 'CARREFOUR',
              numero_tva_intra: 'FR12345678901',
              statut_diffusion: 'diffusible',
              date_creation: '1959-01-01',
              date_derniere_modification: '2022-01-01',
              tranche_effectif: '10000+',
              etat_administratif: 'actif',
              activite_principale: 'Hypermarchés (4711F)',
              categorie_entreprise: 'GE',
              dirigeants: [
                {
                  nom: 'DOE',
                  prenom: 'John',
                  fonction: 'PRÉSIDENT',
                  date_naissance: '1970-01-01',
                },
              ],
              siege: {
                siret: '12345678901234',
                adresse: '33 AVENUE EMILE ZOLA',
                code_postal: '75015',
                ville: 'PARIS',
              },
              etablissements: [
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
            };
          },
        } as Response);
      } else if (urlString.includes('/etablissements/')) {
        return Promise.resolve({
          ok: true,
          json: async () => {
            await Promise.resolve();
            return {
              siret: '12345678901234',
              siren: '123456789',
              nom_complet: 'CARREFOUR - PARIS 15',
              nom_raison_sociale: 'CARREFOUR',
              enseigne: 'CARREFOUR PARIS 15',
              statut_diffusion: 'diffusible',
              date_creation: '1959-01-01',
              date_derniere_modification: '2022-01-01',
              tranche_effectif: '500-999',
              etat_administratif: 'actif',
              activite_principale: 'Hypermarchés (4711F)',
              est_siege: true,
              adresse: {
                numero_voie: '33',
                type_voie: 'AVENUE',
                libelle_voie: 'EMILE ZOLA',
                code_postal: '75015',
                libelle_commune: 'PARIS',
              },
              siege: {
                siret: '12345678901234',
                adresse: '33 AVENUE EMILE ZOLA',
                code_postal: '75015',
                ville: 'PARIS',
              },
              dirigeants: [
                {
                  nom: 'DOE',
                  prenom: 'John',
                  fonction: 'PRÉSIDENT',
                  date_naissance: '1970-01-01',
                },
              ],
              etablissements: [],
            };
          },
        } as Response);
      } else {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => {
            await Promise.resolve();
            return { message: 'Entreprise non trouvée' };
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
        'https://recherche-entreprises.api.gouv.fr/entreprises/123456789'
      );
    });

    it('devrait formater correctement les détails', async () => {
      const result = await tools.getCompanyDetails({ identifier: '123456789' });
      const content = result.content?.[0];
      expect(content?.text).toContain('"siren": "123456789"');
      expect(content?.text).toContain('"raison_sociale": "CARREFOUR"');
      expect(content?.text).toContain('"etat_administratif": "actif"');
      expect(content?.text).toContain('"principale": "Hypermarchés (4711F)"');
      expect(content?.text).toContain('"tranche_effectif": "10000+"');
      expect(content?.text).toContain('"dirigeants":');
      expect(content?.text).toContain('"etablissements":');
    });
  });

  describe('Recherche par SIRET', () => {
    it("devrait récupérer les détails d'un établissement par SIRET", async () => {
      const result = await tools.getCompanyDetails({ identifier: '12345678901234' });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);

      const content = result.content?.[0];
      expect(content?.type).toBe('text');
      expect(content?.text).toContain("Détails de l'entreprise CARREFOUR - PARIS 15");

      // Vérifier que fetch a été appelé avec le bon endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        'https://recherche-entreprises.api.gouv.fr/etablissements/12345678901234'
      );
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs HTTP', async () => {
      // Override du mock pour simuler une erreur
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => {
            await Promise.resolve();
            return { message: 'Entreprise non trouvée' };
          },
        } as Response)
      );

      const result = await tools.getCompanyDetails({ identifier: '999999999' });

      expect(result.isError).toBe(true);
      const content = result.content?.[0];
      expect(content?.text).toBe('{"message":"Entreprise non trouvée"}');
    });

    it('devrait gérer les erreurs réseau', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

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
        'https://recherche-entreprises.api.gouv.fr/entreprises/123456789'
      );

      await tools.getCompanyDetails({ identifier: '12345678901234' }); // SIRET
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://recherche-entreprises.api.gouv.fr/etablissements/12345678901234'
      );
    });
  });
});
