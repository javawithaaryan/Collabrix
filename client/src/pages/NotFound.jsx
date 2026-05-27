import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-zinc-700 text-8xl font-extrabold mb-6 select-none">404</p>
      <h1 className="text-3xl font-bold mb-3">Page not found</h1>
      <p className="text-zinc-500 mb-8 text-base max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="bg-white text-black px-7 py-3 rounded-xl font-semibold hover:opacity-90 transition"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
