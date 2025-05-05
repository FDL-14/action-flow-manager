
import React, { useState, useEffect } from 'react';
import { useNotifications, InternalNotification } from '@/services/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, BellOff, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationCenter() {
  const { user } = useAuth();
  const { 
    getNotifications, 
    getUnreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useNotifications();
  
  const [notifications, setNotifications] = useState<InternalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carregar notificações
  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const notifs = await getNotifications(user.id);
      setNotifications(notifs);
      
      const count = await getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar notificações ao abrir o componente e quando o usuário mudar
  useEffect(() => {
    loadNotifications();
    
    // Recarregar a cada 1 minuto
    const interval = setInterval(() => {
      if (user) {
        getUnreadCount(user.id).then(count => setUnreadCount(count));
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Recarregar as notificações quando o popover for aberto
  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    const success = await markAsRead(id);
    if (success) {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, lida: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    const success = await markAllAsRead(user.id);
    if (success) {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, lida: true }))
      );
      setUnreadCount(0);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const success = await deleteNotification(id);
    if (success) {
      const notif = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif && !notif.lida) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const formatDate = (date: string) => {
    try {
      const now = new Date();
      const notifDate = new Date(date);
      const diffInDays = Math.floor((now.getTime() - notifDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays < 1) {
        return formatDistanceToNow(notifDate, { addSuffix: true, locale: ptBR });
      }
      
      if (diffInDays < 7) {
        return format(notifDate, "EEEE 'às' HH:mm", { locale: ptBR });
      }
      
      return format(notifDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return date;
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notificações</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                className="text-xs h-8 px-2"
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-gray-500">
              <BellOff className="h-8 w-8 mb-2 text-gray-400" />
              <p className="text-sm">Nenhuma notificação</p>
              <p className="text-xs mt-1">Você não tem notificações no momento</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 relative ${notif.lida ? 'bg-white' : 'bg-primary/5'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-medium">{notif.titulo}</h4>
                    <div className="flex gap-1">
                      {!notif.lida && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="h-6 w-6"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="h-6 w-6 text-gray-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{notif.conteudo}</p>
                  <span className="text-xs text-gray-400">{formatDate(notif.criado_em)}</span>
                  {!notif.lida && (
                    <div className="absolute top-3 left-0 w-1 h-1 rounded-full bg-primary"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
