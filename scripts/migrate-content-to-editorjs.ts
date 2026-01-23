/**
 * Script de migration du contenu texte vers le format Editor.js
 * 
 * Usage: bun run scripts/migrate-content-to-editorjs.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { textToEditorJS } from "../src/lib/content-converter";

const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
const adapter = new PrismaLibSql({
  url: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function migrate() {
  console.log("🚀 Démarrage de la migration du contenu vers Editor.js...\n");

  try {
    // Récupérer toutes les sections avec contentType = "text"
    const sections = await prisma.knowledgeSection.findMany({
      where: {
        contentType: "text",
      },
      select: {
        id: true,
        title: true,
        content: true,
        knowledgeCardId: true,
      },
    });

    console.log(`📝 ${sections.length} section(s) à migrer\n`);

    if (sections.length === 0) {
      console.log("✅ Aucune section à migrer. Toutes les sections sont déjà au format Editor.js!\n");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Migrer chaque section
    for (const section of sections) {
      try {
        console.log(`   Traitement de: "${section.title}" (${section.id})`);

        // Convertir le contenu texte en format Editor.js
        const editorJSData = textToEditorJS(section.content);
        const editorJSContent = JSON.stringify(editorJSData);

        // Mettre à jour la section
        await prisma.knowledgeSection.update({
          where: {
            id: section.id,
          },
          data: {
            content: editorJSContent,
            contentType: "editorjs",
          },
        });

        console.log(`   ✅ Migrée avec succès\n`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Erreur lors de la migration:`, error);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Résumé de la migration:");
    console.log(`   ✅ Réussies: ${successCount}`);
    console.log(`   ❌ Échouées: ${errorCount}`);
    console.log(`   📝 Total: ${sections.length}`);
    console.log("=".repeat(50) + "\n");

    if (errorCount === 0) {
      console.log("🎉 Migration terminée avec succès!\n");
    } else {
      console.log("⚠️  Migration terminée avec des erreurs. Vérifiez les logs ci-dessus.\n");
    }
  } catch (error) {
    console.error("❌ Erreur fatale lors de la migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
migrate()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
