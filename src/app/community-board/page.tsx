"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/app/components/applayout";
import { useProtectedPage } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Users, 
  MessageCircle, 
  Plus, 
  Search, 
  Filter, 
  ThumbsUp, 
  ThumbsDown,
  Reply, 
  Calendar,
  MapPin,
  Tag,
  Clock,
  Star,
  TrendingUp,
  Award,
  Heart,
  X,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Share,
  Bookmark,
  MoreHorizontal,
  SortAsc,
  Flame,
  Zap,
  Trash2,
  Edit3
} from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: number;
  author: {
    UserID: number;
    FirstName: string;
    LastName: string;
    Picture?: string;
  };
  category: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  score: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  location?: string;
  is_pinned: boolean;
  is_trending: boolean;
  userVote?: 'up' | 'down' | null;
  isBookmarked?: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  parent_id?: string;
  author_id: number;
  author: {
    UserID: number;
    FirstName: string;
    LastName: string;
    Picture?: string;
  };
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  depth: number;
  created_at: string;
  updated_at: string;
  replies: Comment[];
  userVote?: 'up' | 'down' | null;
}

const CommunityBoard = () => {
  const { isAuthenticated, isLoading, userEmail } = useProtectedPage();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"hot" | "new" | "top">("hot");
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "general",
    tags: "",
    location: ""
  });
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [showEditCommentModal, setShowEditCommentModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [commentToEdit, setCommentToEdit] = useState<Comment | null>(null);
  const [openPostMenu, setOpenPostMenu] = useState<string | null>(null);
  const [openCommentMenu, setOpenCommentMenu] = useState<string | null>(null);
  const [editPost, setEditPost] = useState({
    title: "",
    content: "",
    category: "general",
    tags: "",
    location: ""
  });
  const [editComment, setEditComment] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Full list of U.S. states (same as email preferences)
  const STATES = [
    "ALABAMA", "ALASKA", "ARIZONA", "ARKANSAS", "CALIFORNIA", "COLORADO",
    "CONNECTICUT", "DELAWARE", "FLORIDA", "GEORGIA", "HAWAII", "IDAHO",
    "ILLINOIS", "INDIANA", "IOWA", "KANSAS", "KENTUCKY", "LOUISIANA",
    "MAINE", "MARYLAND", "MASSACHUSETTS", "MICHIGAN", "MINNESOTA",
    "MISSISSIPPI", "MISSOURI", "MONTANA", "NEBRASKA", "NEVADA",
    "NEW HAMPSHIRE", "NEW JERSEY", "NEW MEXICO", "NEW YORK",
    "NORTH CAROLINA", "NORTH DAKOTA", "OHIO", "OKLAHOMA", "OREGON",
    "PENNSYLVANIA", "RHODE ISLAND", "SOUTH CAROLINA", "SOUTH DAKOTA",
    "TENNESSEE", "TEXAS", "UTAH", "VERMONT", "VIRGINIA", "WASHINGTON",
    "WEST VIRGINIA", "WISCONSIN", "WYOMING",
    "DISTRICT OF COLUMBIA", "PUERTO RICO", "GUAM", "AMERICAN SAMOA", "U.S. VIRGIN ISLANDS", "NORTHERN MARIANA ISLANDS"
  ];

  const categories = [
    { value: "all", label: "All Discussions", icon: <MessageCircle size={16} /> },
    { value: "rates", label: "Medicaid Rate Changes", icon: <TrendingUp size={16} /> },
    { value: "policy", label: "Policy & Legislation", icon: <Award size={16} /> },
    { value: "networking", label: "Provider Networking", icon: <Users size={16} /> },
    { value: "resources", label: "Best Practices", icon: <Star size={16} /> },
    { value: "general", label: "General Healthcare", icon: <MessageCircle size={16} /> }
  ];

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams({
        sortBy,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/community/posts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts || []);
      } else {
        console.error('Error fetching posts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  // Fetch comments for a specific post
  const fetchComments = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/comments?postId=${postId}`);
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments || []);
      } else {
        console.error('Error fetching comments:', data.error);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Fetch current user ID
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      if (userEmail) {
        try {
          const response = await fetch('/api/user-info');
          const data = await response.json();
          if (response.ok && data.user) {
            setCurrentUserId(data.user.UserID);
          }
        } catch (error) {
          console.error('Error fetching current user ID:', error);
        }
      }
    };
    
    fetchCurrentUserId();
  }, [userEmail]);

  // Fetch service categories and combine with states for available tags
  useEffect(() => {
    const fetchServiceCategories = async () => {
      try {
        const response = await fetch('/api/service-categories');
        if (response.ok) {
          const data = await response.json();
          const serviceCategories = data.categories || [];
          // Combine states and service categories for available tags
          setAvailableTags([...STATES, ...serviceCategories]);
        }
      } catch (error) {
        console.error('Error fetching service categories:', error);
        // Fallback to just states if service categories fail
        setAvailableTags(STATES);
      }
    };
    
    fetchServiceCategories();
  }, []);

  // Load posts on component mount and when filters change
  useEffect(() => {
    fetchPosts();
  }, [sortBy, selectedCategory, searchTerm]);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-menu') && !target.closest('.tag-dropdown')) {
        setOpenPostMenu(null);
        setOpenCommentMenu(null);
        setShowTagDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Posts are already filtered and sorted by the API

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    try {
      const response = await fetch('/api/community/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, voteType })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh posts to get updated scores
        fetchPosts();
      } else {
        console.error('Error voting:', data.error);
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleCommentVote = async (commentId: string, voteType: 'up' | 'down') => {
    try {
      const response = await fetch('/api/community/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, voteType })
      });

      const data = await response.json();

      if (response.ok && selectedPost) {
        // Refresh comments to get updated scores
        fetchComments(selectedPost.id);
      } else {
        console.error('Error voting on comment:', data.error);
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const response = await fetch('/api/community/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh posts to get updated bookmark status
        fetchPosts();
      } else {
        console.error('Error bookmarking:', data.error);
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
    }
  };

  const handleReply = async (parentId?: string) => {
    if (!newComment.trim() || !selectedPost) return;
    
    try {
      const response = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPost.id,
          parentId,
          content: newComment
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh comments to show the new comment
        fetchComments(selectedPost.id);
        setNewComment("");
        setReplyingTo(null);
      } else {
        console.error('Error creating comment:', data.error);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
          tags: selectedTags,
          location: newPost.location
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh posts to show the new post
        fetchPosts();
        setNewPost({ title: "", content: "", category: "general", tags: "", location: "" });
        setSelectedTags([]);
        setShowNewPostForm(false);
      } else {
        console.error('Error creating post:', data.error);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      const response = await fetch(`/api/community/posts/${postToDelete}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh posts to remove the deleted post
        fetchPosts();
        setShowDeletePostModal(false);
        setPostToDelete(null);
        // Close post detail modal if it was open
        if (selectedPost?.id === postToDelete) {
          setSelectedPost(null);
        }
      } else {
        console.error('Error deleting post:', data.error);
        alert('Failed to delete post. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    
    try {
      const response = await fetch(`/api/community/comments/${commentToDelete}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh comments to remove the deleted comment
        if (selectedPost) {
          fetchComments(selectedPost.id);
        }
        setShowDeleteCommentModal(false);
        setCommentToDelete(null);
      } else {
        console.error('Error deleting comment:', data.error);
        alert('Failed to delete comment. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postToEdit) return;
    
    try {
      const response = await fetch(`/api/community/posts/${postToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editPost.title,
          content: editPost.content,
          category: editPost.category,
          tags: selectedTags,
          location: editPost.location
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh posts to show the updated post
        fetchPosts();
        setShowEditPostModal(false);
        setPostToEdit(null);
        setEditPost({ title: "", content: "", category: "general", tags: "", location: "" });
        setSelectedTags([]);
      } else {
        console.error('Error updating post:', data.error);
        alert('Failed to update post. Please try again.');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    }
  };

  const handleEditComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentToEdit) return;
    
    try {
      const response = await fetch(`/api/community/comments/${commentToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editComment
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh comments to show the updated comment
        if (selectedPost) {
          fetchComments(selectedPost.id);
        }
        setShowEditCommentModal(false);
        setCommentToEdit(null);
        setEditComment("");
      } else {
        console.error('Error updating comment:', data.error);
        alert('Failed to update comment. Please try again.');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const renderComment = (comment: Comment) => (
    <div key={comment.id} className={`${comment.depth > 1 ? 'ml-8' : ''} border-l-2 border-gray-200 pl-4 py-3`}>
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
          {comment.author.Picture ? (
            <img 
              src={comment.author.Picture} 
              alt={`${comment.author.FirstName} ${comment.author.LastName}`}
              className="object-cover w-full h-full" 
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {comment.author.FirstName?.[0]}{comment.author.LastName?.[0]}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-gray-900 text-sm">
              {comment.author.FirstName} {comment.author.LastName}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
          </div>
          <p className="text-gray-700 text-sm mb-2">{comment.content}</p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleCommentVote(comment.id, 'up')}
                className={`p-1 rounded hover:bg-gray-100 ${
                  comment.userVote === 'up' ? 'text-orange-500' : 'text-gray-400'
                }`}
              >
                <ChevronUp size={16} />
              </button>
              <span className="text-sm text-gray-600">{comment.score}</span>
              <button
                onClick={() => handleCommentVote(comment.id, 'down')}
                className={`p-1 rounded hover:bg-gray-100 ${
                  comment.userVote === 'down' ? 'text-blue-500' : 'text-gray-400'
                }`}
              >
                <ChevronDown size={16} />
              </button>
            </div>
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
            >
              <Reply size={12} className="mr-1" />
              Reply
            </button>
            {currentUserId === comment.author_id && (
              <div className="relative dropdown-menu">
                <button
                  onClick={() => setOpenCommentMenu(openCommentMenu === comment.id ? null : comment.id)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <MoreHorizontal size={12} />
                </button>
                {openCommentMenu === comment.id && (
                  <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                    <button
                      onClick={() => {
                        setCommentToEdit(comment);
                        setEditComment(comment.content);
                        setShowEditCommentModal(true);
                        setOpenCommentMenu(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Edit3 size={12} className="mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setCommentToDelete(comment.id);
                        setShowDeleteCommentModal(true);
                        setOpenCommentMenu(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Trash2 size={12} className="mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {replyingTo === comment.id && (
            <div className="mt-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your perspective on this Medicaid rate or policy discussion..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
                rows={3}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => setReplyingTo(null)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReply(comment.id)}
                  className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Reply
                </button>
              </div>
            </div>
          )}
          
          {comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map(reply => renderComment(reply))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <AppLayout activeTab="communityBoard">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    router.push("/");
    return null;
  }

  return (
    <AppLayout activeTab="communityBoard">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                  <Users className="text-white" size={32} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Community Board
                  </h1>
                  <p className="mt-2 text-gray-600 text-lg">
                    Connect with healthcare providers, discuss Medicaid rate changes, and share policy insights
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewPostForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Plus size={20} className="mr-2" />
                Start Discussion
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Filter className="mr-2 text-blue-600" size={20} />
                  Categories
                </h3>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-300 transform hover:scale-105 ${
                        selectedCategory === category.value
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                          : "text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-600"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selectedCategory === category.value ? 'bg-white/20' : 'bg-gray-100'}`}>
                        {category.icon}
                      </div>
                      <span className="ml-3 font-medium">{category.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="mr-2 text-green-600" size={18} />
                    Quick Stats
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <span className="text-gray-700 font-medium">Total Posts</span>
                      <span className="font-bold text-blue-600 bg-white px-3 py-1 rounded-full">{posts.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <span className="text-gray-700 font-medium">Active Today</span>
                      <span className="font-bold text-green-600 bg-white px-3 py-1 rounded-full">
                        {posts.filter(post => {
                          const postDate = new Date(post.created_at);
                          const today = new Date();
                          return postDate.toDateString() === today.toDateString();
                        }).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                      <span className="text-gray-700 font-medium">Trending</span>
                      <span className="font-bold text-orange-600 bg-white px-3 py-1 rounded-full">{posts.filter(p => p.is_trending).length}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <SortAsc className="mr-2 text-purple-600" size={18} />
                    Sort By
                  </h4>
                  <div className="space-y-3">
                    {[
                      { value: "hot", label: "Hot", icon: <Flame size={16} />, color: "from-orange-500 to-red-500" },
                      { value: "new", label: "New", icon: <Zap size={16} />, color: "from-yellow-500 to-orange-500" },
                      { value: "top", label: "Top", icon: <TrendingUp size={16} />, color: "from-green-500 to-emerald-500" }
                    ].map((sort) => (
                      <button
                        key={sort.value}
                        onClick={() => setSortBy(sort.value as "hot" | "new" | "top")}
                        className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-300 transform hover:scale-105 ${
                          sortBy === sort.value
                            ? `bg-gradient-to-r ${sort.color} text-white shadow-lg`
                            : "text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 hover:text-purple-600"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${sortBy === sort.value ? 'bg-white/20' : 'bg-gray-100'}`}>
                          {sort.icon}
                        </div>
                        <span className="ml-3 font-medium">{sort.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Search and Filters */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search Medicaid rates, policy updates, provider discussions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  <button className="flex items-center px-6 py-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <Filter size={20} className="mr-2" />
                    Filters
                  </button>
                </div>
                
                {/* Sort Options */}
                <div className="mt-4 flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <div className="flex space-x-2">
                    {[
                      { value: "hot", label: "Hot", icon: <Flame size={16} /> },
                      { value: "new", label: "New", icon: <Zap size={16} /> },
                      { value: "top", label: "Top", icon: <TrendingUp size={16} /> }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value as "hot" | "new" | "top")}
                        className={`flex items-center px-3 py-1 rounded-lg text-sm transition-colors ${
                          sortBy === option.value
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {option.icon}
                        <span className="ml-1">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Posts */}
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex">
                      {/* Voting Section */}
                      <div className="flex flex-col items-center p-6 border-r border-gray-200/50 bg-gradient-to-b from-gray-50 to-white rounded-l-2xl">
                        <button
                          onClick={() => handleVote(post.id, 'up')}
                          className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                            post.userVote === 'up' 
                              ? 'text-orange-500 bg-orange-50 shadow-lg' 
                              : 'text-gray-400 hover:bg-gray-100 hover:text-orange-500'
                          }`}
                        >
                          <ChevronUp size={24} />
                        </button>
                        <span className={`text-lg font-bold my-2 px-3 py-1 rounded-full ${
                          post.score > 0 ? 'text-green-600 bg-green-50' : 
                          post.score < 0 ? 'text-red-600 bg-red-50' : 
                          'text-gray-600 bg-gray-50'
                        }`}>
                          {post.score}
                        </span>
                        <button
                          onClick={() => handleVote(post.id, 'down')}
                          className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                            post.userVote === 'down' 
                              ? 'text-blue-500 bg-blue-50 shadow-lg' 
                              : 'text-gray-400 hover:bg-gray-100 hover:text-blue-500'
                          }`}
                        >
                          <ChevronDown size={24} />
                        </button>
                      </div>

                      {/* Post Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                              {post.author.Picture ? (
                                <img 
                                  src={post.author.Picture} 
                                  alt={`${post.author.FirstName} ${post.author.LastName}`}
                                  className="object-cover w-full h-full" 
                                />
                              ) : (
                                <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-medium text-sm">
                                    {post.author.FirstName?.[0]}{post.author.LastName?.[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900 text-sm">
                                  {post.author.FirstName} {post.author.LastName}
                                </span>
                                {post.is_pinned && (
                                  <Award className="ml-2 text-yellow-500" size={14} />
                                )}
                                {post.is_trending && (
                                  <TrendingUp className="ml-2 text-green-500" size={14} />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock size={12} className="mr-1" />
                            {formatDate(post.created_at)}
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-3 cursor-pointer hover:text-blue-600 transition-colors duration-300"
                            onClick={() => {
                              setSelectedPost(post);
                              fetchComments(post.id);
                            }}>
                          {post.title}
                        </h3>
                        <p className="text-gray-700 mb-4 leading-relaxed text-base line-clamp-3">{post.content}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => {
                                setSelectedPost(post);
                                fetchComments(post.id);
                              }}
                              className="flex items-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all duration-300 transform hover:scale-105"
                            >
                              <MessageSquare size={16} className="mr-2" />
                              <span className="font-medium">{post.reply_count} comments</span>
                            </button>
                            <button className="flex items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all duration-300 transform hover:scale-105">
                              <Share size={16} className="mr-2" />
                              <span className="font-medium">Share</span>
                            </button>
                            <button
                              onClick={() => handleBookmark(post.id)}
                              className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                                post.isBookmarked 
                                  ? 'bg-green-50 hover:bg-green-100 text-green-600' 
                                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                              }`}
                            >
                              <Bookmark size={16} className="mr-2" />
                              <span className="font-medium">{post.isBookmarked ? 'Saved' : 'Save'}</span>
                            </button>
                            {post.location && (
                              <div className="flex items-center text-gray-500 text-sm">
                                <MapPin size={16} className="mr-1" />
                                {post.location}
                              </div>
                            )}
                            {currentUserId === post.author_id && (
                              <div className="relative dropdown-menu">
                                <button
                                  onClick={() => setOpenPostMenu(openPostMenu === post.id ? null : post.id)}
                                  className="flex items-center text-gray-500 hover:text-gray-700 text-sm"
                                >
                                  <MoreHorizontal size={16} />
                                </button>
                                {openPostMenu === post.id && (
                                  <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                                    <button
                                      onClick={() => {
                                        setPostToEdit(post);
                                        setEditPost({
                                          title: post.title,
                                          content: post.content,
                                          category: post.category,
                                          tags: "",
                                          location: post.location || ""
                                        });
                                        setSelectedTags(post.tags);
                                        setShowEditPostModal(true);
                                        setOpenPostMenu(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                    >
                                      <Edit3 size={12} className="mr-2" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        setPostToDelete(post.id);
                                        setShowDeletePostModal(true);
                                        setOpenPostMenu(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                                    >
                                      <Trash2 size={12} className="mr-2" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 flex-wrap">
                            {post.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 hover:from-blue-200 hover:to-indigo-200 transition-all duration-300"
                              >
                                <Tag size={10} className="mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {posts.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="mx-auto text-gray-400" size={48} />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No discussions found</h3>
                  <p className="mt-2 text-gray-500">
                    {searchTerm ? "Try searching for 'Medicaid rates', 'policy updates', or 'provider alerts'" : "Start the first discussion about Medicaid rates, policy changes, or provider experiences"}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setShowNewPostForm(true)}
                      className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Start First Discussion
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Post Detail Modal with Comments */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Post Discussion</h2>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Post Content */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                        {selectedPost.author.Picture ? (
                          <img 
                            src={selectedPost.author.Picture} 
                            alt={`${selectedPost.author.FirstName} ${selectedPost.author.LastName}`}
                            className="object-cover w-full h-full" 
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {selectedPost.author.FirstName?.[0]}{selectedPost.author.LastName?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {selectedPost.author.FirstName} {selectedPost.author.LastName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={16} className="mr-1" />
                      {formatDate(selectedPost.created_at)}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{selectedPost.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedPost.content}</p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleVote(selectedPost.id, 'up')}
                          className={`p-1 rounded hover:bg-gray-100 ${
                            selectedPost.userVote === 'up' ? 'text-orange-500' : 'text-gray-400'
                          }`}
                        >
                          <ChevronUp size={20} />
                        </button>
                        <span className={`text-sm font-medium px-2 ${
                          selectedPost.score > 0 ? 'text-orange-500' : selectedPost.score < 0 ? 'text-blue-500' : 'text-gray-500'
                        }`}>
                          {selectedPost.score}
                        </span>
                        <button
                          onClick={() => handleVote(selectedPost.id, 'down')}
                          className={`p-1 rounded hover:bg-gray-100 ${
                            selectedPost.userVote === 'down' ? 'text-blue-500' : 'text-gray-400'
                          }`}
                        >
                          <ChevronDown size={20} />
                        </button>
                      </div>
                      <span className="text-sm text-gray-500">{selectedPost.reply_count} comments</span>
                      {currentUserId === selectedPost.author_id && (
                        <div className="relative dropdown-menu">
                          <button
                            onClick={() => setOpenPostMenu(openPostMenu === selectedPost.id ? null : selectedPost.id)}
                            className="flex items-center text-gray-500 hover:text-gray-700 text-sm"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {openPostMenu === selectedPost.id && (
                            <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                              <button
                                onClick={() => {
                                  setPostToEdit(selectedPost);
                                  setEditPost({
                                    title: selectedPost.title,
                                    content: selectedPost.content,
                                    category: selectedPost.category,
                                    tags: "",
                                    location: selectedPost.location || ""
                                  });
                                  setSelectedTags(selectedPost.tags);
                                  setShowEditPostModal(true);
                                  setOpenPostMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Edit3 size={12} className="mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setPostToDelete(selectedPost.id);
                                  setShowDeletePostModal(true);
                                  setOpenPostMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 size={12} className="mr-2" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedPost.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <Tag size={10} className="mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Add Comment */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Add a Comment</h4>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your insights on this Medicaid rate or policy topic..."
                    className="w-full p-4 border border-gray-300 rounded-lg resize-none"
                    rows={4}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => handleReply()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Comment
                    </button>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Comments ({comments.length})
                  </h4>
                  <div className="space-y-4">
                    {comments.map(comment => renderComment(comment))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Post Modal */}
        {showNewPostForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mr-4">
                      <Plus className="text-white" size={24} />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Start New Discussion</h2>
                  </div>
                  <button
                    onClick={() => setShowNewPostForm(false)}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handlePostSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discussion Title
                    </label>
                    <input
                      type="text"
                      required
                      value={newPost.title}
                      onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., New Medicaid rate changes in California, Provider reimbursement updates..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discussion Content
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={newPost.content}
                      onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Share your experience with rate changes, ask questions about policy updates, or provide insights on provider operations..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discussion Category
                      </label>
                      <select
                        value={newPost.category}
                        onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categories.slice(1).map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State/Region (Optional)
                      </label>
                      <input
                        type="text"
                        value={newPost.location}
                        onChange={(e) => setNewPost(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., California, New York, Texas, or specific city"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      States & Service Categories
                    </label>
                    <div className="relative tag-dropdown">
                      <div
                        onClick={() => setShowTagDropdown(!showTagDropdown)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer bg-white"
                      >
                        {selectedTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedTags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTags(prev => prev.filter(t => t !== tag));
                                  }}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">Select states and healthcare service categories</span>
                        )}
                      </div>
                      {showTagDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 mb-2">States</div>
                            {STATES.map((state) => (
                              <label
                                key={state}
                                className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedTags.includes(state)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTags(prev => [...prev, state]);
                                    } else {
                                      setSelectedTags(prev => prev.filter(t => t !== state));
                                    }
                                  }}
                                  className="form-checkbox h-4 w-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{state}</span>
                              </label>
                            ))}
                            <div className="text-xs font-medium text-gray-500 mb-2 mt-4">Service Categories</div>
                            {availableTags.filter(tag => !STATES.includes(tag)).map((category) => (
                              <label
                                key={category}
                                className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedTags.includes(category)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTags(prev => [...prev, category]);
                                    } else {
                                      setSelectedTags(prev => prev.filter(t => t !== category));
                                    }
                                  }}
                                  className="form-checkbox h-4 w-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{category}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowNewPostForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Start Discussion
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Post Confirmation Modal */}
        {showDeletePostModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Post</h3>
                <button
                  onClick={() => setShowDeletePostModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeletePostModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Comment Confirmation Modal */}
        {showDeleteCommentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Comment</h3>
                <button
                  onClick={() => setShowDeleteCommentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this comment? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteCommentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteComment}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Comment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Post Modal */}
        {showEditPostModal && postToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Post</h2>
                  <button
                    onClick={() => setShowEditPostModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleEditPost} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discussion Title
                    </label>
                    <input
                      type="text"
                      required
                      value={editPost.title}
                      onChange={(e) => setEditPost(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., New Medicaid rate changes in California, Provider reimbursement updates..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discussion Content
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={editPost.content}
                      onChange={(e) => setEditPost(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Share your experience with rate changes, ask questions about policy updates, or provide insights on provider operations..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discussion Category
                      </label>
                      <select
                        value={editPost.category}
                        onChange={(e) => setEditPost(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categories.slice(1).map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State/Region (Optional)
                      </label>
                      <input
                        type="text"
                        value={editPost.location}
                        onChange={(e) => setEditPost(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., California, New York, Texas, or specific city"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      States & Service Categories
                    </label>
                    <div className="relative tag-dropdown">
                      <div
                        onClick={() => setShowTagDropdown(!showTagDropdown)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer bg-white"
                      >
                        {selectedTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedTags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTags(prev => prev.filter(t => t !== tag));
                                  }}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">Select states and healthcare service categories</span>
                        )}
                      </div>
                      {showTagDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 mb-2">States</div>
                            {STATES.map((state) => (
                              <label
                                key={state}
                                className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedTags.includes(state)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTags(prev => [...prev, state]);
                                    } else {
                                      setSelectedTags(prev => prev.filter(t => t !== state));
                                    }
                                  }}
                                  className="form-checkbox h-4 w-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{state}</span>
                              </label>
                            ))}
                            <div className="text-xs font-medium text-gray-500 mb-2 mt-4">Service Categories</div>
                            {availableTags.filter(tag => !STATES.includes(tag)).map((category) => (
                              <label
                                key={category}
                                className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedTags.includes(category)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTags(prev => [...prev, category]);
                                    } else {
                                      setSelectedTags(prev => prev.filter(t => t !== category));
                                    }
                                  }}
                                  className="form-checkbox h-4 w-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{category}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEditPostModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Update Discussion
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Comment Modal */}
        {showEditCommentModal && commentToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Comment</h3>
                <button
                  onClick={() => setShowEditCommentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditComment}>
                <textarea
                  required
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none mb-4"
                  rows={4}
                  placeholder="Update your comment about this Medicaid rate or policy discussion..."
                />
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditCommentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CommunityBoard;
