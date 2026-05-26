import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pages that should only be accessible to unauthenticated users
const authRoutes = ["/login", "/register"];

// Pages that can be accessed by ANYONE (both authenticated and unauthenticated)
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/aboutUs",
  "/contacts",
  "/product",
  "/products",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg")
  ) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get("clientRefreshToken")?.value;
  const isAuthenticated = !!refreshToken;

  // Check if current path is a public route
  // For "/", we do an exact match. For others like "/product", we use startsWith to allow "/product/123"
  const isPublicRoute = publicRoutes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );

  // 1. Unauthenticated users trying to access protected routes
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    // Optionally save the page they were trying to visit
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated users trying to access login/register routes
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions (e.g. .svg, .png, .jpg)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
