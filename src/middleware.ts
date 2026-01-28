import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage =
      req.nextUrl.pathname.startsWith("/login") ||
      req.nextUrl.pathname.startsWith("/register") ||
      req.nextUrl.pathname.startsWith("/forgot-password") ||
      req.nextUrl.pathname.startsWith("/reset-password");

    // Si l'utilisateur est authentifié et tente d'accéder à login/register
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Si l'utilisateur n'est pas authentifié et tente d'accéder à une route protégée
    if (!isAuth && !isAuthPage) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // La logique de redirection est gérée dans le middleware
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api/auth|verify-email|forgot-password|reset-password|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
