
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useActions } from '@/contexts/ActionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Action } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings } from 'lucide-react';
import NotificationSettingsDialog from './NotificationSettingsDialog';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Action;
}

const PersonalCalendar: React.FC = () => {
  const { actions } = useActions();
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (user) {
      // Filtrar apenas ações pessoais do usuário atual
      const personalActions = actions.filter(action => 
        action.isPersonal && (action.responsibleId === user.id || action.createdBy === user.id)
      );

      const calendarEvents: CalendarEvent[] = personalActions.map(action => ({
        id: action.id,
        title: action.subject,
        start: action.startDate,
        end: action.endDate,
        resource: action
      }));

      setEvents(calendarEvents);
    }
  }, [actions, user]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const action = event.resource;
    let backgroundColor = '#3174ad';
    
    switch (action.status) {
      case 'concluido':
        backgroundColor = '#28a745';
        break;
      case 'atrasado':
        backgroundColor = '#dc3545';
        break;
      case 'aguardando_aprovacao':
        backgroundColor = '#ffc107';
        break;
      case 'pendente':
        backgroundColor = '#17a2b8';
        break;
      default:
        backgroundColor = '#6c757d';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const messages = {
    allDay: 'Dia todo',
    previous: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Não há eventos neste período.',
    showMore: (total: number) => `+ ${total} mais`
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Agenda Pessoal</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowSettings(true)}
            variant="outline"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações de Notificação
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            messages={messages}
            culture="pt-BR"
            defaultView="month"
            views={['month', 'week', 'day', 'agenda']}
          />
        </div>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Lembrete</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedEvent.title}</h3>
                <p className="text-sm text-gray-500">
                  {selectedEvent.resource.description}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Badge variant={
                  selectedEvent.resource.status === 'concluido' ? 'default' :
                  selectedEvent.resource.status === 'atrasado' ? 'destructive' :
                  selectedEvent.resource.status === 'aguardando_aprovacao' ? 'secondary' :
                  'outline'
                }>
                  {selectedEvent.resource.status}
                </Badge>
              </div>

              <div className="text-sm">
                <p><strong>Início:</strong> {moment(selectedEvent.start).format('DD/MM/YYYY HH:mm')}</p>
                <p><strong>Fim:</strong> {moment(selectedEvent.end).format('DD/MM/YYYY HH:mm')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <NotificationSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
};

export default PersonalCalendar;
