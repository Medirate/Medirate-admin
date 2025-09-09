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
    const { postId, commentId, voteType } = body;

    if (!voteType || !['up', 'down'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    if (!postId && !commentId) {
      return NextResponse.json({ error: 'Either postId or commentId is required' }, { status: 400 });
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

    // Check if user already voted
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('community_votes')
      .select('*')
      .eq('user_id', userData.UserID)
      .eq(postId ? 'post_id' : 'comment_id', postId || commentId)
      .single();

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      console.error('Error checking existing vote:', voteCheckError);
      return NextResponse.json({ error: 'Failed to check existing vote' }, { status: 500 });
    }

    if (existingVote) {
      // User already voted, update the vote
      if (existingVote.vote_type === voteType) {
        // Same vote type, remove the vote
        const { error: deleteError } = await supabase
          .from('community_votes')
          .delete()
          .eq('id', existingVote.id);

        if (deleteError) {
          console.error('Error removing vote:', deleteError);
          return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
        }

        // Update vote counts
        await updateVoteCounts(postId, commentId, existingVote.vote_type, 'remove');

        return NextResponse.json({ 
          message: 'Vote removed',
          voteType: null,
          action: 'removed'
        });
      } else {
        // Different vote type, update the vote
        const { error: updateError } = await supabase
          .from('community_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);

        if (updateError) {
          console.error('Error updating vote:', updateError);
          return NextResponse.json({ error: 'Failed to update vote' }, { status: 500 });
        }

        // Update vote counts (remove old vote, add new vote)
        await updateVoteCounts(postId, commentId, existingVote.vote_type, 'remove');
        await updateVoteCounts(postId, commentId, voteType, 'add');

        return NextResponse.json({ 
          message: 'Vote updated',
          voteType,
          action: 'updated'
        });
      }
    } else {
      // User hasn't voted yet, create new vote
      const { error: insertError } = await supabase
        .from('community_votes')
        .insert({
          user_id: userData.UserID,
          post_id: postId || null,
          comment_id: commentId || null,
          vote_type: voteType
        });

      if (insertError) {
        console.error('Error creating vote:', insertError);
        return NextResponse.json({ error: 'Failed to create vote' }, { status: 500 });
      }

      // Update vote counts
      await updateVoteCounts(postId, commentId, voteType, 'add');

      return NextResponse.json({ 
        message: 'Vote created',
        voteType,
        action: 'created'
      });
    }
  } catch (error) {
    console.error('Error in vote API:', error);
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
    const commentId = searchParams.get('commentId');

    // Get user ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('UserID')
      .eq('Email', user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's vote for this post/comment
    const { data: vote, error } = await supabase
      .from('community_votes')
      .select('vote_type')
      .eq('user_id', userData.UserID)
      .eq(postId ? 'post_id' : 'comment_id', postId || commentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching vote:', error);
      return NextResponse.json({ error: 'Failed to fetch vote' }, { status: 500 });
    }

    return NextResponse.json({ 
      voteType: vote?.vote_type || null 
    });
  } catch (error) {
    console.error('Error in get vote API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to update vote counts
async function updateVoteCounts(postId: string | null, commentId: string | null, voteType: string, action: 'add' | 'remove') {
  const table = postId ? 'community_posts' : 'community_comments';
  const id = postId || commentId;
  
  if (!id) return;

  // First, get current vote counts
  const { data: currentData, error: fetchError } = await supabase
    .from(table)
    .select('upvotes, downvotes, score')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error(`Error fetching current vote counts for ${table}:`, fetchError);
    return;
  }

  const increment = action === 'add' ? 1 : -1;
  const upvoteChange = voteType === 'up' ? increment : 0;
  const downvoteChange = voteType === 'down' ? increment : 0;

  const newUpvotes = Math.max(0, (currentData.upvotes || 0) + upvoteChange);
  const newDownvotes = Math.max(0, (currentData.downvotes || 0) + downvoteChange);
  const newScore = newUpvotes - newDownvotes;

  const { error } = await supabase
    .from(table)
    .update({
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      score: newScore
    })
    .eq('id', id);

  if (error) {
    console.error(`Error updating vote counts for ${table}:`, error);
  }
}
