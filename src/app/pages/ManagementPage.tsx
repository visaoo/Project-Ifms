import { useState, useEffect, useMemo } from 'react';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { Filters } from '../components/Filters';
import { RoomMap } from '../components/RoomMap';
import { RoomInfo } from '../components/RoomInfo';
import { ReservationsTable } from '../components/ReservationsTable';
import { useFloorMap, useBlocks } from '../hooks/useFloorMap';
import { authApi } from '../services/authService';
import type { GridData, RoomDetails } from '../data/roomsApi';

interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  tipo: string;
  created_at: string;
}

type ManagementSection = 'cadastro' | 'reservas' | 'usuarios';

interface ManagementPageProps {
  section?: ManagementSection;
}

const sectionMeta: Record<ManagementSection, { title: string; subtitle: string }> = {
  cadastro: {
    title: 'Cadastro e Mapa de Salas',
    subtitle: 'Gerencie o layout dos blocos e os detalhes das salas em um unico fluxo.',
  },
  reservas: {
    title: 'Gestao de Reservas',
    subtitle: 'Acompanhe a ocupacao, sincronize dados e exporte relatorios operacionais.',
  },
  usuarios: {
    title: 'Gestao de Usuarios',
    subtitle: 'Centralize perfis de acesso, papeis e responsaveis pelo uso das salas.',
  },
};

