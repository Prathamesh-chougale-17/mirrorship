"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GraphicalNotes from '@/components/learning-graph';
import { toast } from 'sonner';

interface LearningTopic {
  id: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
}

const LearningGraphPage = () => {
  const params = useParams();
  const router = useRouter();
  const topicId = params.id as string;
  
  const [topic, setTopic] = useState<LearningTopic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopic();
  }, [topicId]);

  const fetchTopic = async () => {
    try {
      const response = await fetch(`/api/learning/topics/${topicId}`);
      const data = await response.json();
      
      if (response.ok) {
        setTopic(data.topic);
      } else {
        toast.error('Topic not found');
        router.push('/learning');
      }
    } catch (error) {
      console.error('Error fetching topic:', error);
      toast.error('Failed to load topic');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading graph...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return null;
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="absolute top-4 left-4 z-20 flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/learning')}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Topics
        </Button>
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{topic.icon}</span>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {topic.title}
            </h2>
          </div>
          {topic.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {topic.description}
            </p>
          )}
        </div>
      </div>

      <GraphicalNotes topicId={topicId} />
    </div>
  );
};

export default LearningGraphPage;
