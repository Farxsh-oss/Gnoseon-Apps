import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { useLoginForm } from '../hooks/useLoginForm';
import { LoginTab } from './LoginTab';
import { RegisterTab } from './RegisterTab';

interface LoginUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  status: string;
}

interface LoginFormProps {
  onLogin?: (user: LoginUser) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const {
    isLoading,
    error,
    success,
    handleLogin,
    handleRegister,
    generateRandomPassword
  } = useLoginForm(onLogin);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6e9f0] p-4 relative overflow-hidden" style={{ fontFamily: 'var(--font-mono)' }}>
      {/* Background ASCII Art */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none text-[8px] leading-[8px] overflow-hidden whitespace-pre">
        {Array(100).fill(0).map((_, i) => (
          <div key={i}>
            {'GNŌSEŌN '.repeat(20)}
          </div>
        ))}
      </div>
      
      {/* Decorative ASCII elements */}
      <div className="absolute top-10 left-10 text-purple-600/20 text-xs animate-pulse">
        [ SYSTEM_READY ]
      </div>
      <div className="absolute top-20 right-10 text-green-600/20 text-xs animate-pulse delay-700">
        [ ENCRYPTION_ACTIVE ]
      </div>
      
      <Card className="w-full max-w-md neu-flat border-0 relative z-10">
        <CardHeader className="text-center space-y-2">
          {/* ASCII Top Border */}
          <div className="text-[10px] text-gray-400 overflow-hidden whitespace-nowrap">
            ╔══════════════════════════════════════════════════════════════════╗
          </div>
          
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 neu-inset rounded-2xl flex items-center justify-center p-3">
              <img 
                src="/gnoseon-logo.png" 
                alt="Gnōseōn Logo" 
                className="w-full h-full object-contain filter grayscale"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=gnoseon';
                }}
              />
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold tracking-tighter flex flex-col items-center gap-1">
            <span className="text-green-600 tracking-[0.2em]">GNŌSEŌN</span>
            <span className="text-xs text-gray-500 font-mono mt-1 opacity-80">Secure Messaging Protocol</span>
          </CardTitle>
          
          <CardDescription className="text-gray-500 font-mono text-xs mt-2">
            <span className="text-purple-600 animate-pulse">{'>'}</span> Initialize authentication sequence...
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 neu-inset bg-transparent border-0 h-12">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:neu-pressed data-[state=active]:text-green-600 text-gray-600 neu-raised border-0 transition-all"
              >
                <span className="font-semibold">[L]ogin</span>
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:neu-pressed data-[state=active]:text-green-600 text-gray-600 neu-raised border-0 transition-all"
              >
                <span className="font-semibold">[R]egister</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <LoginTab onSubmit={handleLogin} isLoading={isLoading} />
            </TabsContent>
            
            <TabsContent value="register" className="mt-6">
              <RegisterTab 
                onSubmit={handleRegister} 
                isLoading={isLoading} 
                onGenerateRandomPassword={generateRandomPassword} 
              />
            </TabsContent>
          </Tabs>
          
          {(error || success) && (
            <div className="mt-4 space-y-2">
              {error && (
                <Alert className="neu-flat-red border-0 bg-transparent py-2">
                  <AlertDescription className="text-red-600 font-mono text-[10px] flex items-center gap-2">
                    <span className="font-bold">[!] ERROR:</span> {error}
                  </AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="neu-flat-green border-0 bg-transparent py-2">
                  <AlertDescription className="text-green-600 font-mono text-[10px] flex items-center gap-2">
                    <span className="font-bold">[i] SUCCESS:</span> {success}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Terminal Status Bar */}
      <div className="absolute bottom-4 left-4 flex gap-4">
        <div className="neu-inset px-3 py-1 rounded-lg">
          <span className="text-[10px] font-bold text-green-600 font-mono">gnōseon:~$ status --active</span>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 flex gap-4">
        <div className="neu-inset px-3 py-1 rounded-lg">
          <span className="text-[10px] font-bold text-purple-600 font-mono">build_v1.0.0-stable</span>
        </div>
      </div>
    </div>
  );
}
