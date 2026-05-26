import { useState, useEffect, useMemo } from 'react';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Search, MapPin, Clock, Phone, Mail, MapPinned, Info, HelpCircle, Building2, GraduationCap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { RoomMap } from '../components/RoomMap';
import { useBlocks, useFloorMap } from '../hooks/useFloorMap';

export function HomePage() {
  const [blockId, setBlockId] = useState('A');
  const [floorId, setFloorId] = useState('A-1');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { blocks } = useBlocks();
  const { floor, loading } = useFloorMap(blockId, floorId);

  // Ao trocar de bloco, seleciona o primeiro andar disponível
  useEffect(() => {
    const block = blocks.find(b => b.id === blockId);
    if (block && block.floors.length > 0) {
      setFloorId(block.floors[0].id);
    }
  }, [blockId, blocks]);

  const floorLabel = floor ? `${floor.name} – Bloco ${blockId}` : 'Carregando...';

  const selectedRoomTile = useMemo(() => {
    if (!floor || !selectedRoom) return null;

    return Object.values(floor.grid).find(tile => (
      tile.type === 'room' && tile.label === selectedRoom
    )) ?? null;
  }, [floor, selectedRoom]);

  const selectedRoomDetails = selectedRoomTile?.details;
  const selectedRoomPhoto = selectedRoomDetails?.photoUrl || 'https://www.hojemais.com.br/imagem/noticia/1000/1000/1598047640_62013.jpg';
  const selectedRoomDescription = selectedRoomDetails?.description || `${selectedRoom} configurada para atividades academicas e uso diario da comunidade escolar.`;
  const selectedRoomLocation = selectedRoomDetails?.location || `Bloco ${blockId}, ${floor?.name ?? ''}`;
  const selectedRoomDirections = selectedRoomDetails?.directions && selectedRoomDetails.directions.length > 0
    ? selectedRoomDetails.directions
    : [
        'Entre pelo portao principal do campus',
        `Siga em direcao ao Bloco ${blockId}`,
        floor?.id?.endsWith('-0')
          ? 'A sala esta no terreo, proxima a entrada do bloco'
          : `Suba ate o ${floor?.name ?? ''} pelas escadas ou elevador`,
        `A ${selectedRoom} fica no corredor principal`,
      ];

  const handleRoomSelect = (roomLabel: string) => {
    setSelectedRoom(roomLabel);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-950">
      <Header />
      <Navigation />

      <div className="max-w-[1280px] mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8 bg-gradient-to-r from-[#1f3c68] to-[#2d5a8f] rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
                <MapPin className="w-10 h-10" />
                Bem-vindo ao IFMS
              </h1>
              <p className="text-lg text-blue-100 mb-4">
                Sistema de Localização de Salas - Encontre facilmente onde você precisa estar
              </p>
              <div className="flex gap-4">
                <Badge className="bg-green-500 hover:bg-green-600 text-white px-4 py-2">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Para Calouros
                </Badge>
                <Badge className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2">
                  <Info className="w-4 h-4 mr-2" />
                  Atualizado em tempo real
                </Badge>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                <Building2 className="w-16 h-16 text-white/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
              <span className="font-semibold text-gray-700 dark:text-zinc-300">Encontre sua sala:</span>
            </div>

            <div className="flex-1 max-w-xs">
              <Select value={blockId} onValueChange={setBlockId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Bloco" />
                </SelectTrigger>
                <SelectContent>
                  {blocks.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 max-w-xs">
              <Select value={floorId} onValueChange={setFloorId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Andar" />
                </SelectTrigger>
                <SelectContent>
                  {(blocks.find(b => b.id === blockId)?.floors ?? []).map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="bg-[#1f3c68] hover:bg-[#2d4d7f] text-white px-6 h-11">
              Buscar
            </Button>
          </div>
        </div>

        {/* Mapa 2D */}
        <div className="mb-8">
          {loading ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-12 flex items-center justify-center text-gray-400 dark:text-zinc-500 gap-3">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Carregando mapa...
            </div>
          ) : (
            <RoomMap
              readOnly
              floorName={floorLabel}
              initialGrid={floor?.grid}
              initialCols={floor?.cols}
              initialRows={floor?.rows}
              onRoomSelect={handleRoomSelect}
            />
          )}
        </div>

        {/* Informações Úteis */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Localização Fácil</CardTitle>
              <CardDescription>
                Clique em qualquer sala para ver foto e instruções
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                Cada sala possui uma imagem ilustrativa e um passo a passo de como chegar até lá.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                <Search className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Busca Rápida</CardTitle>
              <CardDescription>
                Filtros por bloco e andar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                Use os filtros para navegar rapidamente entre os diferentes blocos e andares do campus.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Tempo Real</CardTitle>
              <CardDescription>
                Status atualizado constantemente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                Veja em tempo real quais salas estão ocupadas ou disponíveis no momento.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Informações do Campus */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Horários de Funcionamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#1f3c68]" />
                Horários de Funcionamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b dark:border-zinc-700">
                  <span className="font-medium dark:text-zinc-200">Segunda a Sexta</span>
                  <span className="text-gray-600 dark:text-zinc-400">07:00 - 22:00</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b dark:border-zinc-700">
                  <span className="font-medium dark:text-zinc-200">Sábado</span>
                  <span className="text-gray-600 dark:text-zinc-400">08:00 - 12:00</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium dark:text-zinc-200">Domingo</span>
                  <span className="text-gray-600 dark:text-zinc-400">Fechado</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contatos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#1f3c68]" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-zinc-200">Secretaria</p>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">(67) 3234-5678</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-zinc-200">E-mail</p>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">contato@ifms.edu.br</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <MapPinned className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-zinc-200">Endereço</p>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Av. Principal, 1234 - Centro</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ - Perguntas Frequentes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <HelpCircle className="w-6 h-6 text-[#1f3c68]" />
              Perguntas Frequentes
            </CardTitle>
            <CardDescription>
              Tire suas dúvidas sobre como utilizar o sistema de localização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  Como faço para encontrar minha sala de aula?
                </AccordionTrigger>
                <AccordionContent>
                  Use os filtros de Bloco e Andar para navegar pelo mapa. Clique na sala desejada para ver uma foto do local e instruções detalhadas de como chegar.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  O que significa quando uma sala está "Ocupada"?
                </AccordionTrigger>
                <AccordionContent>
                  Salas marcadas como "Ocupada" (em cinza) estão com aulas ou atividades em andamento. Salas "Disponíveis" (em verde) estão livres no momento.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  Como sei em qual bloco fica minha sala?
                </AccordionTrigger>
                <AccordionContent>
                  O número da sala indica o bloco e andar. Por exemplo, "Sala 201" significa: 2º andar (primeiro dígito), sala 01. Consulte seu horário de aulas ou use os filtros para explorar.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  Posso fazer reserva de sala por este sistema?
                </AccordionTrigger>
                <AccordionContent>
                  Esta é a área de visualização para estudantes. Para fazer reservas, entre em contato com a secretaria ou acesse o sistema administrativo com suas credenciais de funcionário.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">
                  O mapa é atualizado em tempo real?
                </AccordionTrigger>
                <AccordionContent>
                  Sim! O status das salas (disponível/ocupada) é atualizado automaticamente conforme as reservas e aulas agendadas no sistema.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Estatísticas do Campus */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-[#1f3c68] mb-2">3</div>
            <div className="text-sm text-gray-600 dark:text-zinc-400">Blocos</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">48</div>
            <div className="text-sm text-gray-600 dark:text-zinc-400">Salas de Aula</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
            <div className="text-sm text-gray-600 dark:text-zinc-400">Laboratórios</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">6</div>
            <div className="text-sm text-gray-600 dark:text-zinc-400">Auditórios</div>
          </div>
        </div>

        {/* Dicas para Calouros */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-900 border-2 border-green-200 dark:border-zinc-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-[#1f3c68]">
              <GraduationCap className="w-6 h-6" />
              Dicas para Calouros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Chegue com antecedência</h4>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Nos primeiros dias, chegue 15 minutos antes para se familiarizar com o caminho.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Use o mapa interativo</h4>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Explore todas as salas antes das aulas começarem para não se perder.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Pontos de referência</h4>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Biblioteca fica no Bloco A, Cantina no térreo do Bloco B.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Salve nos favoritos</h4>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Adicione este sistema aos favoritos do seu navegador para acesso rápido.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Completo */}
      <footer className="bg-gradient-to-r from-[#1f3c68] to-[#2d5a8f] text-white mt-16">
        <div className="max-w-[1280px] mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo e Descrição */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-lg grid grid-cols-3 gap-0.5 p-1">
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
                  <h3 className="text-xl font-bold">IFMS</h3>
                  <p className="text-sm text-blue-200">Instituto Federal de Mato Grosso do Sul</p>
                </div>
              </div>
              <p className="text-blue-100 text-sm mb-4">
                Educação de qualidade, transformando vidas e construindo o futuro através do conhecimento e da inovação.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 border-white/30 text-white">
                  Facebook
                </Button>
                <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 border-white/30 text-white">
                  Instagram
                </Button>
                <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 border-white/30 text-white">
                  LinkedIn
                </Button>
              </div>
            </div>

            {/* Links Rápidos */}
            <div>
              <h4 className="font-bold mb-4 text-lg">Links Rápidos</h4>
              <ul className="space-y-2 text-sm text-blue-100">
                <li><a href="#" className="hover:text-white transition-colors">Sobre o IFMS</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cursos Oferecidos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Processo Seletivo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Biblioteca Virtual</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Portal do Aluno</a></li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h4 className="font-bold mb-4 text-lg">Contato</h4>
              <ul className="space-y-3 text-sm text-blue-100">
                <li className="flex items-start gap-2">
                  <MapPinned className="w-4 h-4 mt-1 flex-shrink-0" />
                  <span>Av. Principal, 1234<br/>Centro - Campo Grande/MS</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>(67) 3234-5678</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>contato@ifms.edu.br</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Seg-Sex: 07:00-22:00</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/20 pt-6 text-center text-sm text-blue-100">
            <p>© 2026 Instituto Federal de Mato Grosso do Sul - IFMS. Todos os direitos reservados.</p>
            <p className="mt-2">Desenvolvido pela Equipe de Tecnologia do TADS 3 e 4</p>
          </div>
        </div>
      </footer>

      {/* Dialog com imagem da sala */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[#1f3c68] flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              {selectedRoom}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Imagem ilustrativa */}
            <div className="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden">
              <ImageWithFallback
                src={selectedRoomPhoto}
                alt={selectedRoom || 'Sala'}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-sm text-gray-600">{selectedRoomDescription}</p>

            {/* Informações */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                <span className="font-semibold">Localização:</span>
                <span>{selectedRoomLocation}</span>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-semibold mb-2">Como chegar:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  {selectedRoomDirections.map((step, index) => (
                    <li key={`${selectedRoom}-${index}`}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
