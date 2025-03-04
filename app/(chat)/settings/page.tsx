import { auth } from '@/auth';
import { TokenUsageDisplay } from '@/components/token-usage-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>
              You must be signed in to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
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

      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usage" className="space-y-4 mt-4">
          <h2 className="text-xl font-semibold">Token Usage</h2>
          <p className="text-muted-foreground mb-4">
            Monitor your AI token consumption.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <TokenUsageDisplay userId={session.user.id} />
            
            <Card>
              <CardHeader>
                <CardTitle>Usage Limits</CardTitle>
                <CardDescription>Your current plan and limits</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-4 mt-4">
          <h2 className="text-xl font-semibold">Account Settings</h2>
          <p className="text-muted-foreground mb-4">
            Manage your account details and preferences.
          </p>
          
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Email</span>
                  <span className="font-medium">{session.user.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4 mt-4">
          <h2 className="text-xl font-semibold">Appearance</h2>
          <p className="text-muted-foreground mb-4">
            Customize the appearance of the application.
          </p>
          
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Manage your theme preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Theme settings are available in the user menu in the sidebar.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 