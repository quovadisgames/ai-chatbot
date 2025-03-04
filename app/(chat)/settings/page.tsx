import { auth } from '@/auth';
import { TokenUsageDisplay } from '@/components/token-usage-display';

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-6 bg-card border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Unauthorized</h2>
          <p className="text-muted-foreground">
            You must be signed in to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="border-b pb-2 mb-4">
        <div className="flex space-x-4">
          <button className="px-4 py-2 font-medium border-b-2 border-primary">Usage</button>
          <button className="px-4 py-2 text-muted-foreground">Account</button>
          <button className="px-4 py-2 text-muted-foreground">Appearance</button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Token Usage</h2>
        <p className="text-muted-foreground mb-4">
          Monitor your AI token consumption.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <TokenUsageDisplay userId={session.user.id} />
          
          <div className="p-6 bg-card border rounded-lg shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Usage Limits</h3>
              <p className="text-sm text-muted-foreground">Your current plan and limits</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Plan</span>
                <span className="font-medium">Free</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly limit</span>
                <span className="font-medium">100,000 tokens</span>
              </div>
              <div className="flex justify-between">
                <span>Reset date</span>
                <span className="font-medium">1st of each month</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 