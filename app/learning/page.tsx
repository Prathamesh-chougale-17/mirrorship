"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen, Archive, Trash2, Edit2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface LearningTopic {
  id: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const Learning = () => {
  const router = useRouter();
  const [topics, setTopics] = useState<LearningTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: '#6366f1',
    icon: '📚',
    tags: ''
  });

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/learning/topics');
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }

    try {
      const response = await fetch('/api/learning/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          color: formData.color,
          icon: formData.icon,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      if (response.ok) {
        toast.success('Topic created successfully');
        setDialogOpen(false);
        setFormData({ title: '', description: '', color: '#6366f1', icon: '📚', tags: '' });
        fetchTopics();
      } else {
        toast.error('Failed to create topic');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      toast.error('Failed to create topic');
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic? This will also delete the associated graph.')) {
      return;
    }

    try {
      const response = await fetch(`/api/learning/topics/${topicId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Topic deleted successfully');
        fetchTopics();
      } else {
        toast.error('Failed to delete topic');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error('Failed to delete topic');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 min-h-[60vh]">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-48 mb-4" />
          <p className="text-sm text-muted-foreground mb-4">Loading topics...</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Learning Topics
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Organize your learning journey with visual knowledge graphs
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Topic
        </Button>
      </div>

      {topics.length === 0 ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="p-12 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-dashed border-2 border-indigo-200 dark:border-indigo-600 max-w-md">
            <FolderOpen className="w-16 h-16 mx-auto text-indigo-600 dark:text-indigo-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              No Topics Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first learning topic to start building knowledge graphs
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Topic
            </Button>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className="group hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              onClick={() => router.push(`/learning/${topic.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="text-4xl"
                      style={{ color: topic.color }}
                    >
                      {topic.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {topic.title}
                      </CardTitle>
                      {topic.description && (
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {topic.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {topic.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {topic.tags.length > 3 && (
                      <span className="text-xs px-2 py-1 text-gray-500 dark:text-gray-400">
                        +{topic.tags.length - 3}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTopic(topic.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">
              Create New Learning Topic
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Topic Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., React Fundamentals"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Brief description of what you'll learn"
                className="mt-1 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Icon (Emoji)
                </Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📚"
                  className="mt-1 text-2xl text-center"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="color" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color
                </Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="mt-1 h-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tags (comma separated)
              </Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="javascript, frontend, web"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTopic}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Create Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Learning;