import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");

  if (!urlParam) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Verificar se o usuário está autenticado
  const token = await getToken({ req });
  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const parsedUrl = new URL(urlParam);

    // Basic SSRF protection: Apenas aceitar requisições para a rota de media
    if (!parsedUrl.pathname.startsWith("/api/media/")) {
      return new NextResponse("Invalid image URL", { status: 403 });
    }

    const res = await fetch(urlParam, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    if (!res.ok) {
      return new NextResponse(`Error fetching image: ${res.statusText}`, { status: res.status });
    }

    const contentType = res.headers.get("content-type");
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType || "image/jpeg",
        "Cache-Control": "public, max-age=86400", // Cache por 1 dia no navegador
      },
    });
  } catch (error) {
    console.error("Image Proxy Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
