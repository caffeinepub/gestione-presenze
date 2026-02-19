import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Calendar, LogOut, Moon, Sun, User, Shield } from 'lucide-react';
import { useTheme } from 'next-themes';
import { t } from '../lib/i18n';
import { ReactNode } from 'react';

interface HeaderProps {
  modeControl?: ReactNode;
  isAdminMode?: boolean;
}

export default function Header({ modeControl, isAdminMode = false }: HeaderProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur transition-colors ${
      isAdminMode 
        ? 'bg-accent/95 border-accent supports-[backdrop-filter]:bg-accent/80' 
        : 'bg-background/95 supports-[backdrop-filter]:bg-background/60'
    }`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
            isAdminMode ? 'bg-accent-foreground/10' : 'bg-primary/10'
          }`}>
            <Calendar className={`h-6 w-6 ${isAdminMode ? 'text-accent-foreground' : 'text-primary'}`} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">{t('login.title')}</h1>
            {isAdminMode && (
              <Badge variant="default" className="gap-1 bg-accent-foreground text-accent">
                <Shield className="h-3 w-3" />
                {t('header.adminMode')}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {modeControl && (
            <div className="hidden sm:flex items-center gap-2">
              {modeControl}
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{t('theme.toggleTheme')}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('auth.myAccount')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t('auth.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {modeControl && (
        <div className="sm:hidden border-t px-4 py-2 bg-background/50">
          {modeControl}
        </div>
      )}
    </header>
  );
}
