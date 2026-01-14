// Migration script to import existing projects from local storage to Neon DB
// Run with: npx ts-node scripts/migrate-to-neon.ts

import { Pool } from '@neondatabase/serverless';
import * as fs from 'fs/promises';
import * as path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || '';

async function migrate() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    // Read local index
    const indexPath = path.join(process.cwd(), 'public/data/projects/index.json');
    let index: { projects: any[] } = { projects: [] };
    
    try {
      const indexData = await fs.readFile(indexPath, 'utf-8');
      index = JSON.parse(indexData);
    } catch (e) {
      console.log('No local index found, checking Blob...');
      // If using Blob, would need to list from there
      return;
    }

    console.log(`Found ${index.projects.length} projects to migrate`);

    for (const proj of index.projects) {
      console.log(`Migrating project: ${proj.id} - ${proj.title}`);
      
      // Read project data
      const dataPath = path.join(process.cwd(), `public/data/projects/${proj.id}/data.json`);
      let projectData: any = {};
      
      try {
        const data = await fs.readFile(dataPath, 'utf-8');
        projectData = JSON.parse(data);
      } catch (e) {
        console.log(`  No data.json found for ${proj.id}`);
      }

      // Check if already exists in DB
      const existing = await client.query('SELECT id FROM projects WHERE id = $1', [proj.id]);
      if (existing.rows.length > 0) {
        console.log(`  Project ${proj.id} already exists in DB, skipping`);
        continue;
      }

      // Insert into DB
      await client.query(`
        INSERT INTO projects (id, title, config, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        proj.id,
        proj.title || projectData.title || 'Untitled',
        projectData.config || {},
        proj.createdAt || new Date().toISOString(),
        proj.updatedAt || new Date().toISOString()
      ]);

      console.log(`  Migrated ${proj.id}`);
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
