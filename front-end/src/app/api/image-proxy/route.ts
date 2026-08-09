import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "@/config/env";

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
    let fetchUrl = urlParam;
    const internalBackend = env.BACKEND_INTERNAL_URL || "http://localhost:3001";

    if (!urlParam.startsWith("http://") && !urlParam.startsWith("https://")) {
      // Path relativo (ex: users/123/avatar.png)
      const isR2Path = /^(users|tenants|misc)\//.test(urlParam);
      
      if (!isR2Path) {
        return new NextResponse("Invalid image path", { status: 403 });
      }
      
      fetchUrl = `${internalBackend}/api/media/${urlParam}`;
    } else {
      const parsedUrl = new URL(urlParam);

      // Basic SSRF protection: Apenas aceitar requisições para a rota de media ou caminhos do R2
      const isApiMedia = parsedUrl.pathname.startsWith("/api/media/");
      const isR2Path = /^\/(users|tenants|misc)\//.test(parsedUrl.pathname);
      
      if (!isApiMedia && !isR2Path) {
        return new NextResponse("Invalid image URL", { status: 403 });
      }

      // Se for uma requisição local, reescrevemos para bater no backend interno
      if (isApiMedia) {
        fetchUrl = `${internalBackend}${parsedUrl.pathname}${parsedUrl.search}`;
      }
    }

    const isInternal = fetchUrl.startsWith(internalBackend);
    const res = await fetch(fetchUrl, {
      headers: isInternal ? {
        Authorization: `Bearer ${token.accessToken}`,
      } : undefined,
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
