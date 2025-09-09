import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const supabase = createServiceClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const resolvedParams = await params;

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('UserID')
      .eq('Email', user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: comment, error } = await supabase
      .from('community_comments')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .eq('author_id', userData.UserID) // Ensure user can only update their own comments
      .select(`
        *,
        author:User!community_comments_author_id_fkey(
          UserID,
          FirstName,
          LastName,
          Picture
        )
      `)
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error in update comment API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('UserID')
      .eq('Email', user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('community_comments')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('author_id', userData.UserID); // Ensure user can only delete their own comments

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error in delete comment API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
