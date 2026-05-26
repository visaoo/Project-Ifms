import { useEffect, useState } from 'react';
import { ChevronDown, Home, ImageIcon, ListOrdered, MapPin, Plus, Save, User, Users } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { NewReservationDialog } from './NewReservationDialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { RoomDetails, Tile } from '../data/roomsApi';

interface RoomInfoProps {
  roomId: string;
  blockId: string;
  floorName: string;
  roomTile?: Tile | null;
  saving?: boolean;
  collapseSignal?: number;
  onSaveDetails?: (roomLabel: string, detailsPatch: RoomDetails) => Promise<void>;
}

const DEFAULT_PHOTO = 'https://www.hojemais.com.br/imagem/noticia/1000/1000/1598047640_62013.jpg';

function buildFallbackDetails(roomId: string, blockId: string, floorName: string): RoomDetails {
  return {
    photoUrl: DEFAULT_PHOTO,
    description: `${roomId} configurada para atividades academicas e uso diario da comunidade escolar.`,
    location: `Bloco ${blockId}, ${floorName || 'Andar nao informado'}`,
    directions: [
      'Entre pelo portao principal do campus',
      `Siga em direcao ao Bloco ${blockId}`,
      `Localize o ${floorName || 'andar selecionado'} pelas placas de orientacao`,
      `A ${roomId} fica no corredor principal`,
    ],
  };
}

export function RoomInfo({
  roomId,
  blockId,
  floorName,
  roomTile,
  saving = false,
  collapseSignal = 0,
  onSaveDetails,
}: RoomInfoProps) {
  const [formData, setFormData] = useState({
    photoUrl: DEFAULT_PHOTO,
    description: '',
    location: '',
    directionsText: '',
  });
  const [savingDetails, setSavingDetails] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isDetailsFormOpen, setIsDetailsFormOpen] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setFeedbackMessage('');
      return;
    }

    const fallback = buildFallbackDetails(roomId, blockId, floorName);
    const details = roomTile?.details ?? fallback;

    setFormData({
      photoUrl: details.photoUrl || DEFAULT_PHOTO,
      description: details.description || fallback.description || '',
      location: details.location || fallback.location || '',
      directionsText: (details.directions && details.directions.length > 0
        ? details.directions
        : fallback.directions || []
      ).join('\n'),
    });
    setFeedbackMessage('');
  }, [roomId, roomTile, blockId, floorName]);

  useEffect(() => {
    setIsDetailsFormOpen(false);
  }, [collapseSignal, roomId]);

  if (!roomId) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-lg mb-3 text-[#1f3c68]">Informações da Sala</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Clique em uma sala no mapa para visualizar e editar foto, descricao, localizacao e passos para chegar.
        </p>
      </div>
    );
  }

  const roomStatus = roomTile?.status ?? 'available';
  const roomCapacity = roomTile?.capacity ?? 30;
  const roomCategory = roomTile?.category ?? 'Sala comum';
  const roomReservations = roomTile?.reservations ?? [];
  const defaultReservationRoom = roomId.startsWith('Sala ') ? roomId.replace('Sala ', '') : '';

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveDetails) return;

    const directions = formData.directionsText
      .split('\n')
      .map(step => step.trim())
      .filter(Boolean);

    setSavingDetails(true);
    setFeedbackMessage('');
    try {
      await onSaveDetails(roomId, {
        photoUrl: formData.photoUrl.trim() || DEFAULT_PHOTO,
        description: formData.description.trim(),
        location: formData.location.trim(),
        directions,
      });
      setFeedbackMessage('Detalhes da sala salvos com sucesso.');
      setIsDetailsFormOpen(false);
    } finally {
      setSavingDetails(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="font-semibold text-lg mb-4 text-[#1f3c68]">
            Informações da Sala
          </h3>

          <div className="space-y-3">
            <h4 className="font-bold text-2xl">{roomId}</h4>
            
            <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
              <Users className="w-4 h-4" />
              <span className="text-sm">{roomCapacity} lugares</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
              <Home className="w-4 h-4" />
              <span className="text-sm">{roomCategory}</span>
            </div>

            <Badge
              className={`${
                roomStatus === 'occupied'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white px-4 py-1`}
            >
              {roomStatus === 'occupied' ? 'Ocupada' : 'Disponivel'}
            </Badge>
          </div>
        </div>

        {/* Reservations */}
        <div className="border-t dark:border-zinc-700 pt-6">
          <h3 className="font-semibold text-base mb-4 dark:text-zinc-200">Reservas Agendadas</h3>

          {roomReservations.length > 0 ? (
            <div className="space-y-3">
              {roomReservations.map((reservation, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {reservation.date}, {reservation.time}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                        Reservado por: {reservation.user}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Nenhuma reserva agendada</p>
          )}

          <NewReservationDialog
            defaultRoom={defaultReservationRoom}
            trigger={
              <Button className="w-full mt-4 bg-[#4a90e2] hover:bg-[#3a7bc8] text-white flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Nova Reserva
              </Button>
            }
          />
        </div>

        {/* Formulario de configuracao dinamica */}
        <div className="border-t dark:border-zinc-700 pt-6">
          <button
            type="button"
            onClick={() => setIsDetailsFormOpen(open => !open)}
            aria-expanded={isDetailsFormOpen}
            className="w-full flex items-center justify-between rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-sm font-semibold text-[#1f3c68] dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <span>Detalhes dinamicos da sala</span>
            <ChevronDown
              className={[
                'w-4 h-4 transition-transform',
                isDetailsFormOpen ? 'rotate-180' : '',
              ].join(' ')}
            />
          </button>

          {feedbackMessage && (
            <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              {feedbackMessage}
            </p>
          )}

          {isDetailsFormOpen && (
            <form onSubmit={handleSaveDetails} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="room-photo" className="flex items-center gap-2 text-sm">
                  <ImageIcon className="w-4 h-4" />
                  Foto (URL)
                </Label>
                <Input
                  id="room-photo"
                  placeholder="https://..."
                  value={formData.photoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                />
              </div>

              <div className="rounded-lg overflow-hidden border dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                <ImageWithFallback
                  src={formData.photoUrl || DEFAULT_PHOTO}
                  alt={roomId}
                  className="w-full h-36 object-cover"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-description" className="text-sm">Descricao da sala</Label>
                <Textarea
                  id="room-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Exemplo: laboratorio com 30 maquinas e projetor"
                  className="min-h-20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-location" className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  Localizacao
                </Label>
                <Input
                  id="room-location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Exemplo: Bloco A, Terreo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-directions" className="flex items-center gap-2 text-sm">
                  <ListOrdered className="w-4 h-4" />
                  Passos para chegar (1 por linha)
                </Label>
                <Textarea
                  id="room-directions"
                  value={formData.directionsText}
                  onChange={(e) => setFormData(prev => ({ ...prev, directionsText: e.target.value }))}
                  placeholder={'Entre pelo portao principal\nSiga para o Bloco A\n...'}
                  className="min-h-28"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1f3c68] hover:bg-[#2d4d7f] text-white"
                disabled={saving || savingDetails}
              >
                <Save className="w-4 h-4" />
                {saving || savingDetails ? 'Salvando detalhes...' : 'Salvar Detalhes da Sala'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}