"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Editor, JSONContent } from "@/components/ui/kibo-ui/editor";
import {
  EditorBubbleMenu,
  EditorCharacterCount,
  EditorClearFormatting,
  EditorFloatingMenu,
  EditorFormatBold,
  EditorFormatCode,
  EditorFormatItalic,
  EditorFormatStrike,
  EditorFormatSubscript,
  EditorFormatSuperscript,
  EditorFormatUnderline,
  EditorLinkSelector,
  EditorNodeBulletList,
  EditorNodeCode,
  EditorNodeHeading1,
  EditorNodeHeading2,
  EditorNodeHeading3,
  EditorNodeOrderedList,
  EditorNodeQuote,
  EditorNodeTable,
  EditorNodeTaskList,
  EditorNodeText,
  EditorProvider,
  EditorSelector,
  EditorTableColumnAfter,
  EditorTableColumnBefore,
  EditorTableColumnDelete,
  EditorTableColumnMenu,
  EditorTableDelete,
  EditorTableFix,
  EditorTableGlobalMenu,
  EditorTableHeaderColumnToggle,
  EditorTableHeaderRowToggle,
  EditorTableMenu,
  EditorTableMergeCells,
  EditorTableRowAfter,
  EditorTableRowBefore,
  EditorTableRowDelete,
  EditorTableRowMenu,
  EditorTableSplitCell,
} from "@/components/ui/kibo-ui/editor";
import { Calendar, Save, Sparkles, BookOpen, Heart } from "lucide-react";
import { toast } from "sonner";

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: number;
  tags: string[];
  aiSummary?: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

const moodEmojis = {
  1: "😔",
  2: "😕", 
  3: "😐",
  4: "😊",
  5: "😄"
};

const moodLabels = {
  1: "Very Sad",
  2: "Sad",
  3: "Neutral", 
  4: "Happy",
  5: "Very Happy"
};

