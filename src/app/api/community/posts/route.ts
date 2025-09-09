import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const supabase = createServiceClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'hot';
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get current user for vote status
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    let currentUserId = null;
    
    if (user?.email) {
      const { data: userData } = await supabase
        .from('User')
        .select('UserID')
        .eq('Email', user.email)
        .single();
      currentUserId = userData?.UserID;
    }

    let query = supabase
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
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'new':
        query = query.order('created_at', { ascending: false });
        break;
      case 'top':
        query = query.order('score', { ascending: false });
        break;
      case 'hot':
      default:
        // Hot algorithm: pinned first, then trending, then by score
        query = query.order('is_pinned', { ascending: false })
                    .order('is_trending', { ascending: false })
                    .order('score', { ascending: false })
                    .order('created_at', { ascending: false });
        break;
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    // Add user vote status and bookmark status to each post
    if (currentUserId && posts) {
      const postIds = posts.map(post => post.id);
      
      // Get user votes for all posts
      const { data: votes } = await supabase
        .from('community_votes')
        .select('post_id, vote_type')
        .eq('user_id', currentUserId)
        .in('post_id', postIds);

      // Get user bookmarks for all posts
      const { data: bookmarks } = await supabase
        .from('community_bookmarks')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds);

      // Add vote and bookmark status to posts
      posts.forEach(post => {
        const userVote = votes?.find(vote => vote.post_id === post.id);
        const isBookmarked = bookmarks?.some(bookmark => bookmark.post_id === post.id);
        
        post.userVote = userVote?.vote_type || null;
        post.isBookmarked = !!isBookmarked;
      });
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error in posts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, category, tags, location } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Get user ID from User table
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
      .insert({
        title,
        content,
        author_id: userData.UserID,
        category: category || 'general',
        tags: tags || [],
        location: location || null
      })
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
      console.error('Error creating post:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error in create post API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
