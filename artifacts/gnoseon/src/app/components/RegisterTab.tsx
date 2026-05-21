import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface RegisterTabProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onGenerateRandomPassword: () => string;
}

export const RegisterTab: React.FC<RegisterTabProps> = ({ 
  onSubmit, 
  isLoading, 
  onGenerateRandomPassword 
}) => {
  const handleRndPassword = () => {
    const randomPassword = onGenerateRandomPassword();
    const input = document.getElementById('regPassword') as HTMLInputElement;
    const confirmInput = document.getElementById('confirmPassword') as HTMLInputElement;
    if (input && confirmInput) {
      input.value = randomPassword;
      confirmInput.value = randomPassword;
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="regUsername" className="text-gray-700 font-semibold text-sm">
          <span className="text-green-600">$</span> username:
        </Label>
        <Input
          id="regUsername"
          name="regUsername"
          type="text"
          placeholder="pilih_username"
          required
          disabled={isLoading}
          className="neu-inset border-0 bg-transparent text-gray-700 placeholder-gray-500 focus:neu-pressed transition-all"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-gray-700 font-semibold text-sm">
          <span className="text-green-600">$</span> display_name:
        </Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          placeholder="Nama Tampilan"
          required
          disabled={isLoading}
          className="neu-inset border-0 bg-transparent text-gray-700 placeholder-gray-500 focus:neu-pressed transition-all"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="regPassword" className="text-gray-700 font-semibold text-sm">
          <span className="text-green-600">$</span> password:
        </Label>
        <div className="flex gap-2">
          <Input
            id="regPassword"
            name="regPassword"
            type="password"
            placeholder="minimal_6_karakter"
            required
            disabled={isLoading}
            className="flex-1 neu-inset border-0 bg-transparent text-gray-700 placeholder-gray-500 focus:neu-pressed transition-all"
          />
          <Button
            type="button"
            className="neu-raised border-0 text-gray-600 hover:neu-pressed transition-all px-3"
            size="sm"
            onClick={handleRndPassword}
            disabled={isLoading}
          >
            <span className="text-purple-600 font-semibold">[RND]</span>
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold text-sm">
          <span className="text-green-600">$</span> confirm_password:
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="ulangi_password"
          required
          disabled={isLoading}
          className="neu-inset border-0 bg-transparent text-gray-700 placeholder-gray-500 focus:neu-pressed transition-all"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full neu-raised-green border-0 text-green-700 font-semibold hover:neu-pressed transition-all"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="text-green-600">█</span>
            <span>processing...</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="text-green-600">►</span>
            <span>[ENTER] Register</span>
          </span>
        )}
      </Button>
    </form>
  );
};
