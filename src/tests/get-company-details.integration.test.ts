import { describe, it, expect } from 'vitest';
import { Tools } from '../mcp/Tools.js';

interface CompanyDetails {
  siren: string;
  siret?: string;
  nom_complet: string;
  raison_sociale: string;
  tva_intra: string;
  etat_administratif: string;
  date_creation: string;
  date_mise_a_jour?: string;
  activite_principale: string;
  tranche_effectif_salarie?: string;
  categorie_entreprise?: string;
  dirigeants: Array<Record<string, unknown>>;
  siege: Record<string, unknown>;
  matching_etablissements: Array<Record<string, unknown>>;
}

function parseCompanyDetails(text: string): CompanyDetails {
  // Extraire uniquement la partie JSON (tout ce qui suit la première accolade)
  const jsonStart = text.indexOf('{');
  const jsonText = text.slice(jsonStart);
  const parsed = JSON.parse(jsonText) as unknown;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Format de réponse invalide');
  }
  const details = parsed as CompanyDetails;
  if (
    !details.siren ||
    !details.nom_complet ||
    !details.raison_sociale ||
    !details.etat_administratif ||
    !details.date_creation ||
    !details.activite_principale ||
    !Array.isArray(details.dirigeants) ||
    !details.siege ||
    !Array.isArray(details.matching_etablissements)
  ) {
    throw new Error('Format de réponse invalide');
  }
  return details;
}

function parseErrorResponse(text: string): { message: string } {
  const parsed = JSON.parse(text) as unknown;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Format de réponse invalide');
  }
  const error = parsed as { message: string };
  if (!error.message || typeof error.message !== 'string') {
    throw new Error('Format de réponse invalide');
  }
  return error;
}

function getTextContent(content: { type: string; text?: string } | undefined): string {
  if (!content || content.type !== 'text' || !content.text || typeof content.text !== 'string') {
    throw new Error('Le contenu de la réponse est vide ou invalide');
  }
  return content.text;
}

describe('get-company-details (Integration Tests)', () => {
  const tools = new Tools();

  describe('Cas de succès', () => {
    it("devrait récupérer les détails d'une entreprise active (MAUGIE)", async () => {
      const result = await tools.getCompanyDetails({ identifier: '832378541' });
      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      const content = result.content?.[0];
      expect(content?.type).toBe('text');

      const text = getTextContent(content);
      const details = parseCompanyDetails(text);
      expect(details.siren).toBe('832378541');
      expect(details.nom_complet).toContain('MAUGIE');
      expect(details.etat_administratif).toBe('A');
    });

    it("devrait récupérer les détails d'une grande entreprise (CARREFOUR)", async () => {
      const result = await tools.getCompanyDetails({ identifier: '652014051' });
      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      const content = result.content?.[0];
      expect(content?.type).toBe('text');

      const text = getTextContent(content);
      const details = parseCompanyDetails(text);
      expect(details.siren).toBe('652014051');
      expect(details.nom_complet).toContain('CARREFOUR');
      expect(details.etat_administratif).toBe('A');
    });
  });

  describe('Cas limites', () => {
    it('devrait gérer un SIREN avec des zéros au début', async () => {
      const result = await tools.getCompanyDetails({ identifier: '000123456' });
      expect(result.isError).toBe(true);
      const content = result.content?.[0];
      expect(content?.type).toBe('text');

      const text = getTextContent(content);
      const error = parseErrorResponse(text);
      expect(error.message).toBe('Format SIREN/SIRET invalide');
    });

    it('devrait gérer un SIRET complet', async () => {
      const result = await tools.getCompanyDetails({ identifier: '80035414400043' });
      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      const content = result.content?.[0];
      expect(content?.type).toBe('text');

      const text = getTextContent(content);
      const details = parseCompanyDetails(text);
      expect(details.siren).toBe('800354144');
      expect(details.siret).toBe('80035414400043');
      expect(details.nom_complet).toContain('STREAMROOT');
      expect(details.etat_administratif).toBe('A');
    });
  });

  describe("Cas d'erreur", () => {
    it('devrait gérer un SIREN inexistant', async () => {
      const result = await tools.getCompanyDetails({ identifier: '111111111' });
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      const content = result.content?.[0];
      expect(content?.type).toBe('text');

      const text = getTextContent(content);
      const error = parseErrorResponse(text);
      expect(error.message).toBe('Entreprise non trouvée');
    });

    it('devrait gérer un SIREN invalide (trop court)', async () => {
      const result = await tools.getCompanyDetails({ identifier: '123456' });
      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      const content = result.content?.[0];
      expect(content?.type).toBe('text');

      const text = getTextContent(content);
      const error = parseErrorResponse(text);
      expect(error.message).toBe('Format SIREN/SIRET invalide');
    });

    it('devrait gérer un SIREN invalide (trop long)', async () => {
      const result = await tools.getCompanyDetails({ identifier: '1234567890' });
      expect(result.isError).toBe(true);
      const content = result.content?.[0];
      expect(content?.type).toBe('text');

      const text = getTextContent(content);
      const error = parseErrorResponse(text);
      expect(error.message).toBe('Format SIREN/SIRET invalide');
    });

    it('devrait gérer un SIREN avec des caractères non numériques', async () => {
      const result = await tools.getCompanyDetails({ identifier: '12345678A' });
      expect(result.isError).toBe(true);
      const content = result.content?.[0];
      expect(content?.type).toBe('text');

      const text = getTextContent(content);
      const error = parseErrorResponse(text);
      expect(error.message).toBe('Format SIREN/SIRET invalide');
    });
  });

  describe('Format de réponse', () => {
    it('devrait retourner tous les champs requis dans le format attendu', async () => {
      const result = await tools.getCompanyDetails({ identifier: '832378541' });
      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      const content = result.content?.[0];
      expect(content?.type).toBe('text');

      const text = getTextContent(content);
      const details = parseCompanyDetails(text);
      expect(details).toHaveProperty('siren');
      expect(details.siren).toBe('832378541');
      expect(details).toHaveProperty('nom_complet');
      expect(details).toHaveProperty('raison_sociale');
      expect(details).toHaveProperty('tva_intra');
      expect(details).toHaveProperty('etat_administratif');
      expect(details).toHaveProperty('date_creation');
      expect(details).toHaveProperty('activite_principale');
      expect(details).toHaveProperty('dirigeants');
      expect(Array.isArray(details.dirigeants)).toBe(true);
      expect(details).toHaveProperty('siege');
      expect(typeof details.siege).toBe('object');
      expect(details).toHaveProperty('matching_etablissements');
      expect(Array.isArray(details.matching_etablissements)).toBe(true);
    });
  });
});
