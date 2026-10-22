import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_FILE = path.resolve(process.cwd(), 'healthify.sqlite');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Failed to load existing SQLite database file, creating fresh one:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  saveDb();
  await seedDemoData(dbInstance);

  return dbInstance;
}

export function saveDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      reset_token TEXT,
      reset_expires TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      age INTEGER,
      gender TEXT,
      height_cm REAL,
      weight_kg REAL,
      activity_level TEXT,
      food_preference TEXT,
      cuisine TEXT,
      food_allergies TEXT,
      goal TEXT,
      onboarding_completed INTEGER DEFAULT 0,
      daily_water_glasses INTEGER DEFAULT 0,
      water_updated_date TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conditions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      condition_name TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      dose TEXT NOT NULL,
      form TEXT NOT NULL,
      frequency_per_day INTEGER DEFAULT 1,
      times_of_day TEXT NOT NULL,
      meal_timing TEXT NOT NULL,
      days_of_week TEXT DEFAULT 'everyday',
      start_date TEXT,
      end_date TEXT,
      stock_quantity INTEGER DEFAULT 30,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS care_checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      condition_name TEXT NOT NULL,
      title TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      frequency TEXT DEFAULT 'daily',
      is_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS intake_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      medicine_id INTEGER,
      care_checklist_id INTEGER,
      item_name TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      status TEXT NOT NULL,
      taken_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diet_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      title TEXT NOT NULL,
      target_calories INTEGER,
      target_protein INTEGER,
      target_carbs INTEGER,
      target_fat INTEGER,
      daily_water_goal_liters REAL,
      days_json TEXT NOT NULL,
      grocery_list_json TEXT,
      condition_reasons_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exercise_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      title TEXT NOT NULL,
      goal TEXT NOT NULL,
      fitness_level TEXT,
      days_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exercise_plan_id INTEGER,
      day_name TEXT NOT NULL,
      duration_minutes INTEGER,
      calories_burned INTEGER,
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vitals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      value_primary REAL NOT NULL,
      value_secondary REAL,
      unit TEXT NOT NULL,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      status_flag TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

