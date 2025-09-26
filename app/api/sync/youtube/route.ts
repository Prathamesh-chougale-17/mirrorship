import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/mongodb";
import { YouTubeService } from "@/lib/youtube";
import { auth } from "@/auth";

async function getAuthUser(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: cookieHeader
      })
    });
    return session?.user || null;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { channelHandle } = await request.json();

    if (!channelHandle) {
      return NextResponse.json(
        { error: "Channel handle is required" },
        { status: 400 }
      );
    }

    console.log(`Starting YouTube sync for user ${user.id}, handle: ${channelHandle}`);

    // Step 1: Get channel information
    const channelData = await YouTubeService.getChannelByHandle(channelHandle);
    
    if (!channelData) {
      return NextResponse.json(
        { error: "YouTube channel not found" },
        { status: 404 }
      );
    }

    // Step 2: Transform and save channel data
    const transformedChannelData = YouTubeService.transformChannelData(channelData, channelHandle);
    await DatabaseService.saveYouTubeChannel(user.id, transformedChannelData);

    // Step 3: Get uploads for the last 9 months
    const nineMonthsAgo = new Date();
    nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
    
    const uploads = await YouTubeService.getUploadsInDateRange(
      transformedChannelData.uploadsPlaylistId,
      nineMonthsAgo,
      new Date()
    );

    // Step 4: Transform and save upload data
    const transformedUploads = uploads.map(upload => 
      YouTubeService.transformUploadData(upload)
    );
    
    await DatabaseService.saveYouTubeUploads(user.id, transformedUploads);

    // Step 5: Update platform settings
    await DatabaseService.updateUserPlatformSettings(user.id, {
      youtube: {
        channelHandle,
        channelId: transformedChannelData.channelId,
        uploadsPlaylistId: transformedChannelData.uploadsPlaylistId,
        lastSyncDate: new Date(),
        syncEnabled: true
      }
    });

    console.log(`YouTube sync completed for user ${user.id}. Synced ${transformedUploads.length} uploads`);

    return NextResponse.json({
      message: "YouTube sync completed successfully",
      channelData: {
        title: transformedChannelData.title,
        subscriberCount: transformedChannelData.statistics.subscriberCount,
        videoCount: transformedChannelData.statistics.videoCount
      },
      uploadCount: transformedUploads.length,
      dateRange: {
        from: nineMonthsAgo.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error("YouTube sync error:", error);
    return NextResponse.json(
      { 
        error: "Failed to sync YouTube data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}