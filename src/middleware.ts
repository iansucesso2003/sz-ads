import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // Redireciona /api/auth/error para /login (preserva query params)
  if (req.nextUrl.pathname === "/api/auth/error") {
    const url = new URL("/login", req.url);
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));
    return NextResponse.redirect(url);
  }

  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/registro") ||
    req.nextUrl.pathname.startsWith("/organizacao");

  if (isAuthPage) {
    // /login ou /registro: se logado, vai para organizacao
    if (
      (req.nextUrl.pathname.startsWith("/login") ||
        req.nextUrl.pathname.startsWith("/registro")) &&
      isLoggedIn
    ) {
      return Response.redirect(new URL("/organizacao", req.url));
    }
    // /organizacao: sempre permitir (usuário precisa escolher org)
    return;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.url));
  }

  if (req.nextUrl.pathname === "/") {
    return Response.redirect(new URL("/dashboard", req.url));
  }

  return;
});

export const config = {
  matcher: ["/api/auth/error", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
