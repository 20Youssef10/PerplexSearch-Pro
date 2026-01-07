
import { YouTubeVideo } from '../types';
import { YOUTUBE_API_KEY } from '../constants';

export const searchYouTube = async (query: string): Promise<YouTubeVideo[]> => {
  if (!YOUTUBE_API_KEY) throw new Error("YouTube API Key missing");

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('YouTube API failed');
  }

  const data = await response.json();
  
  return data.items.map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails.medium.url,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt
  }));
};
