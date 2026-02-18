import { SignIn, useAuth } from "@clerk/tanstack-react-start";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in/$")({
  component: SignInPage,
});

function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F0E8] px-4">
        <p className="text-sm text-[#6f6f6f]">Loading session…</p>
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/" search={{ c: undefined }} />;
  }

  return (
    <div className="auth-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F0E8] px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#1D3557]/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-[#F4D35E]/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-[#D62828]/15 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md rounded-[26px] border border-[#D4CFC6] bg-white/92 p-8 shadow-[0_26px_80px_rgba(26,26,26,0.10)] backdrop-blur">
        <SignIn />
      </div>
    </div>
  );
}
