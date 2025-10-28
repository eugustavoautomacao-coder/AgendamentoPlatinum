import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Link as LinkIcon
} from 'lucide-react';
import { parseSupabaseLink, createManualRedirectUrl } from '@/utils/linkInterceptor';

interface ManualLinkProcessorProps {
  onClose?: () => void;
}

export default function ManualLinkProcessor({ onClose }: ManualLinkProcessorProps) {
  const [supabaseLink, setSupabaseLink] = useState('');
  const [processedUrl, setProcessedUrl] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const processLink = () => {
    if (!supabaseLink.trim()) {
      alert('Por favor, cole o link do Supabase primeiro');
      return;
    }

    try {
      const parsedLink = parseSupabaseLink(supabaseLink);
      
      if (parsedLink) {
        const redirectUrl = createManualRedirectUrl(parsedLink);
        setProcessedUrl(redirectUrl);
        setIsValid(true);
        
        console.log('✅ Link processado com sucesso:', {
          original: supabaseLink,
          processed: redirectUrl,
          token: parsedLink.token,
          type: parsedLink.type,
          redirectTo: parsedLink.redirectTo
        });
      } else {
        setProcessedUrl('');
        setIsValid(false);
        alert('Link do Supabase inválido ou malformado');
      }
    } catch (error) {
      setProcessedUrl('');
      setIsValid(false);
      alert(`Erro ao processar link: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL copiada para a área de transferência!');
  };

  const navigateToProcessedUrl = () => {
    if (processedUrl) {
      if (confirm('Deseja navegar para a URL processada?')) {
        console.log('🔄 Navegando para:', processedUrl);
        window.location.href = processedUrl;
      }
    }
  };

  const extractTokenFromLink = () => {
    try {
      const url = new URL(supabaseLink);
      return url.searchParams.get('token');
    } catch {
      return null;
    }
  };

  const token = extractTokenFromLink();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Processador Manual de Links
          <Badge variant="outline">Solução Alternativa</Badge>
        </CardTitle>
        <CardDescription>
          Processe manualmente o link do email do Supabase para forçar o redirecionamento correto
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Input do Link */}
        <div className="space-y-2">
          <Label htmlFor="supabase-link">Link do Supabase do email:</Label>
          <div className="flex gap-2">
            <Input
              id="supabase-link"
              value={supabaseLink}
              onChange={(e) => setSupabaseLink(e.target.value)}
              placeholder="Cole aqui o link que você recebeu por email..."
              className="flex-1"
            />
            <Button onClick={processLink} disabled={!supabaseLink.trim()}>
              Processar
            </Button>
          </div>
        </div>

        {/* Status do Link */}
        {supabaseLink && (
          <div className="space-y-2">
            <Label>Status do Link:</Label>
            <div className="flex items-center gap-2">
              {token ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Link Válido
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <Badge variant="destructive">
                    Link Inválido
                  </Badge>
                </>
              )}
            </div>
          </div>
        )}

        {/* Token (se disponível) */}
        {token && (
          <div className="space-y-2">
            <Label>Token Extraído:</Label>
            <div className="flex gap-2">
              <Input 
                value={showToken ? token : '••••••••••••••••'} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* URL Processada */}
        {processedUrl && (
          <div className="space-y-2">
            <Label>URL Processada:</Label>
            <div className="flex gap-2">
              <Input 
                value={processedUrl} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => copyToClipboard(processedUrl)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-2">
          {processedUrl && (
            <Button 
              onClick={navigateToProcessedUrl}
              className="bg-green-600 hover:bg-green-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Navegar para URL Processada
            </Button>
          )}
          
          <Button 
            onClick={() => {
              setSupabaseLink('');
              setProcessedUrl('');
              setIsValid(false);
            }}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          
          {onClose && (
            <Button onClick={onClose} variant="ghost">
              Fechar
            </Button>
          )}
        </div>

        {/* Instruções */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Como usar:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Copie o link do email de recuperação de senha</li>
              <li>Cole no campo acima</li>
              <li>Clique em "Processar"</li>
              <li>Use "Navegar para URL Processada" para ir direto para a página de redefinição</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Exemplo de Link */}
        <Alert>
          <LinkIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Exemplo de link válido:</strong>
            <br />
            <code className="text-xs bg-gray-100 p-1 rounded">
              https://lbpqmdcmoybuuthzezmj.supabase.co/auth/v1/verify?token=abc123&type=recovery&redirect_to=http://localhost:8080/redefinir-senha
            </code>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}











