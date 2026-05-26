import { useEffect, useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertCircle, BarChart3, Calendar, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock3, Download, RefreshCcw, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { NewReservationDialog } from './NewReservationDialog';
import { defaultRecentReservations, getRecentReservations, type RecentReservation } from '../data/reservationsApi';

export function ReservationsTable() {
  const [reservations, setReservations] = useState<RecentReservation[]>(defaultRecentReservations);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [dataSource, setDataSource] = useState<'api' | 'default'>('default');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const syncReservations = async () => {
    setLoadingReservations(true);
    const response = await getRecentReservations();

    setReservations(response.reservations);
    setDataSource(response.source);
    setLastSync(new Date());
    setLoadingReservations(false);
  };

  useEffect(() => {
    void syncReservations();
  }, []);

  const sourceInfo = useMemo(() => {
    if (loadingReservations) {
      return {
        label: 'Sincronizando reservas...',
        className: 'bg-blue-600 text-white hover:bg-blue-600',
      };
    }

    if (dataSource === 'api') {
      return {
        label: 'Dados da API externa',
        className: 'bg-emerald-600 text-white hover:bg-emerald-600',
      };
    }

    return {
      label: 'Valores padrao de exibicao',
      className: 'bg-amber-500 text-white hover:bg-amber-500',
    };
  }, [dataSource, loadingReservations]);

  const lastSyncLabel = useMemo(() => {
    if (!lastSync) {
      return 'Sincronizacao pendente';
    }

    return `Ultima sincronizacao: ${lastSync.toLocaleTimeString('pt-BR')}`;
  }, [lastSync]);

  const reservationSummary = useMemo(() => {
    const total = reservations.length;
    const active = reservations.filter((reservation) => reservation.status === 'Ativa').length;
    const completed = reservations.filter((reservation) => reservation.status === 'Concluida').length;
    const canceled = reservations.filter((reservation) => reservation.status === 'Cancelada').length;

    return { total, active, completed, canceled };
  }, [reservations]);

  const occupancyRate = useMemo(() => {
    if (reservationSummary.total === 0) {
      return 0;
    }

    return Math.round((reservationSummary.active / reservationSummary.total) * 100);
  }, [reservationSummary]);

  const upcomingAgenda = useMemo(() => {
    return reservations
      .filter((reservation) => reservation.status === 'Ativa')
      .slice(0, 4);
  }, [reservations]);

  const getStatusClass = (status: RecentReservation['status']) => {
    if (status === 'Concluida') {
      return 'bg-blue-600 hover:bg-blue-700 text-white';
    }

    if (status === 'Cancelada') {
      return 'bg-rose-600 hover:bg-rose-700 text-white';
    }

    return 'bg-emerald-600 hover:bg-emerald-700 text-white';
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6">
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1f3c68]">Reservas Recentes</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{lastSyncLabel}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={sourceInfo.className}>{sourceInfo.label}</Badge>
          <Button
            onClick={() => void syncReservations()}
            variant="outline"
            disabled={loadingReservations}
            className="flex items-center gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${loadingReservations ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {dataSource === 'default' && !loadingReservations && (
        <div className="mb-5 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          API indisponivel no momento. Exibindo valores padrao automaticamente.
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">Total de reservas</p>
          <p className="text-2xl font-bold text-[#1f3c68] dark:text-blue-300 mt-1">{reservationSummary.total}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">No recorte exibido</p>
        </div>

        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Ativas</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{reservationSummary.active}</p>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-500 mt-1">Em andamento ou futuras</p>
        </div>

        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-400">Concluidas</p>
            <BarChart3 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{reservationSummary.completed}</p>
          <p className="text-xs text-blue-700/80 dark:text-blue-500 mt-1">Historico recente</p>
        </div>

        <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-rose-700 dark:text-rose-400">Canceladas</p>
            <XCircle className="w-4 h-4 text-rose-700 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1">{reservationSummary.canceled}</p>
          <p className="text-xs text-rose-700/80 dark:text-rose-500 mt-1">Demandas com replanejamento</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Select>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sala" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="101">Sala 101</SelectItem>
            <SelectItem value="102">Sala 102</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Data" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="joao">João Silva</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativa</SelectItem>
          </SelectContent>
        </Select>

        <Button className="ml-auto bg-green-700 hover:bg-green-800 text-white flex items-center gap-2">
          Exportar
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="border dark:border-zinc-700 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-zinc-800">
              <TableHead className="font-semibold">Sala</TableHead>
              <TableHead className="font-semibold">Data</TableHead>
              <TableHead className="font-semibold">Horário</TableHead>
              <TableHead className="font-semibold">Responsável</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.length > 0 ? (
              reservations.map((reservation) => (
                <TableRow key={reservation.id} className="h-14">
                  <TableCell className="font-medium">{reservation.room}</TableCell>
                  <TableCell>{reservation.date}</TableCell>
                  <TableCell>{reservation.time}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#dbe8f9] dark:bg-blue-800 text-[#1f3c68] dark:text-blue-200 rounded-full flex items-center justify-center text-xs font-bold">
                        {reservation.avatar}
                      </div>
                      <span>{reservation.responsible}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusClass(reservation.status)}>{reservation.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-16 text-center text-gray-500 dark:text-zinc-400">
                  Nenhuma reserva recente encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock3 className="w-4 h-4 text-[#1f3c68] dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-[#1f3c68] dark:text-blue-300">Proximas reservas ativas</h3>
          </div>

          {upcomingAgenda.length > 0 ? (
            <div className="space-y-2">
              {upcomingAgenda.map((reservation) => (
                <div key={`agenda-${reservation.id}`} className="flex items-center justify-between rounded-md border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{reservation.room}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{reservation.responsible}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#1f3c68] dark:text-blue-300 font-semibold">{reservation.time}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{reservation.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-zinc-400">Sem reservas ativas para o periodo atual.</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-[#1f3c68] dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-[#1f3c68] dark:text-blue-300">Resumo operacional do turno</h3>
          </div>

          <p className="text-sm text-gray-600 dark:text-zinc-400 mb-3">
            Taxa estimada de ocupacao com base nas reservas ativas do recorte atual.
          </p>

          <div className="h-2.5 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden mb-3">
            <div className="h-full bg-gradient-to-r from-[#1f5ea4] to-[#1f8c6d]" style={{ width: `${occupancyRate}%` }} />
          </div>

          <p className="text-sm font-semibold text-[#1f3c68] dark:text-blue-300 mb-3">{occupancyRate}% de ocupacao prevista</p>

          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-zinc-400">
            <div className="rounded-md border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 px-3 py-2">
              Janela de pico: 10:00 - 12:00
            </div>
            <div className="rounded-md border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 px-3 py-2">
              Tempo medio de uso: 1h30
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button variant="outline" size="sm" className="w-9 h-9 p-0">
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" className="w-9 h-9 p-0">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="default" size="sm" className="w-9 h-9 p-0 bg-[#1f3c68] hover:bg-[#2d4d7f]">
          1
        </Button>
        <Button variant="outline" size="sm" className="w-9 h-9 p-0">
          2
        </Button>
        <Button variant="outline" size="sm" className="w-9 h-9 p-0">
          3
        </Button>
        <Button variant="outline" size="sm" className="w-9 h-9 p-0">
          4
        </Button>
        <Button variant="outline" size="sm" className="w-9 h-9 p-0">
          5
        </Button>
        <span className="px-2">...</span>
        <Button variant="outline" size="sm" className="w-9 h-9 p-0">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" className="w-9 h-9 p-0">
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 mt-8">
        <NewReservationDialog />
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
        <Select>
          <SelectTrigger className="w-40 ml-auto">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <SelectValue placeholder="Exportar" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="excel">Excel</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}