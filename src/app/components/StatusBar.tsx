import { Cpu, HardDrive, Wifi, Shield, Activity } from 'lucide-react';

export function StatusBar() {
  return (
    <footer className="bg-[#e6e9f0] px-4 py-2 neu-flat border-t border-gray-300" style={{ fontFamily: 'var(--font-mono)' }}>
      <div className="flex items-center justify-between text-xs">
        {/* System Info */}
        <div className="flex items-center gap-4 text-gray-600">
          <div className="flex items-center gap-1 neu-inset px-2 py-1 rounded">
            <Cpu className="w-3 h-3 text-green-600" />
            <span className="text-green-600">CPU: 45%</span>
          </div>
          <div className="flex items-center gap-1 neu-inset px-2 py-1 rounded">
            <HardDrive className="w-3 h-3 text-purple-600" />
            <span className="text-purple-600">RAM: 8.2GB</span>
          </div>
          <div className="flex items-center gap-1 neu-inset px-2 py-1 rounded">
            <Activity className="w-3 h-3 text-green-600" />
            <span className="text-green-600">NET: 1.2MB/s</span>
          </div>
        </div>
        
        {/* Status */}
        <div className="flex items-center gap-4 text-gray-600">
          <div className="flex items-center gap-1 neu-inset px-2 py-1 rounded">
            <Wifi className="w-3 h-3 text-green-600" />
            <span className="text-green-600">Connected</span>
          </div>
          <div className="flex items-center gap-1 neu-inset px-2 py-1 rounded">
            <Shield className="w-3 h-3 text-purple-600" />
            <span className="text-purple-600">Secure</span>
          </div>
          <div className="neu-inset px-2 py-1 rounded">
            <span className="text-green-600 font-bold">Gnoseon v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
