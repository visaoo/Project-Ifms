import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  Wrench,
  Bath,
  ArrowUpDown,
  DoorOpen,
  Pencil,
  Eye,
  X,
  GripVertical,
  Minus,
  Save,
  Loader2,
} from 'lucide-react';
import type { GridData, Tile, TileType } from '../data/roomsApi';

interface RoomMapProps {
  /** Label exibido no header, ex: "1º Andar – Bloco A" */
  floorName?: string;
  /** Grid vindo da API */
  initialGrid?: GridData;
  initialCols?: number;
  initialRows?: number;
  /** Se true: esconde botão Editar Layout */
  readOnly?: boolean;
  /** Chamado ao clicar Salvar no modo edição */
  onSave?: (grid: GridData, cols: number, rows: number) => Promise<void>;
  saving?: boolean;
  onRoomSelect: (roomId: string) => void;
}

// ─── Constantes ────────────────────────────────────────────────────
const FALLBACK_COLS = 5;
const FALLBACK_ROWS = 3;
const MIN_SIZE = 2;
const MAX_SIZE = 12;

// Grid vazio usado como fallback enquanto a API carrega
const FALLBACK_GRID: GridData = {};

const PALETTE_ITEMS: { type: TileType; label: string }[] = [
  { type: 'room', label: 'Sala' },
  { type: 'corridor', label: 'Corredor' },
  { type: 'bathroom', label: 'Banheiro' },
  { type: 'stairs', label: 'Escada' },
  { type: 'entrance', label: 'Entrada' },
  { type: 'wall', label: 'Parede' },
];

// ─── Helpers de estilo ─────────────────────────────────────────────
function getTileBg(tile: Tile, isOver = false, isDragging = false): string {
  let bg = '';
  switch (tile.type) {
    case 'room':
      if (tile.status === 'occupied') bg = 'bg-red-600';
      else if (tile.status === 'maintenance') bg = 'bg-gray-400';
      else bg = 'bg-green-600';
      break;
    case 'corridor': bg = 'bg-gray-300'; break;
    case 'bathroom': bg = 'bg-blue-200'; break;
    case 'stairs': bg = 'bg-orange-200'; break;
    case 'entrance': bg = 'bg-purple-200'; break;
    case 'wall': bg = 'bg-gray-700'; break;
  }
  return [
    bg,
    'rounded-lg transition-all',
    isDragging ? 'opacity-30' : '',
    isOver ? 'ring-2 ring-blue-400 ring-offset-1' : '',
  ].join(' ');
}

function getTileTextColor(type: TileType): string {
  if (type === 'room') return 'text-white';
  if (type === 'wall') return 'text-gray-100';
  if (type === 'bathroom') return 'text-blue-800';
  if (type === 'stairs') return 'text-orange-800';
  if (type === 'entrance') return 'text-purple-800';
  return 'text-gray-700';
}

function getPaletteBg(type: TileType): string {
  switch (type) {
    case 'room': return 'bg-green-600 text-white';
    case 'corridor': return 'bg-gray-300 text-gray-700';
    case 'bathroom': return 'bg-blue-200 text-blue-800';
    case 'stairs': return 'bg-orange-200 text-orange-800';
    case 'entrance': return 'bg-purple-200 text-purple-800';
    case 'wall': return 'bg-gray-700 text-gray-100';
  }
}

function TileIcon({ type, className = 'w-4 h-4' }: { type: TileType; className?: string }) {
  if (type === 'bathroom') return <Bath className={className} />;
  if (type === 'stairs') return <ArrowUpDown className={className} />;
  if (type === 'entrance') return <DoorOpen className={className} />;
  if (type === 'wall') return <Minus className={className} />;
  if (type === 'corridor') return <GripVertical className={className} />;
  return null;
}

// ─── Paleta: item arrastável ────────────────────────────────────────
function PaletteItem({ type, label }: { type: TileType; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: 'palette', tileType: type },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title={`Arrastar para adicionar: ${label}`}
      className={[
        'cursor-grab active:cursor-grabbing px-3 py-2 rounded-lg text-sm font-medium',
        'flex items-center gap-2 select-none transition-opacity shadow-sm',
        isDragging ? 'opacity-30' : 'hover:brightness-95',
        getPaletteBg(type),
      ].join(' ')}
    >
      <TileIcon type={type} />
      {label}
    </div>
  );
}

