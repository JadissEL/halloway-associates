import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="luxury-surface flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-20 md:min-h-[calc(100vh-4.5rem)]">
      <SignUp />
    </div>
  );
}
