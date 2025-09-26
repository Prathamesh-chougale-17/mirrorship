/**
 * YouTube API Integration Service
 * Handles fetching channel data and video uploads from YouTube API v3
 */

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.warn('YouTube API key not found. YouTube integration will not work.');
}

interface YouTubeAPIResponse<T> {
  kind: string;
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: T[];
  nextPageToken?: string;
}

interface YouTubeChannelResponse {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
    };
    localized: {
      title: string;
      description: string;
    };
  };
  contentDetails: {
    relatedPlaylists: {
      likes: string;
      uploads: string;
    };
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
}

interface YouTubeVideoResponse {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
  };
  contentDetails?: {
    duration: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export class YouTubeService {
  /**
   * Get channel information by handle (e.g., @ai-beyond-human)
   */
  static async getChannelByHandle(handle: string): Promise<YouTubeChannelResponse | null> {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    try {
      // Remove @ if present
      const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
      
      const url = `${YOUTUBE_API_BASE_URL}/channels?part=snippet,contentDetails,statistics&forHandle=${cleanHandle}&key=${YOUTUBE_API_KEY}`;
      
      const response = await fetch(url);
      const data: YouTubeAPIResponse<YouTubeChannelResponse> = await response.json();
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${JSON.stringify(data)}`);
      }
      
      return data.items[0] || null;
    } catch (error) {
      console.error('Error fetching YouTube channel:', error);
      throw error;
    }
  }

  /**
   * Get all videos from a channel's uploads playlist
   */
  static async getChannelUploads(
    uploadsPlaylistId: string, 
    maxResults = 50,
    pageToken?: string
  ): Promise<{
    videos: YouTubeVideoResponse[];
    nextPageToken?: string;
  }> {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    try {
      let url = `${YOUTUBE_API_BASE_URL}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
      
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }
      
      const response = await fetch(url);
      const playlistData: YouTubeAPIResponse<any> = await response.json();
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${JSON.stringify(playlistData)}`);
      }

      // Extract video IDs
      const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId);
      
      if (videoIds.length === 0) {
        return { videos: [] };
      }

      // Get detailed video information
      const videosUrl = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
      
      const videosResponse = await fetch(videosUrl);
      const videosData: YouTubeAPIResponse<YouTubeVideoResponse> = await videosResponse.json();
      
      if (!videosResponse.ok) {
        throw new Error(`YouTube API error: ${JSON.stringify(videosData)}`);
      }

      return {
        videos: videosData.items,
        nextPageToken: playlistData.nextPageToken
      };
    } catch (error) {
      console.error('Error fetching YouTube uploads:', error);
      throw error;
    }
  }

  /**
   * Get all uploads for a channel (handles pagination)
   */
  static async getAllChannelUploads(uploadsPlaylistId: string): Promise<YouTubeVideoResponse[]> {
    const allVideos: YouTubeVideoResponse[] = [];
    let nextPageToken: string | undefined;

    do {
      const result = await this.getChannelUploads(uploadsPlaylistId, 50, nextPageToken);
      allVideos.push(...result.videos);
      nextPageToken = result.nextPageToken;
    } while (nextPageToken);

    return allVideos;
  }

  /**
   * Get uploads within a date range
   */
  static async getUploadsInDateRange(
    uploadsPlaylistId: string,
    startDate: Date,
    endDate: Date
  ): Promise<YouTubeVideoResponse[]> {
    const allUploads = await this.getAllChannelUploads(uploadsPlaylistId);
    
    return allUploads.filter(video => {
      const publishedAt = new Date(video.snippet.publishedAt);
      return publishedAt >= startDate && publishedAt <= endDate;
    });
  }

  /**
   * Transform YouTube API response to our database format
   */
  static transformChannelData(apiChannel: YouTubeChannelResponse, handle: string) {
    return {
      channelId: apiChannel.id,
      channelHandle: handle,
      title: apiChannel.snippet.title,
      description: apiChannel.snippet.description,
      customUrl: apiChannel.snippet.customUrl,
      publishedAt: new Date(apiChannel.snippet.publishedAt),
      thumbnails: apiChannel.snippet.thumbnails,
      statistics: {
        viewCount: parseInt(apiChannel.statistics.viewCount),
        subscriberCount: parseInt(apiChannel.statistics.subscriberCount),
        videoCount: parseInt(apiChannel.statistics.videoCount)
      },
      uploadsPlaylistId: apiChannel.contentDetails.relatedPlaylists.uploads
    };
  }

  /**
   * Transform YouTube video API response to our database format
   */
  static transformUploadData(apiVideo: YouTubeVideoResponse) {
    return {
      videoId: apiVideo.id,
      title: apiVideo.snippet.title,
      description: apiVideo.snippet.description,
      publishedAt: new Date(apiVideo.snippet.publishedAt),
      thumbnails: apiVideo.snippet.thumbnails,
      duration: apiVideo.contentDetails?.duration,
      viewCount: apiVideo.statistics ? parseInt(apiVideo.statistics.viewCount) : 0,
      likeCount: apiVideo.statistics ? parseInt(apiVideo.statistics.likeCount || '0') : 0,
      commentCount: apiVideo.statistics ? parseInt(apiVideo.statistics.commentCount || '0') : 0,
      tags: apiVideo.snippet.tags,
      categoryId: apiVideo.snippet.categoryId,
      videoUrl: `https://www.youtube.com/watch?v=${apiVideo.id}`
    };
  }
}