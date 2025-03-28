# Plan de Test pour l'API de Recherche d'Entreprises

## 1. Tests Fonctionnels de Base

### 1.1 Recherche Simple
- Recherche avec un terme commun (ex: "Carrefour", "Total", "EDF")
- Recherche avec un terme rare mais valide
- Recherche d'une entreprise par son nom exact
- Recherche incluant la ponctuation (ex: "L'Oréal", "Peugeot S.A.")
- Recherche avec des termes partiels (début, milieu, fin du nom)

### 1.2 Pagination
- Récupérer la première page de résultats
- Récupérer la dernière page de résultats
- Naviguer entre les pages (page 1, 2, 3...)
- Demander une page qui n'existe pas (au-delà du nombre total)
- Vérifier la cohérence des résultats entre les pages

### 1.3 Filtres
- Filtrer par code postal unique
- Filtrer par code postal inexistant
- Filtrer par code NAF valide
- Filtrer par code NAF invalide
- Combiner plusieurs filtres (code postal + statut juridique)
- Appliquer tous les filtres disponibles simultanément
- Filtrer par date de création (min et max)
- Filtrer par tranche d'effectif
- Filtrer par catégorie d'entreprise

### 1.4 Tri
- Trier par pertinence (score)
- Trier par date de création (asc/desc)
- Trier par nom (asc/desc)
- Vérifier que le tri est correctement appliqué

## 2. Tests de Performance

### 2.1 Volume de Données
- Rechercher un terme générant un grand volume de résultats (ex: "restaurant", "conseil")
- Rechercher un terme générant un petit volume de résultats
- Requêtes successives rapides (simulation de pics d'utilisation)

### 2.2 Temps de Réponse
- Mesurer le temps de réponse pour différentes combinaisons de paramètres
- Vérifier le temps de réponse avec tous les filtres activés
- Vérifier le temps de réponse avec une pagination élevée

### 2.3 Limites
- Tester avec le nombre maximum de résultats par page (20)
- Tester avec le nombre minimum de résultats par page (1)
- Tester avec des valeurs intermédiaires (5, 10, 15)

## 3. Tests de Robustesse

### 3.1 Gestion des Erreurs
- Tester le comportement lorsque l'API externe est indisponible
- Tester le comportement en cas de timeout
- Tester le comportement en cas de réponse malformée de l'API externe
- Vérifier que les erreurs sont correctement capturées et formatées

### 3.2 Données Malformées ou Manquantes
- Appeler l'outil search-company sans paramètre query
- Utiliser des types incorrects pour les paramètres (string au lieu de number, etc.)
- Fournir des valeurs hors limites pour les paramètres numériques
- Fournir des caractères spéciaux ou des injections SQL dans les paramètres
- Fournir des paramètres extrêmement longs

### 3.3 Comportement en Cas d'Échec
- Tester la reprise après échec
- Vérifier que les erreurs sont loggées correctement
- Vérifier que les messages d'erreur sont compréhensibles

## 4. Tests de Sécurité

### 4.1 Injection
- Tester les injections SQL dans les paramètres
- Tester les injections NoSQL dans les paramètres
- Tester les injections de commande

### 4.2 Validation des Entrées
- Vérifier que toutes les entrées sont validées côté serveur
- Tester avec des caractères d'échappement
- Tester avec des caractères Unicode inhabituels
- Tester avec des données HTML/JavaScript

### 4.3 Rate Limiting
- Envoyer un grand nombre de requêtes en peu de temps
- Vérifier si l'API externe impose des limites de taux
- Tester le comportement lorsque ces limites sont atteintes

## 5. Tests de Cas Limites

### 5.1 Valeurs Limites
- Utiliser page=0 (invalide)
- Utiliser des valeurs négatives pour les paramètres numériques
- Utiliser des valeurs extrêmement grandes pour les paramètres numériques
- Utiliser des chaînes vides pour les paramètres obligatoires
- Utiliser uniquement des espaces dans les paramètres

### 5.2 Caractères Spéciaux
- Rechercher avec des caractères accentués (é, è, ê, à, etc.)
- Rechercher avec des caractères spéciaux (@, #, $, %, etc.)
- Rechercher avec des caractères d'autres alphabets (cyrillique, arabe, chinois, etc.)
- Rechercher avec des emojis

### 5.3 Formats de Date
- Tester différents formats de date pour les filtres de date de création
- Utiliser des dates invalides
- Utiliser des dates futures
- Utiliser des dates très anciennes

## 6. Tests d'Intégration

### 6.1 Interaction avec le Client MCP
- Vérifier que le serveur MCP répond correctement aux requêtes du client
- Vérifier que les résultats sont correctement formatés pour le client
- Vérifier que les erreurs sont correctement transmises au client

### 6.2 Interaction avec l'API Externe
- Vérifier que les paramètres sont correctement transmis à l'API externe
- Vérifier que les réponses de l'API externe sont correctement traitées
- Vérifier le comportement en cas de changement de l'API externe

### 6.3 Intégration avec d'Autres Outils MCP
- Tester l'interaction avec d'autres outils MCP qui pourraient être ajoutés ultérieurement
- Vérifier que les résultats peuvent être utilisés par d'autres outils

## 7. Tests de Compatibilité

### 7.1 Versions de Node.js
- Tester avec différentes versions de Node.js (LTS, latest)
- Vérifier la compatibilité avec les futures versions

### 7.2 Environnements
- Tester en environnement de développement local
- Tester en environnement de staging
- Tester en environnement de production

### 7.3 Clients MCP
- Tester avec différents clients MCP
- Vérifier la compatibilité avec les futures versions du protocole MCP

## 8. Tests de Régression

### 8.1 Suivi des Changements
- Après chaque modification de l'API, exécuter tous les tests pour s'assurer que tout fonctionne toujours
- Vérifier que les corrections de bugs ne réintroduisent pas d'anciens bugs
- Maintenir une suite de tests automatisés pour détecter les régressions

### 8.2 Vérification des Edge Cases Connus
- Maintenir une liste de cas limites connus et les tester régulièrement
- Documenter les comportements attendus pour les cas limites

## 9. Plan d'Implémentation des Tests

### Phase 1: Tests Unitaires (Vitest)
- Implémenter des tests pour chaque fonction/méthode
- Utiliser des mocks pour simuler l'API externe
- Vérifier le comportement avec des entrées variées

### Phase 2: Tests d'Intégration
- Tester l'intégration entre le serveur MCP et l'API externe
- Vérifier le formatage des réponses
- Vérifier la gestion des erreurs

### Phase 3: Tests de Performance et de Robustesse
- Implémenter des tests de charge
- Simuler des conditions d'erreur
- Vérifier les temps de réponse

### Phase 4: Tests Automatisés en CI/CD
- Configurer les tests pour qu'ils s'exécutent automatiquement à chaque commit
- Mettre en place une matrice de tests pour différentes configurations
- Générer des rapports de couverture de code 