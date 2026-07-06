import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

// Check if Postgres environment is configured
const isDbConfigured = () => {
  return !!process.env.POSTGRES_URL || !!process.env.POSTGRES_PRISMA_URL;
};

// Fallback JSON databases for local development if Postgres is not configured yet
const USERS_JSON_PATH = path.join(process.cwd(), 'content', 'users_fallback.json');
const FEEDBACK_JSON_PATH = path.join(process.cwd(), 'content', 'feedback_fallback.json');

const readLocalFile = (filePath: string): any[] => {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
  } catch {
    return [];
  }
};

const writeLocalFile = (filePath: string, data: any[]) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write local database fallback:', e);
  }
};

// Queries user by their unique username
export async function queryUserByUsername(username: string) {
  if (isDbConfigured()) {
    try {
      const { rows } = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`;
      return rows[0] || null;
    } catch (e) {
      console.warn('Postgres query failed, attempting to read from fallback users database.', e);
      return null;
    }
  } else {
    const users = readLocalFile(USERS_JSON_PATH);
    return users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
  }
}

// Inserts a new user record
export async function createUser(username: string, passwordHash: string) {
  if (isDbConfigured()) {
    const { rows } = await sql`
      INSERT INTO users (username, password_hash)
      VALUES (${username}, ${passwordHash})
      RETURNING id, username
    `;
    return rows[0];
  } else {
    const users = readLocalFile(USERS_JSON_PATH);
    const newId = users.length + 1;
    const newUser = { id: newId, username, password_hash: passwordHash, created_at: new Date().toISOString() };
    users.push(newUser);
    writeLocalFile(USERS_JSON_PATH, users);
    return { id: newUser.id, username: newUser.username };
  }
}

// Inserts a feedback submission
export async function insertFeedback(
  userId: number | null,
  nickname: string,
  message: string,
  rating: number,
  suggestions = '',
  bugReport = '',
  favoriteFeature = ''
) {
  if (isDbConfigured()) {
    await sql`
      INSERT INTO feedback (user_id, nickname, message, rating, suggestions, bug_report, favorite_feature)
      VALUES (${userId}, ${nickname}, ${message}, ${rating}, ${suggestions}, ${bugReport}, ${favoriteFeature})
    `;
  } else {
    const feedback = readLocalFile(FEEDBACK_JSON_PATH);
    const newFeedback = {
      id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      nickname,
      message,
      rating,
      suggestions,
      bugReport,
      favoriteFeature,
      timestamp: new Date().toISOString()
    };
    feedback.push(newFeedback);
    writeLocalFile(FEEDBACK_JSON_PATH, feedback);
  }
}

// Retrieves all feedback items
export async function getAllFeedback() {
  if (isDbConfigured()) {
    try {
      const { rows } = await sql`
        SELECT f.id, f.nickname, f.message, f.rating, f.suggestions, f.bug_report as "bugReport", f.favorite_feature as "favoriteFeature", f.created_at as "timestamp", u.username
        FROM feedback f
        LEFT JOIN users u ON f.user_id = u.id
        ORDER BY f.created_at DESC
      `;
      return rows;
    } catch (e) {
      console.warn('Postgres query failed, returning fallback reviews data.', e);
      return [];
    }
  } else {
    const feedback = readLocalFile(FEEDBACK_JSON_PATH);
    const users = readLocalFile(USERS_JSON_PATH);
    
    // Map user relationship
    return feedback.map((fb) => {
      const u = users.find((usr) => usr.id === fb.user_id);
      return {
        id: fb.id,
        nickname: u ? u.username : fb.nickname,
        message: fb.message,
        rating: fb.rating,
        suggestions: fb.suggestions,
        bugReport: fb.bugReport,
        favoriteFeature: fb.favoriteFeature,
        timestamp: fb.timestamp,
        username: u ? u.username : fb.nickname
      };
    }).reverse();
  }
}
