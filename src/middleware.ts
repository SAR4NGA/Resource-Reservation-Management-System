export { default } from "next-auth/middleware";

// Everything under the app requires a logged-in session except the
// auth pages themselves and the NextAuth API routes. API routes for
// resources/reservations enforce their own checks (see those route
// files) since they also need role-based rules, not just "logged in".
export const config = {
  matcher: ["/", "/resources", "/reservations"],
};
