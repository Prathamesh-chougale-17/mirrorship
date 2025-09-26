import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/mongodb";
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

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const settings = await DatabaseService.getUserPlatformSettings(user.id);
    
    return NextResponse.json({
      hasGitHub: !!(settings?.github?.username && settings?.github?.accessToken),
      hasLeetCode: !!(settings?.leetcode?.username),
      settings
    });
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform settings" },
      { status: 500 }
    );
  }
}