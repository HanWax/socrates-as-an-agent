import { SignUp, useAuth } from "@clerk/tanstack-react-start";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up/$")({
  component: SignUpPage,
});

function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F0E8] px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-2 border-[#1D3557] border-t-transparent animate-spin" />
          <p className="text-sm text-[#6f6f6f]">Loading session…</p>
        </div>
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
      <div className="relative flex w-full max-w-md flex-col items-center">
        <img
          src="/socrates.svg"
          alt="Socrates as a Service"
          width={160}
          height={200}
          className="mb-4 h-auto w-28 sm:w-40"
        />
        <h1 className="mb-1 text-xl font-medium text-[#1a1a1a] sm:text-2xl">
          Welcome to Socrates
        </h1>
        <p className="mb-6 text-center text-sm text-[#8b8b8b]">
          The chatbot that won't let you off easy.
        </p>
        <div className="w-full rounded-[26px] border border-[#D4CFC6] bg-white/92 p-8 shadow-[0_26px_80px_rgba(26,26,26,0.10)] backdrop-blur">
          <SignUp />
        </div>
      </div>
    </div>
  );
}
