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
    <div className="w-full h-[76.5vh] flex flex-col">
      <GraphicalNotes topicId={topicId} />
    </div>
  );
};

export default LearningGraphPage;
