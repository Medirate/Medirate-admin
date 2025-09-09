import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const supabase = createServiceClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { data: post, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:User!community_posts_author_id_fkey(
          UserID,
          FirstName,
          LastName,
          Picture
        )
      `)
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error in get post API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { title, content, category, tags, location } = body;

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

    const { data: post, error } = await supabase
      .from('community_posts')
      .update({
        title,
        content,
        category,
        tags,
        location,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .eq('author_id', userData.UserID) // Ensure user can only update their own posts
      .select(`
        *,
        author:User!community_posts_author_id_fkey(
          UserID,
          FirstName,
          LastName,
          Picture
        )
      `)
      .single();

    if (error) {
      console.error('Error updating post:', error);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error in update post API:', error);
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
      .from('community_posts')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('author_id', userData.UserID); // Ensure user can only delete their own posts

    if (error) {
      console.error('Error deleting post:', error);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error in delete post API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
