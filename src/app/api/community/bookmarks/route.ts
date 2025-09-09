import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const supabase = createServiceClient();

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('UserID')
      .eq('Email', user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if bookmark already exists
    const { data: existingBookmark, error: bookmarkCheckError } = await supabase
      .from('community_bookmarks')
      .select('*')
      .eq('user_id', userData.UserID)
      .eq('post_id', postId)
      .single();

    if (bookmarkCheckError && bookmarkCheckError.code !== 'PGRST116') {
      console.error('Error checking existing bookmark:', bookmarkCheckError);
      return NextResponse.json({ error: 'Failed to check existing bookmark' }, { status: 500 });
    }

    if (existingBookmark) {
      // Bookmark exists, remove it
      const { error: deleteError } = await supabase
        .from('community_bookmarks')
        .delete()
        .eq('id', existingBookmark.id);

      if (deleteError) {
        console.error('Error removing bookmark:', deleteError);
        return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Bookmark removed',
        isBookmarked: false,
        action: 'removed'
      });
    } else {
      // Bookmark doesn't exist, create it
      const { error: insertError } = await supabase
        .from('community_bookmarks')
        .insert({
          user_id: userData.UserID,
          post_id: postId
        });

      if (insertError) {
        console.error('Error creating bookmark:', insertError);
        return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Bookmark created',
        isBookmarked: true,
        action: 'created'
      });
    }
  } catch (error) {
    console.error('Error in bookmark API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('UserID')
      .eq('Email', user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (postId) {
      // Check if specific post is bookmarked
      const { data: bookmark, error } = await supabase
        .from('community_bookmarks')
        .select('*')
        .eq('user_id', userData.UserID)
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching bookmark:', error);
        return NextResponse.json({ error: 'Failed to fetch bookmark' }, { status: 500 });
      }

      return NextResponse.json({ 
        isBookmarked: !!bookmark 
      });
    } else {
      // Get all user's bookmarks
      const { data: bookmarks, error } = await supabase
        .from('community_bookmarks')
        .select(`
          *,
          post:community_posts(
            *,
            author:User!community_posts_author_id_fkey(
              UserID,
              FirstName,
              LastName,
              Picture
            )
          )
        `)
        .eq('user_id', userData.UserID)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookmarks:', error);
        return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
      }

      return NextResponse.json({ bookmarks });
    }
  } catch (error) {
    console.error('Error in get bookmarks API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
