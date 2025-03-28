import { describe, it, expect } from 'vitest';
import { Tools } from '../mcp/Tools.js';

interface CompanyDetails {
  identification: {
    siren: string;
    siret?: string;
    nom: string;
    raison_sociale: string;
    tva_intra: string;
  };
  statut: {
    etat_administratif: string;
    date_creation: string;
    derniere_modification?: string;
  };
  activite: {
    principale: string;
    tranche_effectif?: string;
    categorie?: string;
  };
  dirigeants: Array<Record<string, unknown>>;
  siege: Record<string, unknown>;
  etablissements: Array<Record<string, unknown>>;
}

function parseCompanyDetails(text: string): CompanyDetails {
  const parsed = JSON.parse(text) as unknown;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Format de réponse invalide');
  }
  const details = parsed as CompanyDetails;
  if (
    !details.identification ||
    !details.statut ||
    !details.activite ||
    !details.dirigeants ||
    !details.siege ||
    !details.etablissements
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
      expect(details.identification.siren).toBe('832378541');
      expect(details.identification.nom).toContain('MAUGIE');
      expect(details.statut.etat_administratif).toBe('A');
    });

    it("devrait récupérer les détails d'une grande entreprise (CARREFOUR)", async () => {
      const result = await tools.getCompanyDetails({ identifier: '652014051' });
      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      const content = result.content?.[0];
      expect(content?.type).toBe('text');

      const text = getTextContent(content);
      const details = parseCompanyDetails(text);
      expect(details.identification.siren).toBe('652014051');
      expect(details.identification.nom).toContain('CARREFOUR');
      expect(details.statut.etat_administratif).toBe('A');
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
      expect(details.identification.siren).toBe('800354144');
      expect(details.identification.siret).toBe('80035414400043');
      expect(details.identification.nom).toContain('STREAMROOT');
      expect(details.statut.etat_administratif).toBe('A');
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
      expect(details).toHaveProperty('identification');
      expect(details.identification).toHaveProperty('siren');
      expect(details.identification).toHaveProperty('nom');
      expect(details.identification).toHaveProperty('raison_sociale');
      expect(details.identification).toHaveProperty('tva_intra');

      expect(details).toHaveProperty('statut');
      expect(details.statut).toHaveProperty('etat_administratif');
      expect(details.statut).toHaveProperty('date_creation');

      expect(details).toHaveProperty('activite');
      expect(details.activite).toHaveProperty('principale');

      expect(details).toHaveProperty('dirigeants');
      expect(Array.isArray(details.dirigeants)).toBe(true);

      expect(details).toHaveProperty('siege');
      expect(typeof details.siege).toBe('object');

      expect(details).toHaveProperty('etablissements');
      expect(Array.isArray(details.etablissements)).toBe(true);
    });
  });
});
