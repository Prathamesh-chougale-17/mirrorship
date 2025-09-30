import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DatabaseService } from '@/lib/mongodb';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const topics = await DatabaseService.getLearningTopics(
      session.user.id,
      includeArchived
    );

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Error fetching learning topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning topics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, color, icon, tags } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const topic = await DatabaseService.createLearningTopic(session.user.id, {
      title,
      description,
      color,
      icon,
      tags: tags || []
    });

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    console.error('Error creating learning topic:', error);
    return NextResponse.json(
      { error: 'Failed to create learning topic' },
      { status: 500 }
    );
  }
}
