export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 font-sans">
      <main className="flex flex-col gap-8 items-center text-center">
        <h1 className="text-4xl font-bold">Welcome to Zoom Clone</h1>
        <p className="text-lg">
          Frontend is running on Next.js 14 and interacting with FastAPI.
        </p>
      </main>
    </div>
  );
}
