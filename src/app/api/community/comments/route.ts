import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const supabase = createServiceClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

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

    const { data: comments, error } = await supabase
      .from('community_comments')
      .select(`
        *,
        author:User!community_comments_author_id_fkey(
          UserID,
          FirstName,
          LastName,
          Picture
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    // Add user vote status to each comment
    if (currentUserId && comments) {
      const commentIds = comments.map(comment => comment.id);
      
      // Get user votes for all comments
      const { data: votes } = await supabase
        .from('community_votes')
        .select('comment_id, vote_type')
        .eq('user_id', currentUserId)
        .in('comment_id', commentIds);

      // Add vote status to comments
      comments.forEach(comment => {
        const userVote = votes?.find(vote => vote.comment_id === comment.id);
        comment.userVote = userVote?.vote_type || null;
      });
    }

    // Organize comments into a tree structure
    const commentTree = buildCommentTree(comments);

    return NextResponse.json({ comments: commentTree });
  } catch (error) {
    console.error('Error in comments API:', error);
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
    const { postId, parentId, content } = body;

    if (!postId || !content) {
      return NextResponse.json({ error: 'Post ID and content are required' }, { status: 400 });
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

    // Calculate depth
    let depth = 1;
    if (parentId) {
      const { data: parentComment } = await supabase
        .from('community_comments')
        .select('depth')
        .eq('id', parentId)
        .single();
      
      depth = (parentComment?.depth || 1) + 1;
    }

    const { data: comment, error } = await supabase
      .from('community_comments')
      .insert({
        post_id: postId,
        parent_id: parentId || null,
        author_id: userData.UserID,
        content,
        depth
      })
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
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error in create comment API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildCommentTree(comments: any[]): any[] {
  const commentMap = new Map();
  const rootComments: any[] = [];

  // First pass: create map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: build tree structure
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id);
    
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}
