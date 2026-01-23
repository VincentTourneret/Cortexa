#!/bin/bash

# Script de migration pour ajouter la fonctionnalité de liens inline

echo "🚀 Migration : Ajout des liens inline entre fiches"
echo "=================================================="
echo ""

# Vérifier que Prisma est installé
if ! command -v npx &> /dev/null; then
    echo "❌ Erreur : npx n'est pas installé"
    exit 1
fi

echo "📋 Étape 1/3 : Génération du client Prisma..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la génération du client Prisma"
    exit 1
fi

echo "✅ Client Prisma généré avec succès"
echo ""

echo "📋 Étape 2/3 : Création de la migration..."
npx prisma migrate dev --name add_inline_references

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la création de la migration"
    echo "💡 Conseil : Si vous rencontrez des erreurs, essayez :"
    echo "   - npx prisma migrate reset (ATTENTION : efface toutes les données)"
    echo "   - npx prisma db push (pour SQLite en développement)"
    exit 1
fi

echo "✅ Migration créée et appliquée avec succès"
echo ""

echo "📋 Étape 3/3 : Vérification de la base de données..."
npx prisma db pull

if [ $? -ne 0 ]; then
    echo "⚠️  Avertissement : Impossible de vérifier la base de données"
else
    echo "✅ Base de données vérifiée"
fi

echo ""
echo "🎉 Migration terminée avec succès !"
echo ""
echo "📚 Prochaines étapes :"
echo "   1. Redémarrez votre serveur de développement"
echo "   2. Consultez INLINE_REFERENCES_GUIDE.md pour plus d'informations"
echo "   3. Testez la fonctionnalité en créant un lien dans l'éditeur"
echo ""
