import Link from 'next/link';


export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-4xl font-bold mb-4">Unlock AI Potential with PDT AI</h1>
      <p className="text-xl mb-8">Innovative AI with RPG flair, cinematic immersion, or professional precision</p>
      <Link 
        href="/login" 
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Get Started
      </Link>
    </div>
  );
}
