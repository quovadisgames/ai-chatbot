import { redirect } from 'next/navigation';

export default function LandingPage() {
  // Redirect to the static index.html page
  return redirect('/index.html');
}
