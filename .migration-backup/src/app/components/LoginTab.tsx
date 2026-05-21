import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface LoginTabProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export const LoginTab: React.FC<LoginTabProps> = ({ onSubmit, isLoading }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-gray-700 font-semibold text-sm">
          <span className="text-green-600">$</span> username:
        </Label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="masukkan_username"
          required
          disabled={isLoading}
          className="neu-inset border-0 bg-transparent text-gray-700 placeholder-gray-500 focus:neu-pressed transition-all"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">
          <span className="text-green-600">$</span> password:
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="●●●●●●●●"
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
            <span>[ENTER] Login</span>
          </span>
        )}
      </Button>
    </form>
  );
};
