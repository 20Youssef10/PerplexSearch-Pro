
import { YouTubeVideo } from '../types';
import { YOUTUBE_API_KEY } from '../constants';

export const searchYouTube = async (query: string): Promise<YouTubeVideo[]> => {
  if (!YOUTUBE_API_KEY) throw new Error("YouTube API Key missing");

  // Updated to include 'playlist' in type parameter
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video,playlist&key=${YOUTUBE_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('YouTube API failed');
  }

  const data = await response.json();
  
  return data.items.map((item: any) => ({
    // Handle different ID structures for video vs playlist
    id: item.id.videoId || item.id.playlistId,
    type: item.id.kind === 'youtube#playlist' ? 'playlist' : 'video',
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt
  }));
};