// ─── Célula do grid ─────────────────────────────────────────────────
function GridCell({
  cellId,
  tile,
  isSelected,
  isEditMode,
  onSelect,
  onRemove,
}: {
  cellId: string;
  tile?: Tile;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: (label: string) => void;
  onRemove: (cellId: string) => void;
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: cellId,
    data: { type: 'cell', cellId },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `grid-${cellId}`,
    data: { source: 'grid', cellId, tile },
    disabled: !isEditMode || !tile,
  });

  const setRef = useCallback(
    (el: HTMLElement | null) => {
      setDropRef(el);
      setDragRef(el);
    },
    [setDropRef, setDragRef]
  );

  const isEmpty = !tile;
  const isRoom = tile?.type === 'room';

  return (
    <div
      ref={setRef}
      className={[
        'relative h-20 flex items-center justify-center select-none',
        isEmpty
          ? isOver
            ? 'rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'rounded-lg border-2 border-dashed border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-500 transition-colors'
          : getTileBg(tile!, isOver, isDragging),
        isSelected && !isEmpty ? 'ring-2 ring-offset-2 ring-yellow-400' : '',
        isRoom ? 'cursor-pointer' : '',
        isEditMode && tile ? 'cursor-grab active:cursor-grabbing' : '',
        'group',
      ].join(' ')}
      style={{ touchAction: 'none' }}
      onClick={() => isRoom ? onSelect(tile!.label ?? cellId) : undefined}
      {...(isEditMode && tile ? attributes : {})}
    >
      {tile ? (
        <div
          className={[
            'w-full h-full flex flex-col items-center justify-center p-1',
            getTileTextColor(tile.type),
          ].join(' ')}
          {...(isEditMode ? listeners : {})}
        >
          {/* Botão remover */}
          {isEditMode && (
            <button
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-white/30 hover:bg-red-500 hover:text-white rounded p-0.5 transition-all z-10"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onRemove(cellId); }}
              title="Remover"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Ícone */}
          <TileIcon type={tile.type} className="w-4 h-4 mb-0.5 shrink-0" />

          {/* Label */}
          <span className="text-xs font-semibold text-center leading-tight px-1">
            {tile.type === 'room' && tile.status === 'maintenance' && (
              <Wrench className="w-3 h-3 inline mr-0.5" />
            )}
            {tile.label || PALETTE_ITEMS.find(p => p.type === tile.type)?.label}
          </span>

          {/* Indicador de porta (salas) */}
          {tile.type === 'room' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-1 bg-white/40 rounded-t" />
          )}
        </div>
      ) : (
        isOver ? (
          <span className="text-xs text-blue-400 font-medium pointer-events-none">Soltar aqui</span>
        ) : null
      )}
    </div>
  );
}

// ─── Overlay card ao arrastar ───────────────────────────────────────
function OverlayCard({ tile, type }: { tile?: Tile; type?: TileType }) {
  const resolved = tile ?? { type: type!, label: PALETTE_ITEMS.find(p => p.type === type)?.label };
  return (
    <div
      className={[
        'h-20 w-28 rounded-lg flex flex-col items-center justify-center shadow-2xl',
        'rotate-3 scale-105',
        getTileBg(resolved as Tile),
        getTileTextColor(resolved.type!),
      ].join(' ')}
    >
      <TileIcon type={resolved.type!} className="w-4 h-4 mb-1" />
      <span className="text-xs font-semibold text-center px-1">
        {resolved.label || PALETTE_ITEMS.find(p => p.type === resolved.type)?.label}
      </span>
    </div>
  );
}

