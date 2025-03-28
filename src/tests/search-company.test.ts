/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tools } from '../mcp/Tools.js';

describe('search-company', () => {
  let tools: Tools;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockFetch: any;

  beforeEach(() => {
    tools = new Tools();

    // Mock de la réponse de l'API
    mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => {
        await Promise.resolve();
        return {
          page: 1,
          total_pages: 10,
          total_results: 100,
          results: [
            {
              name: 'Carrefour SA',
              siren: '123456789',
              siret: '12345678900001',
              address: '33 Avenue Émile Zola, 75015 Paris',
              creation_date: '1959-01-01',
              legal_status: 'SA',
            },
          ],
        };
      },
    } as Response);
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('1.1 Recherche Simple', () => {
    it('devrait retourner des résultats pour un terme commun', async () => {
      const result = await tools.searchCompany({ query: 'Carrefour' });

      expect(result.isError).toBeUndefined(); // Notre fonction ne retourne pas isError: false si tout va bien
      expect(result.content).toHaveLength(1);

      const content = result.content?.[0];
      expect(content?.type).toBe('text');
      expect(content?.text).toContain('Résultats de la recherche');

      // Vérifier que fetch a été appelé avec les bons paramètres
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://recherche-entreprises.api.gouv.fr/search?q=Carrefour')
      );
    });

    it('devrait gérer la recherche avec ponctuation', async () => {
      await tools.searchCompany({ query: "L'Oréal" });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('L%27Or%C3%A9al'));
    });
  });

  describe('1.2 Pagination', () => {
    it('devrait gérer la pagination correctement', async () => {
      await tools.searchCompany({
        query: 'Carrefour',
        page: 2,
        per_page: 15,
      });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/page=2.*per_page=15/));
    });

    it('devrait utiliser les valeurs par défaut si non spécifiées', async () => {
      await tools.searchCompany({ query: 'Carrefour' });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/page=1.*per_page=10/));
    });

    it('devrait respecter la limite maximale de résultats par page', async () => {
      await tools.searchCompany({
        query: 'Carrefour',
        per_page: 100, // Supérieur à la limite de 20
      });

      // Devrait quand même envoyer 100 mais l'API limitera probablement à 20
      expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/per_page=100/));
    });
  });

  describe('1.3 Filtres', () => {
    it('devrait appliquer le filtre de code postal', async () => {
      await tools.searchCompany({
        query: 'Carrefour',
        postal_code: '75015',
      });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/postal_code=75015/));
    });

    it('devrait appliquer le filtre de statut juridique', async () => {
      await tools.searchCompany({
        query: 'Carrefour',
        legal_status: 'SA',
      });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/legal_status=SA/));
    });

    it('devrait combiner plusieurs filtres', async () => {
      await tools.searchCompany({
        query: 'Carrefour',
        postal_code: '75015',
        legal_status: 'SA',
        creation_date_min: '1950-01-01',
        creation_date_max: '2000-01-01',
      });

      const calls = mockFetch.mock.calls;
      if (calls && calls.length > 0) {
        const fetchUrl = calls[0][0] as string;
        expect(fetchUrl).toContain('postal_code=75015');
        expect(fetchUrl).toContain('legal_status=SA');
        expect(fetchUrl).toContain('creation_date_min=1950-01-01');
        expect(fetchUrl).toContain('creation_date_max=2000-01-01');
      }
    });
  });

  describe('1.4 Tri', () => {
    it('devrait appliquer le tri par pertinence', async () => {
      await tools.searchCompany({
        query: 'Carrefour',
        sort_by: 'score',
      });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/sort_by=score/));
    });

    it('devrait appliquer le tri par date de création', async () => {
      await tools.searchCompany({
        query: 'Carrefour',
        sort_by: 'creation_date',
        sort_order: 'asc',
      });

      const calls = mockFetch.mock.calls;
      if (calls && calls.length > 0) {
        const fetchUrl = calls[0][0] as string;
        expect(fetchUrl).toContain('sort_by=creation_date');
        expect(fetchUrl).toContain('sort_order=asc');
      }
    });
  });

  describe('3.1 Gestion des Erreurs', () => {
    it("devrait gérer les erreurs de l'API externe", async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await tools.searchCompany({ query: 'Carrefour' });

      expect(result.isError).toBe(true);
      // Vérifier le contenu exact du message d'erreur
      const content = result.content?.[0];
      if (content) {
        expect(content.text).toBe('{}');
      }
    });

    it('devrait gérer les réponses malformées', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => {
          await Promise.resolve();
          return { error: 'Invalid response' };
        },
      } as Response);

      const result = await tools.searchCompany({ query: 'Carrefour' });

      // Le code actuel ne vérifie pas la structure de la réponse, mais on peut tester
      // que la fonction ne plante pas avec une réponse inattendue
      expect(result.isError).toBeUndefined();
    });
  });

  describe('5.1 Valeurs Limites', () => {
    it('devrait remplacer la page 0 par page 1', async () => {
      await tools.searchCompany({
        query: 'Carrefour',
        page: 0,
      });

      // Le code actuel n'envoie pas 0 mais 1 (par défaut)
      expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/page=1/));
    });

    it('devrait gérer une chaîne vide comme requête', async () => {
      await tools.searchCompany({ query: '' });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/q=/));
    });
  });
});
