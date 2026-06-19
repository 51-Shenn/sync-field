import { GoogleSignInButton } from "@/components/google-sign-in-button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 w-full max-w-lg flex-col items-center justify-center gap-10 px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Imagine Hack
          </h1>
          <p className="max-w-sm text-lg leading-7 text-zinc-500 dark:text-zinc-400">
            Sign in to get started with your project.
          </p>
        </div>
        <GoogleSignInButton />
      </main>
    </div>
  );
}
