import client from "./mongodb";
import { COLLECTIONS, DiaryEntry, KanbanNote, ActivityEntry, AISummary, UserPreferences, Project, ProjectNote } from "./models";
import { ObjectId } from "mongodb";

// Generic database operations
export class DatabaseService {
  static async getDb() {
    await client.connect();
    return client.db("mirrorship");
  }

  // Diary Entry operations
  static async createDiaryEntry(entry: Omit<DiaryEntry, "_id">) {
    const db = await this.getDb();
    const result = await db.collection<DiaryEntry>(COLLECTIONS.DIARY_ENTRIES).insertOne({
      ...entry,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result;
  }

  static async getDiaryEntries(userId: string, limit = 10, skip = 0) {
    const db = await this.getDb();
    const entries = await db
      .collection<DiaryEntry>(COLLECTIONS.DIARY_ENTRIES)
      .find({ userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return entries;
  }

  static async getDiaryEntryByDate(userId: string, date: string) {
    const db = await this.getDb();
    const entry = await db
      .collection<DiaryEntry>(COLLECTIONS.DIARY_ENTRIES)
      .findOne({ userId, date });
    return entry;
  }

  static async getDiaryEntriesByMonth(userId: string, month: string) {
    const db = await this.getDb();
    // Month format is YYYY-MM, we need to find all dates that start with this pattern
    const regex = new RegExp(`^${month}-`);
    const entries = await db
      .collection<DiaryEntry>(COLLECTIONS.DIARY_ENTRIES)
      .find({ 
        userId, 
        date: { $regex: regex }
      })
      .sort({ date: -1 })
      .toArray();
    return entries;
  }

  static async updateDiaryEntry(id: string, userId: string, updates: Partial<DiaryEntry>) {
    const db = await this.getDb();
    const result = await db
      .collection<DiaryEntry>(COLLECTIONS.DIARY_ENTRIES)
      .updateOne(
        { id, userId },
        { 
          $set: { 
            ...updates, 
            updatedAt: new Date() 
          } 
        }
      );
    return result;
  }

  static async deleteDiaryEntry(id: string, userId: string) {
    const db = await this.getDb();
    const result = await db
      .collection<DiaryEntry>(COLLECTIONS.DIARY_ENTRIES)
      .deleteOne({ id, userId });
    return result;
  }

  // Get diary data for heatmap (last 365 days)
  static async getDiaryHeatmapData(userId: string) {
    const db = await this.getDb();
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    
    const entries = await db
      .collection<DiaryEntry>(COLLECTIONS.DIARY_ENTRIES)
      .find({ 
        userId,
        date: { $gte: oneYearAgo.toISOString().split('T')[0] }
      })
      .project({
        date: 1,
        wordCount: 1,
        mood: 1
      })
      .sort({ date: 1 })
      .toArray();

    // Group entries by date and count them
    const heatmapData = entries.reduce((acc: { [key: string]: { count: number; wordCount: number; mood?: number } }, entry) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = { count: 0, wordCount: 0 };
      }
      acc[date].count += 1;
      acc[date].wordCount += entry.wordCount || 0;
      if (entry.mood) {
        acc[date].mood = entry.mood;
      }
      return acc;
    }, {});

    // Convert to array format expected by component
    return Object.entries(heatmapData).map(([date, data]) => ({
      date,
      count: data.count,
      wordCount: data.wordCount,
      mood: data.mood
    }));
  }

  // Daily Quote operations
  static async createDailyQuote(quote: { id: string; userId: string; date: string; quote: string; source?: string }) {
    const db = await this.getDb();
    const result = await db.collection(COLLECTIONS.DAILY_QUOTES).insertOne({
      ...quote,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result;
  }

  static async getDailyQuote(userId: string, date: string) {
    const db = await this.getDb();
    const quote = await db.collection(COLLECTIONS.DAILY_QUOTES).findOne({ userId, date });
    return quote;
  }

  // Helper: get latest N diary entries (excluding a specific date) for context
  static async getLatestDiaryEntriesForContext(userId: string, excludeDate: string, limit = 5) {
    const db = await this.getDb();
    const entries = await db
      .collection(COLLECTIONS.DIARY_ENTRIES)
      .find({ userId, date: { $ne: excludeDate } })
      .sort({ date: -1 })
      .limit(limit)
      .toArray();
    return entries;
  }

  // Kanban Note operations
  static async createKanbanNote(note: Omit<KanbanNote, "_id">) {
    const db = await this.getDb();
    const result = await db.collection<KanbanNote>(COLLECTIONS.KANBAN_NOTES).insertOne({
      ...note,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result;
  }

  static async getKanbanNotes(userId: string) {
    const db = await this.getDb();
    const notes = await db
      .collection<KanbanNote>(COLLECTIONS.KANBAN_NOTES)
      .find({ userId })
      .sort({ position: 1 })
      .toArray();
    return notes;
  }

  static async updateKanbanNote(id: string, userId: string, updates: Partial<KanbanNote>) {
    const db = await this.getDb();
    const result = await db
      .collection<KanbanNote>(COLLECTIONS.KANBAN_NOTES)
      .updateOne(
        { id, userId },
        { 
          $set: { 
            ...updates, 
            updatedAt: new Date() 
          } 
        }
      );
    return result;
  }

  static async updateKanbanNotePositions(userId: string, noteUpdates: Array<{ id: string; column: string; position: number }>) {
    const db = await this.getDb();
    const collection = db.collection<KanbanNote>(COLLECTIONS.KANBAN_NOTES);
    
    // Use bulk operations for better performance
    const operations = noteUpdates.map(({ id, column, position }) => ({
      updateOne: {
        filter: { id, userId },
        update: { 
          $set: { 
            column, 
            position, 
            updatedAt: new Date() 
          } 
        }
      }
    }));

    const result = await collection.bulkWrite(operations);
    return result;
  }

  static async deleteKanbanNote(id: string, userId: string) {
    const db = await this.getDb();
    const result = await db
      .collection<KanbanNote>(COLLECTIONS.KANBAN_NOTES)
      .deleteOne({ id, userId });
    return result;
  }

  // Activity Entry operations
  static async createActivityEntry(activity: Omit<ActivityEntry, "_id">) {
    const db = await this.getDb();
    const result = await db.collection<ActivityEntry>(COLLECTIONS.ACTIVITY_ENTRIES).insertOne({
      ...activity,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result;
  }

  static async getActivityEntries(userId: string, startDate?: string, endDate?: string) {
    const db = await this.getDb();
    const query: any = { userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const activities = await db
      .collection<ActivityEntry>(COLLECTIONS.ACTIVITY_ENTRIES)
      .find(query)
      .sort({ date: -1 })
      .toArray();
    return activities;
  }

  static async getActivitySummary(userId: string, days: number = 30) {
    const db = await this.getDb();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const activities = await db
      .collection<ActivityEntry>(COLLECTIONS.ACTIVITY_ENTRIES)
      .aggregate([
        { 
          $match: { 
            userId, 
            date: { $gte: startDateStr } 
          } 
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            totalValue: { $sum: "$value" },
            avgValue: { $avg: "$value" }
          }
        }
      ])
      .toArray();
    
    return activities;
  }

  // AI Summary operations
  static async createAISummary(summary: Omit<AISummary, "_id">) {
    const db = await this.getDb();
    const result = await db.collection<AISummary>(COLLECTIONS.AI_SUMMARIES).insertOne({
      ...summary,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result;
  }

  static async getAISummaries(userId: string, type?: "daily" | "weekly" | "monthly") {
    const db = await this.getDb();
    const query: any = { userId };
    if (type) query.type = type;

    const summaries = await db
      .collection<AISummary>(COLLECTIONS.AI_SUMMARIES)
      .find(query)
      .sort({ period: -1 })
      .toArray();
    return summaries;
  }

  static async getLatestAISummary(userId: string, type: "daily" | "weekly" | "monthly") {
    const db = await this.getDb();
    const summary = await db
      .collection<AISummary>(COLLECTIONS.AI_SUMMARIES)
      .findOne(
        { userId, type },
        { sort: { period: -1 } }
      );
    return summary;
  }

  // User Preferences operations
  static async getUserPreferences(userId: string) {
    const db = await this.getDb();
    const preferences = await db
      .collection<UserPreferences>(COLLECTIONS.USER_PREFERENCES)
      .findOne({ userId });
    return preferences;
  }

  static async createOrUpdateUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
    const db = await this.getDb();
    const result = await db
      .collection<UserPreferences>(COLLECTIONS.USER_PREFERENCES)
      .updateOne(
        { userId },
        { 
          $set: { 
            ...preferences,
            userId,
            updatedAt: new Date() 
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
    return result;
  }

  // Analytics and Statistics
  static async getDashboardStats(userId: string) {
    const db = await this.getDb();
    
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const [
      totalEntries,
      entriesThisMonth,
      todayEntry,
      totalNotes,
      recentActivities
    ] = await Promise.all([
      // Total diary entries
      db.collection<DiaryEntry>(COLLECTIONS.DIARY_ENTRIES).countDocuments({ userId }),
      
      // Entries this month
      db.collection<DiaryEntry>(COLLECTIONS.DIARY_ENTRIES).countDocuments({
        userId,
        date: { $gte: thirtyDaysAgo }
      }),
      
      // Today's entry
      db.collection<DiaryEntry>(COLLECTIONS.DIARY_ENTRIES).findOne({
        userId,
        date: today
      }),
      
      // Total kanban notes
      db.collection<KanbanNote>(COLLECTIONS.KANBAN_NOTES).countDocuments({ userId }),
      
      // Recent activities (last 7 days)
      db.collection<ActivityEntry>(COLLECTIONS.ACTIVITY_ENTRIES)
        .find({
          userId,
          date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
        })
        .sort({ date: -1 })
        .limit(10)
        .toArray()
    ]);

    return {
      totalEntries,
      entriesThisMonth,
      hasEntryToday: !!todayEntry,
      totalNotes,
      recentActivities: recentActivities.length
    };
  }

  static async getKanbanSummary(userId: string) {
    const db = await this.getDb();
    
    const [
      todoCount,
      inProgressCount,
      doneCount,
      totalCount
    ] = await Promise.all([
      db.collection<KanbanNote>(COLLECTIONS.KANBAN_NOTES).countDocuments({ 
        userId, 
        column: "todo" 
      }),
      db.collection<KanbanNote>(COLLECTIONS.KANBAN_NOTES).countDocuments({ 
        userId, 
        column: "in-progress" 
      }),
      db.collection<KanbanNote>(COLLECTIONS.KANBAN_NOTES).countDocuments({ 
        userId, 
        column: "done" 
      }),
      db.collection<KanbanNote>(COLLECTIONS.KANBAN_NOTES).countDocuments({ 
        userId 
      })
    ]);

    return {
      todo: todoCount,
      'in-progress': inProgressCount,
      done: doneCount,
      total: totalCount
    };
  }

  // Project operations
  static async createProject(project: Omit<Project, "_id">) {
    const db = await this.getDb();
    const result = await db.collection<Project>(COLLECTIONS.PROJECTS).insertOne({
      ...project,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result;
  }

  static async getProjects(userId: string) {
    const db = await this.getDb();
    const projects = await db
      .collection<Project>(COLLECTIONS.PROJECTS)
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    return projects;
  }

  static async getProjectById(id: string, userId: string) {
    const db = await this.getDb();
    const project = await db
      .collection<Project>(COLLECTIONS.PROJECTS)
      .findOne({ id, userId });
    return project;
  }

  static async updateProject(id: string, userId: string, updates: Partial<Project>) {
    const db = await this.getDb();
    const result = await db
      .collection<Project>(COLLECTIONS.PROJECTS)
      .updateOne(
        { id, userId },
        { 
          $set: { 
            ...updates, 
            updatedAt: new Date() 
          } 
        }
      );
    return result;
  }

  static async deleteProject(id: string, userId: string) {
    const db = await this.getDb();
    
    // Delete all project notes first
    await db.collection<ProjectNote>(COLLECTIONS.PROJECT_NOTES).deleteMany({ 
      projectId: id, 
      userId 
    });
    
    // Delete the project
    const result = await db
      .collection<Project>(COLLECTIONS.PROJECTS)
      .deleteOne({ id, userId });
    return result;
  }

  // Project Note operations
  static async createProjectNote(note: Omit<ProjectNote, "_id">) {
    const db = await this.getDb();
    const result = await db.collection<ProjectNote>(COLLECTIONS.PROJECT_NOTES).insertOne({
      ...note,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result;
  }

  static async getProjectNotes(userId: string, projectId: string) {
    const db = await this.getDb();
    const notes = await db
      .collection<ProjectNote>(COLLECTIONS.PROJECT_NOTES)
      .find({ userId, projectId })
      .sort({ createdAt: -1 })
      .toArray();
    return notes;
  }

  static async getProjectNoteById(id: string, userId: string) {
    const db = await this.getDb();
    const note = await db
      .collection<ProjectNote>(COLLECTIONS.PROJECT_NOTES)
      .findOne({ id, userId });
    return note;
  }

  static async updateProjectNote(id: string, userId: string, updates: Partial<ProjectNote>) {
    const db = await this.getDb();
    const result = await db
      .collection<ProjectNote>(COLLECTIONS.PROJECT_NOTES)
      .updateOne(
        { id, userId },
        { 
          $set: { 
            ...updates, 
            updatedAt: new Date() 
          } 
        }
      );
    return result;
  }

  static async deleteProjectNote(id: string, userId: string) {
    const db = await this.getDb();
    const result = await db
      .collection<ProjectNote>(COLLECTIONS.PROJECT_NOTES)
      .deleteOne({ id, userId });
    return result;
  }

  static async getProjectsWithNoteCounts(userId: string) {
    const db = await this.getDb();
    const projects = await db
      .collection<Project>(COLLECTIONS.PROJECTS)
      .aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: COLLECTIONS.PROJECT_NOTES,
            localField: "id",
            foreignField: "projectId",
            as: "notes"
          }
        },
        {
          $addFields: {
            noteCount: { $size: "$notes" }
          }
        },
        {
          $project: {
            notes: 0 // Remove the notes array from output
          }
        },
        { $sort: { createdAt: -1 } }
      ])
      .toArray();
    return projects;
  }
}