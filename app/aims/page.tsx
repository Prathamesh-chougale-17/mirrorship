"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { KanbanProvider, KanbanBoard, KanbanHeader, KanbanCards, KanbanCard } from "@/components/ui/kibo-ui/kanban";
import { Plus, Target, Clock, AlertCircle, CheckCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import type { DragEndEvent } from "@dnd-kit/core";

interface KanbanNote {
  id: string;
  title: string;
  content: string;
  column: string;
  position: number;
  priority: "low" | "medium" | "high";
  tags: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

const columns = [
  { id: "todo", name: "To Do" },
  { id: "in-progress", name: "In Progress" },
  { id: "done", name: "Done" }
];

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", 
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const priorityIcons = {
  low: CheckCircle,
  medium: Clock,
  high: AlertCircle
};

export default function NotesPage() {
  const { data: session, isPending } = useSession();
  const [notes, setNotes] = useState<KanbanNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedNote, setSelectedNote] = useState<KanbanNote | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchNotes();
    }
  }, [session?.user]);

  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/kanban");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch notes");
      }
      
      setNotes(data.notes || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPriority("medium");
    setDueDate("");
    setIsEditing(false);
    setSelectedNote(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (note: KanbanNote) => {
    setTitle(note.title);
    setContent(note.content);
    setPriority(note.priority);
    setDueDate(note.dueDate || "");
    setSelectedNote(note);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        priority,
        column: selectedNote?.column || "todo",
        dueDate: dueDate || undefined,
      };

      let response;
      if (isEditing && selectedNote) {
        response = await fetch("/api/kanban", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedNote.id, ...payload }),
        });
      } else {
        response = await fetch("/api/kanban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save note");
      }

      toast.success(isEditing ? "Note updated!" : "Note created!");
      setIsDialogOpen(false);
      resetForm();
      fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save note");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    // open confirmation dialog instead — this function will be used by the confirm flow
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/kanban?id=${noteToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete note");
      }

      toast.success("Note deleted!");
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete note");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const activeNote = notes.find(note => note.id === active.id);
    const overNote = notes.find(note => note.id === over.id);
    
    if (!activeNote) return;

    // Determine the new column
    const newColumn = overNote?.column || 
      columns.find(col => col.id === over.id)?.id || 
      activeNote.column;

    // Create optimistic update
    const updatedNotes = notes.map(note => {
      if (note.id === activeNote.id) {
        return { ...note, column: newColumn };
      }
      return note;
    });

    setNotes(updatedNotes);

    // Send update to server
    try {
      const response = await fetch("/api/kanban", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: updatedNotes.map((note, index) => ({
            id: note.id,
            column: note.column,
            position: index
          }))
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update note positions");
      }
    } catch (error) {
      console.error("Error updating positions:", error);
      toast.error("Failed to update note position");
      // Revert optimistic update
      fetchNotes();
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>

        {/* Kanban Board Skeleton */}
        <div className="h-[calc(100vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {columns.map((column) => (
              <Card key={column.id} className="flex flex-col h-full">
                <CardHeader className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-8 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <Skeleton className="h-5 w-32" />
                          <div className="flex items-center gap-1 ml-2">
                            <Skeleton className="h-6 w-6" />
                            <Skeleton className="h-6 w-6" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
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
            <CardDescription>Please sign in to access your notes</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Task Board
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize your thoughts and tasks with drag & drop
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Note" : "Create New Note"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Update your note details" : "Add a new task or note to your board"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Note title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Add details (optional)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isCreating} className="flex-1">
                  {isCreating ? "Saving..." : isEditing ? "Update" : "Create"}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="h-[calc(100vh-200px)]">
        <KanbanProvider 
          columns={columns} 
          data={notes.map(note => ({ ...note, name: note.title }))} 
          onDragEnd={handleDragEnd}
          className="h-full"
        >
          {(column) => (
            <KanbanBoard key={column.id} id={column.id} className="h-full">
              <KanbanHeader className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{column.name}</h3>
                  <Badge variant="secondary">
                    {notes.filter(note => note.column === column.id).length}
                  </Badge>
                </div>
              </KanbanHeader>
              <KanbanCards id={column.id} className="flex-1 overflow-auto">
                {(item) => {
                  // Find the original note by ID
                  const note = notes.find(n => n.id === item.id);
                  if (!note) return null;
                  
                  return (
                    <KanbanCard key={item.id} {...item}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm leading-tight">{note.title}</h4>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onPointerDown={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(note);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onPointerDown={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(note.id);
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {note.content && (
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {note.content}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${priorityColors[note.priority]}`}
                            >
                              {React.createElement(priorityIcons[note.priority], { 
                                className: "h-3 w-3 mr-1" 
                              })}
                              {note.priority}
                            </Badge>
                          </div>
                          
                          {note.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </KanbanCard>
                  );
                }}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
      
      {notes.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No notes yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first note to get started with organizing your tasks
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Note
          </Button>
        </div>
      )}
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setNoteToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}