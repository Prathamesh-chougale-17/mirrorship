import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { DiaryEntry, ActivityEntry } from "./models";

export class AIService {
  private static model = google("gemini-1.5-flash");

  /**
   * Generate a daily summary from diary entry and activities
   */
  static async generateDailySummary(
    diaryEntry: DiaryEntry,
    activities: ActivityEntry[] = []
  ): Promise<{ summary: string; insights: string[]; mood?: { analysis: string; score: number } }> {
    try {
      const prompt = this.buildDailySummaryPrompt(diaryEntry, activities);
      
      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7
      });

      // Parse the structured response
      return this.parseDailySummaryResponse(text);
    } catch (error) {
      console.error("Error generating daily summary:", error);
      throw new Error("Failed to generate AI summary");
    }
  }

  /**
   * Generate weekly insights from multiple diary entries
   */
  static async generateWeeklySummary(
    diaryEntries: DiaryEntry[],
    activities: ActivityEntry[] = []
  ): Promise<{ summary: string; insights: string[]; trends: string[] }> {
    try {
      const prompt = this.buildWeeklySummaryPrompt(diaryEntries, activities);
      
      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.6,
      });

      return this.parseWeeklySummaryResponse(text);
    } catch (error) {
      console.error("Error generating weekly summary:", error);
      throw new Error("Failed to generate weekly summary");
    }
  }

  /**
   * Analyze mood from diary content
   */
  static async analyzeMood(content: string): Promise<{ score: number; analysis: string }> {
    try {
      const prompt = `
Analyze the emotional tone and mood of this diary entry and provide:
1. A mood score from 1-5 (1=very negative, 2=negative, 3=neutral, 4=positive, 5=very positive)
2. A brief analysis of the emotional state

Diary content:
${content}

Respond in JSON format:
{
  "score": <number>,
  "analysis": "<brief emotional analysis>"
}`;

      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.3,
      });

      const parsed = JSON.parse(text);
      return {
        score: Math.max(1, Math.min(5, parsed.score)),
        analysis: parsed.analysis
      };
    } catch (error) {
      console.error("Error analyzing mood:", error);
      return {
        score: 3,
        analysis: "Unable to analyze mood at this time."
      };
    }
  }

  /**
   * Generate tags for diary entry
   */
  static async generateTags(content: string): Promise<string[]> {
    try {
      const prompt = `
Extract 3-5 relevant tags from this diary entry. Tags should be single words or short phrases that capture key themes, activities, emotions, or topics.

Diary content:
${content}

Respond with a JSON array of strings:
["tag1", "tag2", "tag3"]`;

      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.4,
      });

      const tags = JSON.parse(text);
      return Array.isArray(tags) ? tags.slice(0, 5) : [];
    } catch (error) {
      console.error("Error generating tags:", error);
      return [];
    }
  }

  private static buildDailySummaryPrompt(diaryEntry: DiaryEntry, activities: ActivityEntry[]): string {
    const activitySummary = activities.length > 0 
      ? `\n\nActivities tracked today:\n${activities.map(a => `- ${a.title}: ${a.description || ''}`).join('\n')}`
      : '';

    return `
Please analyze this daily diary entry and provide insights in the following JSON format:

{
  "summary": "<2-3 sentence summary of the day>",
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "mood": {
    "analysis": "<brief mood analysis>",
    "score": <1-5 mood score>
  }
}

Diary Entry:
Title: ${diaryEntry.title}
Content: ${diaryEntry.content}
${activitySummary}

Focus on:
1. Key events and experiences
2. Emotional patterns and mood
3. Personal growth observations
4. Notable achievements or challenges
`;
  }

  private static buildWeeklySummaryPrompt(diaryEntries: DiaryEntry[], activities: ActivityEntry[]): string {
    const entriesSummary = diaryEntries.map(entry => 
      `${entry.date}: ${entry.title} - ${entry.content.substring(0, 200)}...`
    ).join('\n\n');

    const activitySummary = activities.length > 0
      ? `\n\nWeek's activities:\n${activities.map(a => `${a.date} - ${a.title}`).join('\n')}`
      : '';

    return `
Analyze these diary entries from the past week and provide insights in JSON format:

{
  "summary": "<comprehensive weekly summary>",
  "insights": ["<key insight 1>", "<key insight 2>", "<key insight 3>"],
  "trends": ["<trend 1>", "<trend 2>"]
}

Diary Entries:
${entriesSummary}
${activitySummary}

Focus on:
1. Weekly patterns and themes
2. Emotional trends and mood changes
3. Personal growth and learning
4. Recurring challenges or successes
5. Overall life balance and satisfaction
`;
  }

  private static parseDailySummaryResponse(text: string) {
    try {
      const parsed = JSON.parse(text);
      return {
        summary: parsed.summary || "No summary available",
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        mood: parsed.mood ? {
          analysis: parsed.mood.analysis || "",
          score: Math.max(1, Math.min(5, parsed.mood.score || 3))
        } : undefined
      };
    } catch (error) {
      return {
        summary: "Unable to generate summary at this time.",
        insights: [],
        mood: undefined
      };
    }
  }

  private static parseWeeklySummaryResponse(text: string) {
    try {
      const parsed = JSON.parse(text);
      return {
        summary: parsed.summary || "No summary available",
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        trends: Array.isArray(parsed.trends) ? parsed.trends : []
      };
    } catch (error) {
      return {
        summary: "Unable to generate weekly summary at this time.",
        insights: [],
        trends: []
      };
    }
  }
}