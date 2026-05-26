import { ArrowRight, LogIn, Moon, Sparkles, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { useNavigate } from 'react-router';

export function Header() {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <header className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-4 md:px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-zinc-700">
      <div className="flex items-center gap-4">
        {/* Logo IFMS */}
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded grid grid-cols-3 gap-0.5 p-1">
          <div className="bg-white rounded-sm"></div>
          <div className="bg-white rounded-sm"></div>
          <div className="bg-white rounded-sm"></div>
          <div className="bg-white rounded-sm"></div>
          <div className="bg-white rounded-sm"></div>
          <div className="bg-white rounded-sm"></div>
          <div className="bg-white rounded-sm"></div>
          <div className="bg-white rounded-sm"></div>
          <div className="bg-white rounded-sm"></div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg dark:text-white">IFMS</span>
          <div className="w-px h-6 bg-gray-300 dark:bg-zinc-600"></div>
          <span className="text-sm md:text-lg dark:text-zinc-200">Central de Salas IFMS</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 text-xs text-[#1f3c68] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800 px-3 py-2 rounded-full">
          <Sparkles className="w-4 h-4" />
          Acesso publico para consulta de salas
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="rounded-full h-10 w-10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Alternar tema"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        <Button
          onClick={handleLogin}
          className="rounded-full h-10 px-5 bg-gradient-to-r from-[#143f74] via-[#1f5ea4] to-[#1f8c6d] hover:from-[#123a68] hover:via-[#1b528f] hover:to-[#1b7a5f] text-white border border-white/20 shadow-[0_10px_24px_-14px_rgba(20,63,116,0.95)] flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Logar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}