export function ManagementPage({ section = 'cadastro' }: ManagementPageProps) {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [blockId, setBlockId] = useState('A');
  const [floorId, setFloorId] = useState('A-1');
  const [detailsCollapseSignal, setDetailsCollapseSignal] = useState(0);

  const { blocks } = useBlocks();
  const { floor, loading, saving, saveLayout, saveRoomDetails } = useFloorMap(blockId, floorId);

  // Quando muda o bloco, seleciona o primeiro andar disponível
  useEffect(() => {
    const block = blocks.find(b => b.id === blockId);
    if (block && block.floors.length > 0) {
      setFloorId(block.floors[0].id);
    }
  }, [blockId, blocks]);

  const floorLabel = floor
    ? `${floor.name} – Bloco ${blockId}`
    : 'Carregando...';

  const selectedRoomTile = useMemo(() => {
    if (!floor || !selectedRoom) return null;

    const roomEntry = Object.values(floor.grid).find(tile => (
      tile.type === 'room' && tile.label === selectedRoom
    ));

    return roomEntry ?? null;
  }, [floor, selectedRoom]);

  const handleSaveLayout = async (grid: GridData, cols: number, rows: number) => {
    await saveLayout({ grid, cols, rows });
    setDetailsCollapseSignal(signal => signal + 1);
  };

  const handleSaveRoomDetails = async (roomLabel: string, detailsPatch: RoomDetails) => {
    await saveRoomDetails(roomLabel, detailsPatch);
    setDetailsCollapseSignal(signal => signal + 1);
  };

  const [users, setUsers] = useState<Usuario[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ nome: '', email: '', senha: '', tipo: 'coordenador' });

  const fetchUsers = () => {
    setUsersLoading(true);
    authApi.get<{ usuarios: Usuario[] }>('/usuarios')
      .then(res => setUsers(res.data.usuarios ?? []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  };

  useEffect(() => {
    if (section !== 'usuarios') return;
    fetchUsers();
  }, [section]);

  const handleDelete = async (id: number) => {
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      await authApi.delete(`/usuarios/${id}`);
      setUsers(prev => prev.filter(u => u.id_usuario !== id));
    } finally {
      setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleCreateUser = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSaving(true);
    setFormError('');
    try {
      await authApi.post('/usuarios', form);
      setModalOpen(false);
      setForm({ nome: '', email: '', senha: '', tipo: 'admin' });
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: { mensagem?: string } | string } } })
        ?.response?.data?.detail;
      setFormError(typeof msg === 'object' ? msg?.mensagem ?? 'Erro ao criar usuário' : String(msg ?? 'Erro ao criar usuário'));
    } finally {
      setFormSaving(false);
    }
  };

  const meta = sectionMeta[section];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-950">
      <Header />
      <Navigation />

      <div className="max-w-[1280px] mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1f3c68] mb-2">
            {meta.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">{meta.subtitle}</p>
          <div className="h-px bg-gray-200 dark:bg-zinc-700"></div>
        </div>

        {section === 'cadastro' && (
          <>
            <div className="mb-8">
              <Filters
                blockId={blockId}
                floorId={floorId}
                onBlockChange={setBlockId}
                onFloorChange={setFloorId}
              />
            </div>

            {loading ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-12 flex items-center justify-center text-gray-400 dark:text-zinc-500 gap-3 mb-8">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Carregando mapa...
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-8 items-start">
                <RoomMap
                  floorName={floorLabel}
                  initialGrid={floor?.grid}
                  initialCols={floor?.cols}
                  initialRows={floor?.rows}
                  onSave={handleSaveLayout}
                  saving={saving}
                  onRoomSelect={setSelectedRoom}
                />
                <RoomInfo
                  roomId={selectedRoom}
                  blockId={blockId}
                  floorName={floor?.name ?? ''}
                  roomTile={selectedRoomTile}
                  saving={saving}
                  collapseSignal={detailsCollapseSignal}
                  onSaveDetails={handleSaveRoomDetails}
                />
              </div>
            )}
          </>
        )}

        {section === 'reservas' && (
          <>
            <div className="mb-6 rounded-xl border border-blue-100 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-900/20 px-4 py-3 text-sm text-[#1f3c68] dark:text-blue-300">
              Visualizacao dedicada para operacao de reservas. Os dados abaixo ajudam no acompanhamento diario da ocupacao.
            </div>
            <ReservationsTable />
          </>
        )}

        {section === 'usuarios' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">Usuarios ativos</p>
                <p className="text-3xl font-bold text-[#1f3c68] mt-2">32</p>
                <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">Com acesso operacional ao sistema</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">Perfis administrativos</p>
                <p className="text-3xl font-bold text-emerald-700 mt-2">6</p>
                <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">Permissao para editar mapa e detalhes</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">Aguardando aprovacao</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">3</p>
                <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">Solicitacoes pendentes de liberacao</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#1f3c68]">Usuarios cadastrados</h2>
                <button
                  onClick={() => { setFormError(''); setModalOpen(true); }}
                  className="flex items-center gap-2 bg-[#1f3c68] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#16305a] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Novo usuario
                </button>
              </div>
              <div className="overflow-x-auto">
                {usersLoading ? (
                  <div className="flex items-center justify-center gap-3 py-10 text-gray-400">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Carregando usuarios...
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b bg-gray-50">
                        <th className="py-3 px-3 font-semibold">ID</th>
                        <th className="py-3 px-3 font-semibold">Nome</th>
                        <th className="py-3 px-3 font-semibold">Email</th>
                        <th className="py-3 px-3 font-semibold">Tipo</th>
                        <th className="py-3 px-3 font-semibold">Cadastrado em</th>
                        <th className="py-3 px-3 font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id_usuario} className="border-b last:border-b-0 hover:bg-gray-50/70">
                          <td className="py-3 px-3 font-medium text-[#1f3c68]">{user.id_usuario}</td>
                          <td className="py-3 px-3">{user.nome}</td>
                          <td className="py-3 px-3 text-gray-600">{user.email}</td>
                          <td className="py-3 px-3">
                            <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
                              {user.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-600">
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleDelete(user.id_usuario)}
                              disabled={deletingIds.has(user.id_usuario)}
                              className="flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {deletingIds.has(user.id_usuario) ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
                                </svg>
                              )}
                              Deletar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-[#1f3c68] dark:text-blue-300 mb-2">Regras de permissao</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                Administradores podem editar layout e detalhes de sala. Coordenadores validam reservas e servidores registram uso.
                Mantenha a revisao de perfis em ciclo mensal para reduzir riscos operacionais.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-600 dark:text-zinc-500">
          © 2026 IFMS - Instituto Federal de Mato Grosso do Sul
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#1f3c68]">Novo usuario</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f3c68]/30 focus:border-[#1f3c68]"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f3c68]/30 focus:border-[#1f3c68]"
                  placeholder="email@ifms.edu.br"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  required
                  value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f3c68]/30 focus:border-[#1f3c68]"
                  placeholder="Senha"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f3c68]/30 focus:border-[#1f3c68]"
                >
                  <option value="coordenador">Coordenador</option>
                  <option value="professor">Professor</option>
                  <option value="aluno">Aluno</option>
                </select>
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-semibold py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex-1 bg-[#1f3c68] text-white text-sm font-semibold py-2 rounded-lg hover:bg-[#16305a] disabled:opacity-50 transition-colors"
                >
                  {formSaving ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
