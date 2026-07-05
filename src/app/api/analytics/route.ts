import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FEEDBACK_FILE_PATH = path.join(process.cwd(), 'content', 'feedback.json');

const getFeedbackData = (): any[] => {
  try {
    if (fs.existsSync(FEEDBACK_FILE_PATH)) {
      const data = fs.readFileSync(FEEDBACK_FILE_PATH, 'utf-8');
      return JSON.parse(data || '[]');
    }
  } catch (e) {}
  return [];
};

export async function GET() {
  const feedbacks = getFeedbackData();

  // Aggregate metrics
  const totalSubmissions = feedbacks.length;
  
  // Average rating
  const avgRating = totalSubmissions > 0
    ? parseFloat((feedbacks.reduce((sum, item) => sum + item.rating, 0) / totalSubmissions).toFixed(2))
    : 5.0;

  // Countries distribution
  const countryCounts: { [key: string]: number } = {};
  const uniquePilots = new Set<string>();

  feedbacks.forEach((fb) => {
    if (fb.country) {
      countryCounts[fb.country] = (countryCounts[fb.country] || 0) + 1;
    }
    if (fb.nickname) {
      uniquePilots.add(fb.nickname.toLowerCase());
    }
  });

  const countryDistribution = Object.keys(countryCounts).map((c) => ({
    country: c,
    count: countryCounts[c],
  }));

  // Play count (simulated active clicks, matches pilot size + feedback triggers)
  const simulatedPlayCount = Math.max(totalSubmissions, uniquePilots.size * 2 + 3);

  return NextResponse.json({
    totalVisitors: uniquePilots.size,
    playCount: simulatedPlayCount,
    avgRating,
    totalFeedbackCount: totalSubmissions,
    countryDistribution,
    recentFeedback: feedbacks.slice(-10).reverse(), // latest 10 submissions
  });
}
