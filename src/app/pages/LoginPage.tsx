import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { isAxiosError } from 'axios';
import { ArrowLeft, Loader2, LogIn } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';

const authDefaults = {
  email: 'visitante@ifms.edu.br',
  senha: 'senha123',
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState(authDefaults.email);
  const [password, setPassword] = useState(authDefaults.senha);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Informe e-mail e senha para continuar.');
      return;
    }

    setLoading(true);
    try {
      await login({ email, senha: password }, rememberMe);
      navigate('/inicio');
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          setErrorMessage('E-mail ou senha incorretos.');
        } else if (status && status >= 500) {
          setErrorMessage('Erro no servidor. Tente novamente em instantes.');
        } else if (err.code === 'ECONNABORTED' || !err.response) {
          setErrorMessage('Nao foi possivel conectar ao servidor. Verifique sua conexao.');
        } else {
          setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
        }
      } else {
        setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f6f9ff] via-[#eef4ff] to-[#eefaf3] dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950"
      style={{ fontFamily: 'var(--font-body, "Segoe UI", sans-serif)' }}
    >
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #ffffff 0%, transparent 45%), radial-gradient(circle at 80% 30%, #dce9ff 0%, transparent 35%)' }} />
      <div className="absolute -left-24 top-[-4rem] h-80 w-80 rounded-full bg-[#2d5a8f]/20 blur-3xl animate-pulse" />
      <div className="absolute -right-20 bottom-[-6rem] h-96 w-96 rounded-full bg-[#28a36b]/20 blur-3xl animate-pulse" />

      <div
        className={`relative mx-auto flex min-h-screen w-full max-w-lg items-center justify-center px-4 py-10 md:px-8 transition-all duration-700 ${
          isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <section className="w-full rounded-3xl border border-white/70 dark:border-zinc-700/50 bg-white/85 dark:bg-zinc-900/90 p-6 md:p-10 shadow-[0_24px_80px_-36px_rgba(31,60,104,0.65)] backdrop-blur-xl">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/inicio')}
              className="mb-6 -ml-3 text-[#1f3c68] dark:text-blue-400 hover:bg-[#1f3c68]/5 dark:hover:bg-blue-400/10"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para inicio
            </Button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl grid grid-cols-3 gap-1 p-2 shadow-lg">
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

              <div>
                <p className="text-sm text-[#45618a] dark:text-blue-400 uppercase tracking-[0.16em]">Acesso seguro</p>
                <h1 className="text-3xl font-semibold text-[#1a2f4f] dark:text-white" style={{ fontFamily: 'var(--font-heading, "Trebuchet MS", sans-serif)' }}>
                  Login IFMS
                </h1>
              </div>
            </div>

            <p className="text-sm text-[#5f6d82] dark:text-zinc-400 mb-6">
              Tela preparada para autenticacao com API externa. Os campos ja iniciam com valores default para facilitar testes.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#243b5d] dark:text-zinc-300">
                  E-mail institucional
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@ifms.edu.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-[#c9d8eb] dark:border-zinc-600 bg-white dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#243b5d]">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 border-[#c9d8eb] dark:border-zinc-600 bg-white dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-sm text-[#4e6078] dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#9fb8db] accent-[#1f3c68]"
                  />
                  Manter sessao ativa
                </label>

                <button type="button" className="text-sm text-[#1f3c68] dark:text-blue-400 hover:text-[#12325a] dark:hover:text-blue-300 transition-colors text-left">
                  Recuperar senha
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-[#1f3c68] hover:bg-[#163056] text-white font-semibold shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Entrar com conta IFMS
                  </>
                )}
              </Button>

              {errorMessage && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {errorMessage}
                </p>
              )}
            </form>

            <p className="mt-6 text-xs text-[#5f6d82] dark:text-zinc-500 leading-relaxed">
              Ao autenticar, a aplicacao utilizara o endpoint padrao configurado nesta tela ate a API oficial ser integrada.
            </p>
        </section>
      </div>

      <div className="relative text-center pb-6 text-xs text-[#5f6d82] dark:text-zinc-500">
        © 2026 Instituto Federal de Mato Grosso do Sul
      </div>
    </main>
  );
}
