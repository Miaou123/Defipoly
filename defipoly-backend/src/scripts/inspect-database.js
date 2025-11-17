#!/usr/bin/env node
// ============================================
// DATABASE SCHEMA INSPECTOR
// Check all tables, fields, indexes, and constraints
// ============================================

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const DB_PATH = './defipoly.db';

function inspectDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Database not found at: ${DB_PATH}`);
    console.log('\nMake sure you run this from the defipoly-backend directory.');
    process.exit(1);
  }

  const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Error opening database:', err);
      process.exit(1);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('📊 DEFIPOLY DATABASE SCHEMA INSPECTION');
  console.log('='.repeat(80) + '\n');

  // Get all tables
  db.all(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `, (err, tables) => {
    if (err) {
      console.error('Error fetching tables:', err);
      db.close();
      return;
    }

    console.log(`Found ${tables.length} tables:\n`);
    
    let processedTables = 0;
    
    tables.forEach((table, index) => {
      const tableName = table.name;
      
      console.log(`${'▼'.repeat(3)} TABLE ${index + 1}/${tables.length}: ${tableName}`);
      console.log('─'.repeat(80));
      
      // Get table info (columns)
      db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
        if (err) {
          console.error(`Error fetching columns for ${tableName}:`, err);
          return;
        }

        console.log('\n📋 COLUMNS:');
        console.log('┌─────┬─────────────────────────────┬─────────────────┬──────────┬─────────┬────────┐');
        console.log('│ CID │ Name                        │ Type            │ NotNull  │ Default │ PK     │');
        console.log('├─────┼─────────────────────────────┼─────────────────┼──────────┼─────────┼────────┤');
        
        columns.forEach(col => {
          const cid = String(col.cid).padEnd(3);
          const name = String(col.name).padEnd(27);
          const type = String(col.type).padEnd(15);
          const notnull = col.notnull ? 'YES' : 'NO';
          const notnullPadded = notnull.padEnd(8);
          const dflt = col.dflt_value ? String(col.dflt_value).substring(0, 7) : 'NULL';
          const dfltPadded = dflt.padEnd(7);
          const pk = col.pk ? '✓' : '';
          const pkPadded = pk.padEnd(6);
          
          console.log(`│ ${cid} │ ${name} │ ${type} │ ${notnullPadded} │ ${dfltPadded} │ ${pkPadded} │`);
        });
        
        console.log('└─────┴─────────────────────────────┴─────────────────┴──────────┴─────────┴────────┘');

        // Get indexes for this table
        db.all(`
          SELECT name, sql FROM sqlite_master 
          WHERE type='index' AND tbl_name='${tableName}'
          ORDER BY name
        `, (err, indexes) => {
          if (err) {
            console.error(`Error fetching indexes for ${tableName}:`, err);
          } else if (indexes.length > 0) {
            console.log('\n🔍 INDEXES:');
            indexes.forEach(idx => {
              console.log(`   • ${idx.name}`);
              if (idx.sql) {
                console.log(`     ${idx.sql.substring(0, 70)}${idx.sql.length > 70 ? '...' : ''}`);
              }
            });
          }

          // Get foreign keys
          db.all(`PRAGMA foreign_key_list(${tableName})`, (err, fks) => {
            if (err) {
              console.error(`Error fetching foreign keys for ${tableName}:`, err);
            } else if (fks.length > 0) {
              console.log('\n🔗 FOREIGN KEYS:');
              fks.forEach(fk => {
                console.log(`   • ${fk.from} → ${fk.table}.${fk.to}`);
              });
            }

            // Get row count
            db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
              if (err) {
                console.error(`Error counting rows for ${tableName}:`, err);
              } else {
                console.log(`\n📊 ROW COUNT: ${row.count.toLocaleString()}`);
              }

              console.log('\n');
              
              processedTables++;
              
              // When all tables processed, show summary and export
              if (processedTables === tables.length) {
                showSummary(db, tables);
              }
            });
          });
        });
      });
    });
  });
}

function showSummary(db, tables) {
  console.log('='.repeat(80));
  console.log('📈 DATABASE SUMMARY');
  console.log('='.repeat(80) + '\n');

  // Total size
  db.get(`
    SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()
  `, (err, row) => {
    if (!err && row) {
      const sizeMB = (row.size / 1024 / 1024).toFixed(2);
      console.log(`💾 Database Size: ${sizeMB} MB`);
    }
  });

  // Total records across all tables
  const countPromises = tables.map(table => {
    return new Promise((resolve) => {
      db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
        resolve({ table: table.name, count: err ? 0 : row.count });
      });
    });
  });

  Promise.all(countPromises).then(results => {
    const totalRecords = results.reduce((sum, r) => sum + r.count, 0);
    console.log(`📊 Total Records: ${totalRecords.toLocaleString()}\n`);

    console.log('Records by table:');
    results
      .sort((a, b) => b.count - a.count)
      .forEach(r => {
        console.log(`   ${r.table.padEnd(30)} ${r.count.toLocaleString().padStart(10)}`);
      });

    // Export schema to file
    exportSchema(db);
  });
}

function exportSchema(db) {
  console.log('\n' + '='.repeat(80));
  console.log('💾 EXPORTING SCHEMA');
  console.log('='.repeat(80) + '\n');

  db.all(`
    SELECT sql FROM sqlite_master 
    WHERE sql IS NOT NULL 
    ORDER BY type, name
  `, (err, rows) => {
    if (err) {
      console.error('Error exporting schema:', err);
      db.close();
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `schema-export-${timestamp}.sql`;
    
    let schemaSQL = `-- DEFIPOLY DATABASE SCHEMA
-- Exported: ${new Date().toISOString()}
-- Tables: ${rows.length}

`;

    rows.forEach(row => {
      schemaSQL += row.sql + ';\n\n';
    });

    fs.writeFileSync(filename, schemaSQL);
    console.log(`✅ Schema exported to: ${filename}`);
    console.log(`📄 You can use this file to recreate the exact schema\n`);

    // Also create a comparison checklist
    createChecklist(db, filename);
  });
}

function createChecklist(db, schemaFile) {
  const checklistFile = schemaFile.replace('.sql', '-checklist.txt');
  
  db.all(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`, (err, tables) => {
    if (err) {
      db.close();
      return;
    }

    let checklist = `DEFIPOLY DATABASE SCHEMA CHECKLIST
Generated: ${new Date().toISOString()}

Use this checklist to verify your production database has all required fields.

`;

    let processedTables = 0;

    tables.forEach(table => {
      db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
        if (!err) {
          checklist += `\n▢ Table: ${table.name}\n`;
          columns.forEach(col => {
            const pk = col.pk ? ' (PRIMARY KEY)' : '';
            const notnull = col.notnull ? ' NOT NULL' : '';
            const dflt = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
            checklist += `  ▢ ${col.name}: ${col.type}${pk}${notnull}${dflt}\n`;
          });
        }

        processedTables++;
        
        if (processedTables === tables.length) {
          fs.writeFileSync(checklistFile, checklist);
          console.log(`✅ Checklist created: ${checklistFile}`);
          console.log('\n' + '='.repeat(80));
          console.log('🎉 INSPECTION COMPLETE!');
          console.log('='.repeat(80) + '\n');
          
          console.log('Files created:');
          console.log(`  1. ${schemaFile} - Full SQL schema`);
          console.log(`  2. ${checklistFile} - Verification checklist`);
          console.log('\nUse these files to verify your production database before reset.\n');
          
          db.close();
        }
      });
    });
  });
}

// Run inspection
inspectDatabase();