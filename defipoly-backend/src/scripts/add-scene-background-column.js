const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./defipoly.db');

db.run(`ALTER TABLE profiles ADD COLUMN custom_scene_background TEXT`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column')) {
      console.log('Column already exists');
    } else {
      console.error('Error:', err);
    }
  } else {
    console.log('✅ Added custom_scene_background column');
  }
  db.close();
});