// ─── Componente Principal ───────────────────────────────────────────
export function RoomMap({
  floorName,
  initialGrid,
  initialCols,
  initialRows,
  readOnly = false,
  onSave,
  saving = false,
  onRoomSelect,
}: RoomMapProps) {
  const [grid, setGrid] = useState<GridData>(initialGrid ?? FALLBACK_GRID);
  const [selectedCell, setSelectedCell] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeDrag, setActiveDrag] = useState<{
    source: 'palette' | 'grid';
    tileType?: TileType;
    tile?: Tile;
  } | null>(null);
  const [roomCounter, setRoomCounter] = useState(109);
  const [cols, setCols] = useState(initialCols ?? FALLBACK_COLS);
  const [rows, setRows] = useState(initialRows ?? FALLBACK_ROWS);

  // Sincroniza quando o andar selecionado muda (props chegam do hook)
  useEffect(() => {
    setGrid(initialGrid ?? FALLBACK_GRID);
    setCols(initialCols ?? FALLBACK_COLS);
    setRows(initialRows ?? FALLBACK_ROWS);
    setSelectedCell('');
    setIsEditMode(false);
  }, [initialGrid, initialCols, initialRows]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleSave = async () => {
    if (onSave) await onSave(grid, cols, rows);
    setIsEditMode(false);
  };

  // Ao reduzir o grid, remove células fora dos limites
  const changeSize = (axis: 'cols' | 'rows', delta: number) => {
    if (axis === 'cols') {
      const next = Math.min(MAX_SIZE, Math.max(MIN_SIZE, cols + delta));
      if (next < cols) {
        setGrid(prev => {
          const cleaned = { ...prev };
          Object.keys(cleaned).forEach(key => {
            const col = parseInt(key.split('-')[1]);
            if (col >= next) delete cleaned[key];
          });
          return cleaned;
        });
      }
      setCols(next);
    } else {
      const next = Math.min(MAX_SIZE, Math.max(MIN_SIZE, rows + delta));
      if (next < rows) {
        setGrid(prev => {
          const cleaned = { ...prev };
          Object.keys(cleaned).forEach(key => {
            const row = parseInt(key.split('-')[0]);
            if (row >= next) delete cleaned[key];
          });
          return cleaned;
        });
      }
      setRows(next);
    }
  };

  const handleSelect = (label: string) => {
    const cellId = Object.keys(grid).find(k => grid[k].label === label) ?? label;
    setSelectedCell(cellId);
    onRoomSelect(label);
  };

  const handleRemove = (cellId: string) => {
    setGrid(prev => {
      const next = { ...prev };
      delete next[cellId];
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as {
      source: 'palette' | 'grid';
      tileType?: TileType;
      tile?: Tile;
    };
    setActiveDrag(data);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as {
      source: 'palette' | 'grid';
      tileType?: TileType;
      cellId?: string;
      tile?: Tile;
    };
    const targetCellId = over.id as string;

    if (targetCellId.startsWith('palette-')) return;

    if (activeData.source === 'palette') {
      const type = activeData.tileType!;
      let newTile: Tile = { type };
      if (type === 'room') {
        newTile = { type: 'room', label: `Sala ${roomCounter}`, status: 'available' };
        setRoomCounter(c => c + 1);
      } else {
        newTile = { type, label: PALETTE_ITEMS.find(p => p.type === type)?.label };
      }
      setGrid(prev => ({ ...prev, [targetCellId]: newTile }));
    } else if (activeData.source === 'grid') {
      const fromCellId = activeData.cellId!;
      if (fromCellId === targetCellId) return;
      setGrid(prev => {
        const next = { ...prev };
        const movingTile = next[fromCellId];
        const targetTile = next[targetCellId];
        if (targetTile) {
          next[fromCellId] = targetTile;
        } else {
          delete next[fromCellId];
        }
        next[targetCellId] = movingTile;
        return next;
      });
      if (selectedCell === fromCellId) setSelectedCell(targetCellId);
    }
  };

  const cells = Array.from({ length: rows * cols }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    return `${row}-${col}`;
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-[#1f3c68] text-white py-3 px-4 flex items-center justify-between">
        <span className="font-medium">{floorName ?? 'Mapa'}</span>
        <div className="flex items-center gap-2">
          {/* Botão Salvar (só no modo edição) */}
          {isEditMode && onSave && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium bg-green-400 text-green-900 hover:bg-green-300 disabled:opacity-60 transition-colors"
            >
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          )}
          {/* Botão Editar / Visualizar (oculto em readOnly) */}
          {!readOnly && (
            <button
              onClick={() => setIsEditMode(v => !v)}
              className={[
                'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors',
                isEditMode
                  ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300'
                  : 'bg-white/20 hover:bg-white/30 text-white',
              ].join(' ')}
            >
              {isEditMode ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              {isEditMode ? 'Visualizar' : 'Editar Layout'}
            </button>
          )}
        </div>
      </div>

      {/* Dica contextual */}
      <div
        className={[
          'px-4 py-2 text-xs flex items-center gap-1.5 border-b transition-colors',
          isEditMode
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400',
        ].join(' ')}
      >
        {isEditMode ? (
          <>
            <Pencil className="w-3.5 h-3.5 shrink-0" />
            Arraste elementos da paleta para o grid · Mova elementos entre células · Clique em uma sala para configurar detalhes · Clique no ✕ para remover
          </>
        ) : (
          <>
            <Eye className="w-3.5 h-3.5 shrink-0" />
            Clique em uma sala para ver detalhes · Use "Editar Layout" para reorganizar o mapa
          </>
        )}
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-0">
          {/* Paleta lateral (só no modo edição) */}
          {isEditMode && (
            <div className="w-36 shrink-0 border-r dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-3 flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                Elementos
              </span>
              {PALETTE_ITEMS.map(item => (
                <PaletteItem key={item.type} type={item.type} label={item.label} />
              ))}

              {/* Controles de tamanho do grid */}
              <div className="mt-3 pt-3 border-t flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
                  Tamanho
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-zinc-400">Colunas</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => changeSize('cols', -1)}
                      disabled={cols <= MIN_SIZE}
                      className="w-6 h-6 rounded bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 disabled:opacity-40 flex items-center justify-center text-sm font-bold leading-none dark:text-zinc-200"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-xs font-semibold dark:text-zinc-200">{cols}</span>
                    <button
                      onClick={() => changeSize('cols', 1)}
                      disabled={cols >= MAX_SIZE}
                      className="w-6 h-6 rounded bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 disabled:opacity-40 flex items-center justify-center text-sm font-bold leading-none dark:text-zinc-200"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-zinc-400">Linhas</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => changeSize('rows', -1)}
                      disabled={rows <= MIN_SIZE}
                      className="w-6 h-6 rounded bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 disabled:opacity-40 flex items-center justify-center text-sm font-bold leading-none dark:text-zinc-200"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-xs font-semibold dark:text-zinc-200">{rows}</span>
                    <button
                      onClick={() => changeSize('rows', 1)}
                      disabled={rows >= MAX_SIZE}
                      className="w-6 h-6 rounded bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 disabled:opacity-40 flex items-center justify-center text-sm font-bold leading-none dark:text-zinc-200"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="flex-1 p-5">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {cells.map(cellId => (
                <GridCell
                  key={cellId}
                  cellId={cellId}
                  tile={grid[cellId]}
                  isSelected={selectedCell === cellId}
                  isEditMode={isEditMode}
                  onSelect={handleSelect}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            {/* Legenda */}
            <div className="mt-4 pt-3 border-t dark:border-zinc-700 flex items-center gap-4 flex-wrap">
              <LegendItem color="bg-green-600" text="Livre" />
              <LegendItem color="bg-red-600" text="Ocupada" />
              <LegendItem color="bg-gray-400" text="Manutenção" />
              <LegendItem color="bg-gray-300" text="Corredor" />
              <LegendItem color="bg-blue-200" text="Banheiro" />
              <LegendItem color="bg-purple-200" text="Entrada" />
              <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 dark:text-zinc-500">
                <div className="w-4 h-4 rounded ring-2 ring-yellow-400" />
                Selecionada
              </div>
            </div>
          </div>
        </div>

        {/* Clone visual ao arrastar */}
        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeDrag?.source === 'palette' && activeDrag.tileType ? (
            <OverlayCard type={activeDrag.tileType} />
          ) : activeDrag?.source === 'grid' && activeDrag.tile ? (
            <OverlayCard tile={activeDrag.tile} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function LegendItem({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-6 h-4 rounded ${color}`} />
      <span className="text-xs text-gray-600 dark:text-zinc-400">{text}</span>
    </div>
  );
}