async function seedDemoData(db: Database) {
  // Check if demo user exists
  const res = db.exec("SELECT id FROM users WHERE email = 'demo@healthify.app'");
  if (res.length > 0 && res[0].values.length > 0) {
    return; // Demo user already exists
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Demo@1234', salt);

  db.run(
    `INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)`,
    ['demo@healthify.app', passwordHash, 'Alex Morgan']
  );

  const userRes = db.exec("SELECT id FROM users WHERE email = 'demo@healthify.app'");
  const demoUserId = userRes[0].values[0][0] as number;

  // Insert Profile
  db.run(`
    INSERT INTO profiles (
      user_id, age, gender, height_cm, weight_kg, activity_level,
      food_preference, cuisine, food_allergies, goal, onboarding_completed, daily_water_glasses, water_updated_date
    ) VALUES (
      ?, 42, 'male', 176, 78.5, 'moderate',
      'vegetarian', 'Mediterranean & Indian', 'Peanuts', 'manage condition', 1, 6, date('now')
    )
  `, [demoUserId]);

  // Insert Conditions: Diabetes Type 2 and Hypertension
  db.run(`INSERT INTO conditions (user_id, condition_name, notes) VALUES (?, ?, ?)`, [
    demoUserId, 'diabetes', 'Diagnosed 2 years ago, monitored regularly'
  ]);
  db.run(`INSERT INTO conditions (user_id, condition_name, notes) VALUES (?, ?, ?)`, [
    demoUserId, 'hypertension', 'Mild stage 1, managed with medication'
  ]);

  // Insert demo medicines
  db.run(`
    INSERT INTO medicines (
      user_id, name, dose, form, frequency_per_day, times_of_day,
      meal_timing, days_of_week, start_date, end_date, stock_quantity, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    demoUserId,
    'Metformin',
    '500 mg',
    'tablet',
    2,
    JSON.stringify(['08:00', '20:00']),
    'after_food',
    'everyday',
    '2026-01-01',
    '2026-12-31',
    24,
    'Take with dinner and breakfast to reduce stomach upset'
  ]);

  db.run(`
    INSERT INTO medicines (
      user_id, name, dose, form, frequency_per_day, times_of_day,
      meal_timing, days_of_week, start_date, end_date, stock_quantity, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    demoUserId,
    'Telmisartan',
    '40 mg',
    'tablet',
    1,
    JSON.stringify(['08:30']),
    'after_food',
    'everyday',
    '2026-01-01',
    '2026-12-31',
    4, // Low stock alert demo!
    'Morning blood pressure medication'
  ]);

  db.run(`
    INSERT INTO medicines (
      user_id, name, dose, form, frequency_per_day, times_of_day,
      meal_timing, days_of_week, start_date, end_date, stock_quantity, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    demoUserId,
    'Omega-3 Fish Oil / Flaxseed Oil',
    '1000 mg',
    'capsule',
    1,
    JSON.stringify(['13:00']),
    'after_food',
    'everyday',
    '2026-01-01',
    '2026-12-31',
    45,
    'Heart and lipid profile support'
  ]);

  // Care checklists
  db.run(`
    INSERT INTO care_checklists (user_id, condition_name, title, scheduled_time, frequency, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [demoUserId, 'diabetes', 'Fasting Blood Sugar Check', '07:30', 'daily', 1]);

  db.run(`
    INSERT INTO care_checklists (user_id, condition_name, title, scheduled_time, frequency, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [demoUserId, 'hypertension', 'Morning Blood Pressure Check', '08:15', 'daily', 1]);

  db.run(`
    INSERT INTO care_checklists (user_id, condition_name, title, scheduled_time, frequency, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [demoUserId, 'diabetes', 'Evening Foot Inspection', '21:30', 'daily', 1]);

  // Insert some vitals for Alex
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10);
  const threeDaysAgo = new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10);

  // Blood Pressure entries
  db.run(`INSERT INTO vitals (user_id, type, value_primary, value_secondary, unit, recorded_at, notes, status_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [demoUserId, 'blood_pressure', 124, 82, 'mmHg', `${today} 08:20:00`, 'Morning check', 'normal']);
  db.run(`INSERT INTO vitals (user_id, type, value_primary, value_secondary, unit, recorded_at, notes, status_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [demoUserId, 'blood_pressure', 128, 84, 'mmHg', `${yesterday} 08:15:00`, 'Morning check', 'normal']);
  db.run(`INSERT INTO vitals (user_id, type, value_primary, value_secondary, unit, recorded_at, notes, status_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [demoUserId, 'blood_pressure', 132, 86, 'mmHg', `${twoDaysAgo} 08:30:00`, 'Post walk check', 'elevated']);
  db.run(`INSERT INTO vitals (user_id, type, value_primary, value_secondary, unit, recorded_at, notes, status_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [demoUserId, 'blood_pressure', 126, 82, 'mmHg', `${threeDaysAgo} 08:10:00`, 'Resting', 'normal']);

  // Blood Sugar entries
  db.run(`INSERT INTO vitals (user_id, type, value_primary, value_secondary, unit, recorded_at, notes, status_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [demoUserId, 'blood_sugar', 108, null, 'mg/dL', `${today} 07:45:00`, 'Fasting', 'normal']);
  db.run(`INSERT INTO vitals (user_id, type, value_primary, value_secondary, unit, recorded_at, notes, status_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [demoUserId, 'blood_sugar', 114, null, 'mg/dL', `${yesterday} 07:40:00`, 'Fasting', 'normal']);
  db.run(`INSERT INTO vitals (user_id, type, value_primary, value_secondary, unit, recorded_at, notes, status_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [demoUserId, 'blood_sugar', 142, null, 'mg/dL', `${twoDaysAgo} 21:00:00`, '2h Post dinner', 'normal']);

  // Weight entries
  db.run(`INSERT INTO vitals (user_id, type, value_primary, value_secondary, unit, recorded_at, notes, status_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [demoUserId, 'weight', 78.5, null, 'kg', `${today} 07:15:00`, 'Morning fasted weight', 'normal']);
  db.run(`INSERT INTO vitals (user_id, type, value_primary, value_secondary, unit, recorded_at, notes, status_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [demoUserId, 'weight', 79.1, null, 'kg', `${threeDaysAgo} 07:15:00`, 'Morning fasted weight', 'normal']);

  // Heart Rate entries
  db.run(`INSERT INTO vitals (user_id, type, value_primary, value_secondary, unit, recorded_at, notes, status_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [demoUserId, 'heart_rate', 72, null, 'bpm', `${today} 08:20:00`, 'Resting pulse', 'normal']);

  // Pre-seed a few intake logs for today so progress rings & streaks show active data
  const medRes = db.exec(`SELECT id, name FROM medicines WHERE user_id = ${demoUserId}`);
  if (medRes.length > 0 && medRes[0].values.length > 0) {
    const med1Id = medRes[0].values[0][0] as number;
    const med1Name = medRes[0].values[0][1] as string;
    db.run(`
      INSERT INTO intake_logs (user_id, medicine_id, item_name, scheduled_time, scheduled_date, status, taken_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [demoUserId, med1Id, med1Name, '08:00', today, 'taken', `${today} 08:05:00`]);
  }

  saveDb();
  console.log('✅ Demo account seeded successfully (demo@healthify.app / Demo@1234)');
}

// Utility helper to run SELECT queries easily and get array of plain objects
export function queryAll<T = any>(db: Database, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T = any>(db: Database, sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}
