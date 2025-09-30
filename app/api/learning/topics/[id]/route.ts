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
    const topic = await DatabaseService.getLearningTopicById(session.user.id, topicId);

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    return NextResponse.json({ topic });
  } catch (error) {
    console.error('Error fetching learning topic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning topic' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const updates = await request.json();

    await DatabaseService.updateLearningTopic(session.user.id, topicId, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating learning topic:', error);
    return NextResponse.json(
      { error: 'Failed to update learning topic' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    await DatabaseService.deleteLearningTopic(session.user.id, topicId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting learning topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete learning topic' },
      { status: 500 }
    );
  }
}
