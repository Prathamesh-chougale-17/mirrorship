import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DatabaseService } from '@/lib/mongodb';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: topicId } = (await params) as { id: string };
    const graph = await DatabaseService.getLearningGraph(session.user.id, topicId);
    const viewSettings = await DatabaseService.getLearningGraphSettings(session.user.id, topicId);

    return NextResponse.json({ graph, viewSettings });
  } catch (error) {
    console.error('Error fetching learning graph:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning graph' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { id: topicId } = (await params) as { id: string };
    const body = await request.json();
    const { rootNode, viewSettings } = body || {};

    if (!rootNode) {
      return NextResponse.json({ error: 'Root node is required' }, { status: 400 });
    }

    await DatabaseService.saveLearningGraph(session.user.id, topicId, rootNode, viewSettings);

    if (viewSettings) {
      await DatabaseService.saveLearningGraphSettings(session.user.id, topicId, viewSettings);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving learning graph:', error);
    return NextResponse.json(
      { error: 'Failed to save learning graph' },
      { status: 500 }
    );
  }
}