export default function DiaryPage() {
  const { data: session, isPending } = useSession();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<JSONContent | string>("");
  const [selectedMood, setSelectedMood] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Load entry for selected date
  useEffect(() => {
    if (session?.user && selectedDate) {
      loadEntry(selectedDate);
    }
  }, [session?.user, selectedDate]);

  const loadEntry = async (date: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/diary?date=${date}`);
      const data = await response.json();
      
      if (data.entry) {
        setEntry(data.entry);
        setTitle(data.entry.title);
        
        // Parse content if it's a JSON string, otherwise use as-is
        let parsedContent = data.entry.content;
        if (typeof data.entry.content === 'string') {
          try {
            // Try to parse as JSON (for content from rich text editor)
            parsedContent = JSON.parse(data.entry.content);
          } catch {
            // If parsing fails, treat as plain text
            parsedContent = data.entry.content;
          }
        }
        setContent(parsedContent);
        setSelectedMood(data.entry.mood);
      } else {
        // No entry for this date
        setEntry(null);
        setTitle("");
        setContent("");
        setSelectedMood(undefined);
      }
    } catch (error) {
      console.error("Error loading diary entry:", error);
      toast.error("Failed to load diary entry");
    } finally {
      setIsLoading(false);
    }
  };

  const saveEntry = async () => {
    if (!session?.user || !title.trim() || isContentEmpty()) {
      toast.error("Please fill in both title and content");
      return;
    }

    setIsSaving(true);
    try {
      const contentToSave = typeof content === 'string' ? content.trim() : JSON.stringify(content);
      const payload = {
        title: title.trim(),
        content: contentToSave,
        date: selectedDate,
        mood: selectedMood,
      };

      let response;
      if (entry) {
        // Update existing entry
        response = await fetch("/api/diary", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: entry.id, ...payload }),
        });
      } else {
        // Create new entry
        response = await fetch("/api/diary", {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save entry");
      }

      toast.success(entry ? "Entry updated!" : "Entry saved!");
      
      // Reload the entry to get AI summary and other processed data
      await loadEntry(selectedDate);
    } catch (error) {
      console.error("Error saving diary entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  };

  const getTodayDateFormatted = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

  const isContentEmpty = () => {
    if (typeof content === 'string') {
      return !content.trim();
    }
    // For JSONContent, check if it's empty or only contains empty paragraphs
    if (!content || !content.content || content.content.length === 0) {
      return true;
    }
    // Check if all content is just empty text nodes
    return content.content.every(node => {
      if (!node.content || node.content.length === 0) {
        return true;
      }
      // Check if it's just empty text
      if (node.content.length === 1 && node.content[0].type === 'text') {
        return !node.content[0].text || !node.content[0].text.trim();
      }
      // For other node types, consider them as non-empty
      return false;
    });
  };

  const extractTextFromContent = (content: JSONContent | string): string => {
    if (typeof content === 'string') {
      return content;
    }
    if (!content || !content.content) {
      return '';
    }
    
    let text = '';
    const traverse = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.type === 'text' && node.text) {
          text += node.text + ' ';
        } else if (node.content) {
          traverse(node.content);
        }
      });
    };
    
    traverse(content.content);
    return text.trim();
  };

  if (isPending || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-5 w-80" />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-1" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Input Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>

            {/* Rich Text Editor Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-96 w-full rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Mood Selector Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-40" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Summary Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-28" />
                </div>
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>

            {/* Tips Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access your diary
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              My Diary
            </h1>
            <p className="text-muted-foreground mt-1">
              {selectedDate === new Date().toISOString().split('T')[0] 
                ? getTodayDateFormatted()
                : new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  })
              }
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Date Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
            
            {/* Save Button */}
            <Button 
              onClick={saveEntry} 
              disabled={isSaving || !title.trim() || isContentEmpty()}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : entry ? "Update" : "Save"}
            </Button>
          </div>
        </div>
        
        {entry && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Words: {entry.wordCount}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>
              Last updated: {new Date(entry.updatedAt).toLocaleString()}
            </span>
            {entry.mood && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>Mood: {moodEmojis[entry.mood as keyof typeof moodEmojis]} {moodLabels[entry.mood as keyof typeof moodLabels]}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entry Title</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="What's on your mind today?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-medium"
              />
            </CardContent>
          </Card>

          {/* Rich Text Editor - Full Width, Rich Features */}
          <div className="w-full">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Thoughts</CardTitle>
                <CardDescription>
                  Write freely about your day, feelings, and experiences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <EditorProvider
                    className="h-full w-full overflow-y-auto rounded-lg border bg-background p-4 min-h-96"
                    content={content}
                    onUpdate={({ editor }) => {
                      setContent(editor.getJSON());
                    }}
                    placeholder="Start writing your diary entry..."
                  >
                    <EditorFloatingMenu>
                      <EditorNodeHeading1 hideName />
                      <EditorNodeBulletList hideName />
                      <EditorNodeQuote hideName />
                      <EditorNodeCode hideName />
                      <EditorNodeTable hideName />
                    </EditorFloatingMenu>
                    <EditorBubbleMenu>
                      <EditorSelector title="Text">
                        <EditorNodeText />
                        <EditorNodeHeading1 />
                        <EditorNodeHeading2 />
                        <EditorNodeHeading3 />
                        <EditorNodeBulletList />
                        <EditorNodeOrderedList />
                        <EditorNodeTaskList />
                        <EditorNodeQuote />
                        <EditorNodeCode />
                      </EditorSelector>
                      <EditorSelector title="Format">
                        <EditorFormatBold />
                        <EditorFormatItalic />
                        <EditorFormatUnderline />
                        <EditorFormatStrike />
                        <EditorFormatCode />
                        <EditorFormatSuperscript />
                        <EditorFormatSubscript />
                      </EditorSelector>
                      <EditorLinkSelector />
                      <EditorClearFormatting />
                    </EditorBubbleMenu>
                    <EditorTableMenu>
                      <EditorTableColumnMenu>
                        <EditorTableColumnBefore />
                        <EditorTableColumnAfter />
                        <EditorTableColumnDelete />
                      </EditorTableColumnMenu>
                      <EditorTableRowMenu>
                        <EditorTableRowBefore />
                        <EditorTableRowAfter />
                        <EditorTableRowDelete />
                      </EditorTableRowMenu>
                      <EditorTableGlobalMenu>
                        <EditorTableHeaderColumnToggle />
                        <EditorTableHeaderRowToggle />
                        <EditorTableDelete />
                        <EditorTableMergeCells />
                        <EditorTableSplitCell />
                        <EditorTableFix />
                      </EditorTableGlobalMenu>
                    </EditorTableMenu>
                    <EditorCharacterCount.Words>Words: </EditorCharacterCount.Words>
                  </EditorProvider>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mood Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5" />
                How are you feeling?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(moodEmojis).map(([value, emoji]) => (
                  <Button
                    key={value}
                    variant={selectedMood === parseInt(value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMood(parseInt(value))}
                    className="flex flex-col gap-1 h-16"
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="text-xs">
                      {moodLabels[parseInt(value) as keyof typeof moodLabels]}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Summary */}
          {entry?.aiSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI Insights
                </CardTitle>
                <CardDescription>
                  Generated insights from your entry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {entry.aiSummary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {entry?.tags && entry.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 Writing Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Be honest about your feelings</p>
              <p>• Include specific details about your day</p>
              <p>• Reflect on what you learned</p>
              <p>• Note things you're grateful for</p>
              <p>• Set intentions for tomorrow</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}